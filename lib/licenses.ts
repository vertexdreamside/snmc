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
