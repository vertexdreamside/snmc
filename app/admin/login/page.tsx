"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ContactFooter } from "@/lib/components/ContactFooter";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";

// Staff Portal login — plain email/password via Supabase Auth, deliberately
// separate from the Nurse/Midwife reg-no/NIN/OTP flow (Section 1.1).
export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(searchParams.get("disabled") ? "This account has been disabled. Contact a Super Admin if you believe this is an error." : null);
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

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

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    // Always show the same confirmation regardless of outcome — this
    // must not reveal whether a given email actually has an account,
    // same reasoning as the portal login's deliberately vague failure
    // message.
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/admin/login` });
    setLoading(false);
    setResetSent(true);
  }

  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-sm w-full bg-white rounded-card border border-council-navy/10 p-8">
          <Image src="/snmc-emblem.png" alt="SNMC emblem" width={48} height={48} className="mx-auto mb-3" />
          <h1 className="font-display text-2xl text-council-navy mb-6 text-center">Staff Login</h1>

          {resetMode ? (
            resetSent ? (
              <div className="text-center space-y-4">
                <p className="font-body text-sm text-council-ink/70">
                  If an account exists for <span className="font-medium text-council-navy">{email}</span>, a
                  password reset link has been sent.
                </p>
                <button onClick={() => { setResetMode(false); setResetSent(false); }} className="font-body text-sm text-council-cyan underline">
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleReset}>
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
                {error && <p className="font-body text-sm text-status-closed mb-4">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-council-navy text-white font-body font-medium rounded-card py-2.5 hover:bg-council-navyDeep transition-colors disabled:opacity-60"
                >
                  {loading ? "Sending…" : "Send Reset Link"}
                </button>
                <button type="button" onClick={() => setResetMode(false)} className="w-full font-body text-sm text-council-ink/50 underline mt-3">
                  Back to Sign In
                </button>
              </form>
            )
          ) : (
            <form onSubmit={handleSubmit}>
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
              <label className="block mb-2">
                <span className="font-body text-sm text-council-ink/70 block mb-1">Password</span>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-council-navy/20 rounded-card px-3 py-2 pr-10 font-body focus:outline-none focus:ring-2 focus:ring-council-cyan"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-council-ink/40"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                  </button>
                </div>
              </label>
              <button type="button" onClick={() => setResetMode(true)} className="font-body text-xs text-council-cyan underline mb-4 block">
                Forgot Password?
              </button>
              {error && <p className="font-body text-sm text-status-closed mb-4">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-council-navy text-white font-body font-medium rounded-card py-2.5 hover:bg-council-navyDeep transition-colors disabled:opacity-60"
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>
          )}
        </div>
      </div>
      <ContactFooter />
    </main>
  );
}
