"use client";

import * as XLSX from "xlsx";

interface CategoryStat {
  category: string;
  eligible: number;
  voted: number;
  turnout: string;
  candidateResults: { name: string; votes: number; elected: boolean }[];
}

interface ElectionReport {
  election: { id: string; term_label: string; status: string };
  categoryStats: CategoryStat[];
}

export function ElectionReportClient({ report }: { report: ElectionReport[] }) {
  function exportExcel() {
    const rows: Record<string, string | number>[] = [];
    for (const { election, categoryStats } of report) {
      for (const stat of categoryStats) {
        if (stat.candidateResults.length === 0) {
          rows.push({
            Election: election.term_label, Status: election.status, Category: stat.category,
            "Eligible Voters": stat.eligible, "Votes Cast": stat.voted, "Turnout %": stat.turnout,
            Candidate: "", Votes: "", Elected: "",
          });
        }
        for (const c of stat.candidateResults) {
          rows.push({
            Election: election.term_label, Status: election.status, Category: stat.category,
            "Eligible Voters": stat.eligible, "Votes Cast": stat.voted, "Turnout %": stat.turnout,
            Candidate: c.name, Votes: c.votes, Elected: c.elected ? "Yes" : "",
          });
        }
      }
    }
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Election Report");
    XLSX.writeFile(wb, "snmc-election-report.xlsx");
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={exportExcel} className="border border-council-navy/20 font-body text-sm font-medium rounded-card px-4 py-2">
          Export Excel
        </button>
      </div>
      {report.map(({ election, categoryStats }) => (
        <div key={election.id} className="bg-white rounded-card border border-council-navy/10 p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-base text-council-navy">{election.term_label}</h2>
            <span className="font-body text-xs text-council-ink/50">{election.status}</span>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {categoryStats.map((stat) => (
              <div key={stat.category}>
                <p className="font-body text-sm font-medium text-council-navy mb-1">{stat.category}</p>
                <p className="font-body text-xs text-council-ink/60 mb-2">
                  {stat.voted} of {stat.eligible} eligible voted ({stat.turnout}%)
                </p>
                {stat.candidateResults.length > 0 ? (
                  <ul className="space-y-0.5">
                    {stat.candidateResults.map((c) => (
                      <li key={c.name} className="font-body text-xs text-council-ink/70 flex justify-between">
                        <span>{c.name} {c.elected && <span className="text-status-active font-medium">(Elected)</span>}</span>
                        <span>{c.votes} votes</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="font-body text-xs text-council-ink/40 italic">No votes recorded yet.</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      {report.length === 0 && (
        <div className="bg-white rounded-card border border-council-navy/10 p-8 text-center">
          <p className="font-body text-sm text-council-ink/50">No elections yet.</p>
        </div>
      )}
    </div>
  );
}
