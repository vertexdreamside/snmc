"use client";

import { useEffect, useState } from "react";

// Completes the login flow started in lib/auth/identify.ts. Supabase's
// magic-link verification redirects here with the session token in the
// URL fragment (#access_token=...) — fragments never reach the server,
// so this page reads it client-side, then POSTs it to
// /api/auth/set-session, which establishes the session server-side using
// the same cookie-writing path middleware already reliably reads. An
// earlier version of this page called setSession() directly on the
// browser Supabase client, which writes via document.cookie — that did
// not reliably end up visible to the server-side cookie reading, so the
// person would be signed in from the browser's own point of view but
// bounced straight back to login on the very next page load. Routing the
// actual session-establishment through our own server route closes that
// gap.
export default function AuthCallbackPage() {
  const [status, setStatus] = useState<"working" | "error">("working");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    async function completeLogin() {
      const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
      const params = new URLSearchParams(hash);
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (!access_token || !refresh_token) {
        setErrorDetail("No session token found in the link.");
        setStatus("error");
        return;
      }

      const res = await fetch("/api/auth/set-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token, refresh_token }),
      });
      const data = await res.json();

      if (!data.ok) {
        setErrorDetail(data.reason ?? "Could not establish session.");
        setStatus("error");
        return;
      }

      // Clear the token out of the visible URL before navigating —
      // no reason to leave a session token sitting in browser history.
      window.location.replace("/portal");
    }

    completeLogin();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        {status === "working" ? (
          <p className="font-body text-council-ink/60">Signing you in…</p>
        ) : (
          <div>
            <p className="font-body text-status-closed mb-2">Something went wrong completing sign-in.</p>
            {errorDetail && <p className="font-body text-xs text-council-ink/50 mb-2">{errorDetail}</p>}
            <a href="/portal/login" className="font-body text-council-navy underline">
              Return to login
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
