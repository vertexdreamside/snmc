"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PersonActions({ personId, profileStatus }: { personId: string; profileStatus: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function run(action: "approve" | "reject" | "mark_deceased") {
    if (action === "mark_deceased" && !confirm("Mark this person as deceased? This cannot be self-reversed by the person.")) {
      return;
    }
    setBusy(action);
    await fetch(`/api/admin/people/${personId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {profileStatus === "Pending Review" && (
        <>
          <button
            onClick={() => run("approve")}
            disabled={busy !== null}
            className="bg-status-active text-white font-body text-sm font-medium rounded-card px-4 py-2 disabled:opacity-60"
          >
            {busy === "approve" ? "Approving…" : "Approve"}
          </button>
          <button
            onClick={() => run("reject")}
            disabled={busy !== null}
            className="border border-status-closed text-status-closed font-body text-sm font-medium rounded-card px-4 py-2 disabled:opacity-60"
          >
            {busy === "reject" ? "Rejecting…" : "Reject"}
          </button>
        </>
      )}
      <button
        onClick={() => run("mark_deceased")}
        disabled={busy !== null}
        className="border border-council-navy/20 text-council-ink/70 font-body text-sm font-medium rounded-card px-4 py-2 disabled:opacity-60 ml-auto"
      >
        {busy === "mark_deceased" ? "Updating…" : "Mark Deceased"}
      </button>
    </div>
  );
}
