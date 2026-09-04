import { requirePortalUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

// Published election results, visible to every Nurse/Midwife — not just
// Councillors. "Publish Results" in the admin panel should mean results
// are actually visible to the people who voted for them, not just to the
// Council itself; this was a real gap (the only place results showed up
// was the Councillor Portal, which regular members can't reach).
//
// HARD RULE, not a preference: this gates on results_published ONLY. It
// must NEVER also check elections.live_results_visible — that flag
// controls whether ADMINS see live per-candidate tallies while
// monitoring an open vote (Section 9 of the confirmed election rules);
// it has nothing to do with what a voter is allowed to see. If you're
// extending this page, do not thread live_results_visible into it.
export default async function PortalResultsPage() {
  await requirePortalUser();
  const supabase = createClient();

  const { data: publishedElections } = await supabase
    .from("elections")
    .select("id, term_label, status")
    .eq("results_published", true)
    .order("term_label", { ascending: false });

  const resultsByElection = await Promise.all(
    (publishedElections ?? []).map(async (e) => {
      const { data: elected } = await supabase
        .from("candidates")
        .select("category, people:person_id(first_name, last_name)")
        .eq("election_id", e.id)
        .eq("status", "Elected")
        .order("category");
      return { election: e, elected: elected ?? [] };
    })
  );

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl text-council-navy">Election Results</h1>
        <p className="font-body text-sm text-council-ink/60 mt-1">Published outcomes of past Council elections.</p>
      </div>

      {resultsByElection.length === 0 ? (
        <div className="bg-white rounded-card border border-council-navy/10 p-6 text-center">
          <p className="font-body text-sm text-council-ink/50">No results have been published yet.</p>
        </div>
      ) : (
        resultsByElection.map(({ election, elected }) => (
          <section key={election.id} className="bg-white rounded-card border border-council-navy/10 p-6">
            <h2 className="font-display text-lg text-council-navy mb-3">{election.term_label}</h2>
            {elected.length > 0 ? (
              <ul className="font-body text-sm divide-y divide-council-navy/10">
                {elected.map((c: any, i: number) => (
                  <li key={i} className="py-2 flex justify-between">
                    <span>
                      {c.people?.first_name} {c.people?.last_name}
                    </span>
                    <span className="text-council-ink/60">{c.category}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="font-body text-sm text-council-ink/50">Published, but no candidates are marked "Elected" yet.</p>
            )}
          </section>
        ))
      )}
    </div>
  );
}
