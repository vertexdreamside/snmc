"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const STATUS_FLOW = ["Planned", "Round 1 Open", "Round 1 Closed", "Round 2 Open", "Round 2 Closed", "Completed"] as const;

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

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="font-body text-sm text-council-ink/60">
        Current status: <span className="font-medium text-council-navy">{status}</span>
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
  );
}
