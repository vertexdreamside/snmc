// Simplified login: Registration Number + NIN only, no second factor.
//
// Trade-off, stated plainly: this means anyone who knows a person's
// registration number and NIN can sign in and vote as them. The
// registration number is not secret (it's on the public register/licence),
// and a NIN is often known to family members or accessible through other
// means. This was a deliberate simplification for now — if the Council
// wants stronger assurance before Round 1 goes live, the natural
// re-addition point is a second factor at this exact function boundary
// (see the removed lib/auth/otp.ts in version control history for the
// previous OTP-based design).

import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const loginSchema = z.object({
  registrationNumber: z.string().min(1, "Registration number is required"),
  nin: z.string().min(1, "National ID number is required"),
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
  if (person.nin !== input.nin) return genericFailure;
  if (INELIGIBLE_STATUSES.includes(person.registration_status as any)) return genericFailure;

  if (!person.auth_user_id) {
    return {
      ok: false,
      reason: "Account not yet provisioned. Please contact the Council office.",
    };
  }

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
  const { data: link, error: linkError } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: `${person.id}@placeholder.snmc.internal`,
    options: {
      redirectTo: `${siteOrigin}/auth/callback`,
    },
  });

  if (linkError || !link) {
    return { ok: false, reason: "Could not start a session. Please try again." };
  }

  return { ok: true, redirectTo: link.properties.action_link };
}
