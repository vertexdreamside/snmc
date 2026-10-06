"use client";

// One place to see every file this person has uploaded — licence
// documents, renewal supporting documents, name-change documents and
// special-licence documents. Each opens through a short-lived signed
// link generated on click, so nothing is ever publicly addressable.

import { useState } from "react";
import { FileText, ExternalLink } from "lucide-react";

export type PersonDocument = {
  key: string;
  label: string;
  detail: string;
  uploadedAt: string | null;
  status: string | null;
  viewEndpoint: string;
};

export function DocumentsSection({ documents }: { documents: PersonDocument[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function open(doc: PersonDocument) {
    setBusy(doc.key);
    setError(null);
    try {
      const res = await fetch(doc.viewEndpoint);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok || !data.url) {
        setError(data.reason ?? "Could not open that document.");
      } else {
        window.open(data.url, "_blank", "noopener,noreferrer");
      }
    } catch {
      setError("Could not open that document.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="bg-white rounded-card border border-council-navy/10 p-6">
      <h2 className="font-display text-base text-council-navy mb-1">Documents</h2>
      <p className="font-body text-xs text-council-ink/50 mb-4">Everything this person (or an administrator) has uploaded to their record.</p>
      {documents.length === 0 ? (
        <p className="font-body text-sm text-council-ink/50">No documents have been uploaded.</p>
      ) : (
        <ul className="divide-y divide-council-navy/10">
          {documents.map((d) => (
            <li key={d.key} className="flex items-center gap-3 py-3">
              <FileText size={18} strokeWidth={1.75} className="text-council-cyan shrink-0" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm text-council-navy">{d.label}</p>
                <p className="font-body text-xs text-council-ink/50 truncate">
                  {d.detail}
                  {d.status ? ` · ${d.status}` : ""}
                  {d.uploadedAt ? ` · ${d.uploadedAt}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => open(d)}
                disabled={busy === d.key}
                className="inline-flex items-center gap-1 font-body text-xs text-council-cyan underline disabled:opacity-50"
              >
                {busy === d.key ? "Opening…" : "View"} <ExternalLink size={12} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="font-body text-xs text-status-closed mt-3">{error}</p>}
    </div>
  );
}
