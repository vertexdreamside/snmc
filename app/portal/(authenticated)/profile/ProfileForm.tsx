"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Person } from "@/lib/types/database";
import { CheckCircle2, ArrowLeft, ArrowRight, Plus } from "lucide-react";

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

function specialLicenseExpiryStatus(expiryDate: string | null): "Active" | "Expiring Soon" | "Expired" | null {
  if (!expiryDate) return null;
  const days = Math.floor((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return "Expired";
  if (days <= 90) return "Expiring Soon";
  return "Active";
}

const STEPS = ["Personal", "Contact", "Professional", "Licence", "Special Licences", "Review"] as const;

// Guided step-by-step wizard per the confirmed Nurse/Midwife portal UX
// requirements — "divide the profile into simple steps" rather than one
// long form, with a progress indicator, Back/Next navigation, a review
// step before submission, and a confirmation with a reference number
// afterward. Licence number and expiry are shown READ-ONLY here (not
// editable) — see the API route's comment for why: editing them here
// used to quietly bypass the dedicated Licence Renewal workflow.
export function ProfileForm({ person, specialLicenses, hasNinOnFile }: { person: Omit<Person, "nin" | "notes">; specialLicenses: SpecialLicense[]; hasNinOnFile: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
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
    reasonForChange: "",
  });
  const [initialForm] = useState(form);
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [showSpecialLicenseForm, setShowSpecialLicenseForm] = useState(false);
  const [specialLicenseForm, setSpecialLicenseForm] = useState({ licenseName: "", licenseNumber: "", issuedDate: "", expiryDate: "", notes: "" });
  const [specialLicenseBusy, setSpecialLicenseBusy] = useState(false);

  async function submitSpecialLicense(e: React.FormEvent) {
    e.preventDefault();
    setSpecialLicenseBusy(true);
    await fetch("/api/portal/special-licenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(specialLicenseForm),
    });
    setSpecialLicenseBusy(false);
    setSpecialLicenseForm({ licenseName: "", licenseNumber: "", issuedDate: "", expiryDate: "", notes: "" });
    setShowSpecialLicenseForm(false);
    router.refresh();
  }

  const hasUnsavedChanges = JSON.stringify(form) !== JSON.stringify(initialForm);

  // Warn on tab close / navigation away with unsaved changes — the
  // browser's own native prompt is the only mechanism available for
  // this (custom UI can't intercept a tab close), so the message text
  // itself is controlled by the browser, not this code.
  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (hasUnsavedChanges && status !== "done") {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges, status]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function canAdvance(): boolean {
    if (step === 0) return !!form.first_name && !!form.last_name && (hasNinOnFile || !!form.nin.trim());
    if (step === 1) return !!form.address_line1 && !!form.phone_mobile;
    if (step === 2) return !!form.employer && !!form.place_of_work;
    return true;
  }

  async function handleSubmit() {
    setStatus("saving");
    setError(null);
    const { reasonForChange, ...rest } = form;
    const res = await fetch("/api/portal/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...rest, reasonForChange }),
    });
    const data = await res.json();
    if (!data.ok) {
      setError(data.reason ?? "Could not save your changes.");
      setStatus("error");
      return;
    }
    setReference(data.reference ?? null);
    setStatus("done");
  }

  if (status === "done") {
    return (
      <div className="bg-white rounded-card border border-status-active/30 p-8 text-center space-y-3">
        <CheckCircle2 size={40} className="text-status-active mx-auto" aria-hidden="true" />
        <h2 className="font-display text-lg text-council-navy">Changes Submitted Successfully</h2>
        <p className="font-body text-sm text-council-ink/70">
          Your information has been submitted to the Council for review. You'll see the outcome on this page once
          it's been reviewed.
        </p>
        {reference && (
          <p className="font-body text-sm text-council-ink/60">
            Submission Reference: <span className="font-mono font-medium text-council-navy">{reference}</span>
          </p>
        )}
        <p className="font-body text-sm text-status-pending font-medium">Status: Pending Approval</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <div>
        <div className="flex items-center justify-between mb-1">
          {STEPS.map((label, i) => (
            <span key={label} className={`font-body text-xs ${i === step ? "text-council-navy font-medium" : "text-council-ink/40"} hidden sm:block`}>
              {label}
            </span>
          ))}
        </div>
        <div className="flex gap-1">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-council-cyan" : "bg-council-navy/10"}`} />
          ))}
        </div>
        <p className="font-body text-xs text-council-ink/50 mt-1">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
      </div>

      <div className="bg-white rounded-card border border-council-navy/10 p-6 space-y-4">
        {step === 0 && (
          <>
            <h2 className="font-display text-base text-council-navy">Personal Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="First Name" required value={form.first_name} onChange={(v) => update("first_name", v)} />
              <Field label="Last Name" required value={form.last_name} onChange={(v) => update("last_name", v)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="font-body text-sm text-council-ink/70 block mb-1">Sex</span>
                <select value={form.sex} onChange={(e) => update("sex", e.target.value as "M" | "F")} className="w-full border border-council-navy/20 rounded-card px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-council-cyan">
                  <option value="F">Female</option>
                  <option value="M">Male</option>
                </select>
              </label>
              <Field label="Date of Birth" type="date" value={form.date_of_birth} onChange={(v) => update("date_of_birth", v)} />
            </div>
            <Field
              label="National ID Number (NIN)"
              required={!hasNinOnFile}
              value={form.nin}
              onChange={(v) => update("nin", v)}
              placeholder={hasNinOnFile ? "Enter to update — leave blank to keep unchanged" : "e.g. 123456-7-8901"}
            />
            <p className="font-body text-xs text-council-ink/40 -mt-2">
              NIN is required. Please enter your National Identification Number exactly as shown on your official
              identification document, including the hyphen (-).
              {hasNinOnFile && " Your current NIN isn't shown here for privacy — leave this blank to keep it as-is."}
            </p>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="font-display text-base text-council-navy">Contact Details</h2>
            <Field label="Address Line 1" required value={form.address_line1} onChange={(v) => update("address_line1", v)} />
            <Field label="Address Line 2" value={form.address_line2} onChange={(v) => update("address_line2", v)} />
            <Field label="Address Line 3" value={form.address_line3} onChange={(v) => update("address_line3", v)} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Mobile Number" required type="tel" value={form.phone_mobile} onChange={(v) => update("phone_mobile", v)} />
              <Field label="Home Number" type="tel" value={form.phone_home} onChange={(v) => update("phone_home", v)} />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="font-display text-base text-council-navy">Professional Details</h2>
            <Field label="Employer" required value={form.employer} onChange={(v) => update("employer", v)} />
            <Field label="Place of Work" required value={form.place_of_work} onChange={(v) => update("place_of_work", v)} />
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="font-body text-sm text-council-ink/70 block mb-1">Employment Sector</span>
                <select value={form.employment_sector} onChange={(e) => update("employment_sector", e.target.value as "Government" | "Private")} className="w-full border border-council-navy/20 rounded-card px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-council-cyan">
                  <option value="Government">Government</option>
                  <option value="Private">Private</option>
                </select>
              </label>
              <label className="block">
                <span className="font-body text-sm text-council-ink/70 block mb-1">Service Category</span>
                <select value={form.service_category} onChange={(e) => update("service_category", e.target.value as "Hospital" | "Community" | "Private")} className="w-full border border-council-navy/20 rounded-card px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-council-cyan">
                  <option value="Hospital">Hospital</option>
                  <option value="Community">Community</option>
                  <option value="Private">Private</option>
                </select>
              </label>
            </div>
            <Field label="Training Institute" value={form.training_institute} onChange={(v) => update("training_institute", v)} />
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="font-display text-base text-council-navy">Licence</h2>
            <p className="font-body text-xs text-council-ink/50 mb-2">
              These come from the Council's records and can't be edited here. To renew an expiring licence, use
              "Request Renewal" below your details on the main profile page. For a correction to your licence
              number, contact the Council office directly.
            </p>
            <ReadOnlyField label="Nurse Licence No." value={person.nurse_license_no} />
            <ReadOnlyField label="Nurse Licence Expiry" value={person.nurse_license_expiry} />
            <ReadOnlyField label="Midwife Licence No." value={person.midwife_license_no} />
            <ReadOnlyField label="Midwife Licence Expiry" value={person.midwife_license_expiry} />
          </>
        )}

        {step === 4 && (
          <>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display text-base text-council-navy">Special Licences</h2>
              <button type="button" onClick={() => setShowSpecialLicenseForm(!showSpecialLicenseForm)} className="flex items-center gap-1 text-xs text-council-cyan underline">
                <Plus size={12} aria-hidden="true" /> Add Special Licence
              </button>
            </div>
            <p className="font-body text-xs text-council-ink/50 mb-2">
              Additional certifications beyond your base Nurse/Midwife registration. A new special licence you add
              here goes to the Council for review before it's added to your official record.
            </p>

            {showSpecialLicenseForm && (
              <form onSubmit={submitSpecialLicense} className="bg-council-cream rounded-card p-3 space-y-2">
                <input
                  type="text" required placeholder="Licence name (e.g. Critical Care)"
                  value={specialLicenseForm.licenseName}
                  onChange={(e) => setSpecialLicenseForm({ ...specialLicenseForm, licenseName: e.target.value })}
                  className="w-full border border-council-navy/20 rounded-card px-2 py-1.5 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text" placeholder="Licence number (if applicable)"
                    value={specialLicenseForm.licenseNumber}
                    onChange={(e) => setSpecialLicenseForm({ ...specialLicenseForm, licenseNumber: e.target.value })}
                    className="border border-council-navy/20 rounded-card px-2 py-1.5 text-sm"
                  />
                  <div />
                  <label className="text-xs text-council-ink/60">
                    Issue Date
                    <input type="date" value={specialLicenseForm.issuedDate} onChange={(e) => setSpecialLicenseForm({ ...specialLicenseForm, issuedDate: e.target.value })} className="w-full border border-council-navy/20 rounded-card px-2 py-1.5 text-sm mt-0.5" />
                  </label>
                  <label className="text-xs text-council-ink/60">
                    Expiry Date
                    <input type="date" value={specialLicenseForm.expiryDate} onChange={(e) => setSpecialLicenseForm({ ...specialLicenseForm, expiryDate: e.target.value })} className="w-full border border-council-navy/20 rounded-card px-2 py-1.5 text-sm mt-0.5" />
                  </label>
                </div>
                <textarea
                  placeholder="Notes (optional)"
                  value={specialLicenseForm.notes}
                  onChange={(e) => setSpecialLicenseForm({ ...specialLicenseForm, notes: e.target.value })}
                  rows={2}
                  className="w-full border border-council-navy/20 rounded-card px-2 py-1.5 text-sm"
                />
                <p className="font-body text-xs text-council-ink/40">
                  You can attach a supporting document after submitting, from the list below.
                </p>
                <button type="submit" disabled={specialLicenseBusy} className="bg-council-navy text-white text-xs font-medium rounded-card px-3 py-1.5 disabled:opacity-60">
                  {specialLicenseBusy ? "Submitting…" : "Submit for Council Review"}
                </button>
              </form>
            )}

            {specialLicenses.length === 0 ? (
              <p className="font-body text-sm text-council-ink/40 italic">None on file.</p>
            ) : (
              <ul className="space-y-2">
                {specialLicenses.map((l) => {
                  const expiryStatus = specialLicenseExpiryStatus(l.expiry_date);
                  return (
                    <li key={l.id} className="bg-council-cream rounded-card px-3 py-2">
                      <p className="font-body text-sm font-medium text-council-navy">
                        {l.license_name}
                        {l.status === "Pending" && <span className="ml-2 text-xs text-status-pending font-medium">Pending Approval</span>}
                        {l.status === "Rejected" && <span className="ml-2 text-xs text-status-closed font-medium">Rejected</span>}
                        {l.status === "Approved" && expiryStatus && (
                          <span className={`ml-2 text-xs font-medium ${expiryStatus === "Expired" ? "text-status-closed" : expiryStatus === "Expiring Soon" ? "text-status-pending" : "text-status-active"}`}>
                            {expiryStatus}
                          </span>
                        )}
                      </p>
                      <p className="font-body text-xs text-council-ink/50">
                        {l.license_number && `${l.license_number} · `}
                        {l.issued_date && `Issued ${l.issued_date}`}
                        {l.expiry_date && ` · Expires ${l.expiry_date}`}
                      </p>
                      <SpecialLicenseDocRow licenseId={l.id} hasDocument={!!l.document_path} />
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}

        {step === 5 && (
          <>
            <h2 className="font-display text-base text-council-navy">Please Check Your Information</h2>
            <ReviewSection title="Personal Details" onEdit={() => setStep(0)}>
              {form.first_name} {form.last_name} · {form.sex} {form.date_of_birth && `· ${form.date_of_birth}`}
            </ReviewSection>
            <ReviewSection title="Contact Details" onEdit={() => setStep(1)}>
              {form.address_line1} · {form.phone_mobile}
            </ReviewSection>
            <ReviewSection title="Professional Details" onEdit={() => setStep(2)}>
              {form.employer} · {form.place_of_work} · {form.employment_sector}
            </ReviewSection>
            <ReviewSection title="Licence Details" onEdit={() => setStep(3)}>
              Checked — not editable here
            </ReviewSection>
            <ReviewSection title="Special Licences" onEdit={() => setStep(4)}>
              {specialLicenses.length} on file
            </ReviewSection>
            <label className="block pt-2">
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
          </>
        )}

        {error && <p className="font-body text-sm text-status-closed">{error}</p>}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="flex items-center gap-1 border border-council-navy/20 font-body text-sm font-medium rounded-card px-4 py-2 disabled:opacity-40"
        >
          <ArrowLeft size={14} aria-hidden="true" /> Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            disabled={!canAdvance()}
            className="flex items-center gap-1 bg-council-navy text-white font-body text-sm font-medium rounded-card px-5 py-2.5 hover:bg-council-navyDeep transition-colors disabled:opacity-40"
          >
            Next <ArrowRight size={14} aria-hidden="true" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={status === "saving"}
            className="bg-council-navy text-white font-body font-medium rounded-card px-5 py-2.5 hover:bg-council-navyDeep transition-colors disabled:opacity-60"
          >
            {status === "saving" ? "Submitting…" : "Submit Changes for Council Review"}
          </button>
        )}
      </div>
      <p className="font-body text-xs text-council-ink/50">
        Changes are reviewed by the Council before they take effect on your active profile. Registration numbers
        cannot be changed here — contact the Council office for those.
      </p>
    </div>
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

function ReadOnlyField({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between bg-council-cream rounded-card px-3 py-2">
      <span className="font-body text-sm text-council-ink/60">{label}</span>
      <span className="font-body text-sm text-council-navy flex items-center gap-1.5">
        {value || "—"} <span className="text-xs text-council-ink/40">🔒</span>
      </span>
    </div>
  );
}

function ReviewSection({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-council-navy/10 pb-2">
      <div>
        <p className="font-body text-sm font-medium text-council-navy">{title}</p>
        <p className="font-body text-xs text-council-ink/60">{children}</p>
      </div>
      <button type="button" onClick={onEdit} className="font-body text-xs text-council-cyan underline shrink-0 ml-3">
        Edit
      </button>
    </div>
  );
}

function SpecialLicenseDocRow({ licenseId, hasDocument }: { licenseId: string; hasDocument: boolean }) {
  const [busy, setBusy] = useState(false);

  async function handleUpload(file: File) {
    setBusy(true);
    const formData = new FormData();
    formData.append("file", file);
    await fetch(`/api/portal/special-licenses/${licenseId}/document`, { method: "POST", body: formData });
    setBusy(false);
    window.location.reload();
  }

  async function handleView() {
    const res = await fetch(`/api/portal/special-licenses/${licenseId}/view-url`);
    const data = await res.json();
    if (data.ok) window.open(data.url, "_blank", "noopener,noreferrer");
  }

  if (hasDocument) {
    return (
      <button type="button" onClick={handleView} className="font-body text-xs text-council-cyan underline mt-1">
        View attached document
      </button>
    );
  }

  return (
    <label className="font-body text-xs text-council-cyan underline mt-1 cursor-pointer inline-block">
      {busy ? "Uploading…" : "Attach document"}
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        disabled={busy}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
      />
    </label>
  );
}
