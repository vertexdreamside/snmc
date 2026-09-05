import { EmptyState } from "@/lib/components/EmptyState";
import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { isTallyVisible } from "@/lib/elections/tally";
import { ElectionControls } from "./ElectionControls";
import { CandidateRow } from "./CandidateRow";
import { NominationRankingPanel } from "./NominationRankingPanel";
import { VoterParticipation } from "./VoterParticipation";
import { ElectionMonitor } from "./ElectionMonitor";
import { ExtendElectionForm } from "./ExtendElectionForm";
import { ElectionSummary } from "./ElectionSummary";

export default async function ElectionDetailPage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const supabase = createClient();

  const { data: election } = await supabase
    .from("elections")
    .select("id, term_label, status, results_published, live_results_visible, round1_close_at, round2_close_at")
    .eq("id", params.id)
    .single();

  if (!election) {
    return <EmptyState message="Election not found." backHref="/admin/elections" backLabel="← Back to elections" />;
  }

  const { data: candidates } = await supabase
    .from("candidates")
    .select("id, category, status, round, nomination_count, people:person_id(first_name, last_name)")
    .eq("election_id", params.id);

  const { data: ballots } = await supabase.from("ballots").select("candidate_id").eq("election_id", params.id);

  const { count: participationCount } = await supabase
    .from("vote_participation")
    .select("*", { count: "exact", head: true })
    .eq("election_id", params.id);

  const voteCounts = new Map<string, number>();
  for (const b of ballots ?? []) {
    voteCounts.set(b.candidate_id, (voteCounts.get(b.candidate_id) ?? 0) + 1);
  }

  const nurseCandidates = (candidates ?? []).filter((c) => c.category === "Nurse");
  const midwifeCandidates = (candidates ?? []).filter((c) => c.category === "Midwife");

  // Per-candidate tallies now go through the shared isTallyVisible helper
  // (Section 9 of the confirmed rules) — includes the admin-configurable
  // live_results_visible toggle, not just "closed or completed."
  const tallyVisible = isTallyVisible(election);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl text-council-navy">{election.term_label}</h1>
        <p className="font-body text-sm text-council-ink/50 mt-1">{participationCount ?? 0} ballots cast so far</p>
      </div>

      <div className="bg-white rounded-card border border-council-navy/10 p-6 space-y-4">
        <ElectionControls electionId={election.id} status={election.status} resultsPublished={election.results_published} />
        <div className="pt-4 border-t border-council-navy/10 space-y-2">
          <ExtendElectionForm electionId={election.id} field="round1_close_at" label="Nomination closes" currentClosing={election.round1_close_at} />
          <ExtendElectionForm electionId={election.id} field="round2_close_at" label="Voting closes" currentClosing={election.round2_close_at} />
        </div>
      </div>

      {(election.status === "Nomination Closed" || election.status === "Nomination Open") && (
        <NominationRankingPanel electionId={election.id} />
      )}

      {/* Completed was previously excluded here, which meant the final
          turnout summary disappeared entirely right when it matters
          most — after the election is actually done. */}
      {(election.status === "Election Open" || election.status === "Election Closed" || election.status === "Completed") && (
        <ElectionMonitor election={election} />
      )}

      {election.status === "Completed" && (
        <ElectionSummary
          nurseCandidates={nurseCandidates}
          midwifeCandidates={midwifeCandidates}
          voteCounts={voteCounts}
        />
      )}

      <CandidateSection title="Nurse Candidates" candidates={nurseCandidates} voteCounts={voteCounts} tallyVisible={tallyVisible} />
      <CandidateSection title="Midwife Candidates" candidates={midwifeCandidates} voteCounts={voteCounts} tallyVisible={tallyVisible} />

      {(election.status === "Election Open" || election.status === "Election Closed" || election.status === "Completed") && (
        <>
          <VoterParticipation electionId={election.id} round={2} category="Nurse" />
          <VoterParticipation electionId={election.id} round={2} category="Midwife" />
        </>
      )}
    </div>
  );
}

function CandidateSection({
  title,
  candidates,
  voteCounts,
  tallyVisible,
}: {
  title: string;
  candidates: any[];
  voteCounts: Map<string, number>;
  tallyVisible: boolean;
}) {
  // Sorted by vote count when tallies are actually visible — purely
  // informational, to help whoever reviews this see the ranking clearly.
  // Deliberately doesn't auto-declare a winner: the "Mark Elected" /
  // "Not Elected" buttons on each row are still a manual admin decision,
  // consistent with how nomination ranking flags ties instead of
  // resolving them — the Council's actual composition rule (how many
  // seats per category) was never confirmed to this system, so it
  // can't safely decide that on its own.
  const sorted = tallyVisible
    ? [...candidates].sort((a, b) => (voteCounts.get(b.id) ?? 0) - (voteCounts.get(a.id) ?? 0))
    : candidates;

  return (
    <div className="bg-white rounded-card border border-council-navy/10 overflow-hidden">
      <h2 className="font-display text-base text-council-navy px-4 pt-4 pb-2">{title}</h2>
      {sorted.length === 0 ? (
        <p className="px-4 pb-6 font-body text-sm text-council-ink/50">No candidates yet.</p>
      ) : (
        sorted.map((c) => (
          <CandidateRow
            key={c.id}
            candidateId={c.id}
            name={`${c.people?.first_name ?? ""} ${c.people?.last_name ?? ""}`}
            status={c.status}
            nominationCount={c.nomination_count ?? 1}
            votes={tallyVisible ? voteCounts.get(c.id) ?? 0 : null}
          />
        ))
      )}
    </div>
  );
}
