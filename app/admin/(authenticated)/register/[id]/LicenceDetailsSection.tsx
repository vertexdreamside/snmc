"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { FileText, Upload, Check, X, Plus } from "lucide-react";

// Section 7: Nurse Licence, Midwife Licence, and every Special Licence
// shown as rows in ONE unified table — "Special Licence should appear
// as a row within the licence/profile area, rather than being presented
// as a completely separate page or isolated section." Nurse/Midwife
// document upload reuses the existing license_documents infrastructure
// (previously only surfaced on the License Approval/Classify page, never
// here); Special Licence rows keep their full add/approve/reject/upload
// workflow, just rendered inline instead of in their own boxed section.

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

interface BaseLicenseDoc {
  id: string;
  status: "Pending" | "Approved" | "Rejected";
}

function computeStatus(expiryDate: string | null): string {
  if (!expiryDate) return "—";
  const days = Math.floor((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return "Expired";
  if (days <= 90) return "Expiring Soon";
  return "Active";
}

function statusColor(status: string): string {
  if (status === "Expired" || status === "Rejected") return "text-status-closed";
  if (status === "Expiring Soon" || status === "Pending") return "text-status-pending";
  if (status === "Active" || status === "Approved") return "text-status-active";
  return "text-council-ink/40";
}

export function LicenceDetailsSection({
  personId,
  nurseLicenseNo,
  nurseLicenseExpiry,
  nurseDoc,
  midwifeLicenseNo,
  midwifeLicenseExpiry,
  midwifeDoc,
  specialLicenses,
}: {
  personId: string;
  nurseLicenseNo: string | null;
  nurseLicenseExpiry: string | null;
  nurseDoc: BaseLicenseDoc | null;
  midwifeLicenseNo: string | null;
  midwifeLicenseExpiry: string | null;
  midwifeDoc: BaseLicenseDoc | null;
  specialLicenses: SpecialLicense[];
}) {
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

  async function handleUploadSpecialDoc(id: string, file: File) {
    setBusy(id);
    const formData = new FormData();
    formData.append("file", file);
    await fetch(`/api/admin/special-licenses/${id}/document`, { method: "POST", body: formData });
    setBusy(null);
    router.refresh();
  }

  async function handleViewSpecialDoc(id: string) {
    const res = await fetch(`/api/admin/special-licenses/${id}/view-url`);
    const data = await res.json();
    if (data.ok) window.open(data.url, "_blank", "noopener,noreferrer");
  }

  async function handleViewBaseDoc(docId: string) {
    const res = await fetch(`/api/admin/license-documents/${docId}/view-url`);
    const data = await res.json();
    if (data.ok) window.open(data.url, "_blank", "noopener,noreferrer");
  }

  const hasNurse = !!nurseLicenseNo;
  const hasMidwife = !!midwifeLicenseNo;

  return (
    <div className="bg-white rounded-card border border-council-navy/10 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-base text-council-navy">Licence Details</h2>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 text-xs text-council-cyan underline">
          <Plus size={12} aria-hidden="true" /> Add Special Licence
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-council-cream rounded-card p-3 mb-4 grid grid-cols-2 gap-2">
          <input type="text" required placeholder="Licence name (e.g. Critical Care)" value={form.licenseName} onChange={(e) => setForm({ ...form, licenseName: e.target.value })} className="col-span-2 border border-council-navy/20 rounded-card px-2 py-1.5 text-sm" />
          <input type="text" placeholder="Licence number (optional)" value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} className="border border-council-navy/20 rounded-card px-2 py-1.5 text-sm" />
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

      <table className="w-full font-body text-sm">
        <thead className="bg-council-cream text-council-ink/60 text-left">
          <tr>
            <th className="px-3 py-2">Licence Type</th>
            <th className="px-3 py-2">Licence Number</th>
            <th className="px-3 py-2">Expiry Date</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Document</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-council-navy/10">
          {hasNurse && (
            <tr>
              <td className="px-3 py-2">Nurse Licence</td>
              <td className="px-3 py-2 text-council-ink/60">{nurseLicenseNo}</td>
              <td className="px-3 py-2 text-council-ink/60">{nurseLicenseExpiry ?? "—"}</td>
              <td className={`px-3 py-2 font-medium ${statusColor(computeStatus(nurseLicenseExpiry))}`}>{computeStatus(nurseLicenseExpiry)}</td>
              <td className="px-3 py-2">
                {nurseDoc ? (
                  <button onClick={() => handleViewBaseDoc(nurseDoc.id)} className="text-council-cyan underline flex items-center gap-1"><FileText size={12} aria-hidden="true" /> View</button>
                ) : (
                  <span className="text-council-ink/30">None</span>
                )}
              </td>
              <td className="px-3 py-2"></td>
            </tr>
          )}
          {hasMidwife && (
            <tr>
              <td className="px-3 py-2">Midwife Licence</td>
              <td className="px-3 py-2 text-council-ink/60">{midwifeLicenseNo}</td>
              <td className="px-3 py-2 text-council-ink/60">{midwifeLicenseExpiry ?? "—"}</td>
              <td className={`px-3 py-2 font-medium ${statusColor(computeStatus(midwifeLicenseExpiry))}`}>{computeStatus(midwifeLicenseExpiry)}</td>
              <td className="px-3 py-2">
                {midwifeDoc ? (
                  <button onClick={() => handleViewBaseDoc(midwifeDoc.id)} className="text-council-cyan underline flex items-center gap-1"><FileText size={12} aria-hidden="true" /> View</button>
                ) : (
                  <span className="text-council-ink/30">None</span>
                )}
              </td>
              <td className="px-3 py-2"></td>
            </tr>
          )}
          {specialLicenses.map((l) => (
            <tr key={l.id}>
              <td className="px-3 py-2">
                Special Licence <span className="text-council-ink/50">({l.license_name})</span>
                {l.source === "self" && <span className="ml-1 text-xs text-council-ink/40">— self-submitted</span>}
              </td>
              <td className="px-3 py-2 text-council-ink/60">{l.license_number ?? "—"}</td>
              <td className="px-3 py-2 text-council-ink/60">{l.expiry_date ?? "—"}</td>
              <td className={`px-3 py-2 font-medium ${statusColor(l.status === "Approved" ? computeStatus(l.expiry_date) : l.status)}`}>
                {l.status === "Approved" ? computeStatus(l.expiry_date) : l.status}
              </td>
              <td className="px-3 py-2">
                <SpecialDocCell licenseId={l.id} hasDocument={!!l.document_path} onUpload={handleUploadSpecialDoc} onView={handleViewSpecialDoc} busy={busy === l.id} />
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  {l.status === "Pending" && (
                    <>
                      <button onClick={() => handleReview(l.id, "Approved")} disabled={busy === l.id} className="text-status-active" title="Approve"><Check size={14} aria-hidden="true" /></button>
                      <button onClick={() => handleReview(l.id, "Rejected")} disabled={busy === l.id} className="text-status-closed" title="Reject"><X size={14} aria-hidden="true" /></button>
                    </>
                  )}
                  <button onClick={() => handleRemove(l.id)} className="text-council-ink/30" title="Remove"><X size={12} aria-hidden="true" /></button>
                </div>
              </td>
            </tr>
          ))}
          {!hasNurse && !hasMidwife && specialLicenses.length === 0 && (
            <tr>
              <td colSpan={6} className="px-3 py-6 text-center text-council-ink/40">No licences on file.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function SpecialDocCell({
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
      <button onClick={() => onView(licenseId)} className="text-council-cyan underline flex items-center gap-1">
        <FileText size={12} aria-hidden="true" /> View
      </button>
    );
  }

  return (
    <>
      <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(licenseId, f); }} />
      <button onClick={() => fileInputRef.current?.click()} disabled={busy} className="text-council-ink/40 flex items-center gap-1 disabled:opacity-60">
        <Upload size={12} aria-hidden="true" /> Upload
      </button>
    </>
  );
}
