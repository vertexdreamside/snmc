"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

// Section 5: a real renewal request, not just editing the expiry date
// field directly (that field is display-only for self-service — see
// ProfileForm). This creates a Pending license_renewals row; only an
// admin approving it actually changes the official expiry date.
export function RenewalRequestForm({ hasNurse, hasMidwife }: { hasNurse: boolean; hasMidwife: boolean }) {
  const [open, setOpen] = useState(false);
  const [licenseType, setLicenseType] = useState<"Nurse" | "Midwife">(hasNurse ? "Nurse" : "Midwife");
  const [expiryDate, setExpiryDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!hasNurse && !hasMidwife) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/portal/license-renewal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenseType, requestedExpiryDate: expiryDate }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.ok) {
      setMessage("Renewal request submitted — awaiting Council review.");
      setOpen(false);
      setExpiryDate("");
    } else {
      setMessage(data.reason ?? "Could not submit the request.");
    }
  }

  return (
    <div className="bg-white rounded-card border border-council-navy/10 p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base text-council-navy flex items-center gap-2">
          <RefreshCw size={16} className="text-council-cyan" aria-hidden="true" /> Licence Renewal
        </h2>
        <button onClick={() => setOpen(!open)} className="text-xs text-council-cyan underline">
          {open ? "Cancel" : "Request Renewal"}
        </button>
      </div>
      {open && (
        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          {hasNurse && hasMidwife && (
            <label className="block">
              <span className="font-body text-sm text-council-ink/70 block mb-1">Which licence?</span>
              <select value={licenseType} onChange={(e) => setLicenseType(e.target.value as "Nurse" | "Midwife")} className="w-full border border-council-navy/20 rounded-card px-3 py-2 font-body text-sm">
                <option value="Nurse">Nurse</option>
                <option value="Midwife">Midwife</option>
              </select>
            </label>
          )}
          <label className="block">
            <span className="font-body text-sm text-council-ink/70 block mb-1">New expiry date (from your renewed certificate)</span>
            <input type="date" required value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-full border border-council-navy/20 rounded-card px-3 py-2 font-body text-sm" />
          </label>
          <p className="font-body text-xs text-council-ink/40">
            This submits a request for Council review — your official expiry date only changes once approved.
          </p>
          <button type="submit" disabled={busy} className="bg-council-navy text-white font-body text-sm font-medium rounded-card px-4 py-2 disabled:opacity-60">
            {busy ? "Submitting…" : "Submit Renewal Request"}
          </button>
        </form>
      )}
      {message && <p className="font-body text-xs text-council-ink/60 mt-2">{message}</p>}
    </div>
  );
}
