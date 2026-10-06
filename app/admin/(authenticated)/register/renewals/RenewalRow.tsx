"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { formatSeychellesTime } from "@/lib/reports";

// Previously, "Start Review" only flipped the status label to "Under
// Review" — the Approve/Reject buttons were already visible before and
// after clicking it, and nothing else about the card changed. That made
// "review" feel like it did nothing: there was no actual reviewing step,
// just an immediate decision. Now Approve/Reject only appear once review
// has actually been started, and starting review surfaces the submission
// date and the supporting document link more prominently — something
// concrete to look at before deciding, not just a status toggle.
export function RenewalRow({
  renewalId, personName, regNo, licenseType, previousExpiry, requestedExpiry, documentId, onFileDocumentId, status, submittedAt,
}: {
  renewalId: string; personName: string; regNo: string; licenseType: string;
  previousExpiry: string | null; requestedExpiry: string; documentId: string | null; onFileDocumentId: string | null; status: "Pending" | "Under Review";
  submittedAt: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const shownDocumentId = documentId ?? onFileDocumentId;
  const shownDocumentLabel = documentId ? "View supporting document" : `View ${licenseType} licence on file`;

  async function handleView() {
    if (!shownDocumentId) return;
    const res = await fetch(`/api/admin/license-documents/${shownDocumentId}/view-url`);
    const data = await res.json();
    if (data.ok) window.open(data.url, "_blank", "noopener,noreferrer");
  }

  async function startReview() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/license-renewals/${renewalId}/start-review`, { method: "POST" });
    const data = await res.json().catch(() => ({ ok: false }));
    setBusy(false);
    if (!data.ok) {
      setError(data.reason ?? "Could not start the review.");
      return;
    }
    router.refresh();
  }

  async function confirm(newStatus: "Approved" | "Rejected") {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/license-renewals/${renewalId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, comment: comment || undefined }),
    });
    const data = await res.json().catch(() => ({ ok: false }));
    setBusy(false);
    if (!data.ok) {
      setError(data.reason ?? "Could not save the decision.");
      return;
    }
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
      <p className="font-body text-xs text-council-ink/60 mb-1">{licenseType} Licence renewal &middot; Submitted {formatSeychellesTime(submittedAt)}</p>
      <p className="font-body text-sm text-council-ink/70 mb-3">
        {previousExpiry ? <span className="line-through text-council-ink/40">{previousExpiry}</span> : "No prior date on file"} → <span className="font-medium text-council-navy">{requestedExpiry}</span>
      </p>

      {status === "Pending" ? (
        <div className="bg-council-cream rounded-card p-3 mb-3">
          <p className="font-body text-xs text-council-ink/60 mb-2">
            {documentId
              ? "Review the supporting document before approving or rejecting this renewal."
              : onFileDocumentId
                ? "No document was attached to this request, but a licence is already on file for this person."
                : "No supporting document was attached to this request and no licence is on file."}
          </p>
          {shownDocumentId && (
            <button onClick={handleView} className="flex items-center gap-1 text-xs text-council-cyan underline mb-2">
              <FileText size={12} aria-hidden="true" /> {shownDocumentLabel}
            </button>
          )}
          <button onClick={startReview} disabled={busy} className="block text-xs bg-council-navy text-white rounded-card px-3 py-1.5 disabled:opacity-60">
            {busy ? "Starting…" : "Start Review"}
          </button>
        </div>
      ) : (
        <>
          {shownDocumentId ? (
            <button onClick={handleView} className="flex items-center gap-1 text-xs text-council-cyan underline mb-3">
              <FileText size={12} aria-hidden="true" /> {shownDocumentLabel}
            </button>
          ) : (
            <p className="font-body text-xs text-council-ink/50 mb-3">No licence document on file for this person.</p>
          )}

          <label className="block font-body text-xs text-council-ink/60 mb-1" htmlFor={`c-${renewalId}`}>Comment (optional — shown on their renewal history)</label>
          <textarea
            id={`c-${renewalId}`}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder="e.g. Certificate checked, valid until the new date"
            className="w-full text-xs border border-council-navy/20 rounded-card px-2 py-1.5 mb-2"
          />
          <div className="flex gap-2">
            <button onClick={() => confirm("Approved")} disabled={busy} className="text-xs bg-status-active text-white rounded-card px-3 py-1.5 disabled:opacity-60">
              {busy ? "Saving…" : comment.trim() ? "Approve with comment" : "Approve"}
            </button>
            <button onClick={() => confirm("Rejected")} disabled={busy} className="text-xs border border-status-closed/40 text-status-closed rounded-card px-3 py-1.5 disabled:opacity-60">
              {comment.trim() ? "Reject with comment" : "Reject"}
            </button>
          </div>
        </>
      )}
      {error && <p className="font-body text-xs text-status-closed mt-3 bg-status-closed/10 rounded-card px-3 py-2">{error}</p>}
    </div>
  );
}
