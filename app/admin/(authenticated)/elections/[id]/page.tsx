import { EmptyState } from "@/lib/components/EmptyState";
import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { isTallyVisible, computeElectionStageLabel } from "@/lib/elections/tally";
import { isCandidateListLocked } from "@/lib/elections/computeTally";
import { ElectionControls } from "./ElectionControls";
import { CandidateRow } from "./CandidateRow";
import { NominationRankingPanel } from "./NominationRankingPanel";
import { VoterParticipation } from "./VoterParticipation";
import { ElectionMonitor } from "./ElectionMonitor";
import { NominationMonitor } from "./NominationMonitor";
import { ExportSummaryButton, type SummaryExportData } from "./ExportSummaryButton";
import { formatSeychellesTime } from "@/lib/reports";
import { ExtendElectionForm } from "./ExtendElectionForm";
import { ElectionSummary } from "./ElectionSummary";
import { ApprovalPanel } from "./ApprovalPanel";
import { ElectionStageStepper } from "./ElectionStageStepper";
import { ScheduleForm } from "./ScheduleForm";
import { IntegrityCheck } from "./IntegrityCheck";
import { DisputeRecountPanel } from "./DisputeRecountPanel";

export default async function ElectionDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  await requireAdmin(["elections"]);
  const supabase = await createClient();

  const { data: election } = await supabase
    .from("elections")
    .select("id, term_label, status, results_published, live_results_visible, round1_open_at, round1_close_at, round2_open_at, round2_close_at, approval_status, approved_by, approved_at, approval_reference, approval_notes, approval_document_path")
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

  const candidateNames = new Map<string, string>();
  for (const c of candidates ?? []) {
    const p = Array.isArray(c.people) ? c.people[0] : c.people;
    candidateNames.set(c.id, `${p?.first_name ?? ""} ${p?.last_name ?? ""}`.trim());
  }

  const { data: disputes } = await supabase
    .from("election_disputes")
    .select("id, category, reason, status, original_tally, recount_tally, recount_matches, resolution, resolution_notes, filed_at")
    .eq("election_id", params.id)
    .order("filed_at", { ascending: false });

  // Per-candidate tallies now go through the shared isTallyVisible helper
  // (Section 9 of the confirmed rules) — includes the admin-configurable
  // live_results_visible toggle, not just "closed or completed."
  const tallyVisible = isTallyVisible(election);

  // Election Summary export (Closed or Completed): same figures the page
  // already shows — per-candidate vote counts, never who voted for whom.
  let summaryExport: SummaryExportData | null = null;
  if (election.status === "Election Closed" || election.status === "Completed") {
    const cats: ("Nurse" | "Midwife")[] = ["Nurse", "Midwife"];
    const categories = await Promise.all(
      cats.map(async (category) => {
        const { count: eligible } = await supabase
          .from("people").select("*", { count: "exact", head: true })
          .eq("is_deceased", false).eq("category_confirmed", true)
          .or(`professional_category.eq.Both,professional_category.eq.${category}`);
        const { count: voted } = await supabase
          .from("vote_participation").select("*", { count: "exact", head: true })
          .eq("election_id", params.id).eq("round", 2).eq("category", category);
        const list = (category === "Nurse" ? nurseCandidates : midwifeCandidates)
          .filter((c: any) => ["Accepted", "Elected", "Not Elected"].includes(c.status))
          .map((c: any) => ({ name: candidateNames.get(c.id) ?? "", nominations: c.nomination_count ?? 1, votes: voteCounts.get(c.id) ?? 0, status: c.status }))
          .sort((a, b) => b.votes - a.votes);
        const total = list.reduce((sum, c) => sum + c.votes, 0);
        const e = eligible ?? 0;
        const v = voted ?? 0;
        return {
          category,
          eligible: e,
          voted: v,
          turnout: e > 0 ? `${((v / e) * 100).toFixed(1)}%` : "0.0%",
          candidates: list.map((c) => ({ ...c, share: total > 0 ? `${Math.round((c.votes / total) * 100)}%` : "0%" })),
        };
      })
    );
    summaryExport = {
      election: {
        term: election.term_label,
        stage: computeElectionStageLabel(election),
        approval: election.approval_status ?? "Not recorded",
        resultsPublished: !!election.results_published,
      },
      schedule: [
        { label: "Round 1 opens", value: election.round1_open_at ? formatSeychellesTime(election.round1_open_at) : "Not set" },
        { label: "Round 1 closes", value: election.round1_close_at ? formatSeychellesTime(election.round1_close_at) : "Not set" },
        { label: "Round 2 opens", value: election.round2_open_at ? formatSeychellesTime(election.round2_open_at) : "Not set" },
        { label: "Round 2 closes", value: election.round2_close_at ? formatSeychellesTime(election.round2_close_at) : "Not set" },
      ],
      categories,
      disputes: (disputes ?? []).map((d: any) => ({
        category: d.category,
        filed: d.filed_at ? formatSeychellesTime(d.filed_at) : "",
        status: d.status,
        reason: d.reason,
        resolution: d.resolution ?? "",
        notes: d.resolution_notes ?? "",
      })),
    };
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl text-council-navy">{election.term_label}</h1>
        <p className="font-body text-sm text-council-ink/50 mt-1">{participationCount ?? 0} ballots cast so far</p>
      </div>

      <ElectionStageStepper election={election} />

      <ScheduleForm
        electionId={election.id}
        round1OpenAt={election.round1_open_at}
        round1CloseAt={election.round1_close_at}
        round2OpenAt={election.round2_open_at}
        round2CloseAt={election.round2_close_at}
      />

      <div className="bg-white rounded-card border border-council-navy/10 p-6 space-y-4">
        <ElectionControls
          electionId={election.id}
          status={election.status}
          resultsPublished={election.results_published}
          approvalStatus={election.approval_status}
          round1CloseAt={election.round1_close_at}
          round2CloseAt={election.round2_close_at}
          liveResultsVisible={election.live_results_visible}
        />
        <div className="pt-4 border-t border-council-navy/10 space-y-2">
          <ExtendElectionForm electionId={election.id} field="round1_close_at" label="Nomination closes" currentClosing={election.round1_close_at} />
          <ExtendElectionForm electionId={election.id} field="round2_close_at" label="Voting closes" currentClosing={election.round2_close_at} />
        </div>
      </div>

      {(election.status === "Nomination Closed" || election.status === "Nomination Open") && (
        <>
          <NominationMonitor election={election} />
          <NominationRankingPanel electionId={election.id} />
        </>
      )}

      {/* Completed was previously excluded here, which meant the final
          turnout summary disappeared entirely right when it matters
          most — after the election is actually done. */}
      {(election.status === "Election Open" || election.status === "Election Closed" || election.status === "Completed") && (
        <ElectionMonitor election={election} />
      )}

      {(election.status === "Election Closed" || election.status === "Completed") && (
        <>
          <IntegrityCheck electionId={election.id} round={2} />
          <DisputeRecountPanel electionId={election.id} disputes={disputes ?? []} candidateNames={candidateNames} />
          <ApprovalPanel
            electionId={election.id}
            approvalStatus={election.approval_status}
            approvedBy={election.approved_by}
            approvedAt={election.approved_at}
            approvalReference={election.approval_reference}
            approvalNotes={election.approval_notes}
            hasUnresolvedDisputes={(disputes ?? []).some((d: any) => d.status !== "Resolved")}
            approvalDocumentPath={election.approval_document_path}
          />
        </>
      )}

      {summaryExport && (
        <div className="flex justify-end">
          <ExportSummaryButton data={summaryExport} />
        </div>
      )}

      {election.status === "Completed" && (
        <ElectionSummary
          nurseCandidates={nurseCandidates}
          midwifeCandidates={midwifeCandidates}
          voteCounts={voteCounts}
        />
      )}

      <CandidateSection title="Nurse Candidates" candidates={nurseCandidates} voteCounts={voteCounts} tallyVisible={tallyVisible} candidateListLocked={isCandidateListLocked(election.status)} />
      <CandidateSection title="Midwife Candidates" candidates={midwifeCandidates} voteCounts={voteCounts} tallyVisible={tallyVisible} candidateListLocked={isCandidateListLocked(election.status)} />

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
  candidateListLocked,
}: {
  title: string;
  candidates: any[];
  voteCounts: Map<string, number>;
  tallyVisible: boolean;
  candidateListLocked: boolean;
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
            candidateListLocked={candidateListLocked}
          />
        ))
      )}
    </div>
  );
}
