// Customizable register report. Fields are picked from an explicit
// allowlist rather than trusting arbitrary column names from the request.
//
// Sub-filters within a field — e.g. "include Sex, but only Female," or
// "include Age Group, but only 40–49 and 50–59." Age Group and License
// Status are synthetic (computed server-side from date_of_birth and the
// two licence expiry dates respectively) — requesting either pulls the
// underlying raw column(s) internally, but those raw values are never
// included in the output unless separately requested as their own field.
//
// Deliberately NOT sub-filterable here: professional_category and
// registration_status already have their own top-level dropdowns on this
// page — a second, field-level filter for the same thing would just be
// confusing duplication, not a real improvement.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { ALLOWED_REGISTER_FIELDS, computeAgeGroup, computeLicenseStatus } from "@/lib/reports";

export async function GET(request: Request) {
  await requireAdmin(["reports"]);

  const { searchParams } = new URL(request.url);
  const requestedFields = (searchParams.get("fields") ?? "").split(",").filter(Boolean);
  const fields = requestedFields.filter((f): f is (typeof ALLOWED_REGISTER_FIELDS)[number] =>
    (ALLOWED_REGISTER_FIELDS as readonly string[]).includes(f)
  );
  if (fields.length === 0) {
    return NextResponse.json({ ok: false, reason: "Select at least one field." }, { status: 400 });
  }

  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const sexFilter = searchParams.get("sexFilter")?.split(",").filter(Boolean) ?? [];
  const ageGroupFilter = searchParams.get("ageGroupFilter")?.split(",").filter(Boolean) ?? [];
  const employmentSectorFilter = searchParams.get("employmentSectorFilter")?.split(",").filter(Boolean) ?? [];
  const serviceCategoryFilter = searchParams.get("serviceCategoryFilter")?.split(",").filter(Boolean) ?? [];
  const profileStatusFilter = searchParams.get("profileStatusFilter")?.split(",").filter(Boolean) ?? [];
  const licenseStatusFilter = searchParams.get("licenseStatusFilter")?.split(",").filter(Boolean) ?? [];

  const needsAgeGroup = fields.includes("age_group") || ageGroupFilter.length > 0;
  const needsLicenseStatus = fields.includes("license_status") || licenseStatusFilter.length > 0;
  const realColumns = fields.filter((f) => f !== "age_group" && f !== "license_status");
  const selectColumns = Array.from(
    new Set([
      ...realColumns,
      ...(needsAgeGroup ? ["date_of_birth"] : []),
      ...(needsLicenseStatus ? ["nurse_license_expiry", "midwife_license_expiry"] : []),
    ])
  );

  const supabase = createClient();
  let query = supabase.from("people").select(selectColumns.join(",")).order("last_name").limit(2000);
  if (status) query = query.eq("registration_status", status);
  if (category) query = query.eq("professional_category", category);
  if (dateFrom) query = query.gte("created_at", dateFrom);
  if (dateTo) query = query.lte("created_at", dateTo);
  if (sexFilter.length > 0) query = query.in("sex", sexFilter);
  if (employmentSectorFilter.length > 0) query = query.in("employment_sector", employmentSectorFilter);
  if (serviceCategoryFilter.length > 0) query = query.in("service_category", serviceCategoryFilter);
  if (profileStatusFilter.length > 0) query = query.in("profile_status", profileStatusFilter);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ ok: false, reason: "Report query failed." }, { status: 500 });
  }

  let rows = (data ?? []) as unknown as Record<string, unknown>[];

  // Synthetic-field filtering happens against the raw underlying
  // column(s), before those get stripped out of the final output below.
  if (needsAgeGroup && ageGroupFilter.length > 0) {
    rows = rows.filter((row) => ageGroupFilter.includes(computeAgeGroup(row.date_of_birth as string | null)));
  }
  if (needsLicenseStatus && licenseStatusFilter.length > 0) {
    rows = rows.filter((row) =>
      licenseStatusFilter.includes(
        computeLicenseStatus(row.nurse_license_expiry as string | null, row.midwife_license_expiry as string | null)
      )
    );
  }

  if (needsAgeGroup) {
    rows = rows.map((row) => {
      const ageGroup = computeAgeGroup(row.date_of_birth as string | null);
      const { date_of_birth, ...rest } = row;
      return fields.includes("age_group") ? { ...rest, age_group: ageGroup } : rest;
    });
  }
  if (needsLicenseStatus) {
    rows = rows.map((row) => {
      const licenseStatus = computeLicenseStatus(
        row.nurse_license_expiry as string | null,
        row.midwife_license_expiry as string | null
      );
      // Only strip the raw expiry columns if they weren't separately
      // requested as their own fields — a report asking for both
      // "Nurse Licence Expiry" and "License Status" should still show
      // the actual date, not just the derived bucket.
      const rest = { ...row };
      if (!fields.includes("nurse_license_expiry")) delete rest.nurse_license_expiry;
      if (!fields.includes("midwife_license_expiry")) delete rest.midwife_license_expiry;
      return fields.includes("license_status") ? { ...rest, license_status: licenseStatus } : rest;
    });
  }

  return NextResponse.json({ ok: true, fields, rows });
}
