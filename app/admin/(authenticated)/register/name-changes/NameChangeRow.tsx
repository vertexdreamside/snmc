"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";

export function NameChangeRow({
  requestId, regNo, previousName, requestedName, reason, reasonNotes, hasDocument,
}: {
  requestId: string; regNo: string; previousName: string; requestedName: string;
  reason: string; reasonNotes: string | null; hasDocument: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [comment, setComment] = useState("");
  const [pendingAction, setPendingAction] = useState<"Approved" | "Rejected" | null>(null);

  async function handleView() {
    const res = await fetch(`/api/admin/name-change-requests/${requestId}/view-url`);
    const data = await res.json();
    if (data.ok) window.open(data.url, "_blank", "noopener,noreferrer");
  }

  async function confirm(status: "Approved" | "Rejected") {
    setBusy(true);
    await fetch(`/api/admin/name-change-requests/${requestId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, comment: comment || undefined }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="bg-white rounded-card border border-council-navy/10 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="font-body text-sm font-medium text-council-navy">
          <span className="line-through text-council-ink/40">{previousName}</span> → {requestedName}
        </p>
        <span className="font-body text-xs text-council-ink/50">{regNo}</span>
      </div>
      <p className="font-body text-xs text-council-ink/60 mb-1">Reason: {reason}{reasonNotes && ` — "${reasonNotes}"`}</p>
      {hasDocument ? (
        <button onClick={handleView} className="flex items-center gap-1 text-xs text-council-cyan underline mb-3">
          <FileText size={12} aria-hidden="true" /> View supporting document
        </button>
      ) : (
        <p className="font-body text-xs text-status-pending mb-3">No supporting document attached.</p>
      )}

      {pendingAction ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={pendingAction === "Rejected" ? "Reason for rejection (optional)" : "Comment (optional)"}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="flex-1 text-xs border border-council-navy/20 rounded-card px-2 py-1.5"
          />
          <button
            onClick={() => confirm(pendingAction)}
            disabled={busy}
            className={`text-xs rounded-card px-3 py-1.5 text-white disabled:opacity-40 ${pendingAction === "Approved" ? "bg-status-active" : "bg-status-closed"}`}
          >
            Confirm {pendingAction}
          </button>
          <button onClick={() => setPendingAction(null)} className="text-xs text-council-ink/50 underline">Cancel</button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button onClick={() => setPendingAction("Approved")} disabled={busy} className="text-xs bg-status-active text-white rounded-card px-3 py-1.5 disabled:opacity-60">Approve</button>
          <button onClick={() => setPendingAction("Rejected")} disabled={busy} className="text-xs border border-status-closed/40 text-status-closed rounded-card px-3 py-1.5 disabled:opacity-60">Reject</button>
        </div>
      )}
    </div>
  );
}
