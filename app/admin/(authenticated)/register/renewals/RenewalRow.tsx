"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";

export function RenewalRow({
  renewalId, personName, regNo, licenseType, previousExpiry, requestedExpiry, documentId, status,
}: {
  renewalId: string; personName: string; regNo: string; licenseType: string;
  previousExpiry: string | null; requestedExpiry: string; documentId: string | null; status: "Pending" | "Under Review";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [comment, setComment] = useState("");
  const [pendingAction, setPendingAction] = useState<"Approved" | "Rejected" | null>(null);

  async function handleView() {
    if (!documentId) return;
    const res = await fetch(`/api/admin/license-documents/${documentId}/view-url`);
    const data = await res.json();
    if (data.ok) window.open(data.url, "_blank", "noopener,noreferrer");
  }

  async function startReview() {
    setBusy(true);
    await fetch(`/api/admin/license-renewals/${renewalId}/start-review`, { method: "POST" });
    setBusy(false);
    router.refresh();
  }

  async function confirm(newStatus: "Approved" | "Rejected") {
    setBusy(true);
    await fetch(`/api/admin/license-renewals/${renewalId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, comment: comment || undefined }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="bg-white rounded-card border border-council-navy/10 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="font-body text-sm font-medium text-council-navy">{personName}</p>
        <div className="flex items-center gap-2">
          {status === "Under Review" && <span className="text-xs text-council-cyan font-medium">Under Review</span>}
          <span className="font-body text-xs text-council-ink/50">{regNo}</span>
        </div>
      </div>
      <p className="font-body text-xs text-council-ink/60 mb-1">{licenseType} Licence renewal</p>
      <p className="font-body text-sm text-council-ink/70 mb-3">
        {previousExpiry ? <span className="line-through text-council-ink/40">{previousExpiry}</span> : "No prior date on file"} → <span className="font-medium text-council-navy">{requestedExpiry}</span>
      </p>
      {documentId && (
        <button onClick={handleView} className="flex items-center gap-1 text-xs text-council-cyan underline mb-3">
          <FileText size={12} aria-hidden="true" /> View supporting document
        </button>
      )}

      {pendingAction ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Comment (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="flex-1 text-xs border border-council-navy/20 rounded-card px-2 py-1.5"
          />
          <button onClick={() => confirm(pendingAction)} disabled={busy} className={`text-xs rounded-card px-3 py-1.5 text-white disabled:opacity-60 ${pendingAction === "Approved" ? "bg-status-active" : "bg-status-closed"}`}>
            Confirm {pendingAction}
          </button>
          <button onClick={() => setPendingAction(null)} className="text-xs text-council-ink/50 underline">Cancel</button>
        </div>
      ) : (
        <div className="flex gap-2">
          {status === "Pending" && (
            <button onClick={startReview} disabled={busy} className="text-xs border border-council-navy/20 text-council-navy rounded-card px-3 py-1.5 disabled:opacity-60">Start Review</button>
          )}
          <button onClick={() => setPendingAction("Approved")} disabled={busy} className="text-xs bg-status-active text-white rounded-card px-3 py-1.5 disabled:opacity-60">Approve</button>
          <button onClick={() => setPendingAction("Rejected")} disabled={busy} className="text-xs border border-status-closed/40 text-status-closed rounded-card px-3 py-1.5 disabled:opacity-60">Reject</button>
        </div>
      )}
    </div>
  );
}
