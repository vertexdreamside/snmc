import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { LicenseExpiryClient } from "./LicenseExpiryClient";
import { fetchAllRows } from "@/lib/supabase/paginate";

// Redesigned around clickable Summary Cards per the confirmed UX
// requirements: "immediately tell the administrator which licences need
// attention" without configuring filters. Special Licences are now
// included in this monitoring — a real, explicitly-flagged gap before
// this (special licences had their own expiry field, but never showed
// up anywhere in Licence Expiry itself).
export default async function LicenseExpiryPage() {
  await requireAdmin(["register"]);
  const supabase = await createClient();

  // Both queries were unbounded `.select(...)` with no `.limit()` —
  // Supabase/PostgREST silently caps returned rows at its own server-side
  // maximum (1,000) regardless of what the app asks for, so once the
  // number of people with a licence expiry on file passed 1,000 this
  // page's Expired/Active/etc. summary cards were being computed from an
  // incomplete, silently-truncated list. fetchAllRows pages through with
  // .range() so these always reflect every matching record.
  const people = await fetchAllRows<{ id: string; first_name: string; last_name: string; nurse_reg_no: string | null; midwife_reg_no: string | null; professional_category: string | null; nurse_license_expiry: string | null; midwife_license_expiry: string | null }>(() =>
    supabase
      .from("people")
      .select("id, first_name, last_name, nurse_reg_no, midwife_reg_no, professional_category, nurse_license_expiry, midwife_license_expiry")
      .or("nurse_license_expiry.not.is.null,midwife_license_expiry.not.is.null") as any
  );

  type SpecialLicensePerson = { first_name: string; last_name: string; nurse_reg_no: string | null; midwife_reg_no: string | null; professional_category: string | null };
  const specialLicenses = await fetchAllRows<{ id: string; license_name: string; expiry_date: string; status: string; people: SpecialLicensePerson | SpecialLicensePerson[] | null }>(() =>
    supabase
      .from("special_licenses")
      .select("id, license_name, expiry_date, status, people:person_id(id, first_name, last_name, nurse_reg_no, midwife_reg_no, professional_category)")
      .eq("status", "Approved")
      .not("expiry_date", "is", null) as any
  );

  // Flatten into one list of { name, regNo, category, licenseType, expiryDate }
  // rows — this is what the summary cards actually count and the list
  // view actually displays, regardless of which underlying table a
  // given licence came from.
  const rows: { id: string; name: string; regNo: string; category: string; licenseType: string; expiryDate: string }[] = [];

  for (const p of people ?? []) {
    if (p.nurse_license_expiry) {
      rows.push({ id: `${p.id}-nurse`, name: `${p.first_name} ${p.last_name}`, regNo: p.nurse_reg_no ?? "—", category: p.professional_category ?? "—", licenseType: "Nurse Licence", expiryDate: p.nurse_license_expiry });
    }
    if (p.midwife_license_expiry) {
      rows.push({ id: `${p.id}-midwife`, name: `${p.first_name} ${p.last_name}`, regNo: p.midwife_reg_no ?? "—", category: p.professional_category ?? "—", licenseType: "Midwife Licence", expiryDate: p.midwife_license_expiry });
    }
  }
  for (const s of specialLicenses ?? []) {
    const p = Array.isArray(s.people) ? s.people[0] : s.people;
    if (!p || !s.expiry_date) continue;
    rows.push({ id: `special-${s.id}`, name: `${p.first_name} ${p.last_name}`, regNo: p.nurse_reg_no || p.midwife_reg_no || "—", category: p.professional_category ?? "—", licenseType: `Special Licence (${s.license_name})`, expiryDate: s.expiry_date });
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-4">
        <h1 className="font-display text-xl text-council-navy">Licence Expiry</h1>
        <p className="font-body text-sm text-council-ink/60 mt-1">Monitor licences that have expired or are approaching expiry.</p>
      </div>
      <LicenseExpiryClient rows={rows} />
    </div>
  );
}
