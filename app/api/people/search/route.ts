// Candidate lookup for the nomination form. Filters on is_deceased, not
// registration_status — a Retired or Non-Active nurse/midwife is still
// eligible to be nominated under the Council's confirmed election rules
// (only Deceased disqualifies). An earlier version of this endpoint
// filtered on registration_status = 'Practising', which silently made
// every Retired/Non-Active person unfindable here even though they were
// technically eligible — a real bug, not just an inconsistency. Returns
// only what's needed to identify someone — never NIN, address, or other
// sensitive fields.

import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { searchPersonIds, NO_MATCH_ID } from "@/lib/search";

export async function GET(request: Request) {
  const supabase = await createClient();
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
  // See lib/search.ts — a hand-assembled .or() filter string broke on a
  // literal comma typed into the search box even after PostgREST's
  // documented escaping, so this runs one plain per-column filter and
  // merges the matching ids instead.
  const matchingIds = await searchPersonIds(admin, q, ["first_name", "last_name"]);
  let query = admin
    .from("people")
    .select("id, first_name, last_name, place_of_work, professional_category")
    .eq("is_deceased", false)
    .eq("category_confirmed", true)
    .in("id", matchingIds.length ? matchingIds : [NO_MATCH_ID])
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
