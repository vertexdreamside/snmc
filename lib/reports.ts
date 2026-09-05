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
  "license_status", // synthetic — computed from the two expiry dates, not a raw column
] as const;

export type AgeGroupLabel = "Under 30" | "30–39" | "40–49" | "50–59" | "60 and over" | "Unknown";
export const AGE_GROUPS: AgeGroupLabel[] = ["Under 30", "30–39", "40–49", "50–59", "60 and over", "Unknown"];

export type LicenseStatusLabel = "Expired" | "Expiring Soon" | "Valid" | "Not on File";
export const LICENSE_STATUSES: LicenseStatusLabel[] = ["Expired", "Expiring Soon", "Valid", "Not on File"];

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

// Mirrors the bucketing already used on the License Expiry admin page
// (90-day warning window) — reused here as a reportable field, checking
// whichever of the two licence-expiry dates is present (a person may only
// hold one, or both).
const LICENSE_WARNING_WINDOW_DAYS = 90;

export function computeLicenseStatus(nurseExpiry: string | null, midwifeExpiry: string | null): LicenseStatusLabel {
  const dates = [nurseExpiry, midwifeExpiry].filter((d): d is string => !!d).map((d) => new Date(d));
  if (dates.length === 0) return "Not on File";
  const soonest = dates.reduce((a, b) => (a < b ? a : b));
  const today = new Date();
  const warningDate = new Date(today.getTime() + LICENSE_WARNING_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  if (soonest < today) return "Expired";
  if (soonest <= warningDate) return "Expiring Soon";
  return "Valid";
}
