"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CandidateRow({
  candidateId,
  name,
  status,
  votes,
}: {
  candidateId: string;
  name: string;
  status: string;
  votes: number | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function setStatus(newStatus: string) {
    setBusy(true);
    await fetch(`/api/admin/candidates/${candidateId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-council-navy/10 last:border-0">
      <div>
        <p className="font-body text-sm">{name}</p>
        <p className="font-body text-xs text-council-ink/50">
          {status}
          {votes !== null && (
            <>
              {" "}
              · {votes} vote{votes === 1 ? "" : "s"}
            </>
          )}
        </p>
      </div>
      <div className="flex gap-2">
        {status === "Nominated" && (
          <button
            onClick={() => setStatus("Shortlisted")}
            disabled={busy}
            className="text-xs font-body bg-council-navy text-white rounded-card px-3 py-1.5 disabled:opacity-60"
          >
            Shortlist
          </button>
        )}
        {status === "Shortlisted" && (
          <>
            <button
              onClick={() => setStatus("Elected")}
              disabled={busy}
              className="text-xs font-body bg-status-active text-white rounded-card px-3 py-1.5 disabled:opacity-60"
            >
              Mark Elected
            </button>
            <button
              onClick={() => setStatus("Not Elected")}
              disabled={busy}
              className="text-xs font-body border border-council-navy/20 rounded-card px-3 py-1.5 disabled:opacity-60"
            >
              Not Elected
            </button>
          </>
        )}
      </div>
    </div>
  );
}
