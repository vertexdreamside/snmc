"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Section 23: "The information should update automatically without
// requiring the administrator to manually refresh the page." This app
// has no real-time (WebSocket/Supabase Realtime) subscription
// infrastructure anywhere yet — everything else re-renders via an
// explicit action calling router.refresh(). Rather than build a whole
// separate real-time layer for just this one panel, this uses the
// simplest thing that actually satisfies "updates automatically":
// periodically re-running the page's own server-side data fetch, which
// re-executes ElectionMonitor's queries with fresh data. Only mounted
// while an election is actually open — no reason to keep polling a
// closed election, whose results can no longer change anyway.
export function AutoRefresh({ intervalSeconds = 15 }: { intervalSeconds?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalSeconds * 1000);
    return () => clearInterval(id);
  }, [router, intervalSeconds]);

  return null;
}
