"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Award, Plus, X } from "lucide-react";

interface SpecialLicense {
  id: string;
  license_name: string;
  license_number: string | null;
  issued_date: string | null;
  expiry_date: string | null;
}

// Additional specialised licences/certifications a person may hold
// beyond their base Nurse/Midwife registration — e.g. Critical Care,
// Anaesthetic, Public Health. A person can hold several, hence its own
// section and its own table rather than more columns on people.
export function SpecialLicensesSection({ personId, licenses }: { personId: string; licenses: SpecialLicense[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ licenseName: "", licenseNumber: "", issuedDate: "", expiryDate: "" });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await fetch(`/api/admin/people/${personId}/special-licenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);
    setForm({ licenseName: "", licenseNumber: "", issuedDate: "", expiryDate: "" });
    setShowForm(false);
    router.refresh();
  }

  async function handleRemove(id: string) {
    if (!confirm("Remove this special licence?")) return;
    await fetch(`/api/admin/special-licenses/${id}`, { method: "DELETE" });
    router.refresh();
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
          <button type="submit" disabled={busy} className="col-span-2 bg-council-navy text-white text-xs font-medium rounded-card py-1.5 disabled:opacity-60">
            {busy ? "Adding…" : "Add Licence"}
          </button>
        </form>
      )}

      {licenses.length === 0 ? (
        <p className="font-body text-sm text-council-ink/40">No special licences on file.</p>
      ) : (
        <ul className="space-y-2">
          {licenses.map((l) => (
            <li key={l.id} className="flex items-center justify-between bg-council-cream rounded-card px-3 py-2 text-sm">
              <div>
                <p className="font-medium text-council-navy">{l.license_name}</p>
                <p className="text-xs text-council-ink/50">
                  {l.license_number && `${l.license_number} · `}
                  {l.issued_date && `Issued ${l.issued_date}`}
                  {l.expiry_date && ` · Expires ${l.expiry_date}`}
                </p>
              </div>
              <button onClick={() => handleRemove(l.id)} className="text-status-closed">
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
