"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, AlertTriangle } from "lucide-react";

interface TieCandidate { id: string; person_id: string; nomination_count: number; }

export function NominationRankingPanel({ electionId }: { electionId: string }) {
  const router = useRouter();
  const [topN, setTopN] = useState(5);
  const [busy, setBusy] = useState(false);
  const [ties, setTies] = useState<Record<string, TieCandidate[]>>({});
  const [summary, setSummary] = useState<string | null>(null);

  async function handleRank() {
    setBusy(true);
    setSummary(null);
    const res = await fetch(`/api/admin/elections/${electionId}/rank-nominations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topN }),
    });
    const data = await res.json();
    setBusy(false);
    if (!data.ok) {
      setSummary(data.reason ?? "Could not rank nominations.");
      return;
    }
    const newTies: Record<string, TieCandidate[]> = {};
    let autoTotal = 0;
    for (const [category, r] of Object.entries<any>(data.result)) {
      autoTotal += r.autoSelected;
      if (r.tieFlagged.length > 0) newTies[category] = r.tieFlagged;
    }
    setTies(newTies);
    setSummary(`${autoTotal} candidate(s) auto-selected across both categories.` + (Object.keys(newTies).length > 0 ? " Some categories have a tie needing your decision below." : ""));
    router.refresh();
  }

  async function selectTied(candidateId: string, category: string) {
    setBusy(true);
    await fetch(`/api/admin/candidates/${candidateId}/select`, { method: "POST" });
    setTies((prev) => ({ ...prev, [category]: (prev[category] ?? []).filter((c) => c.id !== candidateId) }));
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="bg-council-cream rounded-card border border-council-cyan/30 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Zap size={16} className="text-council-cyan" aria-hidden="true" />
        <h3 className="font-display text-sm text-council-navy">Rank Nominations</h3>
      </div>
      <p className="font-body text-xs text-council-ink/60">
        Selects the top N most-nominated candidates per category to progress to Round 2. A genuine tie at the
        cutoff is flagged for you to decide, never resolved automatically.
      </p>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 font-body text-sm">
          Top
          <input type="number" min={1} max={50} value={topN} onChange={(e) => setTopN(Math.max(1, parseInt(e.target.value, 10) || 1))} className="w-16 border border-council-navy/20 rounded-card px-2 py-1 text-center" />
          per category
        </label>
        <button onClick={handleRank} disabled={busy} className="bg-council-navy text-white font-body text-sm font-medium rounded-card px-4 py-1.5 hover:bg-council-navyDeep disabled:opacity-60">
          {busy ? "Working…" : "Rank Nominations"}
        </button>
      </div>
      {summary && <p className="font-body text-xs text-council-ink/60">{summary}</p>}
      {Object.entries(ties).map(([category, candidates]) =>
        candidates.length > 0 ? (
          <div key={category} className="bg-white rounded-card border border-status-pending/40 p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} className="text-status-pending" aria-hidden="true" />
              <p className="font-body text-xs font-medium text-council-navy">TIE — administrative decision required ({category})</p>
            </div>
            <ul className="space-y-1.5">
              {candidates.map((c) => (
                <li key={c.id} className="flex items-center justify-between font-body text-xs">
                  <span className="text-council-ink/70">{c.nomination_count} nomination{c.nomination_count === 1 ? "" : "s"} — candidate ID {c.person_id.slice(0, 8)}…</span>
                  <button onClick={() => selectTied(c.id, category)} disabled={busy} className="text-council-navy underline disabled:opacity-60">Select to progress</button>
                </li>
              ))}
            </ul>
          </div>
        ) : null
      )}
    </div>
  );
}
