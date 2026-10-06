"use client";

import { useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Stethoscope, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ContactFooter } from "@/lib/components/ContactFooter";

// Registration Number required; NIN optional for now. See the trade-off
// note in lib/auth/identify.ts — NIN wasn't consistently captured in the
// legacy register, so it's only checked when a person actually has one
// on file. Send it if you have it; leave it blank otherwise.
export default function PortalLoginPage() {
  const searchParams = useSearchParams();
  // Set by requireCouncillor() (lib/auth/guards.ts) when redirecting an
  // unauthenticated visit to /council, so a Councillor who isn't signed
  // in yet lands back on /council — not the generic Nurse/Midwife
  // /portal — once they sign in. Same flag also switches this form's own
  // heading/icon below, since it's one shared login for both audiences.
  const next = searchParams.get("next") ?? "/portal";
  const isCouncillor = next === "/council";
  const [registrationNumber, setRegistrationNumber] = useState("");
  // Councillors sign in with their registered email + password instead of
  // a registration number (see requireCouncillor in lib/auth/guards.ts).
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nin, setNin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (isCouncillor) {
      const { error: signInError } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) {
        setLoading(false);
        setError("We couldn't verify those details.");
        return;
      }
      window.location.href = "/council";
      return;
    }
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationNumber, nin: nin || undefined, next }),
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
          <Image src="/snmc-emblem.png" alt="Seychelles Nurses & Midwives Council" width={112} height={112} className="mx-auto mb-3" priority />
          <p className="font-body text-xs text-council-cyanLight uppercase tracking-wide">
            Seychelles Nurses &amp; Midwives Council
          </p>
          <p className="font-body text-[11px] text-council-cyanLight/70 uppercase tracking-wider mt-1">
            Excellence in Practice &middot; Safety in Care
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center px-6 -mt-12 pb-16">
        <form onSubmit={handleSubmit} className="max-w-sm w-full bg-white rounded-card shadow-lg border border-council-navy/10 p-8">
          <div className="w-12 h-12 rounded-full bg-council-cyan/10 flex items-center justify-center mb-4">
            {isCouncillor ? (
              <Users size={24} strokeWidth={1.75} className="text-council-cyan" aria-hidden="true" />
            ) : (
              <Stethoscope size={24} strokeWidth={1.75} className="text-council-cyan" aria-hidden="true" />
            )}
          </div>
          <h1 className="font-display text-2xl text-council-navy mb-1">
            {isCouncillor ? "Councillor Login" : "Nurse / Midwife Login"}
          </h1>
          <p className="font-body text-sm text-council-ink/50 mb-6">
            {isCouncillor ? "Sign in with your registered email and password." : "Vote, nominate, and manage your profile."}
          </p>

          {isCouncillor ? (
            <>
              <Field label="Registered Email" value={email} onChange={setEmail} required type="email" />
              <Field label="Password" value={password} onChange={setPassword} required type="password" />
            </>
          ) : (
            <>
              <Field label="Registration Number" value={registrationNumber} onChange={setRegistrationNumber} required />
              <Field
                label="National ID Number (NIN) — if you have one on file"
                value={nin}
                onChange={setNin}
                required={false}
              />
            </>
          )}

          {error && <p className="font-body text-sm text-status-closed mb-4">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-council-navy text-white font-body font-medium rounded-card py-2.5 hover:bg-council-navyDeep transition-colors disabled:opacity-60"
          >
            {loading ? "Please wait…" : "Sign In"}
          </button>

          {!isCouncillor && (
          <a
              href="/snmc-nurse-midwife-guide.html"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center font-body text-xs text-council-cyan underline mt-4"
            >
              New here? Open the user guide
            </a>
          )}

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
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required: boolean;
  type?: string;
}) {
  return (
    <label className="block mb-4">
      <span className="font-body text-sm text-council-ink/70 block mb-1">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-council-navy/20 rounded-card px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-council-cyan"
      />
    </label>
  );
}
