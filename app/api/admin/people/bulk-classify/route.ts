// Bulk category confirmation — the actual tool for "later when I confirm
// the registration numbers." An admin selects a batch of people they've
// reviewed and know to be Nurse / Midwife / Both, and this sets both
// professional_category and category_confirmed = true in one call, so
// reviewing ~1,000+ records doesn't mean 1,000+ individual clicks.

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { createServiceRoleClient } from "@/lib/supabase/server";

const bulkClassifySchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(500),
  category: z.enum(["Nurse", "Midwife", "Both"]),
});

export async function POST(request: Request) {
  const admin = await requireAdmin(["register"]);

  const body = await request.json();
  const parsed = bulkClassifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: "Invalid input." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { error, count } = await supabase
    .from("people")
    .update({
      professional_category: parsed.data.category,
      category_confirmed: true,
      updated_at: new Date().toISOString(),
    })
    .in("id", parsed.data.ids)
    .select("id", { count: "exact" });

  if (error) {
    return NextResponse.json({ ok: false, reason: "Update failed." }, { status: 500 });
  }

  await supabase.from("audit_log").insert({
    actor_id: admin.id,
    action: "admin_bulk_confirmed_category",
    target_table: "people",
    details: { category: parsed.data.category, count: parsed.data.ids.length },
  });

  return NextResponse.json({ ok: true, updated: count ?? parsed.data.ids.length });
}
