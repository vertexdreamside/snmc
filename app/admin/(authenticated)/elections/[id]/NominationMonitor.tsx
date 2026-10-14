import { createClient } from "@/lib/supabase/server";
import { Users, TrendingUp, Crown, AlertTriangle } from "lucide-react";
import { AutoRefresh } from "./AutoRefresh";

// Round 1 counterpart of ElectionMonitor. Admin-only. Per-candidate
// nomination counts follow the same "Show Live Per-Candidate Results"
// switch used in Round 2: while nominations are open they appear only when
// that switch is on; once Round 1 is closed they always appear. The
// totals (nominations received, nominees, nominators) are always shown.
export async function NominationMonitor({
  election,
}: {
  election: { id: string; status: string; live_results_visible: boolean; round1_close_at: string | null };
}) {
  const supabase = await createClient();
  const isOpen = election.status === "Nomination Open";
  const showPerCandidate = !isOpen || election.live_results_visible;
  const categories: ("Nurse" | "Midwife")[] = ["Nurse", "Midwife"];

  const { data: nominations } = await supabase
    .from("nominations")
    .select("person_id, category, nominated_by")
    .eq("election_id", election.id);

  const rows = nominations ?? [];
  const nominators = new Set(rows.map((n: any) => n.nominated_by).filter(Boolean));

  const personIds = Array.from(new Set(rows.map((n: any) => n.person_id).filter(Boolean)));
  const names = new Map<string, string>();
  if (personIds.length > 0) {
    const { data: people } = await supabase.from("people").select("id, first_name, last_name").in("id", personIds);
    for (const p of people ?? []) names.set(p.id, `${p.first_name} ${p.last_name}`.trim());
  }

  const perCategory = categories.map((category) => {
    const counts = new Map<string, number>();
    for (const n of rows.filter((r: any) => r.category === category)) {
      counts.set(n.person_id, (counts.get(n.person_id) ?? 0) + 1);
    }
    const list = Array.from(counts.entries())
      .map(([id, count]) => ({ name: names.get(id) ?? "Unknown", count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    return { category, total: rows.filter((r: any) => r.category === category).length, list };
  });

  return (
    <div className="bg-white rounded-card border border-council-navy/10 p-6 space-y-5">
      {isOpen && <AutoRefresh intervalSeconds={15} />}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-display text-base text-council-navy flex items-center gap-2">
          <TrendingUp size={16} className="text-council-cyan" aria-hidden="true" /> Live Nomination Monitor
        </h3>
        <span className="font-body text-xs text-council-ink/60">
          {rows.length} nomination{rows.length === 1 ? "" : "s"} · {nominators.size} nominator{nominators.size === 1 ? "" : "s"}
        </span>
      </div>

      {perCategory.map(({ category, total, list }) => {
        const top = list[0]?.count ?? 0;
        const leaders = list.filter((l) => l.count === top && top > 0);
        return (
          <div key={category}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-body text-sm font-medium text-council-navy flex items-center gap-1.5">
                <Users size={13} className="text-council-ink/40" aria-hidden="true" /> {category}
              </span>
              <span className="font-body text-xs text-council-ink/60">
                {total} nomination{total === 1 ? "" : "s"} · {list.length} nominee{list.length === 1 ? "" : "s"}
              </span>
            </div>
            {showPerCandidate ? (
              list.length === 0 ? (
                <p className="pl-4 font-body text-xs text-council-ink/40">No nominations yet.</p>
              ) : (
                <div className="pl-4 space-y-1">
                  {leaders.length > 1 ? (
                    <p className="flex items-center gap-1.5 font-body text-xs text-status-pending font-medium">
                      <AlertTriangle size={12} aria-hidden="true" /> Tied for the lead — {leaders.map((l) => l.name).join(" & ")} ({top} each)
                    </p>
                  ) : (
                    <p className="flex items-center gap-1.5 font-body text-xs text-status-active font-medium">
                      <Crown size={12} aria-hidden="true" /> Currently leading: {list[0].name}
                    </p>
                  )}
                  {list.map((l, i) => (
                    <div key={l.name + i} className="flex items-center justify-between font-body text-xs text-council-ink/60">
                      <span>#{i + 1} {l.name}</span>
                      <span className="font-medium text-council-navy">{l.count} nomination{l.count === 1 ? "" : "s"}</span>
                    </div>
                  ))}
                </div>
              )
            ) : null}
          </div>
        );
      })}

      {!showPerCandidate && (
        <p className="font-body text-xs text-council-ink/40 italic">
          Per-nominee counts are hidden while nominations are open — press "Show Live Per-Candidate Results" above to show them, or wait until Round 1 closes.
        </p>
      )}
    </div>
  );
}
