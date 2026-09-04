// Customizable register report. Fields are picked from an explicit
// allowlist rather than trusting arbitrary column names from the request.
//
// Now supports sub-filters within a field, not just which fields to
// include — e.g. "include Sex, but only Female," or "include Age Group,
// but only 40–49 and 50–59." Age Group is synthetic (computed from
// date_of_birth server-side) — requesting it pulls date_of_birth
// internally, but the raw date of birth is never included in the output.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { ALLOWED_REGISTER_FIELDS, computeAgeGroup, AGE_GROUPS } from "@/lib/reports";

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
  const sexFilter = searchParams.get("sexFilter")?.split(",").filter(Boolean) ?? [];
  const ageGroupFilter = searchParams.get("ageGroupFilter")?.split(",").filter(Boolean) ?? [];
  const employmentSectorFilter = searchParams.get("employmentSectorFilter")?.split(",").filter(Boolean) ?? [];

  const needsAgeGroup = fields.includes("age_group") || ageGroupFilter.length > 0;
  const realColumns = fields.filter((f) => f !== "age_group");
  const selectColumns = Array.from(new Set([...realColumns, ...(needsAgeGroup ? ["date_of_birth"] : [])]));

  const supabase = createClient();
  let query = supabase.from("people").select(selectColumns.join(",")).order("last_name").limit(2000);
  if (status) query = query.eq("registration_status", status);
  if (category) query = query.eq("professional_category", category);
  if (sexFilter.length > 0) query = query.in("sex", sexFilter);
  if (employmentSectorFilter.length > 0) query = query.in("employment_sector", employmentSectorFilter);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ ok: false, reason: "Report query failed." }, { status: 500 });
  }

  let rows = (data ?? []) as unknown as Record<string, unknown>[];

  // Age-group filtering happens against the raw date_of_birth, before
  // that column gets stripped out of the final output below.
  if (needsAgeGroup && ageGroupFilter.length > 0) {
    rows = rows.filter((row) => ageGroupFilter.includes(computeAgeGroup(row.date_of_birth as string | null)));
  }

  if (needsAgeGroup) {
    rows = rows.map((row) => {
      const ageGroup = computeAgeGroup(row.date_of_birth as string | null);
      const { date_of_birth, ...rest } = row;
      return fields.includes("age_group") ? { ...rest, age_group: ageGroup } : rest;
    });
  }

  return NextResponse.json({ ok: true, fields, rows });
}
