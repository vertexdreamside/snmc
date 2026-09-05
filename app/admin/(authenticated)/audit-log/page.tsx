import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { ScrollText } from "lucide-react";
import { canManageRegister } from "@/lib/auth/permissions";
import { redactNinFromDetails } from "@/lib/licenses";

// The audit_log table has been written to since migration 0001, but
// until now there was no page anywhere to actually view it, despite
// being linked in the sidebar nav. Supports ?actor=<id> to show one
// person's activity — see the Admin Users page's "View activity" link.
const PAGE_SIZE = 50;

export default async function AuditLogPage({ searchParams }: { searchParams: { page?: string; actor?: string } }) {
  const admin = await requireAdmin(["users"]);
  const canSeeNin = canManageRegister(admin);
  const supabase = createClient();

  const currentPage = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("audit_log")
    .select("id, action, target_table, target_id, details, created_at, actor_id, ip_address", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (searchParams.actor) {
    query = query.eq("actor_id", searchParams.actor);
  }

  const { data: entries, count } = await query;

  const actorIds = Array.from(new Set((entries ?? []).map((e) => e.actor_id).filter(Boolean)));
  const [{ data: admins }, { data: people }] = await Promise.all([
    actorIds.length > 0
      ? supabase.from("admin_users").select("id, full_name").in("id", actorIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
    actorIds.length > 0
      ? supabase.from("people").select("id, first_name, last_name").in("id", actorIds)
      : Promise.resolve({ data: [] as { id: string; first_name: string; last_name: string }[] }),
  ]);
  const actorNames = new Map<string, string>();
  (admins ?? []).forEach((a) => actorNames.set(a.id, a.full_name ?? "Admin"));
  (people ?? []).forEach((p) => actorNames.set(p.id, `${p.first_name} ${p.last_name}`.trim()));

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const filteredActorName = searchParams.actor ? actorNames.get(searchParams.actor) : null;

  return (
    <div className="space-y-4 max-w-5xl">
      <div>
        <h1 className="font-display text-xl text-council-navy">Audit Log</h1>
        <p className="font-body text-sm text-council-ink/60 mt-1">
          {filteredActorName ? (
            <>
              Showing activity for <span className="font-medium text-council-navy">{filteredActorName}</span> only —{" "}
              <a href="/admin/audit-log" className="underline text-council-cyan">clear filter</a>
            </>
          ) : (
            "Every recorded admin and self-service action — election status changes, register edits, permission changes, and login attempts."
          )}
        </p>
      </div>

      <div className="bg-white rounded-card border border-council-navy/10 overflow-hidden">
        <table className="w-full font-body text-sm">
          <thead className="bg-council-cream text-council-ink/60 text-left">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">IP Address</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-council-navy/10">
            {entries?.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-3 text-council-ink/60 whitespace-nowrap">{new Date(e.created_at).toLocaleString()}</td>
                <td className="px-4 py-3">{e.actor_id ? actorNames.get(e.actor_id) ?? "—" : "—"}</td>
                <td className="px-4 py-3">
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-council-navy/10 text-council-ink/70">{e.action}</span>
                </td>
                <td className="px-4 py-3 text-council-ink/60">
                  {e.target_table}{e.target_id ? ` · ${e.target_id.slice(0, 8)}…` : ""}
                </td>
                <td className="px-4 py-3 text-council-ink/50 font-mono text-xs">{e.ip_address ?? "—"}</td>
                <td className="px-4 py-3 text-council-ink/50 text-xs max-w-xs truncate">{e.details ? JSON.stringify(redactNinFromDetails(e.details, canSeeNin)) : "—"}</td>
              </tr>
            ))}
            {(!entries || entries.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-council-ink/50">
                  <ScrollText size={22} className="mx-auto mb-2 text-council-ink/30" aria-hidden="true" />
                  No audit entries {filteredActorName ? "for this person" : "yet"}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="font-body text-xs text-council-ink/40">
          {totalCount === 0 ? "No entries." : `Showing ${from + 1}–${Math.min(to + 1, totalCount)} of ${totalCount.toLocaleString()}`}
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <PageLink page={currentPage - 1} disabled={currentPage <= 1} label="← Previous" actor={searchParams.actor} />
            <span className="font-body text-xs text-council-ink/50">Page {currentPage} of {totalPages}</span>
            <PageLink page={currentPage + 1} disabled={currentPage >= totalPages} label="Next →" actor={searchParams.actor} />
          </div>
        )}
      </div>
    </div>
  );
}

function PageLink({ page, disabled, label, actor }: { page: number; disabled: boolean; label: string; actor?: string }) {
  if (disabled) {
    return <span className="font-body text-xs text-council-ink/30 border border-council-navy/10 rounded-card px-3 py-1.5 cursor-not-allowed">{label}</span>;
  }
  const params = new URLSearchParams({ page: String(page) });
  if (actor) params.set("actor", actor);
  return (
    <a href={`/admin/audit-log?${params.toString()}`} className="font-body text-xs text-council-navy border border-council-navy/20 rounded-card px-3 py-1.5 hover:bg-council-cream">
      {label}
    </a>
  );
}
