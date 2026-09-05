"use client";

import { useState } from "react";
import Image from "next/image";
import { Stethoscope } from "lucide-react";
import { ContactFooter } from "@/lib/components/ContactFooter";

// Registration Number required; NIN optional for now. See the trade-off
// note in lib/auth/identify.ts — NIN wasn't consistently captured in the
// legacy register, so it's only checked when a person actually has one
// on file. Send it if you have it; leave it blank otherwise.
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
      body: JSON.stringify({ registrationNumber, nin: nin || undefined }),
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
    <main className="min-h-screen flex flex-col bg-white">
      <div className="bg-council-header pt-14 pb-20 px-6">
        <div className="max-w-sm mx-auto text-center">
          <Image src="/snmc-emblem.png" alt="SNMC emblem" width={56} height={56} className="mx-auto mb-3" priority />
          <p className="font-body text-xs text-council-cyanLight uppercase tracking-wide">
            Seychelles Nurses &amp; Midwives Council
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center px-6 -mt-12 pb-16">
        <form onSubmit={handleSubmit} className="max-w-sm w-full bg-white rounded-card shadow-lg border border-council-navy/10 p-8">
          <div className="w-12 h-12 rounded-full bg-council-cyan/10 flex items-center justify-center mb-4">
            <Stethoscope size={24} strokeWidth={1.75} className="text-council-cyan" aria-hidden="true" />
          </div>
          <h1 className="font-display text-2xl text-council-navy mb-1">Nurse / Midwife Login</h1>
          <p className="font-body text-sm text-council-ink/50 mb-6">Vote, nominate, and manage your profile.</p>

          <Field label="Registration Number" value={registrationNumber} onChange={setRegistrationNumber} required />
          <Field
            label="National ID Number (NIN) — if you have one on file"
            value={nin}
            onChange={setNin}
            required={false}
          />

          {error && <p className="font-body text-sm text-status-closed mb-4">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-council-navy text-white font-body font-medium rounded-card py-2.5 hover:bg-council-navyDeep transition-colors disabled:opacity-60"
          >
            {loading ? "Please wait…" : "Sign In"}
          </button>

          <a href="/" className="block text-center font-body text-xs text-council-ink/40 hover:text-council-cyan mt-4">
            ← Back to home
          </a>
        </form>
      </div>

      <ContactFooter />
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required: boolean;
}) {
  return (
    <label className="block mb-4">
      <span className="font-body text-sm text-council-ink/70 block mb-1">{label}</span>
      <input
        type="text"
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-council-navy/20 rounded-card px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-council-cyan"
      />
    </label>
  );
}
