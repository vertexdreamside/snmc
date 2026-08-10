"use client";

import { useState } from "react";
import type { Person } from "@/lib/types/database";

export function ProfileForm({ person }: { person: Omit<Person, "nin" | "notes"> }) {
  const [form, setForm] = useState({
    address_line1: person.address_line1 ?? "",
    address_line2: person.address_line2 ?? "",
    address_line3: person.address_line3 ?? "",
    phone_home: person.phone_home ?? "",
    phone_mobile: person.phone_mobile ?? "",
    employer: person.employer ?? "",
    place_of_work: person.place_of_work ?? "",
    employment_sector: person.employment_sector ?? "Government",
    training_institute: person.training_institute ?? "",
  });
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setError(null);
    const res = await fetch("/api/portal/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!data.ok) {
      setError(data.reason ?? "Could not save your changes.");
      setStatus("error");
      return;
    }
    setStatus("done");
  }

  if (status === "done") {
    return (
      <div className="bg-white rounded-card border border-status-active/30 p-6">
        <p className="font-body text-sm text-status-active">
          Your changes have been submitted and are pending Council review.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-card border border-council-navy/10 p-6 space-y-4">
      <Field label="Address Line 1" required value={form.address_line1} onChange={(v) => update("address_line1", v)} />
      <Field label="Address Line 2" value={form.address_line2} onChange={(v) => update("address_line2", v)} />
      <Field label="Address Line 3" value={form.address_line3} onChange={(v) => update("address_line3", v)} />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Mobile Number" required value={form.phone_mobile} onChange={(v) => update("phone_mobile", v)} />
        <Field label="Home Number" value={form.phone_home} onChange={(v) => update("phone_home", v)} />
      </div>
      <Field label="Employer" required value={form.employer} onChange={(v) => update("employer", v)} />
      <Field label="Place of Work" required value={form.place_of_work} onChange={(v) => update("place_of_work", v)} />
      <label className="block">
        <span className="font-body text-sm text-council-ink/70 block mb-1">
          Employment Sector <span className="text-status-closed">*</span>
        </span>
        <select
          value={form.employment_sector}
          onChange={(e) => update("employment_sector", e.target.value as "Government" | "Private")}
          className="w-full border border-council-navy/20 rounded-card px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-council-gold"
        >
          <option value="Government">Government</option>
          <option value="Private">Private</option>
        </select>
      </label>
      <Field label="Training Institute" value={form.training_institute} onChange={(v) => update("training_institute", v)} />

      {error && <p className="font-body text-sm text-status-closed">{error}</p>}

      <button
        type="submit"
        disabled={status === "saving"}
        className="bg-council-navy text-white font-body font-medium rounded-card px-5 py-2.5 hover:bg-council-navyDeep transition-colors disabled:opacity-60"
      >
        {status === "saving" ? "Saving…" : "Save Changes"}
      </button>
      <p className="font-body text-xs text-council-ink/50">
        Changes are reviewed by the Council before they take effect on your active profile.
      </p>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="font-body text-sm text-council-ink/70 block mb-1">
        {label} {required && <span className="text-status-closed">*</span>}
      </span>
      <input
        type="text"
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-council-navy/20 rounded-card px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-council-gold"
      />
    </label>
  );
}
