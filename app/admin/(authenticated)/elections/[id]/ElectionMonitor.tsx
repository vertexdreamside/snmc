import { createClient } from "@/lib/supabase/server";
import { isTallyVisible } from "@/lib/elections/tally";
import { Users, Clock, TrendingUp } from "lucide-react";

// Turnout and time-remaining are always visible to admins. Per-candidate
// live counts are gated by live_results_visible (Section 9) — completely
// separate from, and never influencing, what voters can see (gated
// exclusively by results_published, see app/portal/(authenticated)/results/page.tsx).
export async function ElectionMonitor({ election }: { election: { id: string; status: string; live_results_visible: boolean; round2_close_at: string | null } }) {
  const supabase = createClient();
  const categories: ("Nurse" | "Midwife")[] = ["Nurse", "Midwife"];

  const stats = await Promise.all(
    categories.map(async (category) => {
      const { count: eligibleCount } = await supabase
        .from("people").select("*", { count: "exact", head: true })
        .eq("is_deceased", false).eq("category_confirmed", true)
        .or(`professional_category.eq.Both,professional_category.eq.${category}`);

      const { count: votedCount } = await supabase
        .from("vote_participation").select("*", { count: "exact", head: true })
        .eq("election_id", election.id).eq("round", 2).eq("category", category);

      let tallies: { name: string; count: number }[] = [];
      if (isTallyVisible(election as any)) {
        const { data: ballotCounts } = await supabase
          .from("ballots").select("candidate_id")
          .eq("election_id", election.id).eq("round", 2).eq("category", category);
        const counts = new Map<string, number>();
        (ballotCounts ?? []).forEach((b) => counts.set(b.candidate_id, (counts.get(b.candidate_id) ?? 0) + 1));
        if (counts.size > 0) {
          const { data: candidates } = await supabase
            .from("candidates").select("id, people:person_id(first_name, last_name)")
            .in("id", Array.from(counts.keys()));
          tallies = (candidates ?? [])
            .map((c: any) => ({ name: `${c.people?.first_name ?? ""} ${c.people?.last_name ?? ""}`, count: counts.get(c.id) ?? 0 }))
            .sort((a, b) => b.count - a.count);
        }
      }
      return { category, eligible: eligibleCount ?? 0, voted: votedCount ?? 0, tallies };
    })
  );

  const timeRemaining = election.round2_close_at ? getTimeRemaining(election.round2_close_at) : null;

  return (
    <div className="bg-white rounded-card border border-council-navy/10 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base text-council-navy flex items-center gap-2">
          <TrendingUp size={16} className="text-council-cyan" aria-hidden="true" /> Live Election Monitor
        </h3>
        {timeRemaining && <span className="flex items-center gap-1 font-body text-xs text-council-ink/60"><Clock size={12} aria-hidden="true" /> {timeRemaining}</span>}
      </div>
      {stats.map(({ category, eligible, voted, tallies }) => {
        const pct = eligible > 0 ? Math.round((voted / eligible) * 100) : 0;
        return (
          <div key={category}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-body text-sm font-medium text-council-navy flex items-center gap-1.5"><Users size={13} className="text-council-ink/40" aria-hidden="true" /> {category}</span>
              <span className="font-body text-xs text-council-ink/60">{voted} of {eligible} voted ({pct}%)</span>
            </div>
            <div className="h-2 bg-council-cream rounded-full overflow-hidden">
              <div className="h-full bg-council-cyan rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            {tallies.length > 0 && (
              <div className="mt-2 pl-4 space-y-1">
                {tallies.map((t) => (
                  <div key={t.name} className="flex justify-between font-body text-xs text-council-ink/60">
                    <span>{t.name}</span><span className="font-medium text-council-navy">{t.count} vote{t.count === 1 ? "" : "s"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      {!isTallyVisible(election as any) && election.status === "Election Open" && (
        <p className="font-body text-xs text-council-ink/40 italic">Per-candidate totals are hidden while voting is open — toggle "live results visible" to show them here, or wait until voting closes.</p>
      )}
    </div>
  );
}

function getTimeRemaining(closingIso: string): string {
  const diffMs = new Date(closingIso).getTime() - Date.now();
  if (diffMs <= 0) return "Closing time has passed";
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h remaining`;
  return `${hours}h remaining`;
}
