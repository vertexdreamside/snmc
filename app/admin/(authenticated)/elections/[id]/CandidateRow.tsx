"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// 'Shortlisted' is replaced by the Council's own confirmed terminology:
// selecting a nominee via .../select moves them to 'Pending' (awaiting
// their accept/decline). This row now shows the Accept/Decline/Remove
// controls directly for 'Pending' candidates, and still handles
// Elected/Not Elected marking after voting closes.
export function CandidateRow({
  candidateId,
  name,
  status,
  nominationCount,
  votes,
}: {
  candidateId: string;
  name: string;
  status: string;
  nominationCount: number;
  votes: number | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [showReasonFor, setShowReasonFor] = useState<"Declined" | "Removed" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function select() {
    setBusy("select");
    await fetch(`/api/admin/candidates/${candidateId}/select`, { method: "POST" });
    setBusy(null);
    router.refresh();
  }

  async function recordDecision(decision: "Accepted" | "Declined" | "Removed") {
    setBusy(decision);
    const res = await fetch(`/api/admin/candidates/${candidateId}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, reason: reason || undefined }),
    });
    const data = await res.json();
    setBusy(null);
    setShowReasonFor(null);
    if (data.ok && data.replacement) {
      setMessage(`Recorded. Next-highest nominee moved to Pending as a replacement.`);
    }
    router.refresh();
  }

  async function setElectedStatus(newStatus: "Elected" | "Not Elected") {
    setBusy(newStatus);
    await fetch(`/api/admin/candidates/${candidateId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-council-navy/10 last:border-0">
      <div>
        <p className="font-body text-sm">{name}</p>
        <p className="font-body text-xs text-council-ink/50">
          {status} · {nominationCount} nomination{nominationCount === 1 ? "" : "s"}
          {votes !== null && <> · {votes} vote{votes === 1 ? "" : "s"}</>}
        </p>
        {message && <p className="font-body text-xs text-council-ink/60 italic mt-1">{message}</p>}
      </div>
      <div className="flex gap-2">
        {status === "Nominated" && (
          <button onClick={select} disabled={busy !== null} className="text-xs font-body bg-council-navy text-white rounded-card px-3 py-1.5 disabled:opacity-60">
            {busy === "select" ? "Selecting…" : "Select to Progress"}
          </button>
        )}
        {status === "Pending" && !showReasonFor && (
          <>
            <button onClick={() => recordDecision("Accepted")} disabled={busy !== null} className="text-xs font-body bg-status-active text-white rounded-card px-3 py-1.5 disabled:opacity-60">
              Accept
            </button>
            <button onClick={() => setShowReasonFor("Declined")} disabled={busy !== null} className="text-xs font-body border border-council-navy/20 rounded-card px-3 py-1.5 disabled:opacity-60">
              Decline
            </button>
            <button onClick={() => setShowReasonFor("Removed")} disabled={busy !== null} className="text-xs font-body border border-status-closed/40 text-status-closed rounded-card px-3 py-1.5 disabled:opacity-60">
              Remove
            </button>
          </>
        )}
        {showReasonFor && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Reason (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="text-xs border border-council-navy/20 rounded-card px-2 py-1"
            />
            <button onClick={() => recordDecision(showReasonFor)} disabled={busy !== null} className="text-xs bg-status-closed text-white rounded-card px-3 py-1">
              Confirm {showReasonFor}
            </button>
            <button onClick={() => setShowReasonFor(null)} className="text-xs text-council-ink/50 underline">Cancel</button>
          </div>
        )}
        {status === "Accepted" && (
          <>
            <button onClick={() => setElectedStatus("Elected")} disabled={busy !== null} className="text-xs font-body bg-status-active text-white rounded-card px-3 py-1.5 disabled:opacity-60">
              Mark Elected
            </button>
            <button onClick={() => setElectedStatus("Not Elected")} disabled={busy !== null} className="text-xs font-body border border-council-navy/20 rounded-card px-3 py-1.5 disabled:opacity-60">
              Not Elected
            </button>
          </>
        )}
      </div>
    </div>
  );
}
