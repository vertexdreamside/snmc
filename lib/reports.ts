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
] as const;
