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
  const supabase = createClient();

  const categories: ("Nurse" | "Midwife")[] = ["Nurse", "Midwife"];
  const groups: ("Hospital" | "Community" | "Private")[] = ["Hospital", "Community", "Private"];

  const summary: Record<string, Record<string, number>> = {};
  let unspecifiedTotal = 0;

  for (const category of categories) {
    summary[category] = {};
    for (const group of groups) {
      const { count } = await supabase
        .from("people")
        .select("*", { count: "exact", head: true })
        .eq("is_deceased", false)
        .eq("category_confirmed", true)
        .eq("service_category", group)
        .or(`professional_category.eq.Both,professional_category.eq.${category}`);
      summary[category][group] = count ?? 0;
    }
  }

  const { count: unspecified } = await supabase
    .from("people")
    .select("*", { count: "exact", head: true })
    .eq("is_deceased", false)
    .eq("category_confirmed", true)
    .or("service_category.is.null,service_category.eq.Unspecified");
  unspecifiedTotal = unspecified ?? 0;

  return NextResponse.json({ ok: true, summary, unspecifiedTotal });
}
