import type { createServiceRoleClient } from "@/lib/supabase/server";

// Shared between filing a dispute (captures the original snapshot) and
// running a recount (re-computes independently for comparison) — the
// exact same query logic, so a "recount" is a genuine re-run of the same
// computation, not a slightly different one that could disagree for
// reasons unrelated to the actual data.
export async function computeTally(
  supabase: ReturnType<typeof createServiceRoleClient>,
  electionId: string,
  category: string
): Promise<Record<string, number>> {
  const { data: ballots } = await supabase
    .from("ballots")
    .select("candidate_id")
    .eq("election_id", electionId)
    .eq("round", 2)
    .eq("category", category);
  const counts = new Map<string, number>();
  (ballots ?? []).forEach((b: { candidate_id: string }) => counts.set(b.candidate_id, (counts.get(b.candidate_id) ?? 0) + 1));
  return Object.fromEntries(counts);
}

// Section 17: "Once confirmed, the candidate list should be locked when
// the election opens." Locked once Round 2 has actually opened or later
// — Select/Accept/Decline/Remove must never be possible once voting has
// started, since that would let an admin change who's on the ballot
// while people are actively voting on it. Checked here at the API
// level, not just hidden in the UI.
export function isCandidateListLocked(electionStatus: string): boolean {
  return electionStatus === "Election Open" || electionStatus === "Election Closed" || electionStatus === "Completed";
}
