import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PendingApprovalRow } from "./PendingApprovalRow";
import Link from "next/link";

const NEW_WINDOW_DAYS = 7;

export default async function PendingApprovalPage({ searchParams }: { searchParams: { filter?: string } }) {
  await requireAdmin(["register"]);
  const supabase = createClient();

  const { data: allPending } = await supabase
    .from("people")
    .select("id, first_name, last_name, nurse_reg_no, midwife_reg_no, updated_at")
    .eq("profile_status", "Pending Review")
    .order("updated_at", { ascending: false })
    .limit(200);

  const cutoff = Date.now() - NEW_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const filter = searchParams.filter === "new" || searchParams.filter === "old" ? searchParams.filter : "all";

  const pending = (allPending ?? []).filter((p) => {
    if (filter === "all") return true;
    const isNew = new Date(p.updated_at).getTime() >= cutoff;
    return filter === "new" ? isNew : !isNew;
  });

  const newCount = (allPending ?? []).filter((p) => new Date(p.updated_at).getTime() >= cutoff).length;
  const oldCount = (allPending ?? []).length - newCount;

  const personIds = pending.map((p) => p.id);
  const { data: auditEntries } = personIds.length
    ? await supabase.from("audit_log").select("target_id, details, created_at")
        .eq("action", "self_service_profile_update").in("target_id", personIds).order("created_at", { ascending: false })
    : { data: [] };

  const latestChanges = new Map<string, { changes: Record<string, { from: unknown; to: unknown }>; reason?: string; at: string }>();
  for (const entry of auditEntries ?? []) {
    if (!latestChanges.has(entry.target_id)) latestChanges.set(entry.target_id, { changes: entry.details?.changes ?? {}, reason: entry.details?.reason, at: entry.created_at });
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h1 className="font-display text-xl text-council-navy">Pending Approval</h1>
        <p className="font-body text-sm text-council-ink/60 mt-1">Self-service changes awaiting review — the specific fields each person changed are shown below their name.</p>
      </div>

      <div className="flex gap-2">
        <FilterTab href="/admin/register/pending" active={filter === "all"} label={`All (${(allPending ?? []).length})`} />
        <FilterTab href="/admin/register/pending?filter=new" active={filter === "new"} label={`New — last ${NEW_WINDOW_DAYS} days (${newCount})`} />
        <FilterTab href="/admin/register/pending?filter=old" active={filter === "old"} label={`Older (${oldCount})`} />
      </div>

      <div className="space-y-3">
        {pending.map((person) => (
          <PendingApprovalRow key={person.id} person={person} change={latestChanges.get(person.id)} />
        ))}
        {pending.length === 0 && (
          <div className="bg-white rounded-card border border-council-navy/10 p-8 text-center">
            <p className="font-body text-sm text-council-ink/50">
              {filter === "all" ? "Nothing pending review right now." : `No ${filter === "new" ? "new" : "older"} pending items.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterTab({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`font-body text-sm rounded-card px-3 py-1.5 transition-colors ${
        active ? "bg-council-navy text-white" : "bg-white border border-council-navy/10 text-council-ink/60 hover:text-council-navy"
      }`}
    >
      {label}
    </Link>
  );
}
