// Bulk data export — whole-table pulls for the Data Export module, gated
// admin-only. Returns raw row data; the client builds the actual
// Excel/CSV file in-browser via SheetJS (nothing is generated or stored
// server-side, matching the "generated in your browser" pattern).

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

const DATASETS = ["register", "candidates", "councillors"] as const;

export async function GET(request: Request) {
  await requireAdmin(["reports"]);

  const { searchParams } = new URL(request.url);
  const dataset = searchParams.get("dataset");
  if (!dataset || !(DATASETS as readonly string[]).includes(dataset)) {
    return NextResponse.json({ ok: false, reason: "Unknown dataset." }, { status: 400 });
  }

  const supabase = createClient();

  if (dataset === "register") {
    const { data, error } = await supabase
      .from("people")
      .select(
        "first_name, last_name, sex, nurse_reg_no, midwife_reg_no, professional_category, registration_status, profile_status, employment_sector, service_category, place_of_work, employer, training_institute, nurse_license_expiry, midwife_license_expiry, category_confirmed"
      )
      .order("last_name");
    if (error) return NextResponse.json({ ok: false, reason: "Query failed." }, { status: 500 });
    return NextResponse.json({ ok: true, rows: data });
  }

  if (dataset === "candidates") {
    const { data, error } = await supabase
      .from("candidates")
      .select("category, service_category, round, status, current_placement_note, elections(term_label), people:person_id(first_name, last_name)")
      .order("round");
    if (error) return NextResponse.json({ ok: false, reason: "Query failed." }, { status: 500 });
    const rows = (data ?? []).map((c: any) => ({
      term: c.elections?.term_label ?? "",
      name: `${c.people?.first_name ?? ""} ${c.people?.last_name ?? ""}`,
      category: c.category,
      service_category: c.service_category,
      round: c.round,
      status: c.status,
      current_placement: c.current_placement_note,
    }));
    return NextResponse.json({ ok: true, rows });
  }

  // councillors
  const { data, error } = await supabase
    .from("councillor_terms")
    .select("category, appointment_type, service_category, term_start, term_end, is_active, people:person_id(first_name, last_name)")
    .order("term_start", { ascending: false });
  if (error) return NextResponse.json({ ok: false, reason: "Query failed." }, { status: 500 });
  const rows = (data ?? []).map((t: any) => ({
    name: `${t.people?.first_name ?? ""} ${t.people?.last_name ?? ""}`,
    category: t.category,
    appointment_type: t.appointment_type,
    service_category: t.service_category,
    term_start: t.term_start,
    term_end: t.term_end,
    active: t.is_active,
  }));
  return NextResponse.json({ ok: true, rows });
}
