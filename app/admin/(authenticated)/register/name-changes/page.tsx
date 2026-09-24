import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { NameChangeRow } from "./NameChangeRow";

export default async function NameChangesPage() {
  await requireAdmin(["register"]);
  const supabase = await createClient();

  const { data: requests } = await supabase
    .from("name_change_requests")
    .select("id, previous_first_name, previous_last_name, requested_first_name, requested_last_name, reason, reason_notes, document_path, submitted_at, people:person_id(nurse_reg_no, midwife_reg_no)")
    .eq("status", "Pending")
    .order("submitted_at", { ascending: true });

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="font-display text-xl text-council-navy">Name Change Requests</h1>
        <p className="font-body text-sm text-council-ink/60 mt-1">
          The official name only changes once a request is approved here — nothing updates automatically.
        </p>
      </div>
      <div className="space-y-3">
        {(requests ?? []).map((r: any) => {
          const p = Array.isArray(r.people) ? r.people[0] : r.people;
          return (
            <NameChangeRow
              key={r.id}
              requestId={r.id}
              regNo={p?.nurse_reg_no || p?.midwife_reg_no || "—"}
              previousName={`${r.previous_first_name} ${r.previous_last_name}`}
              requestedName={`${r.requested_first_name} ${r.requested_last_name}`}
              reason={r.reason}
              reasonNotes={r.reason_notes}
              hasDocument={!!r.document_path}
            />
          );
        })}
        {(!requests || requests.length === 0) && (
          <div className="bg-white rounded-card border border-council-navy/10 p-8 text-center">
            <p className="font-body text-sm text-council-ink/50">No name change requests pending.</p>
          </div>
        )}
      </div>
    </div>
  );
}
