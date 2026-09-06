"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

// Election Admin Wizard, Steps 1-2 (Section 30): Election Details, then
// Voting Groups — auto-identified from the live register, shown for
// confirmation before the election is actually created. Steps 3-11
// (Nomination through Publish) are the election's own lifecycle from
// there, walked through via the stepper on the election detail page
// once created — this wizard only covers the part that happens before
// an election record exists at all.
export function CreateElectionForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [termLabel, setTermLabel] = useState("");
  const [nominationDays, setNominationDays] = useState(14);
  const [votingDays, setVotingDays] = useState(7);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ summary: Record<string, Record<string, number>>; unspecifiedTotal: number } | null>(null);

  useEffect(() => {
    if (step === 2 && !summary) {
      fetch("/api/admin/register/voting-groups-summary")
        .then((r) => r.json())
        .then((d) => (d.ok ? setSummary(d) : setError(d.reason ?? "Could not load voting group counts.")))
        .catch(() => setError("Could not load voting group counts — you can still create the election without this summary."));
    }
  }, [step, summary]);

  async function handleCreate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/elections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ termLabel, nominationDurationDays: nominationDays, votingDurationDays: votingDays }),
      });

      const text = await res.text();
      let data: { ok?: boolean; id?: string; reason?: string };
      try {
        data = JSON.parse(text);
      } catch {
        setBusy(false);
        setError(`The server didn't return a valid response (status ${res.status}). This usually means the request never reached the election-creation logic at all — check that you're signed in with Elections permission.`);
        return;
      }

      setBusy(false);
      if (data.ok && data.id) {
        router.push(`/admin/elections/${data.id}`);
      } else {
        setError(data.reason ?? "Could not create the election. Please try again.");
      }
    } catch (err) {
      setBusy(false);
      setError("Could not reach the server. Check your connection and try again.");
    }
  }

  return (
    <div className="bg-white rounded-card border border-council-navy/10 p-6 space-y-4">
      <div className="flex items-center gap-2">
        {["Election Details", "Voting Groups"].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${step === i + 1 ? "bg-council-navy text-white" : "bg-council-navy/10 text-council-ink/50"}`}>
              {i + 1}
            </span>
            <span className={`font-body text-xs ${step === i + 1 ? "text-council-navy font-medium" : "text-council-ink/40"}`}>{label}</span>
            {i === 0 && <span className="text-council-ink/20 mx-1">→</span>}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-3">
          <label className="block">
            <span className="font-body text-xs text-council-ink/60 block mb-1">Election name / Council term</span>
            <input
              type="text"
              required
              value={termLabel}
              onChange={(e) => setTermLabel(e.target.value)}
              placeholder="e.g. 2026-2029"
              className="w-full border border-council-navy/20 rounded-card px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-council-cyan"
            />
            <span className="font-body text-xs text-council-ink/40 mt-1 block">Councillors serve a 3-year term — label this election accordingly.</span>
          </label>
          <div className="flex gap-3">
            <label>
              <span className="font-body text-xs text-council-ink/60 block mb-1">Nomination period (days)</span>
              <input type="number" min={1} max={90} value={nominationDays} onChange={(e) => setNominationDays(Math.max(1, parseInt(e.target.value, 10) || 1))} className="w-24 border border-council-navy/20 rounded-card px-3 py-2 font-body text-sm text-center" />
            </label>
            <label>
              <span className="font-body text-xs text-council-ink/60 block mb-1">Election period (days)</span>
              <input type="number" min={1} max={90} value={votingDays} onChange={(e) => setVotingDays(Math.max(1, parseInt(e.target.value, 10) || 1))} className="w-24 border border-council-navy/20 rounded-card px-3 py-2 font-body text-sm text-center" />
            </label>
          </div>
          <button
            onClick={() => termLabel && setStep(2)}
            disabled={!termLabel}
            className="flex items-center gap-1 bg-council-navy text-white font-body text-sm font-medium rounded-card px-4 py-2 hover:bg-council-navyDeep disabled:opacity-40"
          >
            Next <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <p className="font-body text-xs text-council-ink/60">
            Automatically identified from the current register — anyone deceased or with an unconfirmed category is
            excluded, matching the same eligibility rules used at voting time.
          </p>
          {!summary && !error ? (
            <p className="font-body text-sm text-council-ink/40">Loading…</p>
          ) : !summary && error ? (
            <p className="font-body text-sm text-status-pending">{error} You can still proceed to create the election below.</p>
          ) : summary ? (
            <div className="grid grid-cols-2 gap-4">
              {(["Nurse", "Midwife"] as const).map((category) => (
                <div key={category} className="bg-council-cream rounded-card p-3">
                  <p className="font-body text-xs font-medium text-council-navy mb-1">{category}</p>
                  {(["Hospital", "Community", "Private"] as const).map((group) => (
                    <p key={group} className="font-body text-xs text-council-ink/60 flex justify-between">
                      <span>{group}</span> <span>{summary.summary[category]?.[group] ?? 0}</span>
                    </p>
                  ))}
                </div>
              ))}
              {summary.unspecifiedTotal > 0 && (
                <p className="col-span-2 font-body text-xs text-council-ink/40 italic">
                  {summary.unspecifiedTotal} eligible people have no workplace sector on file — treated as eligible
                  across all groups until that's filled in.
                </p>
              )}
            </div>
          ) : null}
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="flex items-center gap-1 border border-council-navy/20 font-body text-sm font-medium rounded-card px-4 py-2">
              <ArrowLeft size={14} aria-hidden="true" /> Back
            </button>
            <button onClick={handleCreate} disabled={busy} className="bg-council-navy text-white font-body text-sm font-medium rounded-card px-4 py-2 hover:bg-council-navyDeep disabled:opacity-60">
              {busy ? "Creating…" : "Create Election"}
            </button>
          </div>
          {error && (
            <div className="bg-status-closed/10 border border-status-closed/30 rounded-card p-3">
              <p className="font-body text-sm text-status-closed">{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
