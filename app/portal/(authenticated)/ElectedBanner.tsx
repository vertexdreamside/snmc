import { createClient } from "@/lib/supabase/server";
import { canSeeElection } from "@/lib/elections/test-election";
import { PartyPopper } from "lucide-react";

// Shown to a person who has been marked "Elected" once the election's
// results are published (never before — publishing is gated by Minister
// Approval, so no one is told early). Shown on the portal home and on the
// profile page.
export async function ElectedBanner({ person }: { person: { id: string; first_name?: string | null; last_name?: string | null } }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("candidates")
    .select("id, category, elections(term_label, results_published)")
    .eq("person_id", person.id)
    .eq("status", "Elected");

  const wins = (data ?? [])
    .map((c: any) => {
      const e = Array.isArray(c.elections) ? c.elections[0] : c.elections;
      return { id: c.id as string, category: c.category as string, term: (e?.term_label ?? "") as string, published: !!e?.results_published };
    })
    .filter((w) => w.published && canSeeElection(w.term, person));

  if (wins.length === 0) return null;

  return (
    <section className="bg-status-active/10 border-2 border-status-active rounded-card p-4 space-y-2" role="status">
      <div className="flex items-center gap-2">
        <PartyPopper size={16} className="text-status-active" aria-hidden="true" />
        <h2 className="font-display text-sm text-council-navy">Congratulations — you have been elected</h2>
      </div>
      {wins.map((w) => (
        <p key={w.id} className="font-body text-sm text-council-ink/80">
          You were elected as a <span className="font-medium text-council-navy">{w.category}</span> Councillor for{" "}
          <span className="font-medium text-council-navy">{w.term}</span>. The Council office will contact you with the next steps.
        </p>
      ))}
    </section>
  );
}
