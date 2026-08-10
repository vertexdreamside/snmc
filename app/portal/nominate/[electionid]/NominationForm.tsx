"use client";

import { useState } from "react";

interface CandidateResult {
  id: string;
  first_name: string;
  last_name: string;
  place_of_work: string | null;
  professional_category: string | null;
}

// Mirrors the paper Nomination Form's structure exactly:
//   "Registered Licensed NURSE Candidate — Name … Current Placement …"
//   "Registered Licensed MIDWIFE Candidate — Name … Current Placement …"
// A person eligible in both categories (professional_category === "Both")
// sees both sections and may submit either or both, same as the original.
export function NominationForm({
  electionId,
  eligibleCategories,
}: {
  electionId: string;
  eligibleCategories: ("Nurse" | "Midwife")[];
}) {
  return (
    <div className="space-y-6">
      {eligibleCategories.map((category) => (
        <CategorySection key={category} electionId={electionId} category={category} />
      ))}
    </div>
  );
}

function CategorySection({ electionId, category }: { electionId: string; category: "Nurse" | "Midwife" }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CandidateResult[]>([]);
  const [selected, setSelected] = useState<CandidateResult | null>(null);
  const [currentPlacement, setCurrentPlacement] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(value: string) {
    setQuery(value);
    setSelected(null);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    const res = await fetch(`/api/people/search?q=${encodeURIComponent(value)}&category=${category}`);
    const data = await res.json();
    setResults(data.ok ? data.results : []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setStatus("submitting");
    setError(null);
    const res = await fetch("/api/nominate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        electionId,
        category,
        candidatePersonId: selected.id,
        currentPlacement,
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      setError(data.reason ?? "Could not submit the nomination.");
      setStatus("error");
      return;
    }
    setStatus("done");
  }

  if (status === "done") {
    return (
      <section className="bg-white rounded-card border border-status-active/30 p-6">
        <h2 className="font-display text-lg text-council-navy mb-1">
          Registered Licensed {category.toUpperCase()} Candidate
        </h2>
        <p className="font-body text-sm text-status-active">
          Nomination submitted for {selected?.first_name} {selected?.last_name}.
        </p>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-card border border-council-navy/10 p-6">
      <h2 className="font-display text-lg text-council-navy mb-4">
        Registered Licensed {category.toUpperCase()} Candidate
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="font-body text-sm text-council-ink/70 block mb-1">Name (search the register)</span>
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Start typing a name…"
            className="w-full border border-council-navy/20 rounded-card px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-council-gold"
          />
        </label>

        {results.length > 0 && !selected && (
          <ul className="border border-council-navy/10 rounded-card divide-y divide-council-navy/10 max-h-48 overflow-y-auto">
            {results.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(r);
                    setQuery(`${r.first_name} ${r.last_name}`);
                    setResults([]);
                    setCurrentPlacement(r.place_of_work ?? "");
                  }}
                  className="w-full text-left px-3 py-2 font-body text-sm hover:bg-council-cream"
                >
                  {r.first_name} {r.last_name}
                  {r.place_of_work && <span className="text-council-ink/50"> — {r.place_of_work}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}

        <label className="block">
          <span className="font-body text-sm text-council-ink/70 block mb-1">Current Placement</span>
          <input
            type="text"
            required
            value={currentPlacement}
            onChange={(e) => setCurrentPlacement(e.target.value)}
            className="w-full border border-council-navy/20 rounded-card px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-council-gold"
          />
        </label>

        {error && <p className="font-body text-sm text-status-closed">{error}</p>}

        <button
          type="submit"
          disabled={!selected || status === "submitting"}
          className="bg-council-navy text-white font-body font-medium rounded-card px-5 py-2.5 hover:bg-council-navyDeep transition-colors disabled:opacity-40"
        >
          {status === "submitting" ? "Submitting…" : `Nominate for ${category}`}
        </button>
      </form>
    </section>
  );
}
