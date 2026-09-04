import { EmptyState } from "@/lib/components/EmptyState";
import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PersonActions } from "./PersonActions";

export default async function PersonDetailPage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const supabase = createClient();

  const { data: person } = await supabase
    .from("people")
    .select(
      "id, first_name, last_name, sex, date_of_birth, address_line1, address_line2, address_line3, phone_home, phone_mobile, nurse_reg_no, midwife_reg_no, professional_category, training_institute, employer, place_of_work, employment_sector, service_category, nurse_license_no, nurse_license_expiry, midwife_license_no, midwife_license_expiry, registration_status, is_active, profile_status, data_source"
    )
    .eq("id", params.id)
    .single();

  if (!person) {
    return <EmptyState message="Record not found." backHref="/admin/register" backLabel="← Back to register" />;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl text-council-navy">
          {person.first_name} {person.last_name}
        </h1>
        <p className="font-body text-sm text-council-ink/50">
          {person.nurse_reg_no && `Nurse Reg. ${person.nurse_reg_no}`}
          {person.nurse_reg_no && person.midwife_reg_no && " · "}
          {person.midwife_reg_no && `Midwife Reg. ${person.midwife_reg_no}`}
        </p>
      </div>

      <div className="bg-white rounded-card border border-council-navy/10 p-6">
        <PersonActions personId={person.id} profileStatus={person.profile_status} />
      </div>

      <div className="bg-white rounded-card border border-council-navy/10 p-6">
        <h2 className="font-display text-base text-council-navy mb-4">Profile</h2>
        <dl className="grid grid-cols-2 gap-y-3 font-body text-sm">
          <Field label="Registration Status" value={person.registration_status} />
          <Field label="Profile Status" value={person.profile_status} />
          <Field label="Category" value={person.professional_category} />
          <Field label="Sex" value={person.sex} />
          <Field label="Employer" value={person.employer} />
          <Field label="Place of Work" value={person.place_of_work} />
          <Field label="Employment Sector" value={person.employment_sector} />
          <Field label="Service Category" value={person.service_category} />
          <Field label="Training Institute" value={person.training_institute} />
          <Field label="Address" value={[person.address_line1, person.address_line2, person.address_line3].filter(Boolean).join(", ")} />
          <Field label="Mobile" value={person.phone_mobile} />
          <Field label="Home Phone" value={person.phone_home} />
          <Field label="Nurse Licence" value={person.nurse_license_no} />
          <Field label="Nurse Licence Expiry" value={person.nurse_license_expiry} />
          <Field label="Midwife Licence" value={person.midwife_license_no} />
          <Field label="Midwife Licence Expiry" value={person.midwife_license_expiry} />
          <Field label="Source" value={person.data_source} />
        </dl>
      </div>
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
