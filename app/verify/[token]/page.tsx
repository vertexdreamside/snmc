// Public licence verification page — no login required (Section 8).
// Deliberately shows only the fields listed in the spec: registration
// number, category, licence status, expiry. Nothing else about the person.

import { createServiceRoleClient } from "@/lib/supabase/server";

async function lookupByToken(token: string) {
  const supabase = createServiceRoleClient();
  const { data: qr } = await supabase
    .from("licence_qr_tokens")
    .select("person_id, revoked")
    .eq("token", token)
    .maybeSingle();

  if (!qr || qr.revoked) return null;

  const { data: person } = await supabase
    .from("people")
    .select(
      "nurse_reg_no, midwife_reg_no, professional_category, registration_status, nurse_license_expiry, midwife_license_expiry"
    )
    .eq("id", qr.person_id)
    .maybeSingle();

  return person;
}

function licenceIsActive(expiry: string | null): boolean {
  if (!expiry) return false;
  return new Date(expiry) >= new Date();
}

export default async function VerifyPage({ params }: { params: { token: string } }) {
  const person = await lookupByToken(params.token);

  if (!person) {
    return (
      <main className="min-h-screen bg-council-cream flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-card shadow-sm p-8 text-center">
          <h1 className="font-display text-2xl text-council-navy mb-2">Licence not found</h1>
          <p className="font-body text-council-ink/70">
            This QR code could not be verified. If you believe this is an error, contact the SNMC office.
          </p>
        </div>
      </main>
    );
  }

  const active =
    person.registration_status === "Practising" &&
    (licenceIsActive(person.nurse_license_expiry) || licenceIsActive(person.midwife_license_expiry));

  return (
    <main className="min-h-screen bg-council-cream flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-card shadow-sm p-8">
        <div
          className={`inline-block px-3 py-1 rounded-full text-sm font-body font-medium mb-4 ${
            active ? "bg-status-active/10 text-status-active" : "bg-status-closed/10 text-status-closed"
          }`}
        >
          {active ? "Licence Active" : "Not Currently Active"}
        </div>
        <h1 className="font-display text-2xl text-council-navy mb-4">Licence Verification</h1>
        <dl className="space-y-3 font-body text-council-ink">
          <div className="flex justify-between border-b border-council-navy/10 pb-2">
            <dt className="text-council-ink/60">Category</dt>
            <dd className="font-medium">{person.professional_category ?? "—"}</dd>
          </div>
          {person.nurse_reg_no && (
            <div className="flex justify-between border-b border-council-navy/10 pb-2">
              <dt className="text-council-ink/60">Nurse Reg. No.</dt>
              <dd className="font-medium">{person.nurse_reg_no}</dd>
            </div>
          )}
          {person.midwife_reg_no && (
            <div className="flex justify-between border-b border-council-navy/10 pb-2">
              <dt className="text-council-ink/60">Midwife Reg. No.</dt>
              <dd className="font-medium">{person.midwife_reg_no}</dd>
            </div>
          )}
          {person.nurse_license_expiry && (
            <div className="flex justify-between">
              <dt className="text-council-ink/60">Nurse Licence Expiry</dt>
              <dd className="font-medium">{person.nurse_license_expiry}</dd>
            </div>
          )}
          {person.midwife_license_expiry && (
            <div className="flex justify-between">
              <dt className="text-council-ink/60">Midwife Licence Expiry</dt>
              <dd className="font-medium">{person.midwife_license_expiry}</dd>
            </div>
          )}
        </dl>
      </div>
    </main>
  );
}
