// Section 2/11: the Council decides how many nominees progress — no fixed
// number — and ties must be FLAGGED for a human decision, never silently
// resolved. Candidates strictly above a tie at the cutoff auto-progress;
// anyone tied at the boundary is left as 'Nominated' and returned as a
// flagged tie for the admin to decide via .../candidates/[id]/select.

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { createServiceRoleClient } from "@/lib/supabase/server";

const schema = z.object({ topN: z.number().int().min(1).max(50).default(5) });

type CandidateRow = { id: string; person_id: string; nomination_count: number };

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const actor = await requireAdmin(["elections"]);
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, reason: "Invalid input." }, { status: 400 });
  const { topN } = parsed.data;

  const supabase = createServiceRoleClient();
  const categories: ("Nurse" | "Midwife")[] = ["Nurse", "Midwife"];
  const result: Record<string, { autoSelected: number; tieFlagged: CandidateRow[] }> = {};

  for (const category of categories) {
    const { data: candidates } = await supabase
      .from("candidates")
      .select("id, person_id, nomination_count")
      .eq("election_id", params.id).eq("category", category).eq("status", "Nominated")
      .order("nomination_count", { ascending: false });

    if (!candidates || candidates.length === 0) {
      result[category] = { autoSelected: 0, tieFlagged: [] };
      continue;
    }

    if (candidates.length <= topN) {
      const ids = candidates.map((c: CandidateRow) => c.id);
      await supabase.from("candidates").update({ status: "Pending" }).in("id", ids);
      result[category] = { autoSelected: ids.length, tieFlagged: [] };
      continue;
    }

    const cutoffCount = candidates[topN - 1].nomination_count;
    const aboveCutoff = candidates.filter((c: CandidateRow) => c.nomination_count > cutoffCount);
    const atCutoff = candidates.filter((c: CandidateRow) => c.nomination_count === cutoffCount);

    if (aboveCutoff.length > 0) {
      await supabase.from("candidates").update({ status: "Pending" }).in("id", aboveCutoff.map((c: CandidateRow) => c.id));
    }

    const remainingSlots = topN - aboveCutoff.length;
    const isAmbiguous = atCutoff.length > remainingSlots && remainingSlots > 0;

    if (isAmbiguous) {
      result[category] = { autoSelected: aboveCutoff.length, tieFlagged: atCutoff };
    } else {
      const toSelect = atCutoff.slice(0, Math.max(0, remainingSlots));
      if (toSelect.length > 0) {
        await supabase.from("candidates").update({ status: "Pending" }).in("id", toSelect.map((c: CandidateRow) => c.id));
      }
      result[category] = { autoSelected: aboveCutoff.length + toSelect.length, tieFlagged: [] };
    }
  }

  await supabase.from("audit_log").insert({
    actor_id: actor.id, action: "admin_ranked_nominations", target_table: "elections",
    target_id: params.id, details: { topN, result },
  });

  return NextResponse.json({ ok: true, result });
}
