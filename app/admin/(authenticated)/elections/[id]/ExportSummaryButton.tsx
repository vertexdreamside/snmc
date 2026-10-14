"use client";

import * as XLSX from "xlsx";
import { Download } from "lucide-react";

export interface SummaryExportData {
  election: { term: string; stage: string; approval: string; resultsPublished: boolean };
  schedule: { label: string; value: string }[];
  categories: {
    category: string;
    eligible: number;
    voted: number;
    turnout: string;
    candidates: { name: string; nominations: number; votes: number; share: string; status: string }[];
  }[];
  disputes: { category: string; filed: string; status: string; reason: string; resolution: string; notes: string }[];
}

// Admin-only export of the whole election summary as one Excel workbook:
// overview, one results sheet per category, and the disputes log. Built
// from figures the page already computed — vote counts per candidate, never
// who voted for whom.
export function ExportSummaryButton({ data }: { data: SummaryExportData }) {
  function exportSummary() {
    const wb = XLSX.utils.book_new();

    const overview: (string | number)[][] = [
      ["Election", data.election.term],
      ["Stage", data.election.stage],
      ["Minister approval", data.election.approval],
      ["Results published", data.election.resultsPublished ? "Yes" : "No"],
      ...data.schedule.map((s) => [s.label, s.value]),
      [],
      ["Category", "Eligible voters", "Voted", "Turnout"],
      ...data.categories.map((c) => [c.category, c.eligible, c.voted, c.turnout]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(overview), "Summary");

    for (const c of data.categories) {
      const rows = c.candidates.map((x, i) => ({
        Rank: i + 1,
        Candidate: x.name,
        Nominations: x.nominations,
        Votes: x.votes,
        "Share of votes": x.share,
        Status: x.status,
      }));
      const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ Candidate: "No candidates" }]);
      XLSX.utils.book_append_sheet(wb, ws, `${c.category} results`);
    }

    const dRows = data.disputes.map((d) => ({
      Category: d.category,
      Filed: d.filed,
      Status: d.status,
      Reason: d.reason,
      Resolution: d.resolution,
      "Resolution notes": d.notes,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dRows.length > 0 ? dRows : [{ Reason: "No disputes filed" }]), "Disputes");

    const safe = data.election.term.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") || "election";
    XLSX.writeFile(wb, `snmc-election-summary-${safe}.xlsx`);
  }

  return (
    <button
      onClick={exportSummary}
      className="flex items-center gap-1.5 border border-council-navy/20 font-body text-sm font-medium rounded-card px-4 py-2 text-council-navy hover:bg-council-cream"
    >
      <Download size={14} aria-hidden="true" /> Export Election Summary (Excel)
    </button>
  );
}
