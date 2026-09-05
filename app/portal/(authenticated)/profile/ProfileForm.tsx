"use client";

import { useState } from "react";
import type { Person } from "@/lib/types/database";

export function ProfileForm({ person }: { person: Omit<Person, "nin" | "notes"> }) {
  const [form, setForm] = useState({
    first_name: person.first_name ?? "",
    last_name: person.last_name ?? "",
    sex: person.sex ?? "Unknown",
    date_of_birth: person.date_of_birth ?? "",
    nin: "", // write-only — never pre-filled or shown back, see API comment
    address_line1: person.address_line1 ?? "",
    address_line2: person.address_line2 ?? "",
    address_line3: person.address_line3 ?? "",
    phone_home: person.phone_home ?? "",
    phone_mobile: person.phone_mobile ?? "",
    employer: person.employer ?? "",
    place_of_work: person.place_of_work ?? "",
    employment_sector: person.employment_sector ?? "Government",
    service_category: person.service_category ?? "Unspecified",
    training_institute: person.training_institute ?? "",
    nurse_license_no: person.nurse_license_no ?? "",
    nurse_license_expiry: person.nurse_license_expiry ?? "",
    midwife_license_no: person.midwife_license_no ?? "",
    midwife_license_expiry: person.midwife_license_expiry ?? "",
    reasonForChange: "",
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="bg-white rounded-card border border-council-navy/10 p-6 space-y-4">
        <h2 className="font-display text-base text-council-navy">Personal Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="First Name" required value={form.first_name} onChange={(v) => update("first_name", v)} />
          <Field label="Last Name" required value={form.last_name} onChange={(v) => update("last_name", v)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="font-body text-sm text-council-ink/70 block mb-1">Sex</span>
            <select
              value={form.sex}
              onChange={(e) => update("sex", e.target.value as "M" | "F" | "Unknown")}
              className="w-full border border-council-navy/20 rounded-card px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-council-cyan"
            >
              <option value="F">Female</option>
              <option value="M">Male</option>
              <option value="Unknown">Prefer not to say</option>
            </select>
          </label>
          <Field label="Date of Birth" type="date" value={form.date_of_birth} onChange={(v) => update("date_of_birth", v)} />
        </div>
        <Field
          label="National ID Number (NIN)"
          value={form.nin}
          onChange={(v) => update("nin", v)}
          placeholder={person.registration_status ? "Enter to set or update — leave blank to keep unchanged" : undefined}
        />
        <p className="font-body text-xs text-council-ink/40 -mt-2">
          Your current NIN isn't shown here for privacy. Leave this blank to keep it as-is, or enter a value to set
          or correct it.
        </p>
      </section>

      <section className="bg-white rounded-card border border-council-navy/10 p-6 space-y-4">
        <h2 className="font-display text-base text-council-navy">Contact &amp; Address</h2>
        <Field label="Address Line 1" required value={form.address_line1} onChange={(v) => update("address_line1", v)} />
        <Field label="Address Line 2" value={form.address_line2} onChange={(v) => update("address_line2", v)} />
        <Field label="Address Line 3" value={form.address_line3} onChange={(v) => update("address_line3", v)} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Mobile Number" required value={form.phone_mobile} onChange={(v) => update("phone_mobile", v)} />
          <Field label="Home Number" value={form.phone_home} onChange={(v) => update("phone_home", v)} />
        </div>
      </section>

      <section className="bg-white rounded-card border border-council-navy/10 p-6 space-y-4">
        <h2 className="font-display text-base text-council-navy">Employment</h2>
        <Field label="Employer" required value={form.employer} onChange={(v) => update("employer", v)} />
        <Field label="Place of Work" required value={form.place_of_work} onChange={(v) => update("place_of_work", v)} />
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="font-body text-sm text-council-ink/70 block mb-1">Employment Sector</span>
            <select
              value={form.employment_sector}
              onChange={(e) => update("employment_sector", e.target.value as "Government" | "Private")}
              className="w-full border border-council-navy/20 rounded-card px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-council-cyan"
            >
              <option value="Government">Government</option>
              <option value="Private">Private</option>
            </select>
          </label>
          <label className="block">
            <span className="font-body text-sm text-council-ink/70 block mb-1">Service Category</span>
            <select
              value={form.service_category}
              onChange={(e) => update("service_category", e.target.value as "Hospital" | "Community" | "Private" | "Unspecified")}
              className="w-full border border-council-navy/20 rounded-card px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-council-cyan"
            >
              <option value="Hospital">Hospital</option>
              <option value="Community">Community</option>
              <option value="Private">Private</option>
              <option value="Unspecified">Unspecified</option>
            </select>
          </label>
        </div>
        <Field label="Training Institute" value={form.training_institute} onChange={(v) => update("training_institute", v)} />
      </section>

      <section className="bg-white rounded-card border border-council-navy/10 p-6 space-y-4">
        <h2 className="font-display text-base text-council-navy">Licence Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nurse Licence No." value={form.nurse_license_no} onChange={(v) => update("nurse_license_no", v)} />
          <Field label="Nurse Licence Expiry" type="date" value={form.nurse_license_expiry} onChange={(v) => update("nurse_license_expiry", v)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Midwife Licence No." value={form.midwife_license_no} onChange={(v) => update("midwife_license_no", v)} />
          <Field label="Midwife Licence Expiry" type="date" value={form.midwife_license_expiry} onChange={(v) => update("midwife_license_expiry", v)} />
        </div>
      </section>

      <section className="bg-white rounded-card border border-council-navy/10 p-6">
        <label className="block">
          <span className="font-body text-sm text-council-ink/70 block mb-1">Reason for change (optional)</span>
          <textarea
            value={form.reasonForChange}
            onChange={(e) => update("reasonForChange", e.target.value)}
            placeholder="e.g. Changed employer after transfer to Anse Royale Community Clinic"
            rows={2}
            className="w-full border border-council-navy/20 rounded-card px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-council-cyan"
          />
          <span className="font-body text-xs text-council-ink/40 mt-1 block">
            Helps whoever reviews this understand why you're making the change.
          </span>
        </label>
      </section>

      {error && <p className="font-body text-sm text-status-closed">{error}</p>}

      <button
        type="submit"
        disabled={status === "saving"}
        className="bg-council-navy text-white font-body font-medium rounded-card px-5 py-2.5 hover:bg-council-navyDeep transition-colors disabled:opacity-60"
      >
        {status === "saving" ? "Saving…" : "Save Changes"}
      </button>
      <p className="font-body text-xs text-council-ink/50">
        Changes are reviewed by the Council before they take effect on your active profile. Registration numbers
        cannot be changed here — contact the Council office for those.
      </p>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="font-body text-sm text-council-ink/70 block mb-1">
        {label} {required && <span className="text-status-closed">*</span>}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-council-navy/20 rounded-card px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-council-cyan"
      />
    </label>
  );
}
