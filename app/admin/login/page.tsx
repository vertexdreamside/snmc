"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ContactFooter } from "@/lib/components/ContactFooter";

// Staff Portal login — plain email/password via Supabase Auth, deliberately
// separate from the Nurse/Midwife reg-no/NIN/OTP flow (Section 1.1).
export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(searchParams.get("disabled") ? "This account has been disabled. Contact a Super Admin if you believe this is an error." : null);
  const [loading, setLoading] = useState(false);

  async function logAttempt(outcome: "success" | "failure") {
    try {
      await fetch("/api/admin/login-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome, email }),
      });
    } catch {
      // Logging failure shouldn't block sign-in — never let this throw.
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError("Invalid email or password.");
      await logAttempt("failure");
      return;
    }
    await logAttempt("success");
    router.push("/admin");
  }

  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6">
        <form onSubmit={handleSubmit} className="max-w-sm w-full bg-white rounded-card border border-council-navy/10 p-8">
          <h1 className="font-display text-2xl text-council-navy mb-6">Staff Login</h1>
          <label className="block mb-4">
            <span className="font-body text-sm text-council-ink/70 block mb-1">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-council-navy/20 rounded-card px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-council-cyan"
            />
          </label>
          <label className="block mb-4">
            <span className="font-body text-sm text-council-ink/70 block mb-1">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-council-navy/20 rounded-card px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-council-cyan"
            />
          </label>
          {error && <p className="font-body text-sm text-status-closed mb-4">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-council-navy text-white font-body font-medium rounded-card py-2.5 hover:bg-council-navyDeep transition-colors disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
      <ContactFooter />
    </main>
  );
}
