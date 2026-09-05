// Files a formal dispute against an election's results for a specific
// category. Captures the current vote tally as original_tally at the
// moment of filing — this is what a later recount gets compared against.

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { computeTally } from "@/lib/elections/computeTally";

const schema = z.object({
  category: z.enum(["Nurse", "Midwife"]),
  reason: z.string().min(1, "A reason is required"),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(["elections"]);
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: parsed.error.errors[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const originalTally = await computeTally(supabase, params.id, parsed.data.category);

  const { data: dispute, error } = await supabase
    .from("election_disputes")
    .insert({
      election_id: params.id,
      category: parsed.data.category,
      filed_by: admin.id,
      reason: parsed.data.reason,
      original_tally: originalTally,
      status: "Open",
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ ok: false, reason: "Could not file the dispute." }, { status: 500 });

  await supabase.from("audit_log").insert({
    actor_id: admin.id,
    action: "admin_filed_election_dispute",
    target_table: "elections",
    target_id: params.id,
    details: { category: parsed.data.category, reason: parsed.data.reason, dispute_id: dispute.id },
  });

  return NextResponse.json({ ok: true, id: dispute.id });
}
