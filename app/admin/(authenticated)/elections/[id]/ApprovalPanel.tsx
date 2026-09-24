"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Landmark, AlertTriangle, CheckCircle2 } from "lucide-react";

// Sections 25-26: closing an election doesn't publish it — Council
// Review → Minister Approval → Publication. This panel is where that
// approval actually gets recorded. Blocked server-side (not just here)
// while any dispute is unresolved — see the approve API route.
export function ApprovalPanel({
  electionId,
  approvalStatus,
  approvedBy,
  approvedAt,
  approvalReference,
  approvalNotes,
  hasUnresolvedDisputes,
}: {
  electionId: string;
  approvalStatus: "Not Required" | "Pending Approval" | "Approved" | "Disputed";
  approvedBy: string | null;
  approvedAt: string | null;
  approvalReference: string | null;
  approvalNotes: string | null;
  hasUnresolvedDisputes: boolean;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [approvedByName, setApprovedByName] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/elections/${electionId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approvedBy: approvedByName, reference, notes }),
    });
    const data = await res.json();
    setBusy(false);
    if (!data.ok) {
      setError(data.reason ?? "Could not record approval.");
      return;
    }
    setShowForm(false);
    router.refresh();
  }

  return (
    <div className="bg-white rounded-card border border-council-navy/10 p-6 space-y-3">
      <h3 className="font-display text-base text-council-navy flex items-center gap-2">
        <Landmark size={16} className="text-council-cyan" aria-hidden="true" /> Council Review & Minister Approval
      </h3>

      {approvalStatus === "Approved" ? (
        <div className="flex items-start gap-2 bg-status-active/10 rounded-card p-3">
          <CheckCircle2 size={16} className="text-status-active mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-body text-sm font-medium text-council-navy">Approved</p>
            {approvedAt && <p className="font-body text-xs text-council-ink/60">{new Date(approvedAt).toLocaleString()}</p>}
            {approvalReference && <p className="font-body text-xs text-council-ink/60">Reference: {approvalReference}</p>}
            {approvalNotes && <p className="font-body text-xs text-council-ink/60 italic">"{approvalNotes}"</p>}
          </div>
        </div>
      ) : (
        <>
          {(approvalStatus === "Disputed" || hasUnresolvedDisputes) && (
            <div className="flex items-start gap-2 bg-status-closed/10 rounded-card p-3">
              <AlertTriangle size={16} className="text-status-closed mt-0.5" aria-hidden="true" />
              <p className="font-body text-sm text-status-closed">
                This election has an unresolved dispute — approval is blocked until it's resolved (see Disputes & Recounts below).
              </p>
            </div>
          )}
          {!showForm ? (
            <button onClick={() => setShowForm(true)} className="text-sm bg-council-navy text-white font-body font-medium rounded-card px-4 py-2">
              Record Minister Approval
            </button>
          ) : (
            <form onSubmit={handleApprove} className="space-y-2">
              <input type="text" required placeholder="Approved By" value={approvedByName} onChange={(e) => setApprovedByName(e.target.value)} className="w-full text-sm border border-council-navy/20 rounded-card px-3 py-2" />
              <input type="text" placeholder="Approval Reference (optional)" value={reference} onChange={(e) => setReference(e.target.value)} className="w-full text-sm border border-council-navy/20 rounded-card px-3 py-2" />
              <textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full text-sm border border-council-navy/20 rounded-card px-3 py-2" />
              {error && <p className="text-xs text-status-closed">{error}</p>}
              <div className="flex gap-2">
                <button type="submit" disabled={busy} className="text-sm bg-council-navy text-white font-body font-medium rounded-card px-4 py-2 disabled:opacity-60">
                  {busy ? "Recording…" : "Confirm Approval"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="text-sm text-council-ink/50 underline">Cancel</button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}
