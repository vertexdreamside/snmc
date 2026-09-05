import { createClient } from "@/lib/supabase/server";
import { ShieldCheck, ShieldAlert } from "lucide-react";

// Post-election reconciliation ("canvass," per the EAC's election
// technology best-practices guide) — verifies vote_participation and
// ballots counts genuinely match per category. They should ALWAYS be
// equal by design (every vote writes to both), so any mismatch is a
// real signal worth surfacing, not routine — most likely the exact edge
// case already logged as "vote_ballot_insert_failed_after_participation_
// recorded" in app/api/vote/route.ts, where a person's participation was
// recorded but their ballot write failed.
export async function IntegrityCheck({ electionId, round }: { electionId: string; round: number }) {
  const supabase = createClient();
  const categories: ("Nurse" | "Midwife")[] = ["Nurse", "Midwife"];

  const checks = await Promise.all(
    categories.map(async (category) => {
      const [{ count: participationCount }, { count: ballotCount }] = await Promise.all([
        supabase.from("vote_participation").select("*", { count: "exact", head: true }).eq("election_id", electionId).eq("round", round).eq("category", category),
        supabase.from("ballots").select("*", { count: "exact", head: true }).eq("election_id", electionId).eq("round", round).eq("category", category),
      ]);
      return { category, participationCount: participationCount ?? 0, ballotCount: ballotCount ?? 0 };
    })
  );

  const allMatch = checks.every((c) => c.participationCount === c.ballotCount);

  return (
    <div className={`rounded-card border p-4 ${allMatch ? "bg-status-active/5 border-status-active/20" : "bg-status-closed/5 border-status-closed/30"}`}>
      <div className="flex items-center gap-2 mb-2">
        {allMatch ? <ShieldCheck size={16} className="text-status-active" aria-hidden="true" /> : <ShieldAlert size={16} className="text-status-closed" aria-hidden="true" />}
        <h3 className="font-display text-sm text-council-navy">Reconciliation Check</h3>
      </div>
      {checks.map((c) => (
        <p key={c.category} className="font-body text-xs text-council-ink/60">
          {c.category}: {c.participationCount} participation record{c.participationCount === 1 ? "" : "s"}, {c.ballotCount} ballot{c.ballotCount === 1 ? "" : "s"}{" "}
          {c.participationCount === c.ballotCount ? (
            <span className="text-status-active">— matches</span>
          ) : (
            <span className="text-status-closed font-medium">— MISMATCH, needs investigation</span>
          )}
        </p>
      ))}
    </div>
  );
}
