"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";

// Deliberately visually separated from routine profile actions and
// placed at the very bottom of the page — this is a destructive,
// rarely-used administrative action, not something that should sit
// next to Approve/Reject where it could be clicked by mistake.
export function RecordManagementSection({ personId, personName, isDeceased }: { personId: string; personName: string; isDeceased: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function markDeceased() {
    if (!confirm("Mark this person as deceased? This cannot be self-reversed by the person, and will remove their ability to nominate or vote in any election. This does not delete their record.")) {
      return;
    }
    setBusy(true);
    await fetch(`/api/admin/people/${personId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_deceased" }),
    });
    setBusy(false);
    router.refresh();
  }

  // Permanently deletes the record — for duplicates or test accounts left
  // over from the original data migration, not for real people. Typed
  // confirmation (rather than just a confirm() dialog) because this is
  // irreversible and hits a different table set than "Mark as Deceased".
  async function permanentlyDelete() {
    const typed = window.prompt(
      `This permanently deletes ${personName}'s entire record — profile, licence documents, renewal history, everything. This CANNOT be undone.\n\nType the person's full name exactly to confirm: ${personName}`
    );
    if (typed !== personName) {
      if (typed !== null) alert("Name didn't match — nothing was deleted.");
      return;
    }
    setBusy(true);
    setDeleteError(null);
    const res = await fetch(`/api/admin/people/${personId}`, { method: "DELETE" });
    const data = await res.json();
    if (data.ok) {
      router.push("/admin/register");
      router.refresh();
    } else {
      setBusy(false);
      setDeleteError(data.reason ?? "Could not delete this record.");
    }
  }

  if (isDeceased) {
    return (
      <div className="bg-status-closed/5 border border-status-closed/20 rounded-card p-4">
        <h2 className="font-display text-sm text-council-navy mb-1">Record Management</h2>
        <p className="font-body text-sm text-status-closed font-medium">This person is recorded as deceased.</p>
      </div>
    );
  }

  return (
    <div className="border-t-2 border-council-navy/10 pt-6">
      <h2 className="font-display text-sm text-council-ink/50 mb-3 flex items-center gap-2">
        <AlertTriangle size={14} aria-hidden="true" /> Record Management
      </h2>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={markDeceased}
          disabled={busy}
          className="border border-status-closed/40 text-status-closed font-body text-sm font-medium rounded-card px-4 py-2 disabled:opacity-60"
        >
          {busy ? "Updating…" : "Mark as Deceased"}
        </button>
        <button
          onClick={permanentlyDelete}
          disabled={busy}
          className="bg-status-closed text-white font-body text-sm font-medium rounded-card px-4 py-2 disabled:opacity-60"
        >
          {busy ? "Working…" : "Permanently Delete Record"}
        </button>
      </div>
      <p className="font-body text-xs text-council-ink/40 mt-2">
        "Mark as Deceased" preserves the person's historical record — it permanently prevents future
        nomination, voting, and renewal actions but deletes nothing. "Permanently Delete Record" is for
        duplicates or test accounts only — it erases the record entirely and cannot be undone.
      </p>
      {deleteError && <p className="font-body text-xs text-status-closed mt-2">{deleteError}</p>}
    </div>
  );
}
