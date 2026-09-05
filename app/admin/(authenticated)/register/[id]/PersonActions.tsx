"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Mark Deceased moved OUT of this component and down to
// RecordManagementSection.tsx, at the bottom of the profile — per the
// confirmed UX requirements, a destructive/administrative action like
// this shouldn't sit next to routine approve/reject buttons where it
// could be clicked accidentally.
export function PersonActions({ personId, profileStatus }: { personId: string; profileStatus: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function run(action: "approve" | "reject") {
    setBusy(action);
    await fetch(`/api/admin/people/${personId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusy(null);
    router.refresh();
  }

  if (profileStatus !== "Pending Review") return null;

  return (
    <div className="flex flex-wrap gap-2">
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
    </div>
  );
}
