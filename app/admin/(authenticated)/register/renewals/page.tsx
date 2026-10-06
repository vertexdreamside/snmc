import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { RenewalRow } from "./RenewalRow";

export default async function LicenseRenewalsPage() {
  await requireAdmin(["register"]);
  const supabase = await createClient();

  const { data: renewals } = await supabase
    .from("license_renewals")
    .select("id, license_type, previous_expiry_date, requested_expiry_date, submitted_at, supporting_document_id, status, people:person_id(id, first_name, last_name, nurse_reg_no, midwife_reg_no)")
    .in("status", ["Pending", "Under Review"])
    .order("submitted_at", { ascending: true });

  // If a renewal came in without its own supporting document, fall back to
  // the licence document already on file for that person and licence type,
  // so the reviewer still has something to look at.
  const personIds = Array.from(new Set((renewals ?? []).map((r: any) => (Array.isArray(r.people) ? r.people[0]?.id : r.people?.id)).filter(Boolean)));
  const { data: onFileDocs } = personIds.length
    ? await supabase
        .from("license_documents")
        .select("id, person_id, license_type, created_at")
        .in("person_id", personIds)
        .order("created_at", { ascending: false })
    : { data: [] as { id: string; person_id: string; license_type: string; created_at: string }[] };
  const onFile = new Map<string, string>();
  for (const d of onFileDocs ?? []) {
    const key = `${d.person_id}:${d.license_type}`;
    if (!onFile.has(key)) onFile.set(key, d.id);
  }

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
        {(renewals ?? []).map((r: any) => {
          // Guard against Supabase's embedded join coming back as an
          // array — see the fix in the portal vote page for why.
          const p = Array.isArray(r.people) ? r.people[0] : r.people;
          return (
            <RenewalRow
              key={r.id}
              renewalId={r.id}
              personName={`${p?.first_name ?? ""} ${p?.last_name ?? ""}`}
              regNo={p?.nurse_reg_no || p?.midwife_reg_no || "—"}
              licenseType={r.license_type}
              previousExpiry={r.previous_expiry_date}
              requestedExpiry={r.requested_expiry_date}
              documentId={r.supporting_document_id}
              onFileDocumentId={onFile.get(`${p?.id}:${r.license_type}`) ?? null}
              status={r.status}
              submittedAt={r.submitted_at}
            />
          );
        })}
        {(!renewals || renewals.length === 0) && (
          <div className="bg-white rounded-card border border-council-navy/10 p-8 text-center">
            <p className="font-body text-sm text-council-ink/50">No renewal requests pending.</p>
          </div>
        )}
      </div>
    </div>
  );
}
