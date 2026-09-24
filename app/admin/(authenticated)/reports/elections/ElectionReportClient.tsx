"use client";

import * as XLSX from "xlsx";

interface NominationRow { rank: number; name: string; votingGroup: string; nominationCount: number; status: string; }
interface CategoryStat {
  category: string;
  eligible: number;
  voted: number;
  turnout: string;
  candidateResults: { name: string; votes: number; elected: boolean }[];
  nominationReport: NominationRow[];
}
interface ElectionReport {
  election: { id: string; term_label: string; status: string };
  categoryStats: CategoryStat[];
}

// Section 33: three distinct reports, not one combined view —
// Nomination Report, Voting Results, Voter Participation — each
// independently exportable. Voter Participation stays aggregate-only
// (eligible/voted/turnout), same anonymity boundary as everywhere else
// in this system; it's never joined to individual ballot choices.
export function ElectionReportClient({ report }: { report: ElectionReport[] }) {
  function exportNominationReport() {
    const rows: Record<string, string | number>[] = [];
    for (const { election, categoryStats } of report) {
      for (const stat of categoryStats) {
        for (const n of stat.nominationReport) {
          rows.push({ Election: election.term_label, Category: stat.category, Rank: n.rank, Nominee: n.name, "Voting Group": n.votingGroup, Nominations: n.nominationCount, "Acceptance Status": n.status });
        }
      }
    }
    exportRows(rows, "snmc-nomination-report.xlsx");
  }

  function exportVotingResults() {
    const rows: Record<string, string | number>[] = [];
    for (const { election, categoryStats } of report) {
      for (const stat of categoryStats) {
        const total = stat.candidateResults.reduce((sum, c) => sum + c.votes, 0);
        stat.candidateResults.forEach((c, i) => {
          rows.push({ Election: election.term_label, Category: stat.category, Rank: i + 1, Candidate: c.name, Votes: c.votes, Percentage: total > 0 ? `${((c.votes / total) * 100).toFixed(1)}%` : "0%", Elected: c.elected ? "Yes" : "" });
        });
      }
    }
    exportRows(rows, "snmc-voting-results.xlsx");
  }

  function exportVoterParticipation() {
    const rows: Record<string, string | number>[] = [];
    for (const { election, categoryStats } of report) {
      for (const stat of categoryStats) {
        rows.push({ Election: election.term_label, Category: stat.category, "Eligible Voters": stat.eligible, "Votes Cast": stat.voted, "Turnout %": stat.turnout });
      }
    }
    exportRows(rows, "snmc-voter-participation.xlsx");
  }

  function exportRows(rows: Record<string, string | number>[], filename: string) {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, filename);
  }

  return (
    <div className="space-y-8">
      <ReportSection title="Nomination Report" onExport={exportNominationReport}>
        {report.map(({ election, categoryStats }) => (
          <ElectionBlock key={election.id} title={election.term_label} status={election.status}>
            {categoryStats.map((stat) => (
              <CategoryColumn key={stat.category} label={stat.category}>
                {stat.nominationReport.length === 0 ? (
                  <EmptyNote text="No nominations recorded." />
                ) : (
                  <ul className="space-y-0.5">
                    {stat.nominationReport.map((n) => (
                      <li key={n.name + n.rank} className="font-body text-xs text-council-ink/70 flex justify-between">
                        <span>#{n.rank} {n.name} <span className="text-council-ink/40">({n.votingGroup})</span></span>
                        <span>{n.nominationCount} nom. · {n.status}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CategoryColumn>
            ))}
          </ElectionBlock>
        ))}
      </ReportSection>

      <ReportSection title="Voting Results" onExport={exportVotingResults}>
        {report.map(({ election, categoryStats }) => (
          <ElectionBlock key={election.id} title={election.term_label} status={election.status}>
            {categoryStats.map((stat) => (
              <CategoryColumn key={stat.category} label={stat.category}>
                {stat.candidateResults.length === 0 ? (
                  <EmptyNote text="No votes recorded yet." />
                ) : (
                  <ul className="space-y-0.5">
                    {stat.candidateResults.map((c) => (
                      <li key={c.name} className="font-body text-xs text-council-ink/70 flex justify-between">
                        <span>{c.name} {c.elected && <span className="text-status-active font-medium">(Elected)</span>}</span>
                        <span>{c.votes} votes</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CategoryColumn>
            ))}
          </ElectionBlock>
        ))}
      </ReportSection>

      <ReportSection title="Voter Participation" onExport={exportVoterParticipation}>
        {report.map(({ election, categoryStats }) => (
          <ElectionBlock key={election.id} title={election.term_label} status={election.status}>
            {categoryStats.map((stat) => (
              <CategoryColumn key={stat.category} label={stat.category}>
                <p className="font-body text-xs text-council-ink/70">{stat.voted} of {stat.eligible} eligible voted ({stat.turnout}%)</p>
              </CategoryColumn>
            ))}
          </ElectionBlock>
        ))}
      </ReportSection>

      {report.length === 0 && (
        <div className="bg-white rounded-card border border-council-navy/10 p-8 text-center">
          <p className="font-body text-sm text-council-ink/50">No elections yet.</p>
        </div>
      )}
    </div>
  );
}

function ReportSection({ title, onExport, children }: { title: string; onExport: () => void; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg text-council-navy">{title}</h2>
        <button onClick={onExport} className="border border-council-navy/20 font-body text-sm font-medium rounded-card px-3 py-1.5">
          Export Excel
        </button>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function ElectionBlock({ title, status, children }: { title: string; status: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-card border border-council-navy/10 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-body text-sm font-medium text-council-navy">{title}</h3>
        <span className="font-body text-xs text-council-ink/50">{status}</span>
      </div>
      <div className="grid grid-cols-2 gap-6">{children}</div>
    </div>
  );
}

function CategoryColumn({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-body text-xs font-medium text-council-navy mb-1">{label}</p>
      {children}
    </div>
  );
}

function EmptyNote({ text }: { text: string }) {
  return <p className="font-body text-xs text-council-ink/40 italic">{text}</p>;
}
