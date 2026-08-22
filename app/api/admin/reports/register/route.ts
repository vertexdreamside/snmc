// Customizable register report. Fields are picked from an explicit
// allowlist rather than trusting arbitrary column names from the request —
// this endpoint takes user-controlled query params directly into a
// Supabase select() call, so an allowlist matters here, not just as
// tidiness.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { ALLOWED_REGISTER_FIELDS } from "@/lib/reports";

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

  const supabase = createClient();
  let query = supabase.from("people").select(fields.join(",")).order("last_name").limit(2000);
  if (status) query = query.eq("registration_status", status);
  if (category) query = query.eq("professional_category", category);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ ok: false, reason: "Report query failed." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, fields, rows: data });
}
