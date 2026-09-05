import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { createServiceRoleClient } from "@/lib/supabase/server";

const ELECTION_STATUSES = [
  "Planned",
  "Nomination Open",
  "Nomination Closed",
  "Election Open",
  "Election Closed",
  "Completed",
] as const;

const updateSchema = z.object({
  status: z.enum(ELECTION_STATUSES).optional(),
  resultsPublished: z.boolean().optional(),
  certificationText: z.string().optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(["elections"]);
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: "Invalid input." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const update: Record<string, unknown> = {};

  if (parsed.data.status) {
    update.status = parsed.data.status;

    // Auto-apply the configured round durations the moment a round
    // actually opens ("Nomination closes for two weeks... Election
    // opens for one week") — set here rather than at election creation,
    // since the real closing date depends on when the round actually
    // starts, not when the election was first planned.
    if (parsed.data.status === "Nomination Open" || parsed.data.status === "Election Open") {
      const { data: election } = await supabase
        .from("elections")
        .select("nomination_duration_days, voting_duration_days")
        .eq("id", params.id)
        .single();
      if (election) {
        const days = parsed.data.status === "Nomination Open" ? election.nomination_duration_days : election.voting_duration_days;
        const closeField = parsed.data.status === "Nomination Open" ? "round1_close_at" : "round2_close_at";
        update[closeField] = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      }
    }
  }
  if (parsed.data.resultsPublished !== undefined) update.results_published = parsed.data.resultsPublished;

  const { error } = await supabase.from("elections").update(update).eq("id", params.id);
  if (error) {
    return NextResponse.json({ ok: false, reason: "Update failed." }, { status: 500 });
  }

  await supabase.from("audit_log").insert({
    actor_id: admin.id,
    action:
      parsed.data.resultsPublished === true
        ? "admin_certified_and_published_results"
        : "admin_updated_election",
    target_table: "elections",
    target_id: params.id,
    details: parsed.data.resultsPublished === true ? { ...update, certification: parsed.data.certificationText } : update,
  });

  return NextResponse.json({ ok: true });
}
