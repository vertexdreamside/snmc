"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Defaults match the confirmed rules: nomination stays open 2 weeks
// ("so council can do admin work"), voting stays open 1 week — both
// editable per election.
export function CreateElectionForm() {
  const router = useRouter();
  const [termLabel, setTermLabel] = useState("");
  const [nominationDays, setNominationDays] = useState(14);
  const [votingDays, setVotingDays] = useState(7);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/admin/elections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ termLabel, nominationDurationDays: nominationDays, votingDurationDays: votingDays }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.ok) {
      setTermLabel("");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 bg-white rounded-card border border-council-navy/10 p-4">
      <label className="flex-1 min-w-[200px]">
        <span className="font-body text-xs text-council-ink/60 block mb-1">Term label</span>
        <input
          type="text"
          required
          value={termLabel}
          onChange={(e) => setTermLabel(e.target.value)}
          placeholder="e.g. 2026-2029"
          className="w-full border border-council-navy/20 rounded-card px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-council-cyan"
        />
      </label>
      <label>
        <span className="font-body text-xs text-council-ink/60 block mb-1">Nomination (days)</span>
        <input
          type="number"
          min={1}
          max={90}
          value={nominationDays}
          onChange={(e) => setNominationDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
          className="w-24 border border-council-navy/20 rounded-card px-3 py-2 font-body text-sm text-center"
        />
      </label>
      <label>
        <span className="font-body text-xs text-council-ink/60 block mb-1">Voting (days)</span>
        <input
          type="number"
          min={1}
          max={90}
          value={votingDays}
          onChange={(e) => setVotingDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
          className="w-24 border border-council-navy/20 rounded-card px-3 py-2 font-body text-sm text-center"
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="bg-council-navy text-white font-body text-sm font-medium rounded-card px-4 py-2 hover:bg-council-navyDeep disabled:opacity-60"
      >
        {busy ? "Creating…" : "New Election"}
      </button>
    </form>
  );
}
