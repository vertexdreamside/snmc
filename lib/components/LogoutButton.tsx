"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

// Shared across every portal (Nurse/Midwife, Admin, Councillor) — same
// endpoint, same behavior everywhere. Redirects with a full page
// navigation (not router.push) so every bit of client-side state and
// cache is thrown away along with the session, not just the URL.
export function LogoutButton({ redirectTo, className }: { redirectTo: string; className?: string }) {
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = redirectTo;
  }

  return (
    <button
      onClick={handleLogout}
      disabled={busy}
      className={className ?? "flex items-center gap-1.5 text-sm hover:opacity-80 disabled:opacity-50"}
    >
      <LogOut size={14} aria-hidden="true" />
      {busy ? "Signing out…" : "Logout"}
    </button>
  );
}
