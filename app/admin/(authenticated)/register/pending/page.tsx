import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PendingApprovalRow } from "./PendingApprovalRow";

export default async function PendingApprovalPage() {
  await requireAdmin(["register"]);
  const supabase = createClient();

  const { data: pending } = await supabase
    .from("people")
    .select("id, first_name, last_name, nurse_reg_no, midwife_reg_no")
    .eq("profile_status", "Pending Review")
    .order("last_name")
    .limit(200);

  const personIds = (pending ?? []).map((p) => p.id);
  const { data: auditEntries } = personIds.length
    ? await supabase.from("audit_log").select("target_id, details, created_at")
        .eq("action", "self_service_profile_update").in("target_id", personIds).order("created_at", { ascending: false })
    : { data: [] };

  const latestChanges = new Map<string, { changes: Record<string, { from: unknown; to: unknown }>; at: string }>();
  for (const entry of auditEntries ?? []) {
    if (!latestChanges.has(entry.target_id)) latestChanges.set(entry.target_id, { changes: entry.details?.changes ?? {}, at: entry.created_at });
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h1 className="font-display text-xl text-council-navy">Pending Approval</h1>
        <p className="font-body text-sm text-council-ink/60 mt-1">Self-service changes awaiting review — the specific fields each person changed are shown below their name.</p>
      </div>
      <div className="space-y-3">
        {(pending ?? []).map((person) => (
          <PendingApprovalRow key={person.id} person={person} change={latestChanges.get(person.id)} />
        ))}
        {(!pending || pending.length === 0) && (
          <div className="bg-white rounded-card border border-council-navy/10 p-8 text-center">
            <p className="font-body text-sm text-council-ink/50">Nothing pending review right now.</p>
          </div>
        )}
      </div>
    </div>
  );
}
