"use client";

import { useState } from "react";

interface Candidate {
  id: string;
  first_name: string;
  last_name: string;
  service_category: string | null;
}

// Digitizes the historical Ballot Paper: "Make a Tick in box against one
// [candidate] of your choice", one section per eligible category, one
// selection per section.
export function BallotForm({
  electionId,
  round,
  sections,
  votedCategories,
}: {
  electionId: string;
  round: number;
  sections: { category: "Nurse" | "Midwife"; candidates: Candidate[] }[];
  votedCategories: string[];
}) {
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>(
    Object.fromEntries(votedCategories.map((c) => [c, true]))
  );
  const [receipts, setReceipts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);

  async function handleCastVote(category: "Nurse" | "Midwife") {
    const candidateId = choices[category];
    if (!candidateId) return;
    setSubmitting(category);
    setError(null);
    const res = await fetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ electionId, round, category, candidateId }),
    });
    const data = await res.json();
    setSubmitting(null);
    if (!data.ok) {
      setError(data.reason ?? "Could not record your vote.");
      return;
    }
    setSubmitted((s) => ({ ...s, [category]: true }));
    if (data.receipt) setReceipts((r) => ({ ...r, [category]: data.receipt }));
  }

  return (
    <div className="space-y-6">
      {sections.map(({ category, candidates }) => (
        <section key={category} className="bg-white rounded-card border border-council-navy/10 p-6">
          <h2 className="font-display text-lg text-council-navy mb-1">Registered {category.toUpperCase()}</h2>
          <p className="font-body text-xs text-council-ink/50 mb-4">
            Make a tick against one {category.toLowerCase()} of your choice.
          </p>

          {submitted[category] ? (
            <div>
              <p className="font-body text-sm text-status-active">Your vote has been recorded.</p>
              {receipts[category] ? (
                <p className="font-body text-xs text-council-ink/50 mt-1">
                  Reference: <span className="font-mono">{receipts[category]}</span> — keep this as proof you voted.
                  It doesn't reveal your choice to anyone, including the Council.
                </p>
              ) : (
                <p className="font-body text-xs text-council-ink/50 mt-1">
                  You've already voted in this category — each person gets one vote per round.
                </p>
              )}
            </div>
          ) : candidates.length === 0 ? (
            <p className="font-body text-sm text-council-ink/50">No shortlisted candidates yet in this category.</p>
          ) : (
            <div className="space-y-2">
              {candidates.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-3 border border-council-navy/10 rounded-card px-4 py-3 cursor-pointer hover:bg-council-cream"
                >
                  <input
                    type="radio"
                    name={`ballot-${category}`}
                    value={c.id}
                    checked={choices[category] === c.id}
                    onChange={() => setChoices((prev) => ({ ...prev, [category]: c.id }))}
                    className="w-4 h-4 accent-council-navy"
                  />
                  <span className="font-body text-sm">
                    {c.first_name} {c.last_name}
                    {c.service_category && <span className="text-council-ink/50"> — {c.service_category}</span>}
                  </span>
                </label>
              ))}

              <button
                type="button"
                onClick={() => handleCastVote(category)}
                disabled={!choices[category] || submitting === category}
                className="mt-2 bg-council-navy text-white font-body font-medium rounded-card px-5 py-2.5 hover:bg-council-navyDeep transition-colors disabled:opacity-40"
              >
                {submitting === category ? "Submitting…" : "Cast Vote"}
              </button>
            </div>
          )}
        </section>
      ))}
      {error && <p className="font-body text-sm text-status-closed">{error}</p>}
    </div>
  );
}
