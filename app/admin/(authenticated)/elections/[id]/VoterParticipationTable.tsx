"use client";

import { useState } from "react";
import { Download } from "lucide-react";

interface Voter {
  id: string;
  first_name: string;
  last_name: string;
  regNo: string | null;
  professional_category: string;
  registration_status: string;
  phone_mobile: string | null;
}

// Every real election tool researched (ElectionBuddy, SBS, Civix, etc.)
// converges on the same core feature for boosting turnout: an easy way
// to find and reach non-voters — usually an automated email/text
// reminder. That's not possible here (no real email/SMS on file for
// nurses/midwives — see the same constraint noted for nominee and
// licence-expiry notifications), so this is the next best thing: a
// filtered, exportable non-voter list an admin can act on manually
// (phone calls, in-person follow-up), with each person's mobile number
// included specifically for that purpose.
export function VoterParticipationTable({ category, voters, votedIds }: { category: string; voters: Voter[]; votedIds: string[] }) {
  const [filter, setFilter] = useState<"all" | "voted" | "notVoted">("all");
  const votedSet = new Set(votedIds);

  const votedCount = voters.filter((v) => votedSet.has(v.id)).length;
  const turnout = voters.length > 0 ? ((votedCount / voters.length) * 100).toFixed(1) : "0.0";
  const notVotedCount = voters.length - votedCount;

  const visibleVoters =
    filter === "voted" ? voters.filter((v) => votedSet.has(v.id)) : filter === "notVoted" ? voters.filter((v) => !votedSet.has(v.id)) : voters;

  function exportNonVoters() {
    const nonVoters = voters.filter((v) => !votedSet.has(v.id));
    const header = "First Name,Last Name,Reg No,Mobile\n";
    const rows = nonVoters
      .map((v) => `"${v.first_name}","${v.last_name}","${v.regNo ?? ""}","${v.phone_mobile ?? ""}"`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${category.toLowerCase()}-non-voters.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="bg-white rounded-card border border-council-navy/10 overflow-x-auto">
      <div className="p-4 border-b border-council-navy/10 flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-display text-sm text-council-navy">{category} Voter Participation</h3>
        <div className="flex items-center gap-3">
          <p className="font-body text-xs text-council-ink/60">
            {votedCount} of {voters.length} voted ({turnout}%) · {notVotedCount} not voted
          </p>
          <div role="group" aria-label={`Filter ${category} voters`} className="flex items-center rounded-card border border-council-navy/20 overflow-hidden text-xs">
            {([
              ["all", `All (${voters.length})`],
              ["voted", `Voted (${votedCount})`],
              ["notVoted", `Not Voted (${notVotedCount})`],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={filter === key}
                onClick={() => setFilter(key)}
                className={`px-2 py-1 ${filter === key ? "bg-council-navy text-white" : "text-council-ink/60 hover:bg-council-cream"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <button onClick={exportNonVoters} className="flex items-center gap-1 text-xs text-council-cyan underline">
            <Download size={11} aria-hidden="true" /> Export Non-Voters
          </button>
        </div>
      </div>
      <table className="w-full font-body text-sm">
        <thead className="bg-council-cream text-council-ink/60 text-left">
          <tr><th className="px-4 py-2">Name</th><th className="px-4 py-2">Reg. No.</th><th className="px-4 py-2">Type</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Vote Status</th></tr>
        </thead>
        <tbody className="divide-y divide-council-navy/10">
          {visibleVoters.map((v) => (
            <tr key={v.id}>
              <td className="px-4 py-2">{v.first_name} {v.last_name}</td>
              <td className="px-4 py-2 text-council-ink/60">{v.regNo || "—"}</td>
              <td className="px-4 py-2 text-council-ink/60">{v.professional_category}</td>
              <td className="px-4 py-2 text-council-ink/60">{v.registration_status}</td>
              <td className="px-4 py-2">
                {votedSet.has(v.id) ? <span className="text-status-active font-medium">Voted</span> : <span className="text-council-ink/40">Not Voted</span>}
              </td>
            </tr>
          ))}
          {visibleVoters.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-6 text-center text-council-ink/40">{filter === "voted" ? "Nobody has voted yet." : filter === "notVoted" ? "Everyone has voted." : "No eligible voters."}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
