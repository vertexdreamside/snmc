"use client";

import { useState, useRef } from "react";
import { UserCog, Upload, FileText } from "lucide-react";

// Section 4: request a name/surname change (marriage, divorce, legal
// change, other) with supporting documentation. Nothing here changes
// the official name directly — this only creates a Pending request;
// only an admin approving it (see the review API route) ever updates
// people.first_name/last_name.
export function NameChangeRequestForm({ hasPendingRequest }: { hasPendingRequest: boolean }) {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [reason, setReason] = useState<"Marriage" | "Divorce" | "Legal Change of Name" | "Other">("Marriage");
  const [reasonNotes, setReasonNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (hasPendingRequest) {
    return (
      <div className="bg-white rounded-card border border-council-navy/10 p-6">
        <h2 className="font-display text-base text-council-navy flex items-center gap-2 mb-1">
          <UserCog size={16} className="text-council-cyan" aria-hidden="true" /> Name Change Request
        </h2>
        <p className="font-body text-sm text-status-pending">You have a name change request awaiting Council review.</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/portal/name-change", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestedFirstName: firstName, requestedLastName: lastName, reason, reasonNotes }),
    });
    const data = await res.json();
    if (!data.ok) {
      setBusy(false);
      setMessage(data.reason ?? "Could not submit the request.");
      return;
    }
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      await fetch(`/api/portal/name-change/${data.id}/document`, { method: "POST", body: formData });
    }
    setBusy(false);
    setMessage("Request submitted — awaiting Council review.");
    setOpen(false);
    setFirstName("");
    setLastName("");
    setReasonNotes("");
    setFile(null);
  }

  return (
    <div className="bg-white rounded-card border border-council-navy/10 p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base text-council-navy flex items-center gap-2">
          <UserCog size={16} className="text-council-cyan" aria-hidden="true" /> Name Change Request
        </h2>
        <button onClick={() => setOpen(!open)} className="text-xs text-council-cyan underline">
          {open ? "Cancel" : "Request Name Change"}
        </button>
      </div>
      {open && (
        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="font-body text-sm text-council-ink/70 block mb-1">New First Name</span>
              <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full border border-council-navy/20 rounded-card px-3 py-2 font-body text-sm" />
            </label>
            <label className="block">
              <span className="font-body text-sm text-council-ink/70 block mb-1">New Last Name</span>
              <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full border border-council-navy/20 rounded-card px-3 py-2 font-body text-sm" />
            </label>
          </div>
          <label className="block">
            <span className="font-body text-sm text-council-ink/70 block mb-1">Reason for Change</span>
            <select value={reason} onChange={(e) => setReason(e.target.value as typeof reason)} className="w-full border border-council-navy/20 rounded-card px-3 py-2 font-body text-sm">
              <option value="Marriage">Marriage</option>
              <option value="Divorce">Divorce</option>
              <option value="Legal Change of Name">Legal Change of Name</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <label className="block">
            <span className="font-body text-sm text-council-ink/70 block mb-1">Additional Notes (optional)</span>
            <textarea value={reasonNotes} onChange={(e) => setReasonNotes(e.target.value)} rows={2} className="w-full border border-council-navy/20 rounded-card px-3 py-2 font-body text-sm" />
          </label>
          <div>
            <span className="font-body text-sm text-council-ink/70 block mb-1">Supporting Document</span>
            <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 text-xs border border-dashed border-council-navy/20 rounded-card px-3 py-2 hover:border-council-cyan">
              {file ? <FileText size={12} aria-hidden="true" /> : <Upload size={12} aria-hidden="true" />}
              {file ? file.name : "Upload marriage certificate, legal document, etc."}
            </button>
          </div>
          <p className="font-body text-xs text-council-ink/40">
            Your official name won't change until the Council reviews and approves this request.
          </p>
          <button type="submit" disabled={busy} className="bg-council-navy text-white font-body text-sm font-medium rounded-card px-4 py-2 disabled:opacity-60">
            {busy ? "Submitting…" : "Submit Request"}
          </button>
        </form>
      )}
      {message && <p className="font-body text-xs text-council-ink/60 mt-2">{message}</p>}
    </div>
  );
}
