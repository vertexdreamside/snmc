"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Round 1 = Nomination, Round 2 = Election — per the historical process
// (Nomination_Paper_1st_Round_2012 / the 2nd-round ballot form) and
// explicit direction, replacing the earlier "two voting rounds" model.
const STATUS_FLOW = [
  "Planned",
  "Nomination Open",
  "Nomination Closed",
  "Election Open",
  "Election Closed",
  "Completed",
] as const;

const ROUND_LABEL: Record<string, string> = {
  Planned: "Not yet started",
  "Nomination Open": "Round 1 — Nomination",
  "Nomination Closed": "Round 1 — Nomination (closed)",
  "Election Open": "Round 2 — Election",
  "Election Closed": "Round 2 — Election (closed)",
  Completed: "Completed",
};

export function ElectionControls({ electionId, status, resultsPublished }: { electionId: string; status: string; resultsPublished: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function setStatus(newStatus: string) {
    setBusy(true);
    await fetch(`/api/admin/elections/${electionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setBusy(false);
    router.refresh();
  }

  async function togglePublish() {
    setBusy(true);
    await fetch(`/api/admin/elections/${electionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resultsPublished: !resultsPublished }),
    });
    setBusy(false);
    router.refresh();
  }

  const currentIndex = STATUS_FLOW.indexOf(status as (typeof STATUS_FLOW)[number]);
  const next = STATUS_FLOW[currentIndex + 1];

  const round1Current = status === "Nomination Open";
  const round1Done = currentIndex >= STATUS_FLOW.indexOf("Nomination Closed");
  const round2Current = status === "Election Open";
  const round2Done = currentIndex >= STATUS_FLOW.indexOf("Election Closed");

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <RoundBadge label="Round 1 — Nomination" current={round1Current} done={round1Done} />
        <span className="text-council-ink/30">→</span>
        <RoundBadge label="Round 2 — Election" current={round2Current} done={round2Done} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="font-body text-sm text-council-ink/60">
          Current status: <span className="font-medium text-council-navy">{ROUND_LABEL[status] ?? status}</span>
        </span>
        {next && (
          <button
            onClick={() => setStatus(next)}
            disabled={busy}
            className="bg-council-navy text-white font-body text-sm font-medium rounded-card px-4 py-2 hover:bg-council-navyDeep disabled:opacity-60"
          >
            {busy ? "Updating…" : `Advance to "${next}"`}
          </button>
        )}
        <button
          onClick={togglePublish}
          disabled={busy}
          className="border border-council-navy/20 font-body text-sm font-medium rounded-card px-4 py-2 disabled:opacity-60"
        >
          {resultsPublished ? "Unpublish Results" : "Publish Results"}
        </button>
      </div>
    </div>
  );
}

function RoundBadge({ label, current, done }: { label: string; current: boolean; done: boolean }) {
  return (
    <div
      className={`px-3 py-1.5 rounded-full text-xs font-body font-medium ${
        current ? "bg-council-cyan text-white" : done ? "bg-status-active/10 text-status-active" : "bg-council-navy/10 text-council-ink/50"
      }`}
    >
      {label}
    </div>
  );
}
