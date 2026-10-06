"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Award, FileText, Upload } from "lucide-react";

export interface SpecialLicenseSummary { id: string; license_name: string; has_document: boolean; }

// "Upload Special Licence" for the License Approval table: names the
// licence (e.g. Critical Care), creates the special_licenses record through
// the existing admin endpoint, then attaches the chosen file through the
// existing document endpoint. Existing special licences are listed with a
// link to view their document, and can have a missing document uploaded.
export function SpecialLicenseUploadCell({ personId, licenses }: { personId: string; licenses: SpecialLicenseSummary[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadDoc(licenseId: string, file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/admin/special-licenses/${licenseId}/document`, { method: "POST", body: formData });
    const data = await res.json().catch(() => ({ ok: false }));
    return data.ok ? null : data.reason ?? "Upload failed.";
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!name.trim()) { setError("Enter the licence name first."); return; }
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/people/${personId}/special-licenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenseName: name.trim() }),
    });
    const data = await res.json().catch(() => ({ ok: false }));
    if (!data.ok || !data.id) { setBusy(false); setError(data.reason ?? "Could not add the special licence."); return; }
    const uploadError = await uploadDoc(data.id, file);
    setBusy(false);
    if (uploadError) { setError(`Licence added, but the file failed: ${uploadError}`); router.refresh(); return; }
    setName("");
    setOpen(false);
    router.refresh();
  }

  async function view(id: string) {
    const res = await fetch(`/api/admin/special-licenses/${id}/view-url`);
    const data = await res.json();
    if (data.ok) window.open(data.url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-1">
      {licenses.map((l) => (
        <div key={l.id} className="flex items-center gap-1.5 text-xs text-council-ink/70">
          <Award size={12} className="text-council-cyan shrink-0" aria-hidden="true" />
          <span>{l.license_name}</span>
          {l.has_document && (
            <button onClick={() => view(l.id)} className="text-council-cyan" title="View document">
              <FileText size={12} aria-hidden="true" />
            </button>
          )}
        </div>
      ))}
      {open ? (
        <div className="space-y-1">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Licence name (e.g. Critical Care)"
            className="w-full border border-council-navy/20 rounded-card px-2 py-1 text-xs"
          />
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={handleFile} />
          <div className="flex items-center gap-2">
            <button onClick={() => fileRef.current?.click()} disabled={busy} className="flex items-center gap-1 text-xs text-council-cyan underline disabled:opacity-60">
              <Upload size={12} aria-hidden="true" /> {busy ? "Uploading…" : "Choose file & upload"}
            </button>
            <button onClick={() => { setOpen(false); setError(null); }} className="text-xs text-council-ink/40">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="flex items-center gap-1 text-xs text-council-cyan underline">
          <Upload size={12} aria-hidden="true" /> Upload Special Licence
        </button>
      )}
      {error && <p className="text-xs text-status-closed">{error}</p>}
    </div>
  );
}
