// Section 30, Step 2 of the Election Admin Wizard: "The system should
// automatically identify the applicable groups from the Nurses &
// Midwives Register. Show a clear summary for confirmation." Computed
// from the live register, not hard-coded — the exact same eligibility
// dimensions (professional_category x service_category, is_deceased,
// category_confirmed) used everywhere else in the eligibility engine.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  await requireAdmin(["elections"]);
  const supabase = await createClient();

  const categories: ("Nurse" | "Midwife")[] = ["Nurse", "Midwife"];
  const groups: ("Hospital" | "Community" | "Private")[] = ["Hospital", "Community", "Private"];

  const summary: Record<string, Record<string, number>> = {};
  let unspecifiedTotal = 0;
  const totals: Record<string, number> = {};
  const noSector: Record<string, number> = {};

  for (const category of categories) {
    summary[category] = {};
    for (const group of groups) {
      const { count } = await supabase
        .from("people")
        .select("*", { count: "exact", head: true })
        .eq("is_deceased", false)
        .eq("category_confirmed", true)
        .eq("service_category", group)
        .in("professional_category", ["Both", category]).or("registration_status.is.null,registration_status.neq.Revoked");
      summary[category][group] = count ?? 0;
    }
    // Everyone eligible in this category, and the ones with no Hospital /
    // Community / Private sector on file (blank, "Unspecified" or any other
    // value). They ARE eligible and ARE included in the lists — they just
    // haven't had a workplace sector recorded yet, so they can vote for and
    // nominate across all groups until it is.
    const { count: total } = await supabase
      .from("people")
      .select("*", { count: "exact", head: true })
      .eq("is_deceased", false)
      .eq("category_confirmed", true)
      .in("professional_category", ["Both", category]).or("registration_status.is.null,registration_status.neq.Revoked");
    const inGroups = groups.reduce((sum, g) => sum + (summary[category][g] ?? 0), 0);
    totals[category] = total ?? 0;
    noSector[category] = Math.max(0, (total ?? 0) - inGroups);
  }

  const { count: unspecified } = await supabase
    .from("people")
    .select("*", { count: "exact", head: true })
    .eq("is_deceased", false)
    .eq("category_confirmed", true)
    .or("service_category.is.null,service_category.eq.Unspecified").or("registration_status.is.null,registration_status.neq.Revoked");
  unspecifiedTotal = unspecified ?? 0;

  return NextResponse.json({ ok: true, summary, unspecifiedTotal, totals, noSector });
}
