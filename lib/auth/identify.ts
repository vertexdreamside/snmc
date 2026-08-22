// Login: Registration Number, with NIN as a second factor only when it's
// actually on file for that person.
//
// Trade-off, stated plainly: the legacy register was never consistently
// populated with NINs (currently every imported record is missing one),
// so requiring it would lock everyone out. For any record with a blank
// NIN, registration number alone is accepted — and a registration number
// is not secret; it's printed on the public register/licence, so anyone
// who knows it can currently sign in and vote or nominate as that person.
// This is a deliberate, temporary reduction in assurance, not an
// oversight — it exists specifically to unblock login while the Council
// works through actually collecting NINs.
//
// This is self-strengthening, not a one-time switch: the moment a
// person's `nin` column is populated (by an admin now, or by a future
// self-service KYC step), the check below starts requiring and verifying
// it for that person automatically — no further code change needed to
// "turn security back on" as real data comes in.

import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const loginSchema = z.object({
  registrationNumber: z.string().min(1, "Registration number is required"),
  nin: z.string().optional(),
});

const INELIGIBLE_STATUSES = ["Deceased", "Deleted"] as const;

export interface LoginResult {
  ok: boolean;
  reason?: string;
  redirectTo?: string; // Supabase magic-link action URL that establishes the session
}

export async function identifyAndSignIn(input: z.infer<typeof loginSchema>, siteOrigin: string): Promise<LoginResult> {
  const supabase = createServiceRoleClient();

  const { data: person, error } = await supabase
    .from("people")
    .select("id, nin, registration_status, auth_user_id")
    .or(
      `nurse_reg_no.eq.${input.registrationNumber},midwife_reg_no.eq.${input.registrationNumber}`
    )
    .maybeSingle();

  // Deliberately vague on failure — don't reveal whether the registration
  // number exists at all, to avoid leaking register contents to a guesser.
  const genericFailure: LoginResult = { ok: false, reason: "We couldn't verify those details." };

  if (error || !person) return genericFailure;

  // Only enforced once a NIN is actually on file — see the note above.
  const hasNinOnFile = !!person.nin && person.nin.trim() !== "";
  if (hasNinOnFile) {
    if (!input.nin || person.nin !== input.nin) return genericFailure;
  }

  if (INELIGIBLE_STATUSES.includes(person.registration_status as any)) return genericFailure;

  // See README "First-login account provisioning" note — this magic-link
  // approach is a functional placeholder, not a final design, since
  // Supabase Auth expects an email/phone identity and this app's real
  // identity is registration-number + NIN.
  //
  // Explicitly setting redirectTo to our own /auth/callback route (rather
  // than relying on Supabase's global "Site URL" default) is required —
  // that callback page is what actually reads the token from the URL and
  // calls setSession() to establish a real cookie-based session. Without
  // it, the verify link lands the browser back on a page with a valid
  // token sitting unused in the URL, which looks exactly like the login
  // "just refreshing" — Supabase confirms the credential correctly, but
  // nothing on our side ever turns that into a logged-in session.
  //
  // The email is derived from person.id (this table's own primary key,
  // stable and never changes) rather than trusting person.auth_user_id to
  // already be correct. This was a real bug, not a hypothetical: if
  // auth_user_id had ever been set by hand to some OTHER value (e.g. an
  // auth user created manually through the Supabase dashboard with a
  // different email), generateLink would silently create a second,
  // disconnected auth user the first time this ran — since the email it
  // constructs would never have existed before — and every future login
  // would keep signing into that phantom account instead of the one
  // people.auth_user_id pointed at. The person would get a fully valid
  // session that the app could never match back to their profile,
  // bouncing them back to the login page every time with no visible error.
  //
  // The fix: treat the auth user actually returned by generateLink as the
  // source of truth, and self-heal people.auth_user_id to match it
  // whenever the two disagree — including the very first time, when
  // auth_user_id is still null. This makes real first-time provisioning
  // work correctly too, not just this one test account.
  const placeholderEmail = `${person.id}@placeholder.snmc.internal`;

  const { data: link, error: linkError } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: placeholderEmail,
    options: {
      redirectTo: `${siteOrigin}/auth/callback`,
    },
  });

  if (linkError || !link) {
    return { ok: false, reason: "Could not start a session. Please try again." };
  }

  const actualAuthUserId = link.user?.id;
  if (actualAuthUserId && actualAuthUserId !== person.auth_user_id) {
    await supabase.from("people").update({ auth_user_id: actualAuthUserId }).eq("id", person.id);
  }

  return { ok: true, redirectTo: link.properties.action_link };
}
