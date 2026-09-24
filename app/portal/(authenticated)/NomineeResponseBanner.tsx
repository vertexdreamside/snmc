"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Megaphone } from "lucide-react";

interface PendingNomination {
  id: string;
  category: "Nurse" | "Midwife";
  election_term: string;
}

export function NomineeResponseBanner({ nominations }: { nominations: PendingNomination[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [responded, setResponded] = useState<Set<string>>(new Set());

  async function respond(id: string, decision: "Accepted" | "Declined") {
    setBusyId(id);
    await fetch(`/api/portal/candidates/${id}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    setBusyId(null);
    setResponded((prev) => new Set(prev).add(id));
    router.refresh();
  }

  const visible = nominations.filter((n) => !responded.has(n.id));
  if (visible.length === 0) return null;

  return (
    <section className="bg-status-pending/10 border-2 border-status-pending rounded-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Megaphone size={16} className="text-status-pending" aria-hidden="true" />
        <h2 className="font-display text-sm text-council-navy">You've been nominated</h2>
      </div>
      {visible.map((n) => (
        <div key={n.id} className="flex items-center justify-between bg-white rounded-card p-3">
          <p className="font-body text-sm text-council-ink/70">
            {n.category} candidate — {n.election_term}. Do you want to accept this nomination and move forward to
            Round 2?
          </p>
          <div className="flex gap-2 shrink-0 ml-3">
            <button
              onClick={() => respond(n.id, "Accepted")}
              disabled={busyId === n.id}
              className="text-xs bg-status-active text-white rounded-card px-3 py-1.5 disabled:opacity-60"
            >
              Accept
            </button>
            <button
              onClick={() => respond(n.id, "Declined")}
              disabled={busyId === n.id}
              className="text-xs border border-council-navy/20 rounded-card px-3 py-1.5 disabled:opacity-60"
            >
              Decline
            </button>
          </div>
        </div>
      ))}
    </section>
  );
}
