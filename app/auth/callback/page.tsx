"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Completes the login flow started in lib/auth/identify.ts. Supabase's
// magic-link verification redirects here with the session token in the
// URL fragment (#access_token=...) rather than a server-visible query
// param — fragments never reach the server, so this has to be a Client
// Component that reads window.location.hash directly and calls
// setSession() itself. That call is what actually establishes the
// cookie-based session lib/auth/guards.ts checks on every subsequent
// page load; without it, the token just sits unused in the URL and the
// person ends up bounced straight back to the login page.
export default function AuthCallbackPage() {
  const [status, setStatus] = useState<"working" | "error">("working");

  useEffect(() => {
    async function completeLogin() {
      const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
      const params = new URLSearchParams(hash);
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (!access_token || !refresh_token) {
        setStatus("error");
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });

      if (error) {
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
            <a href="/portal/login" className="font-body text-council-navy underline">
              Return to login
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
