"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// "Deleted" and "Unknown" excluded here specifically — a BRAND NEW
// person being added right now should never start out flagged as one of
// those; both remain legitimate values elsewhere in the system (they're
// not purged from the database or hidden from search/filter, since
// existing legacy records genuinely need to stay findable) but neither
// makes sense as a starting choice for someone just being entered.
const STATUS_OPTIONS = ["Practising", "Not Practising", "Retired", "Abroad", "Deceased"];

export function NewPersonForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    first_name: "", last_name: "", sex: "F",
    nin: "", email: "",
    nurse_reg_no: "", midwife_reg_no: "",
    professional_category: "Nurse", registration_status: "Practising", is_deceased: false,
    employer: "", place_of_work: "", phone_mobile: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    if (!data.ok) {
      setError(data.reason ?? "Could not create the record.");
      return;
    }
    router.push(`/admin/register/${data.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-card border border-council-navy/10 p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="First Name" required value={form.first_name} onChange={(v) => update("first_name", v)} />
        <Field label="Last Name" required value={form.last_name} onChange={(v) => update("last_name", v)} />
      </div>
      <Field label="N.I.N" required value={form.nin} onChange={(v) => update("nin", v)} placeholder="e.g. 123456-7-8901" />
      <p className="font-body text-xs text-council-ink/40 -mt-2">Enter the N.I.N exactly as issued, including the hyphen.</p>
      <Field label="Email Address" value={form.email} onChange={(v) => update("email", v)} placeholder="name@example.com" />
      <label className="block">
        <span className="font-body text-sm text-council-ink/70 block mb-1">Sex</span>
        <select value={form.sex} onChange={(e) => update("sex", e.target.value)} className="w-full border border-council-navy/20 rounded-card px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-council-cyan">
          <option value="F">Female</option><option value="M">Male</option>
        </select>
      </label>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Nurse Reg. No." value={form.nurse_reg_no} onChange={(v) => update("nurse_reg_no", v)} placeholder="e.g. 1234/24" />
        <Field label="Midwife Reg. No." value={form.midwife_reg_no} onChange={(v) => update("midwife_reg_no", v)} placeholder="e.g. MW123" />
      </div>
      <p className="font-body text-xs text-council-ink/40 -mt-2">At least one registration number is required.</p>
      <label className="block">
        <span className="font-body text-sm text-council-ink/70 block mb-1">Professional Category</span>
        <select value={form.professional_category} onChange={(e) => update("professional_category", e.target.value)} className="w-full border border-council-navy/20 rounded-card px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-council-cyan">
          <option value="Nurse">Nurse</option><option value="Midwife">Midwife</option><option value="Both">Nurse / Midwife</option>
        </select>
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="font-body text-sm text-council-ink/70 block mb-1">Registration Status</span>
          <select value={form.registration_status} onChange={(e) => update("registration_status", e.target.value)} className="w-full border border-council-navy/20 rounded-card px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-council-cyan">
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 mt-7">
          <input type="checkbox" checked={form.is_deceased} onChange={(e) => update("is_deceased", e.target.checked)} className="accent-status-closed w-4 h-4" />
          <span className="font-body text-sm text-council-ink/70">Deceased</span>
        </label>
      </div>
      <p className="font-body text-xs text-council-ink/40 -mt-2">
        Kept separate on purpose — Registration Status describes employment/practice state; Deceased is the only
        thing that actually blocks nomination or voting.
      </p>
      <Field label="Employer" value={form.employer} onChange={(v) => update("employer", v)} />
      <Field label="Place of Work" value={form.place_of_work} onChange={(v) => update("place_of_work", v)} />
      <Field label="Mobile Number" value={form.phone_mobile} onChange={(v) => update("phone_mobile", v)} />
      {error && <p className="font-body text-sm text-status-closed">{error}</p>}
      <button type="submit" disabled={busy} className="bg-council-navy text-white font-body font-medium rounded-card px-5 py-2.5 hover:bg-council-navyDeep transition-colors disabled:opacity-60">
        {busy ? "Creating…" : "Add to Register"}
      </button>
    </form>
  );
}

function Field({ label, value, onChange, required, placeholder }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string }) {
  return (
    <label className="block">
      <span className="font-body text-sm text-council-ink/70 block mb-1">{label} {required && <span className="text-status-closed">*</span>}</span>
      <input type="text" required={required} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="w-full border border-council-navy/20 rounded-card px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-council-cyan" />
    </label>
  );
}
