"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { FileText, Upload, Check, X } from "lucide-react";

export interface LicenseDocSummary { id: string; status: "Pending" | "Approved" | "Rejected"; original_filename: string | null; }

export function LicenseDocumentCell({ personId, licenseType, document }: { personId: string; licenseType: "Nurse" | "Midwife"; document: LicenseDocSummary | null }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("licenseType", licenseType);
    const res = await fetch(`/api/admin/people/${personId}/license-document`, { method: "POST", body: formData });
    const data = await res.json();
    setBusy(false);
    if (!data.ok) { setError(data.reason ?? "Upload failed."); return; }
    router.refresh();
  }

  async function handleView() {
    if (!document) return;
    const res = await fetch(`/api/admin/license-documents/${document.id}/view-url`);
    const data = await res.json();
    if (data.ok) window.open(data.url, "_blank", "noopener,noreferrer");
  }

  async function handleReview(status: "Approved" | "Rejected") {
    if (!document) return;
    setBusy(true);
    await fetch(`/api/admin/license-documents/${document.id}/review`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setBusy(false);
    router.refresh();
  }

  if (!document) {
    return (
      <div>
        <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleUpload} className="hidden" />
        <button onClick={() => fileInputRef.current?.click()} disabled={busy} className="flex items-center gap-1 text-xs text-council-ink/50 border border-dashed border-council-navy/20 rounded-card px-2 py-1 hover:border-council-cyan disabled:opacity-60">
          <Upload size={12} aria-hidden="true" /> {busy ? "Uploading…" : `Upload ${licenseType}`}
        </button>
        {error && <p className="text-xs text-status-closed mt-1">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button onClick={handleView} className="flex items-center gap-1 text-xs text-council-navy underline"><FileText size={12} aria-hidden="true" /> View</button>
      {document.status === "Pending" ? (
        <>
          <button onClick={() => handleReview("Approved")} disabled={busy} className="text-status-active" title="Approve"><Check size={14} aria-hidden="true" /></button>
          <button onClick={() => handleReview("Rejected")} disabled={busy} className="text-status-closed" title="Reject"><X size={14} aria-hidden="true" /></button>
        </>
      ) : (
        <span className={`text-xs font-medium ${document.status === "Approved" ? "text-status-active" : "text-status-closed"}`}>{document.status}</span>
      )}
    </div>
  );
}
