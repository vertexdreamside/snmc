// Candidate lookup for the nomination form — mirrors the real process's
// "Lists of Registered Licensed Nurses and Midwives currently practicing
// ... are available in the Council Office" (from the historical Nomination
// Form instructions). Returns only what's needed to identify someone —
// never NIN, address, or other sensitive fields.

import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, reason: "Not signed in." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const category = searchParams.get("category"); // "Nurse" | "Midwife"

  if (!q || q.length < 2) {
    return NextResponse.json({ ok: true, results: [] });
  }

  const admin = createServiceRoleClient();
  let query = admin
    .from("people")
    .select("id, first_name, last_name, place_of_work, professional_category")
    .eq("registration_status", "Practising")
    .eq("category_confirmed", true)
    .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
    .limit(10);

  if (category === "Nurse" || category === "Midwife") {
    query = query.or(`professional_category.eq.${category},professional_category.eq.Both`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ ok: false, reason: "Search failed." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, results: data });
}
