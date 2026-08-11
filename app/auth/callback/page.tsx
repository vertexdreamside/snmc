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
  const [debugLines, setDebugLines] = useState<string[]>(["Starting…"]);
  const [status, setStatus] = useState<"working" | "error" | "debug">("working");

  function log(line: string) {
    setDebugLines((prev) => [...prev, line]);
  }

  useEffect(() => {
    async function completeLogin() {
      const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
      const params = new URLSearchParams(hash);
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      log(`Fragment present: ${window.location.hash.length > 0}`);
      log(`access_token found: ${!!access_token} (length ${access_token?.length ?? 0})`);
      log(`refresh_token found: ${!!refresh_token} (length ${refresh_token?.length ?? 0})`);

      if (!access_token || !refresh_token) {
        log("STOPPING: no token in URL fragment.");
        setStatus("debug");
        return;
      }

      const supabase = createClient();
      const { data: setData, error } = await supabase.auth.setSession({ access_token, refresh_token });

      log(`setSession error: ${error ? error.message : "none"}`);
      log(`setSession returned user id: ${setData?.user?.id ?? "none"}`);

      if (error) {
        log("STOPPING: setSession failed.");
        setStatus("debug");
        return;
      }

      // Confirm the session is actually retrievable right after setting it.
      const { data: checkData } = await supabase.auth.getSession();
      log(`getSession() right after: ${checkData.session ? "session found" : "NO SESSION FOUND"}`);
      log(`Cookies visible to JS right now: ${document.cookie.split(";").filter((c) => c.trim().startsWith("sb-")).map((c) => c.trim().split("=")[0]).join(", ") || "none starting with sb-"}`);

      setStatus("debug");
      // TEMPORARY: not auto-redirecting during debugging so the log stays
      // visible. Manual "Continue" link below does the real navigation.
    }

    completeLogin();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-lg w-full bg-white rounded-card border border-council-navy/10 p-6">
        <p className="font-body text-sm text-council-ink/60 mb-3">Debug output:</p>
        <pre className="font-mono text-xs whitespace-pre-wrap text-council-ink bg-council-cream p-3 rounded-card">
          {debugLines.join("\n")}
        </pre>
        {status === "debug" && (
          <a href="/portal" className="mt-4 inline-block font-body text-council-navy underline">
            Continue to /portal manually →
          </a>
        )}
      </div>
    </main>
  );
}
