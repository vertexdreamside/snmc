"use client";

import { useState } from "react";

// Single-step login: Registration Number + NIN. No OTP/second factor —
// see the trade-off note in lib/auth/identify.ts.
export default function PortalLoginPage() {
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [nin, setNin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationNumber, nin }),
    });
    const data = await res.json();
    setLoading(false);
    if (!data.ok) {
      setError(data.reason ?? "Something went wrong. Please try again.");
      return;
    }
    window.location.href = data.redirectTo;
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="max-w-sm w-full bg-white rounded-card border border-council-navy/10 p-8">
        <h1 className="font-display text-2xl text-council-navy mb-6">Nurse / Midwife Login</h1>

        <Field label="Registration Number" value={registrationNumber} onChange={setRegistrationNumber} />
        <Field label="National ID Number (NIN)" value={nin} onChange={setNin} />

        {error && <p className="font-body text-sm text-status-closed mb-4">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-council-navy text-white font-body font-medium rounded-card py-2.5 hover:bg-council-navyDeep transition-colors disabled:opacity-60"
        >
          {loading ? "Please wait…" : "Sign In"}
        </button>
      </form>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block mb-4">
      <span className="font-body text-sm text-council-ink/70 block mb-1">{label}</span>
      <input
        type="text"
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-council-navy/20 rounded-card px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-council-cyan"
      />
    </label>
  );
}
