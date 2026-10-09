// Login: Registration Number, with NIN as a second factor only when it's
// actually on file for that person.
//
// Trade-off, stated plainly: the legacy register was never consistently
// populated with NINs, so requiring it would lock everyone out. For any
// record with a blank NIN, registration number alone is accepted — and a
// registration number is not secret, so this is a deliberate, temporary
// reduction in assurance, not an oversight. It's self-strengthening: the
// moment a person's `nin` column is populated, the check below starts
// requiring it for that person automatically.
//
// Every attempt is now logged — success or failure — including the
// attempted registration number on failure, which is what actually lets
// the Council notice a brute-force or enumeration attempt against the
// portal. actor_id is the matched person's id when one was found (even
// if the NIN then failed to match), or null when no registration number
// matched anyone at all.

import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const loginSchema = z.object({
  registrationNumber: z.string().min(1, "Registration number is required"),
  nin: z.string().optional(),
  // Optional. Only used when the registration number is shared by two
  // people (a nurse number equal to someone else's midwife number): which
  // kind of number the person is entering.
  registrationType: z.enum(["Nurse", "Midwife"]).optional(),
});

const INELIGIBLE_STATUSES = ["Deceased", "Deleted"] as const;

export interface LoginResult {
  ok: boolean;
  reason?: string;
  redirectTo?: string;
}

async function logAttempt(
  supabase: ReturnType<typeof createServiceRoleClient>,
  params: { outcome: "success" | "failure"; registrationNumber: string; personId: string | null; failureReason?: string; ipAddress: string | null; device?: { deviceType: string; browser: string; os: string } }
) {
  await supabase.from("audit_log").insert({
    actor_id: params.personId,
    action: params.outcome === "success" ? "portal_login_success" : "portal_login_failure",
    target_table: "people",
    target_id: params.personId,
    ip_address: params.ipAddress,
    device_type: params.device?.deviceType,
    browser: params.device?.browser,
    operating_system: params.device?.os,
    details: { attempted_registration_number: params.registrationNumber, failure_reason: params.failureReason ?? null },
  });
}

export async function identifyAndSignIn(input: z.infer<typeof loginSchema>, siteOrigin: string, ipAddress: string | null = null, next: string = "/portal", device?: { deviceType: string; browser: string; os: string }): Promise<LoginResult> {
  const supabase = createServiceRoleClient();

  // Previously .maybeSingle() — which throws if the query matches more
  // than one row. nurse_reg_no and midwife_reg_no are two separate
  // columns with no constraint stopping the same string from appearing
  // in both (e.g. one person's nurse number happening to equal a
  // different person's midwife number), so a registration number is not
  // guaranteed unique across the two fields combined. When that happened
  // in practice (see INC: Kathleen Barbara Adrienne's nurse_reg_no
  // "164/85" collided with Cynthia Margaret Edmond's midwife_reg_no, also
  // "164/85"), maybeSingle() errored out and BOTH people were silently
  // locked out with the same generic "couldn't verify" message, with
  // nothing in the audit log pointing at why. Selecting a list instead
  // and handling 0 / 1 / many explicitly means this fails the same way
  // for the person logging in (still a generic message — this is a
  // public-facing login, so it must never hint at which case occurred),
  // but now logs a distinct, searchable failure reason so a future
  // collision like this is diagnosable from the Audit Log alone instead
  // of needing this exact investigation again.
  const { data: matches, error } = await supabase
    .from("people")
    .select("id, nin, registration_status, is_deceased, auth_user_id, nurse_reg_no, midwife_reg_no")
    .or(`nurse_reg_no.eq.${input.registrationNumber},midwife_reg_no.eq.${input.registrationNumber}`);

  const genericFailure: LoginResult = { ok: false, reason: "We couldn't verify those details." };

  if (error || !matches || matches.length === 0) {
    await logAttempt(supabase, { outcome: "failure", registrationNumber: input.registrationNumber, personId: null, failureReason: "no matching registration number", ipAddress, device });
    return genericFailure;
  }

  // A registration number is NOT unique across people: the Council confirms
  // that nurse and midwife numbers share the same "number/year" format, so
  // one person's nurse number can legitimately equal another person's
  // midwife number (e.g. 166/85). When that happens the NIN is what tells
  // them apart: exactly one of the matching people must have that NIN on
  // file and the person must have typed it. If it can't be resolved to
  // exactly one person this still fails closed — it never guesses.
  let person = matches[0];
  if (matches.length > 1) {
    // 1) the NIN, if the person typed one that exactly one of them has on file
    let narrowed = input.nin
      ? matches.filter((m) => !!m.nin && m.nin.trim() !== "" && m.nin === input.nin)
      : [];
    // 2) otherwise the kind of number they said they are entering
    if (narrowed.length !== 1 && input.registrationType) {
      narrowed = matches.filter((m) =>
        input.registrationType === "Nurse"
          ? m.nurse_reg_no === input.registrationNumber
          : m.midwife_reg_no === input.registrationNumber
      );
    }
    if (narrowed.length !== 1) {
      await logAttempt(supabase, { outcome: "failure", registrationNumber: input.registrationNumber, personId: null, failureReason: `registration number is shared by ${matches.length} people and neither the NIN nor the number type singled one out`, ipAddress, device });
      return genericFailure;
    }
    person = narrowed[0];
  }

  const hasNinOnFile = !!person.nin && person.nin.trim() !== "";
  if (hasNinOnFile) {
    if (!input.nin || person.nin !== input.nin) {
      await logAttempt(supabase, { outcome: "failure", registrationNumber: input.registrationNumber, personId: person.id, failureReason: "NIN mismatch", ipAddress, device });
      return genericFailure;
    }
  }

  if (person.is_deceased || INELIGIBLE_STATUSES.includes(person.registration_status as any)) {
    await logAttempt(supabase, { outcome: "failure", registrationNumber: input.registrationNumber, personId: person.id, failureReason: "ineligible status", ipAddress, device });
    return genericFailure;
  }

  const placeholderEmail = `${person.id}@placeholder.snmc.internal`;

  // The intended destination (e.g. /council for someone reaching this
  // login via the Councillor Portal link) is threaded through as a query
  // param on the callback URL itself — Supabase preserves everything
  // before the URL fragment it appends the session tokens to, so this
  // survives the whole magic-link round trip intact.
  const safeNext = next.startsWith("/") ? next : "/portal";
  const { data: link, error: linkError } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: placeholderEmail,
    options: { redirectTo: `${siteOrigin}/auth/callback?next=${encodeURIComponent(safeNext)}` },
  });

  if (linkError || !link) {
    await logAttempt(supabase, { outcome: "failure", registrationNumber: input.registrationNumber, personId: person.id, failureReason: "could not generate session link", ipAddress, device });
    return { ok: false, reason: "Could not start a session. Please try again." };
  }

  const actualAuthUserId = link.user?.id;
  if (actualAuthUserId && actualAuthUserId !== person.auth_user_id) {
    await supabase.from("people").update({ auth_user_id: actualAuthUserId }).eq("id", person.id);
  }

  await logAttempt(supabase, { outcome: "success", registrationNumber: input.registrationNumber, personId: person.id, ipAddress, device });

  return { ok: true, redirectTo: link.properties.action_link };
}
