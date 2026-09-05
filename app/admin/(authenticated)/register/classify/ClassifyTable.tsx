"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LicenseDocumentCell, type LicenseDocSummary } from "./LicenseDocumentCell";

interface Row {
  id: string;
  first_name: string;
  last_name: string;
  nurse_reg_no: string | null;
  midwife_reg_no: string | null;
  professional_category: string | null;
}

// The actual bulk-confirmation workflow: tick everyone you know to be
// Nurses, set the category, confirm — repeat for Midwives and for anyone
// registered as Both. Existing nurse_reg_no/midwife_reg_no and the current
// professional_category guess are shown as a starting hint, but nothing is
// trusted until explicitly confirmed here (see migration 0004).
export function ClassifyTable({ people, documents }: { people: Row[]; documents: Map<string, { nurse?: LicenseDocSummary; midwife?: LicenseDocSummary }> }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === people.length ? new Set() : new Set(people.map((p) => p.id))));
  }

  async function confirmAs(category: "Nurse" | "Midwife" | "Both") {
    if (selected.size === 0) return;
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/admin/people/bulk-classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected), category }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.ok) {
      setMessage(`Confirmed ${data.updated} record(s) as ${category}.`);
      setSelected(new Set());
      router.refresh();
    } else {
      setMessage(data.reason ?? "Could not confirm selected records.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-card border border-council-navy/10 p-4">
        <span className="font-body text-sm text-council-ink/60">{selected.size} selected</span>
        <button
          onClick={() => confirmAs("Nurse")}
          disabled={busy || selected.size === 0}
          className="bg-council-navy text-white font-body text-sm font-medium rounded-card px-4 py-2 disabled:opacity-40"
        >
          Confirm as Nurse
        </button>
        <button
          onClick={() => confirmAs("Midwife")}
          disabled={busy || selected.size === 0}
          className="bg-council-navy text-white font-body text-sm font-medium rounded-card px-4 py-2 disabled:opacity-40"
        >
          Confirm as Midwife
        </button>
        <button
          onClick={() => confirmAs("Both")}
          disabled={busy || selected.size === 0}
          className="bg-council-navy text-white font-body text-sm font-medium rounded-card px-4 py-2 disabled:opacity-40"
        >
          Confirm as Both
        </button>
        {message && <span className="font-body text-sm text-council-ink/60">{message}</span>}
      </div>

      <div className="bg-white rounded-card border border-council-navy/10 overflow-hidden">
        <table className="w-full font-body text-sm">
          <thead className="bg-council-cream text-council-ink/60 text-left">
            <tr>
              <th className="px-4 py-3 w-10">
                <input type="checkbox" checked={selected.size === people.length && people.length > 0} onChange={toggleAll} className="accent-council-navy" />
              </th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Nurse Reg. No.</th>
              <th className="px-4 py-3">Midwife Reg. No.</th>
              <th className="px-4 py-3">Current guess</th>
              <th className="px-4 py-3">License Document</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-council-navy/10">
            {people.map((p) => (
              <tr key={p.id} className={selected.has(p.id) ? "bg-council-cream" : ""}>
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} className="accent-council-navy" />
                </td>
                <td className="px-4 py-3">
                  {p.first_name} {p.last_name}
                </td>
                <td className="px-4 py-3 text-council-ink/70">{p.nurse_reg_no || "—"}</td>
                <td className="px-4 py-3 text-council-ink/70">{p.midwife_reg_no || "—"}</td>
                <td className="px-4 py-3 text-council-ink/50">{p.professional_category ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="space-y-1.5">
                    <LicenseDocumentCell personId={p.id} licenseType="Nurse" document={documents.get(p.id)?.nurse ?? null} />
                    <LicenseDocumentCell personId={p.id} licenseType="Midwife" document={documents.get(p.id)?.midwife ?? null} />
                  </div>
                </td>
              </tr>
            ))}
            {people.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-council-ink/50">
                  Nothing left to confirm — every record has a confirmed category.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
