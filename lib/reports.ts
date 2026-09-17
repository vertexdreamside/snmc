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
// For report filters specifically — "Unknown" isn't a real age range to
// filter by, it's missing data. Excluded here so Reports can't present
// it as a normal selectable category, while AGE_GROUPS above still
// includes it for places that legitimately need to count/flag missing
// DOB as its own thing (e.g. the dashboard's age distribution chart).
export const SELECTABLE_AGE_GROUPS: AgeGroupLabel[] = ["Under 30", "30–39", "40–49", "50–59", "60 and over"];

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

export interface AgeBracket {
  label: string;
  min_age: number;
  max_age: number | null;
  sort_order: number;
}

// Section 13's configurable-ranges version, used by Reports specifically
// — computeAgeGroup above stays exactly as it was (still used by the
// dashboard's own age chart, which wasn't part of this request) rather
// than changing its return type and risking that caller. Brackets are
// fetched once per report request and passed in here, not queried per
// row.
export function computeAgeGroupDynamic(dateOfBirth: string | null, brackets: AgeBracket[]): string {
  if (!dateOfBirth) return "Unknown";
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return "Unknown";
  const ageMs = Date.now() - dob.getTime();
  const age = Math.floor(ageMs / (365.25 * 24 * 60 * 60 * 1000));
  const sorted = [...brackets].sort((a, b) => a.sort_order - b.sort_order);
  for (const bracket of sorted) {
    if (age >= bracket.min_age && (bracket.max_age === null || age <= bracket.max_age)) {
      return bracket.label;
    }
  }
  return "Unknown";
}

// Mirrors the bucketing already used on the License Expiry admin page
// (90-day warning window) — reused here as a reportable field, checking
// whichever of the two licence-expiry dates is present (a person may only
// hold one, or both).
const LICENSE_WARNING_WINDOW_DAYS = 90;

// Single-date version of the same Active/Expiring Soon/Expired logic
// above — used wherever one specific licence's own expiry is being
// shown (a special licence, a single row in the unified Licence Details
// table), as opposed to computeLicenseStatus's combined nurse+midwife
// register-level view. Previously duplicated verbatim, with the same
// 90-day threshold hardcoded separately, in both LicenceDetailsSection.tsx
// and ProfileForm.tsx — consolidated here so the threshold only ever
// needs changing in one place.
export function computeSingleExpiryStatus(expiryDate: string | null): "Active" | "Expiring Soon" | "Expired" | null {
  if (!expiryDate) return null;
  const days = Math.floor((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return "Expired";
  if (days <= LICENSE_WARNING_WINDOW_DAYS) return "Expiring Soon";
  return "Active";
}

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

// Seychelles Time (UTC+4, no daylight saving) — Section 5/7 explicitly
// require timestamps shown to admins to use this timezone specifically,
// not the server's or viewer's own local time. Uses the IANA "Indian/
// Mahe" zone via Intl rather than hardcoding a +4 offset, since that's
// the timezone-database-driven way to get this right even if the
// underlying rules ever changed.
export function formatSeychellesTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-GB", {
    timeZone: "Indian/Mahe",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }) + " SCT";
}
