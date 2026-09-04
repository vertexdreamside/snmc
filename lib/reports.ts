// Shared with app/api/admin/reports/register/route.ts and the client
// report builder — kept out of the route file itself since Next.js route
// modules may only export recognized handler names (GET, POST, etc.), not
// arbitrary constants.
export const ALLOWED_REGISTER_FIELDS = [
  "first_name",
  "last_name",
  "sex",
  "nurse_reg_no",
  "midwife_reg_no",
  "professional_category",
  "registration_status",
  "profile_status",
  "employment_sector",
  "service_category",
  "place_of_work",
  "employer",
  "training_institute",
  "nurse_license_expiry",
  "midwife_license_expiry",
  "age_group", // synthetic — computed from date_of_birth, not a raw column
] as const;

export type AgeGroupLabel = "Under 30" | "30–39" | "40–49" | "50–59" | "60 and over" | "Unknown";

export const AGE_GROUPS: AgeGroupLabel[] = ["Under 30", "30–39", "40–49", "50–59", "60 and over", "Unknown"];

// Derived from date_of_birth, not NIN — Seychelles' NIN doesn't have a
// confirmed, verifiable birthdate encoding, and NIN is also still blank
// for nearly everyone in the register. date_of_birth is the field this
// can actually be computed from reliably.
export function computeAgeGroup(dateOfBirth: string | null): AgeGroupLabel {
  if (!dateOfBirth) return "Unknown";
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return "Unknown";
  const ageMs = Date.now() - dob.getTime();
  const age = Math.floor(ageMs / (365.25 * 24 * 60 * 60 * 1000));
  if (age < 30) return "Under 30";
  if (age < 40) return "30–39";
  if (age < 50) return "40–49";
  if (age < 60) return "50–59";
  return "60 and over";
}
