"use client";

import { useState } from "react";

export function SessionSettingsForm({ initialSeconds }: { initialSeconds: number }) {
  const [minutes, setMinutes] = useState(Math.round(initialSeconds / 60));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/admin/session-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ warningSeconds: minutes * 60 }),
    });
    const data = await res.json();
    setBusy(false);
    setMessage(data.ok ? "Saved." : data.reason ?? "Could not save.");
  }

  return (
    <form onSubmit={handleSave} className="bg-white rounded-card border border-council-navy/10 p-6 space-y-3">
      <label className="block">
        <span className="font-body text-sm text-council-ink/70 block mb-1">Warn this many minutes before expiry</span>
        <input
          type="number"
          min={1}
          max={30}
          value={minutes}
          onChange={(e) => setMinutes(Math.max(1, parseInt(e.target.value, 10) || 1))}
          className="w-32 border border-council-navy/20 rounded-card px-3 py-2 font-body text-sm"
        />
      </label>
      <button type="submit" disabled={busy} className="bg-council-navy text-white font-body text-sm font-medium rounded-card px-4 py-2 disabled:opacity-60">
        {busy ? "Saving…" : "Save"}
      </button>
      {message && <p className="font-body text-sm text-council-ink/60">{message}</p>}
    </form>
  );
}
