"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock } from "lucide-react";

type RoundScheduleState = "Not Scheduled" | "Scheduled" | "Active" | "Closed";

function computeState(openAt: string | null, closeAt: string | null): RoundScheduleState {
  const now = Date.now();
  if (!openAt) return "Not Scheduled";
  const opens = new Date(openAt).getTime();
  if (now < opens) return "Scheduled";
  if (closeAt && now >= new Date(closeAt).getTime()) return "Closed";
  return "Active";
}

function formatCountdown(target: string): string {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return "now";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${mins}m`;
}

function toInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Section 7: explicit, manually-configured start/end date-time for each
// round, shown with a simplified Scheduled/Active/Closed state and a
// live countdown — separate from the more detailed status-advance
// buttons elsewhere on this page. Setting these here is what the vote/
// nominate API routes actually enforce (see lib/elections/schedule.ts),
// independent of whether the status has been manually advanced.
export function ScheduleForm({
  electionId,
  round1OpenAt,
  round1CloseAt,
  round2OpenAt,
  round2CloseAt,
}: {
  electionId: string;
  round1OpenAt: string | null;
  round1CloseAt: string | null;
  round2OpenAt: string | null;
  round2CloseAt: string | null;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    round1_open_at: toInputValue(round1OpenAt),
    round1_close_at: toInputValue(round1CloseAt),
    round2_open_at: toInputValue(round2OpenAt),
    round2_close_at: toInputValue(round2CloseAt),
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [, forceTick] = useState(0);

  // Re-render every 30s so the countdown/state actually stays current
  // while someone has this page open.
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const res = await fetch(`/api/admin/elections/${electionId}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        round1_open_at: form.round1_open_at || null,
        round1_close_at: form.round1_close_at || null,
        round2_open_at: form.round2_open_at || null,
        round2_close_at: form.round2_close_at || null,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.ok) {
      setMessage("Schedule saved.");
      router.refresh();
    } else {
      setMessage(data.reason ?? "Could not save the schedule.");
    }
  }

  const round1State = computeState(round1OpenAt, round1CloseAt);
  const round2State = computeState(round2OpenAt, round2CloseAt);

  return (
    <div className="bg-white rounded-card border border-council-navy/10 p-6 space-y-4">
      <h3 className="font-display text-base text-council-navy flex items-center gap-2">
        <CalendarClock size={16} className="text-council-cyan" aria-hidden="true" /> Election Schedule
      </h3>
      <form onSubmit={handleSave} className="space-y-4">
        <ScheduleRound
          label="Round 1 — Nomination"
          state={round1State}
          openAt={round1OpenAt}
          closeAt={round1CloseAt}
          openValue={form.round1_open_at}
          closeValue={form.round1_close_at}
          onOpenChange={(v) => setForm((f) => ({ ...f, round1_open_at: v }))}
          onCloseChange={(v) => setForm((f) => ({ ...f, round1_close_at: v }))}
        />
        <ScheduleRound
          label="Round 2 — Election / Voting"
          state={round2State}
          openAt={round2OpenAt}
          closeAt={round2CloseAt}
          openValue={form.round2_open_at}
          closeValue={form.round2_close_at}
          onOpenChange={(v) => setForm((f) => ({ ...f, round2_open_at: v }))}
          onCloseChange={(v) => setForm((f) => ({ ...f, round2_close_at: v }))}
        />
        <button type="submit" disabled={busy} className="bg-council-navy text-white font-body text-sm font-medium rounded-card px-4 py-2 disabled:opacity-60">
          {busy ? "Saving…" : "Save Schedule"}
        </button>
        {message && <p className="font-body text-xs text-council-ink/60">{message}</p>}
      </form>
    </div>
  );
}

function ScheduleRound({
  label, state, openAt, closeAt, openValue, closeValue, onOpenChange, onCloseChange,
}: {
  label: string; state: RoundScheduleState; openAt: string | null; closeAt: string | null;
  openValue: string; closeValue: string; onOpenChange: (v: string) => void; onCloseChange: (v: string) => void;
}) {
  const stateColor = state === "Active" ? "text-status-active" : state === "Scheduled" ? "text-council-cyan" : state === "Closed" ? "text-status-closed" : "text-council-ink/40";
  return (
    <div className="border-t border-council-navy/10 pt-4 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between mb-2">
        <p className="font-body text-sm font-medium text-council-navy">{label}</p>
        <span className={`font-body text-xs font-medium ${stateColor}`}>
          {state}
          {state === "Scheduled" && openAt && ` — opens in ${formatCountdown(openAt)}`}
          {state === "Active" && closeAt && ` — closes in ${formatCountdown(closeAt)}`}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="font-body text-xs text-council-ink/60 block mb-1">Start</span>
          <input type="datetime-local" value={openValue} onChange={(e) => onOpenChange(e.target.value)} className="w-full border border-council-navy/20 rounded-card px-2 py-1.5 text-sm" />
        </label>
        <label className="block">
          <span className="font-body text-xs text-council-ink/60 block mb-1">End</span>
          <input type="datetime-local" value={closeValue} onChange={(e) => onCloseChange(e.target.value)} className="w-full border border-council-navy/20 rounded-card px-2 py-1.5 text-sm" />
        </label>
      </div>
    </div>
  );
}
