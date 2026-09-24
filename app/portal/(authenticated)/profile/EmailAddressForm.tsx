"use client";

import { useState } from "react";
import { Mail } from "lucide-react";

export function EmailAddressForm({ currentEmail }: { currentEmail: string | null }) {
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState(currentEmail ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [savedEmail, setSavedEmail] = useState(currentEmail);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/portal/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.ok) {
      setSavedEmail(email);
      setEditing(false);
      setMessage("Email address updated.");
    } else {
      setMessage(data.reason ?? "Could not update your email address.");
    }
  }

  return (
    <div className="bg-white rounded-card border border-council-navy/10 p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base text-council-navy flex items-center gap-2">
          <Mail size={16} className="text-council-cyan" aria-hidden="true" /> Email Address
        </h2>
        {!editing && (
          <button onClick={() => setEditing(true)} className="text-xs text-council-cyan underline">
            {savedEmail ? "Update" : "Add Email"}
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={handleSubmit} className="mt-3 flex items-center gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="flex-1 border border-council-navy/20 rounded-card px-3 py-2 font-body text-sm"
          />
          <button type="submit" disabled={busy} className="bg-council-navy text-white font-body text-sm font-medium rounded-card px-4 py-2 disabled:opacity-60">
            {busy ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={() => { setEditing(false); setEmail(savedEmail ?? ""); }} className="text-sm text-council-ink/50 underline">
            Cancel
          </button>
        </form>
      ) : (
        <p className="font-body text-sm text-council-ink/70 mt-2">
          {savedEmail ?? <span className="text-council-ink/40 italic">No email address on file.</span>}
        </p>
      )}
      {message && <p className="font-body text-xs text-council-ink/60 mt-2">{message}</p>}
    </div>
  );
}
