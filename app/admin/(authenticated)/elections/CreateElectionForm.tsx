"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateElectionForm() {
  const router = useRouter();
  const [termLabel, setTermLabel] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/admin/elections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ termLabel }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.ok) {
      setTermLabel("");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 bg-white rounded-card border border-council-navy/10 p-4">
      <input
        type="text"
        required
        value={termLabel}
        onChange={(e) => setTermLabel(e.target.value)}
        placeholder="Term label, e.g. 2026-2029"
        className="flex-1 border border-council-navy/20 rounded-card px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-council-cyan"
      />
      <button
        type="submit"
        disabled={busy}
        className="bg-council-navy text-white font-body text-sm font-medium rounded-card px-4 py-2 hover:bg-council-navyDeep disabled:opacity-60"
      >
        {busy ? "Creating…" : "New Election"}
      </button>
    </form>
  );
}
