// Runs an independent recount — re-executes the exact same tally query
// fresh, and compares it against the snapshot captured when the dispute
// was filed. A mismatch here is a genuinely serious signal (the
// underlying vote data changed between filing and recounting, which
// shouldn't happen once an election is closed) — not something to
// silently resolve, which is why recount_matches is stored explicitly
// rather than just left implicit in the two JSON blobs.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { computeTally } from "@/lib/elections/computeTally";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(["elections"]);
  const supabase = createServiceRoleClient();

  const { data: dispute } = await supabase
    .from("election_disputes")
    .select("id, election_id, category, original_tally")
    .eq("id", params.id)
    .single();

  if (!dispute) return NextResponse.json({ ok: false, reason: "Dispute not found." }, { status: 404 });

  const recountTally = await computeTally(supabase, dispute.election_id, dispute.category);
  const matches = JSON.stringify(recountTally) === JSON.stringify(dispute.original_tally ?? {});

  const { error } = await supabase
    .from("election_disputes")
    .update({
      recount_tally: recountTally,
      recount_matches: matches,
      status: "Recounting",
      recounted_at: new Date().toISOString(),
    })
    .eq("id", params.id);

  if (error) return NextResponse.json({ ok: false, reason: "Could not record the recount." }, { status: 500 });

  await supabase.from("audit_log").insert({
    actor_id: admin.id,
    action: "admin_ran_election_recount",
    target_table: "election_disputes",
    target_id: params.id,
    details: { matches, recount_tally: recountTally },
  });

  return NextResponse.json({ ok: true, matches, recountTally });
}
