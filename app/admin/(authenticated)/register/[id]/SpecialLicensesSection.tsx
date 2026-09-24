"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Award, Plus, X, Check, FileText, Upload } from "lucide-react";

interface SpecialLicense {
  id: string;
  license_name: string;
  license_number: string | null;
  issued_date: string | null;
  expiry_date: string | null;
  status: "Pending" | "Approved" | "Rejected";
  source: "self" | "admin";
  document_path: string | null;
}

// Additional specialised licences/certifications a person may hold
// beyond their base Nurse/Midwife registration — e.g. Critical Care,
// Anaesthetic, Public Health. A person can hold several, hence its own
// section and its own table rather than more columns on people.
//
// Section 13.7/13.8: a self-submitted special licence goes through the
// same approval workflow as any other profile change — it enters as
// Pending and stays there until reviewed here, never applied
// immediately the way an admin adding one directly is.
export function SpecialLicensesSection({ personId, licenses }: { personId: string; licenses: SpecialLicense[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [form, setForm] = useState({ licenseName: "", licenseNumber: "", issuedDate: "", expiryDate: "" });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setBusy("add");
    await fetch(`/api/admin/people/${personId}/special-licenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(null);
    setForm({ licenseName: "", licenseNumber: "", issuedDate: "", expiryDate: "" });
    setShowForm(false);
    router.refresh();
  }

  async function handleRemove(id: string) {
    if (!confirm("Remove this special licence?")) return;
    await fetch(`/api/admin/special-licenses/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function handleReview(id: string, status: "Approved" | "Rejected") {
    setBusy(id);
    await fetch(`/api/admin/special-licenses/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(null);
    router.refresh();
  }

  async function handleUploadDocument(id: string, file: File) {
    setBusy(id);
    const formData = new FormData();
    formData.append("file", file);
    await fetch(`/api/admin/special-licenses/${id}/document`, { method: "POST", body: formData });
    setBusy(null);
    router.refresh();
  }

  async function handleViewDocument(id: string) {
    const res = await fetch(`/api/admin/special-licenses/${id}/view-url`);
    const data = await res.json();
    if (data.ok) window.open(data.url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="bg-white rounded-card border border-council-navy/10 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-base text-council-navy flex items-center gap-2">
          <Award size={16} className="text-council-cyan" aria-hidden="true" /> Special Licences
        </h2>
        <button onClick={() => setShowForm(!showForm)} className="text-xs text-council-cyan underline flex items-center gap-1">
          <Plus size={12} aria-hidden="true" /> Add
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-council-cream rounded-card p-3 mb-4 grid grid-cols-2 gap-2">
          <input
            type="text"
            required
            placeholder="Licence name (e.g. Critical Care)"
            value={form.licenseName}
            onChange={(e) => setForm({ ...form, licenseName: e.target.value })}
            className="col-span-2 border border-council-navy/20 rounded-card px-2 py-1.5 text-sm"
          />
          <input
            type="text"
            placeholder="Licence number (optional)"
            value={form.licenseNumber}
            onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
            className="border border-council-navy/20 rounded-card px-2 py-1.5 text-sm"
          />
          <div />
          <label className="text-xs text-council-ink/60">
            Issued
            <input type="date" value={form.issuedDate} onChange={(e) => setForm({ ...form, issuedDate: e.target.value })} className="w-full border border-council-navy/20 rounded-card px-2 py-1.5 text-sm mt-0.5" />
          </label>
          <label className="text-xs text-council-ink/60">
            Expiry
            <input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} className="w-full border border-council-navy/20 rounded-card px-2 py-1.5 text-sm mt-0.5" />
          </label>
          <button type="submit" disabled={busy === "add"} className="col-span-2 bg-council-navy text-white text-xs font-medium rounded-card py-1.5 disabled:opacity-60">
            {busy === "add" ? "Adding…" : "Add Licence"}
          </button>
        </form>
      )}

      {licenses.length === 0 ? (
        <p className="font-body text-sm text-council-ink/40">No special licences on file.</p>
      ) : (
        <ul className="space-y-2">
          {licenses.map((l) => (
            <li key={l.id} className="bg-council-cream rounded-card px-3 py-2 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-council-navy">
                    {l.license_name}
                    {l.status === "Pending" && <span className="ml-2 text-xs text-status-pending font-medium">Pending Approval{l.source === "self" ? " — submitted by nurse/midwife" : ""}</span>}
                    {l.status === "Rejected" && <span className="ml-2 text-xs text-status-closed font-medium">Rejected</span>}
                  </p>
                  <p className="text-xs text-council-ink/50">
                    {l.license_number && `${l.license_number} · `}
                    {l.issued_date && `Issued ${l.issued_date}`}
                    {l.expiry_date && ` · Expires ${l.expiry_date}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <SpecialLicenseDocCell licenseId={l.id} hasDocument={!!l.document_path} onUpload={handleUploadDocument} onView={handleViewDocument} busy={busy === l.id} />
                  {l.status === "Pending" && (
                    <>
                      <button onClick={() => handleReview(l.id, "Approved")} disabled={busy === l.id} className="text-status-active" title="Approve"><Check size={16} aria-hidden="true" /></button>
                      <button onClick={() => handleReview(l.id, "Rejected")} disabled={busy === l.id} className="text-status-closed" title="Reject"><X size={16} aria-hidden="true" /></button>
                    </>
                  )}
                  <button onClick={() => handleRemove(l.id)} className="text-council-ink/40" title="Remove">
                    <X size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SpecialLicenseDocCell({
  licenseId,
  hasDocument,
  onUpload,
  onView,
  busy,
}: {
  licenseId: string;
  hasDocument: boolean;
  onUpload: (id: string, file: File) => void;
  onView: (id: string) => void;
  busy: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (hasDocument) {
    return (
      <button onClick={() => onView(licenseId)} className="flex items-center gap-1 text-xs text-council-cyan underline" title="View document">
        <FileText size={14} aria-hidden="true" />
      </button>
    );
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(licenseId, file);
        }}
      />
      <button onClick={() => fileInputRef.current?.click()} disabled={busy} className="text-council-ink/40 disabled:opacity-60" title="Upload document">
        <Upload size={14} aria-hidden="true" />
      </button>
    </>
  );
}
