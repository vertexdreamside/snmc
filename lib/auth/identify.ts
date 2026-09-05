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
});

const INELIGIBLE_STATUSES = ["Deceased", "Deleted"] as const;

export interface LoginResult {
  ok: boolean;
  reason?: string;
  redirectTo?: string;
}

async function logAttempt(
  supabase: ReturnType<typeof createServiceRoleClient>,
  params: { outcome: "success" | "failure"; registrationNumber: string; personId: string | null; failureReason?: string; ipAddress: string | null }
) {
  await supabase.from("audit_log").insert({
    actor_id: params.personId,
    action: params.outcome === "success" ? "portal_login_success" : "portal_login_failure",
    target_table: "people",
    target_id: params.personId,
    ip_address: params.ipAddress,
    details: { attempted_registration_number: params.registrationNumber, failure_reason: params.failureReason ?? null },
  });
}

export async function identifyAndSignIn(input: z.infer<typeof loginSchema>, siteOrigin: string, ipAddress: string | null = null): Promise<LoginResult> {
  const supabase = createServiceRoleClient();

  const { data: person, error } = await supabase
    .from("people")
    .select("id, nin, registration_status, is_deceased, auth_user_id")
    .or(`nurse_reg_no.eq.${input.registrationNumber},midwife_reg_no.eq.${input.registrationNumber}`)
    .maybeSingle();

  const genericFailure: LoginResult = { ok: false, reason: "We couldn't verify those details." };

  if (error || !person) {
    await logAttempt(supabase, { outcome: "failure", registrationNumber: input.registrationNumber, personId: null, failureReason: "no matching registration number", ipAddress });
    return genericFailure;
  }

  const hasNinOnFile = !!person.nin && person.nin.trim() !== "";
  if (hasNinOnFile) {
    if (!input.nin || person.nin !== input.nin) {
      await logAttempt(supabase, { outcome: "failure", registrationNumber: input.registrationNumber, personId: person.id, failureReason: "NIN mismatch", ipAddress });
      return genericFailure;
    }
  }

  if (person.is_deceased || INELIGIBLE_STATUSES.includes(person.registration_status as any)) {
    await logAttempt(supabase, { outcome: "failure", registrationNumber: input.registrationNumber, personId: person.id, failureReason: "ineligible status", ipAddress });
    return genericFailure;
  }

  const placeholderEmail = `${person.id}@placeholder.snmc.internal`;

  const { data: link, error: linkError } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: placeholderEmail,
    options: { redirectTo: `${siteOrigin}/auth/callback` },
  });

  if (linkError || !link) {
    await logAttempt(supabase, { outcome: "failure", registrationNumber: input.registrationNumber, personId: person.id, failureReason: "could not generate session link", ipAddress });
    return { ok: false, reason: "Could not start a session. Please try again." };
  }

  const actualAuthUserId = link.user?.id;
  if (actualAuthUserId && actualAuthUserId !== person.auth_user_id) {
    await supabase.from("people").update({ auth_user_id: actualAuthUserId }).eq("id", person.id);
  }

  await logAttempt(supabase, { outcome: "success", registrationNumber: input.registrationNumber, personId: person.id, ipAddress });

  return { ok: true, redirectTo: link.properties.action_link };
}
