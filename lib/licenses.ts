// Nurse licence numbers start with "LN", midwife licence numbers start
// with "MW" — this was already true of the historical data (verified and
// cleaned during the register rebuild), but nothing enforced it going
// forward at the point of entry. This is that enforcement, applied
// wherever a licence number can actually be set: the admin edit route
// and the self-service portal profile route.

export function validateLicenseFormat(
  type: "nurse" | "midwife",
  value: string
): { valid: boolean; reason?: string } {
  if (!value) return { valid: true }; // blank is fine — clearing a licence number isn't an error
  const prefix = type === "nurse" ? "LN" : "MW";
  if (!value.toUpperCase().startsWith(prefix)) {
    return { valid: false, reason: `${type === "nurse" ? "Nurse" : "Midwife"} licence numbers must start with "${prefix}".` };
  }
  return { valid: true };
}

// "Both" is the internal database value for someone holding both a Nurse
// and a Midwife registration — shown to Council staff as "Nurse /
// Midwife" instead of the raw word "Both", which reads as vague/unclear
// in a professional register context.
export function categoryDisplay(category: string | null): string {
  if (category === "Both") return "Nurse / Midwife";
  return category ?? "—";
}

// Shared redaction for audit_log.details wherever it's displayed or
// exported — a self-service profile edit's diff can contain the actual
// old/new NIN value inside details.changes.nin, which is just as
// sensitive as the NIN field itself. Anywhere details gets rendered or
// exported needs this check, not just the main profile field — see the
// HistorySection fix this was extracted from, and the Audit Log
// page/export this was found to also affect.
export function redactNinFromDetails(details: Record<string, unknown> | null, canSeeNin: boolean): Record<string, unknown> | null {
  if (!details || canSeeNin) return details;
  const changes = details.changes as Record<string, unknown> | undefined;
  if (changes && "nin" in changes) {
    const { nin, ...restChanges } = changes;
    return { ...details, changes: { ...restChanges, nin: "(restricted)" } };
  }
  return details;
}
