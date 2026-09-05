// Section 3 of the confirmed election rules: after a nominee is selected
// to progress ('Pending'), they must be given the chance to accept or
// decline. Declining/removal automatically finds the next-highest-
// nominated person still available and moves them to 'Pending' too — a
// human still confirms THAT decision separately. Audit trail captures
// exactly what Section 3 specifies: original nominee, nomination count,
// decision, replacement, administrator, timestamp.

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { createServiceRoleClient } from "@/lib/supabase/server";

const decisionSchema = z.object({
  decision: z.enum(["Accepted", "Declined", "Removed"]),
  reason: z.string().optional(),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const actor = await requireAdmin(["elections"]);

  const body = await request.json().catch(() => ({}));
  const parsed = decisionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: "Invalid input." }, { status: 400 });
  }
  const { decision, reason } = parsed.data;

  const supabase = createServiceRoleClient();

  const { data: candidate, error: fetchError } = await supabase
    .from("candidates")
    .select("id, election_id, category, person_id, nomination_count, status")
    .eq("id", params.id)
    .single();

  if (fetchError || !candidate) {
    return NextResponse.json({ ok: false, reason: "Candidate not found." }, { status: 404 });
  }
  if (candidate.status !== "Pending") {
    return NextResponse.json(
      { ok: false, reason: `Can only record a decision for a candidate awaiting one — this one is currently "${candidate.status}".` },
      { status: 400 }
    );
  }

  const { error: updateError } = await supabase
    .from("candidates")
    .update({ status: decision, decision_recorded_at: new Date().toISOString(), decision_recorded_by: actor.id })
    .eq("id", candidate.id);

  if (updateError) {
    return NextResponse.json({ ok: false, reason: "Could not record the decision." }, { status: 500 });
  }

  let replacement: { id: string; person_id: string; nomination_count: number } | null = null;

  if (decision === "Declined" || decision === "Removed") {
    const { data: nextBest } = await supabase
      .from("candidates")
      .select("id, person_id, nomination_count")
      .eq("election_id", candidate.election_id)
      .eq("category", candidate.category)
      .eq("status", "Nominated")
      .order("nomination_count", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (nextBest) {
      await supabase.from("candidates").update({ status: "Pending" }).eq("id", nextBest.id);
      await supabase.from("candidates").update({ replaced_by: nextBest.id }).eq("id", candidate.id);
      replacement = nextBest;
    }
  }

  await supabase.from("audit_log").insert({
    actor_id: actor.id,
    action: "admin_recorded_candidate_decision",
    target_table: "candidates",
    target_id: candidate.id,
    details: {
      original_nominee_person_id: candidate.person_id,
      nomination_count: candidate.nomination_count,
      decision,
      reason: reason ?? null,
      replacement_candidate_id: replacement?.id ?? null,
      replacement_person_id: replacement?.person_id ?? null,
      replacement_nomination_count: replacement?.nomination_count ?? null,
    },
  });

  return NextResponse.json({ ok: true, replacement });
}
