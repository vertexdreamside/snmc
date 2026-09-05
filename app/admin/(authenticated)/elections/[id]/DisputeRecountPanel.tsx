"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gavel, AlertTriangle, CheckCircle2 } from "lucide-react";

interface Dispute {
  id: string;
  category: string;
  reason: string;
  status: "Open" | "Recounting" | "Resolved";
  original_tally: Record<string, number> | null;
  recount_tally: Record<string, number> | null;
  recount_matches: boolean | null;
  resolution: string | null;
  resolution_notes: string | null;
  filed_at: string;
}

// Formal dispute + recount workflow. A "recount" here is an independently
// re-run tally query compared against what was recorded at filing time —
// it can't mean physically recounting paper, since there isn't any, but
// the point is the same: an auditable re-verification, not just trusting
// the same number twice.
export function DisputeRecountPanel({
  electionId,
  disputes,
  candidateNames,
}: {
  electionId: string;
  disputes: Dispute[];
  candidateNames: Map<string, string>;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState<"Nurse" | "Midwife">("Nurse");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function fileDispute(e: React.FormEvent) {
    e.preventDefault();
    setBusy("filing");
    await fetch(`/api/admin/elections/${electionId}/disputes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, reason }),
    });
    setBusy(null);
    setReason("");
    setShowForm(false);
    router.refresh();
  }

  async function runRecount(disputeId: string) {
    setBusy(disputeId);
    await fetch(`/api/admin/disputes/${disputeId}/recount`, { method: "POST" });
    setBusy(null);
    router.refresh();
  }

  async function resolve(disputeId: string, resolution: "Upheld" | "Rejected", notes: string) {
    if (!notes) return;
    setBusy(disputeId);
    await fetch(`/api/admin/disputes/${disputeId}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolution, notes }),
    });
    setBusy(null);
    router.refresh();
  }

  function tallyLine(tally: Record<string, number> | null): string {
    if (!tally || Object.keys(tally).length === 0) return "No votes recorded";
    return Object.entries(tally)
      .map(([id, count]) => `${candidateNames.get(id) ?? id.slice(0, 8)}: ${count}`)
      .join(", ");
  }

  return (
    <div className="bg-white rounded-card border border-council-navy/10 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base text-council-navy flex items-center gap-2">
          <Gavel size={16} className="text-council-cyan" aria-hidden="true" /> Disputes & Recounts
        </h3>
        <button onClick={() => setShowForm(!showForm)} className="text-xs text-council-cyan underline">
          {showForm ? "Cancel" : "File a Dispute"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={fileDispute} className="bg-council-cream rounded-card p-3 space-y-2">
          <select value={category} onChange={(e) => setCategory(e.target.value as "Nurse" | "Midwife")} className="border border-council-navy/20 rounded-card px-2 py-1.5 text-sm">
            <option value="Nurse">Nurse</option>
            <option value="Midwife">Midwife</option>
          </select>
          <textarea
            required
            placeholder="Reason for the dispute"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            className="w-full border border-council-navy/20 rounded-card px-2 py-1.5 text-sm"
          />
          <button type="submit" disabled={busy === "filing"} className="text-xs bg-council-navy text-white rounded-card px-3 py-1.5 disabled:opacity-60">
            {busy === "filing" ? "Filing…" : "File Dispute"}
          </button>
        </form>
      )}

      {disputes.length === 0 ? (
        <p className="font-body text-sm text-council-ink/40">No disputes filed for this election.</p>
      ) : (
        disputes.map((d) => (
          <div key={d.id} className="border border-council-navy/10 rounded-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-body text-sm font-medium text-council-navy">{d.category} — filed {new Date(d.filed_at).toLocaleDateString()}</p>
              <span className={`text-xs font-medium ${d.status === "Resolved" ? "text-status-active" : "text-status-pending"}`}>{d.status}</span>
            </div>
            <p className="font-body text-xs text-council-ink/60 italic">"{d.reason}"</p>
            <p className="font-body text-xs text-council-ink/50">Original tally: {tallyLine(d.original_tally)}</p>

            {d.recount_tally ? (
              <div className={`flex items-start gap-2 rounded-card p-2 ${d.recount_matches ? "bg-status-active/10" : "bg-status-closed/10"}`}>
                {d.recount_matches ? <CheckCircle2 size={14} className="text-status-active mt-0.5" aria-hidden="true" /> : <AlertTriangle size={14} className="text-status-closed mt-0.5" aria-hidden="true" />}
                <div>
                  <p className="font-body text-xs font-medium text-council-navy">
                    Recount: {tallyLine(d.recount_tally)}
                  </p>
                  <p className={`font-body text-xs ${d.recount_matches ? "text-status-active" : "text-status-closed font-medium"}`}>
                    {d.recount_matches ? "Matches the original tally." : "DOES NOT MATCH the original tally — needs investigation."}
                  </p>
                </div>
              </div>
            ) : (
              d.status === "Open" && (
                <button onClick={() => runRecount(d.id)} disabled={busy === d.id} className="text-xs bg-council-navy text-white rounded-card px-3 py-1.5 disabled:opacity-60">
                  {busy === d.id ? "Recounting…" : "Run Recount"}
                </button>
              )
            )}

            {d.status === "Recounting" && <ResolveForm disputeId={d.id} onResolve={resolve} busy={busy === d.id} />}

            {d.status === "Resolved" && (
              <p className="font-body text-xs text-council-ink/60">
                <span className={d.resolution === "Upheld" ? "text-status-closed font-medium" : "text-status-active font-medium"}>{d.resolution}</span>
                {d.resolution_notes && ` — "${d.resolution_notes}"`}
              </p>
            )}
          </div>
        ))
      )}
    </div>
  );
}

function ResolveForm({ disputeId, onResolve, busy }: { disputeId: string; onResolve: (id: string, resolution: "Upheld" | "Rejected", notes: string) => void; busy: boolean }) {
  const [notes, setNotes] = useState("");
  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        placeholder="Resolution notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="flex-1 text-xs border border-council-navy/20 rounded-card px-2 py-1.5"
      />
      <button onClick={() => onResolve(disputeId, "Rejected", notes)} disabled={busy || !notes} className="text-xs bg-status-active text-white rounded-card px-3 py-1.5 disabled:opacity-60">
        Reject Dispute
      </button>
      <button onClick={() => onResolve(disputeId, "Upheld", notes)} disabled={busy || !notes} className="text-xs bg-status-closed text-white rounded-card px-3 py-1.5 disabled:opacity-60">
        Uphold Dispute
      </button>
    </div>
  );
}
