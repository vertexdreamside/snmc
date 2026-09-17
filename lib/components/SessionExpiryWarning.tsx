"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { AlertTriangle } from "lucide-react";

const WARNING_BEFORE_EXPIRY_SECONDS = 120; // Section 8: "reasonable period" — warn 2 minutes before the token actually expires.

// Sections 8-9: warn before an inactive session expires, offer "Stay
// Logged In" (refreshes the session in place — nothing is lost, no
// navigation happens) or "Log Out". If ignored, the session is allowed
// to actually expire (this never artificially extends it further) and
// the reason is recorded as "Session Expired" before redirecting —
// distinct from a deliberate Logout. This is genuinely new
// infrastructure: nothing like it existed anywhere in the app before.
export function SessionExpiryWarning({ loginPath }: { loginPath: string }) {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WARNING_BEFORE_EXPIRY_SECONDS);
  const [refreshing, setRefreshing] = useState(false);
  const expiresAtRef = useRef<number | null>(null);
  const warnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scheduleFromSession = useCallback(async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.expires_at) return;

    expiresAtRef.current = session.expires_at * 1000;
    const msUntilWarning = expiresAtRef.current - Date.now() - WARNING_BEFORE_EXPIRY_SECONDS * 1000;

    if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
    if (msUntilWarning <= 0) {
      setShowWarning(true);
    } else {
      warnTimerRef.current = setTimeout(() => setShowWarning(true), msUntilWarning);
    }
  }, []);

  useEffect(() => {
    scheduleFromSession();
    return () => {
      if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [scheduleFromSession]);

  useEffect(() => {
    if (!showWarning || !expiresAtRef.current) return;

    countdownRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.round((expiresAtRef.current! - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(countdownRef.current!);
        forceLogoutAsExpired();
      }
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showWarning]);

  async function forceLogoutAsExpired() {
    await fetch("/api/auth/session-expired", { method: "POST" });
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = `${loginPath}?reason=expired`;
  }

  async function handleStayLoggedIn() {
    setRefreshing(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.refreshSession();
    setRefreshing(false);
    if (error || !data.session) {
      // The refresh token itself is no longer valid — nothing left to
      // renew, so this really has become an expiry, not just a warning.
      await forceLogoutAsExpired();
      return;
    }
    setShowWarning(false);
    scheduleFromSession();
  }

  async function handleLogoutNow() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = loginPath;
  }

  if (!showWarning) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-card max-w-sm w-full p-6 space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle size={24} className="text-status-pending shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h2 className="font-display text-lg text-council-navy">Your session is about to expire</h2>
            <p className="font-body text-sm text-council-ink/60 mt-1">
              Would you like to stay logged in? You'll be signed out automatically in{" "}
              <span className="font-medium text-council-navy">
                {minutes}:{String(seconds).padStart(2, "0")}
              </span>{" "}
              if you don't respond.
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={handleLogoutNow} className="font-body text-sm text-council-ink/60 underline px-3 py-2">
            Log Out
          </button>
          <button
            onClick={handleStayLoggedIn}
            disabled={refreshing}
            className="bg-council-navy text-white font-body text-sm font-medium rounded-card px-4 py-2 disabled:opacity-60"
          >
            {refreshing ? "Renewing…" : "Stay Logged In"}
          </button>
        </div>
      </div>
    </div>
  );
}
