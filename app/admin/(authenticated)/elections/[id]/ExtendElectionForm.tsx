"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";

export function ExtendElectionForm({ electionId, field, label, currentClosing }: { electionId: string; field: "round1_close_at" | "round2_close_at"; label: string; currentClosing: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [newClosing, setNewClosing] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const res = await fetch(`/api/admin/elections/${electionId}/extend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field, newClosingTime: new Date(newClosing).toISOString(), reason }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.ok) {
      setMessage("Updated.");
      setOpen(false);
      router.refresh();
    } else {
      setMessage(data.reason ?? "Could not extend.");
    }
  }

  return (
    <div className="font-body text-sm">
      <div className="flex items-center gap-2 text-council-ink/70">
        <Clock size={14} className="text-council-ink/40" aria-hidden="true" />
        <span>{label}: {currentClosing ? new Date(currentClosing).toLocaleString() : "Not set"}</span>
        <button onClick={() => setOpen(!open)} className="text-council-cyan underline text-xs">{open ? "Cancel" : "Extend"}</button>
      </div>
      {open && (
        <form onSubmit={handleSubmit} className="mt-2 flex flex-wrap items-center gap-2 bg-council-cream rounded-card p-3">
          <input type="datetime-local" required value={newClosing} onChange={(e) => setNewClosing(e.target.value)} className="text-xs border border-council-navy/20 rounded-card px-2 py-1" />
          <input type="text" required placeholder="Reason (required for the audit record)" value={reason} onChange={(e) => setReason(e.target.value)} className="text-xs border border-council-navy/20 rounded-card px-2 py-1 flex-1 min-w-[200px]" />
          <button type="submit" disabled={busy} className="text-xs bg-council-navy text-white rounded-card px-3 py-1.5 disabled:opacity-60">{busy ? "Saving…" : "Confirm Extension"}</button>
        </form>
      )}
      {message && <p className="text-xs text-council-ink/50 mt-1">{message}</p>}
    </div>
  );
}
