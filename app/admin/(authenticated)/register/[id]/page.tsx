import { EmptyState } from "@/lib/components/EmptyState";
import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PersonActions } from "./PersonActions";
import { RecordManagementSection } from "./RecordManagementSection";
import { categoryDisplay } from "@/lib/licenses";
import { LicenceDetailsSection } from "./LicenceDetailsSection";
import { HistorySection } from "./HistorySection";

// Reorganized per Section 7: Profile Summary, Personal Details,
// Professional Details, and a unified Licence Details table (Nurse,
// Midwife, and every Special Licence as rows in ONE table, not a
// separate isolated section) — rather than one long flat field list.
export default async function PersonDetailPage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const supabase = createClient();

  const { data: person } = await supabase
    .from("people")
    .select(
      "id, first_name, last_name, sex, date_of_birth, address_line1, address_line2, address_line3, phone_home, phone_mobile, nurse_reg_no, midwife_reg_no, professional_category, training_institute, employer, place_of_work, employment_sector, service_category, nurse_license_no, nurse_license_expiry, midwife_license_no, midwife_license_expiry, registration_status, is_active, is_deceased, profile_status, data_source"
    )
    .eq("id", params.id)
    .single();

  if (!person) {
    return <EmptyState message="Record not found." backHref="/admin/register" backLabel="← Back to register" />;
  }

  const { data: specialLicenses } = await supabase
    .from("special_licenses")
    .select("id, license_name, license_number, issued_date, expiry_date, status, source, document_path")
    .eq("person_id", params.id)
    .order("created_at", { ascending: false });

  const { data: licenseDocs } = await supabase
    .from("license_documents")
    .select("id, license_type, status")
    .eq("person_id", params.id)
    .order("created_at", { ascending: false });

  const nurseDoc = (licenseDocs ?? []).find((d) => d.license_type === "Nurse") ?? null;
  const midwifeDoc = (licenseDocs ?? []).find((d) => d.license_type === "Midwife") ?? null;

  const { data: renewalHistory } = await supabase
    .from("license_renewals")
    .select("id, license_type, previous_expiry_date, requested_expiry_date, status, submitted_at, reviewed_at, review_comment")
    .eq("person_id", params.id)
    .order("submitted_at", { ascending: false });

  const { data: history } = await supabase
    .from("audit_log")
    .select("id, action, details, created_at")
    .or(`actor_id.eq.${params.id},target_id.eq.${params.id}`)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="max-w-3xl space-y-6">
      {/* Profile Summary */}
      <div>
        <h1 className="font-display text-2xl text-council-navy">
          {person.first_name} {person.last_name}
        </h1>
        <p className="font-body text-sm text-council-ink/50">
          {person.nurse_reg_no && `Nurse Reg. ${person.nurse_reg_no}`}
          {person.nurse_reg_no && person.midwife_reg_no && " · "}
          {person.midwife_reg_no && `Midwife Reg. ${person.midwife_reg_no}`}
          {" · "}{categoryDisplay(person.professional_category)}
          {" · "}{person.registration_status}
        </p>
      </div>

      <div className="bg-white rounded-card border border-council-navy/10 p-6">
        <PersonActions personId={person.id} profileStatus={person.profile_status} />
      </div>

      {/* Personal Details */}
      <div className="bg-white rounded-card border border-council-navy/10 p-6">
        <h2 className="font-display text-base text-council-navy mb-4">Personal Details</h2>
        <dl className="grid grid-cols-2 gap-y-3 font-body text-sm">
          <Field label="Sex" value={person.sex} />
          <Field label="Date of Birth" value={person.date_of_birth} />
          <Field label="Address" value={[person.address_line1, person.address_line2, person.address_line3].filter(Boolean).join(", ")} />
          <Field label="Mobile" value={person.phone_mobile} />
          <Field label="Home Phone" value={person.phone_home} />
        </dl>
      </div>

      {/* Professional Details */}
      <div className="bg-white rounded-card border border-council-navy/10 p-6">
        <h2 className="font-display text-base text-council-navy mb-4">Professional Details</h2>
        <dl className="grid grid-cols-2 gap-y-3 font-body text-sm">
          <Field label="Training Institute" value={person.training_institute} />
          <Field label="Employer" value={person.employer} />
          <Field label="Place of Work" value={person.place_of_work} />
          <Field label="Employment Sector" value={person.employment_sector} />
          <Field label="Service Category" value={person.service_category} />
          <Field label="Profile Status" value={person.profile_status} />
          <Field label="Data Source" value={person.data_source} />
        </dl>
      </div>

      {/* Licence Details — Nurse, Midwife, and Special Licences unified */}
      <LicenceDetailsSection
        personId={person.id}
        nurseLicenseNo={person.nurse_license_no}
        nurseLicenseExpiry={person.nurse_license_expiry}
        nurseDoc={nurseDoc}
        midwifeLicenseNo={person.midwife_license_no}
        midwifeLicenseExpiry={person.midwife_license_expiry}
        midwifeDoc={midwifeDoc}
        specialLicenses={specialLicenses ?? []}
      />

      {renewalHistory && renewalHistory.length > 0 && (
        <div className="bg-white rounded-card border border-council-navy/10 p-6">
          <h2 className="font-display text-base text-council-navy mb-4">Renewal History</h2>
          <ul className="space-y-2">
            {renewalHistory.map((r) => (
              <li key={r.id} className="font-body text-sm border-l-2 border-council-navy/10 pl-3">
                <p>
                  {r.license_type}: {r.previous_expiry_date ?? "—"} → {r.requested_expiry_date}{" "}
                  <span className={r.status === "Approved" ? "text-status-active" : r.status === "Rejected" ? "text-status-closed" : "text-status-pending"}>
                    ({r.status})
                  </span>
                </p>
                <p className="text-xs text-council-ink/40">
                  Submitted {new Date(r.submitted_at).toLocaleDateString()}
                  {r.reviewed_at && ` · Reviewed ${new Date(r.reviewed_at).toLocaleDateString()}`}
                  {r.review_comment && ` · "${r.review_comment}"`}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <HistorySection entries={history ?? []} />

      <RecordManagementSection personId={person.id} isDeceased={person.is_deceased} />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <>
      <dt className="text-council-ink/50">{label}</dt>
      <dd>{value || "—"}</dd>
    </>
  );
}
