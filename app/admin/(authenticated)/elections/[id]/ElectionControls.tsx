"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { computeElectionStageLabel } from "@/lib/elections/tally";

// Round 1 = Nomination, Round 2 = Election — per the historical process
// (Nomination_Paper_1st_Round_2012 / the 2nd-round ballot form) and
// explicit direction, replacing the earlier "two voting rounds" model.
const STATUS_FLOW = [
  "Planned",
  "Nomination Open",
  "Nomination Closed",
  "Election Open",
  "Election Closed",
  "Completed",
] as const;

export function ElectionControls({
  electionId,
  status,
  resultsPublished,
  approvalStatus,
  round1CloseAt,
  round2CloseAt,
}: {
  electionId: string;
  status: string;
  resultsPublished: boolean;
  approvalStatus: string;
  round1CloseAt: string | null;
  round2CloseAt: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  async function setStatus(newStatus: string) {
    // "Add option to bypass" the default duration — closing a round
    // early is already technically possible (nothing but the status
    // field itself gates whether nominate/vote submissions are
    // accepted), but it was previously an unlabeled side effect of the
    // ordinary "advance" button rather than a deliberate, confirmed
    // choice. This makes the early-close explicit.
    const closeDate = newStatus === "Nomination Closed" ? round1CloseAt : newStatus === "Election Closed" ? round2CloseAt : null;
    if (closeDate && new Date(closeDate) > new Date()) {
      const daysLeft = Math.ceil((new Date(closeDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (!confirm(`This round isn't scheduled to close for another ${daysLeft} day${daysLeft === 1 ? "" : "s"} (${new Date(closeDate).toLocaleDateString()}). Close it early anyway?`)) {
        return;
      }
    }
    setBusy(true);
    await fetch(`/api/admin/elections/${electionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setBusy(false);
    router.refresh();
  }

  async function togglePublish() {
    if (!resultsPublished && !showConfirm) {
      // Publishing is consequential and irreversible in effect (once seen,
      // it's seen) — require a typed confirmation rather than a single
      // click, and log who certified it.
      setShowConfirm(true);
      return;
    }
    setBusy(true);
    await fetch(`/api/admin/elections/${electionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resultsPublished: !resultsPublished, certificationText: confirmText || undefined }),
    });
    setBusy(false);
    setShowConfirm(false);
    setConfirmText("");
    router.refresh();
  }

  const currentIndex = STATUS_FLOW.indexOf(status as (typeof STATUS_FLOW)[number]);
  const next = STATUS_FLOW[currentIndex + 1];

  function isEarlyClose(target: string): boolean {
    const closeDate = target === "Nomination Closed" ? round1CloseAt : target === "Election Closed" ? round2CloseAt : null;
    return !!closeDate && new Date(closeDate) > new Date();
  }

  const round1Current = status === "Nomination Open";
  const round1Done = currentIndex >= STATUS_FLOW.indexOf("Nomination Closed");
  const round2Current = status === "Election Open";
  const round2Done = currentIndex >= STATUS_FLOW.indexOf("Election Closed");

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <RoundBadge label="Round 1 — Nomination" current={round1Current} done={round1Done} />
        <span className="text-council-ink/30">→</span>
        <RoundBadge label="Round 2 — Election" current={round2Current} done={round2Done} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="font-body text-sm text-council-ink/60">
          Current status: <span className="font-medium text-council-navy">{computeElectionStageLabel({ status, approval_status: approvalStatus, results_published: resultsPublished })}</span>
        </span>
        {next && (
          <button
            onClick={() => setStatus(next)}
            disabled={busy}
            className="bg-council-navy text-white font-body text-sm font-medium rounded-card px-4 py-2 hover:bg-council-navyDeep disabled:opacity-60"
          >
            {busy ? "Updating…" : isEarlyClose(next) ? `Close Early → "${next}"` : `Advance to "${next}"`}
          </button>
        )}
        <button
          onClick={togglePublish}
          disabled={busy || (!resultsPublished && approvalStatus !== "Approved")}
          title={!resultsPublished && approvalStatus !== "Approved" ? "Requires Minister Approval first — see Council Review & Minister Approval below." : undefined}
          className="border border-council-navy/20 font-body text-sm font-medium rounded-card px-4 py-2 disabled:opacity-40"
        >
          {resultsPublished ? "Unpublish Results" : "Publish Results"}
        </button>
      </div>
      {!resultsPublished && approvalStatus !== "Approved" && (
        <p className="font-body text-xs text-council-ink/40 mt-2">
          Publishing is locked until Minister Approval is recorded below.
        </p>
      )}

      {showConfirm && (
        <div className="bg-status-pending/10 border border-status-pending rounded-card p-3 space-y-2">
          <p className="font-body text-xs text-council-ink/70">
            Publishing makes results visible to every nurse/midwife immediately. Enter your name or a short
            certification note to confirm.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="e.g. Certified by J. Confait, Registrar"
              className="flex-1 border border-council-navy/20 rounded-card px-2 py-1.5 text-sm"
            />
            <button onClick={togglePublish} disabled={busy || !confirmText} className="text-xs bg-status-active text-white rounded-card px-3 py-1.5 disabled:opacity-60">
              Confirm Publish
            </button>
            <button onClick={() => setShowConfirm(false)} className="text-xs text-council-ink/50 underline">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RoundBadge({ label, current, done }: { label: string; current: boolean; done: boolean }) {
  return (
    <div
      className={`px-3 py-1.5 rounded-full text-xs font-body font-medium ${
        current ? "bg-council-cyan text-white" : done ? "bg-status-active/10 text-status-active" : "bg-council-navy/10 text-council-ink/50"
      }`}
    >
      {label}
    </div>
  );
}
