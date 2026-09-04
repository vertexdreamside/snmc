// Section 10: extend either round's closing time, with a required reason
// recorded to the audit trail (original closing, new closing, reason,
// admin, timestamp). Uses the existing round1_close_at/round2_close_at
// columns from migration 0001 — no new columns needed.

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { createServiceRoleClient } from "@/lib/supabase/server";

const schema = z.object({
  field: z.enum(["round1_close_at", "round2_close_at"]),
  newClosingTime: z.string().datetime(),
  reason: z.string().min(1, "A reason is required for the audit record."),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const actor = await requireAdmin(["elections"]);
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: parsed.error.errors[0]?.message ?? "Invalid input." }, { status: 400 });
  }
  const { field, newClosingTime, reason } = parsed.data;

  const supabase = createServiceRoleClient();
  const { data: election } = await supabase.from("elections").select(`id, term_label, ${field}`).eq("id", params.id).single();
  if (!election) return NextResponse.json({ ok: false, reason: "Election not found." }, { status: 404 });

  const originalClosing = (election as Record<string, unknown>)[field];

  const { error } = await supabase.from("elections").update({ [field]: newClosingTime }).eq("id", params.id);
  if (error) return NextResponse.json({ ok: false, reason: "Could not update the closing time." }, { status: 500 });

  await supabase.from("audit_log").insert({
    actor_id: actor.id,
    action: "admin_extended_election",
    target_table: "elections",
    target_id: params.id,
    details: { field, election_term: election.term_label, original_closing: originalClosing, new_closing: newClosingTime, reason },
  });

  return NextResponse.json({ ok: true });
}
