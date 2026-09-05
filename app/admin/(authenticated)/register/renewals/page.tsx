import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { RenewalRow } from "./RenewalRow";

export default async function LicenseRenewalsPage() {
  await requireAdmin(["register"]);
  const supabase = createClient();

  const { data: renewals } = await supabase
    .from("license_renewals")
    .select("id, license_type, previous_expiry_date, requested_expiry_date, submitted_at, supporting_document_id, status, people:person_id(id, first_name, last_name, nurse_reg_no, midwife_reg_no)")
    .in("status", ["Pending", "Under Review"])
    .order("submitted_at", { ascending: true });

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="font-display text-xl text-council-navy">Licence Renewals</h1>
        <p className="font-body text-sm text-council-ink/60 mt-1">
          Renewal requests awaiting review. Approving one updates the person's official licence expiry date;
          nothing changes on rejection.
        </p>
      </div>
      <div className="space-y-3">
        {(renewals ?? []).map((r: any) => (
          <RenewalRow
            key={r.id}
            renewalId={r.id}
            personName={`${r.people?.first_name ?? ""} ${r.people?.last_name ?? ""}`}
            regNo={r.people?.nurse_reg_no || r.people?.midwife_reg_no || "—"}
            licenseType={r.license_type}
            previousExpiry={r.previous_expiry_date}
            requestedExpiry={r.requested_expiry_date}
            documentId={r.supporting_document_id}
            status={r.status}
          />
        ))}
        {(!renewals || renewals.length === 0) && (
          <div className="bg-white rounded-card border border-council-navy/10 p-8 text-center">
            <p className="font-body text-sm text-council-ink/50">No renewal requests pending.</p>
          </div>
        )}
      </div>
    </div>
  );
}
