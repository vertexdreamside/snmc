import { requireCouncillor } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export default async function CouncilHome() {
  const { termId } = await requireCouncillor();
  const supabase = createClient();

  const { data: myTerm } = await supabase
    .from("councillor_terms")
    .select("category, appointment_type, service_category, term_start, term_end")
    .eq("id", termId)
    .single();

  const { data: roster } = await supabase
    .from("council_roster")
    .select("first_name, last_name, category, appointment_type, service_category, term_start, term_end")
    .order("last_name");

  const { data: publishedElections } = await supabase
    .from("elections")
    .select("id, term_label, status")
    .eq("results_published", true);

  // Pull the actual elected candidates for each published election —
  // "published" should mean real results are visible, not just a status
  // label with no content behind it.
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
    <div className="max-w-3xl mx-auto space-y-6">
      <section className="bg-white rounded-card border border-council-navy/10 p-6">
        <h2 className="font-display text-lg text-council-navy mb-3">Your Term</h2>
        {myTerm && (
          <dl className="grid grid-cols-2 gap-y-2 font-body text-sm">
            <dt className="text-council-ink/60">Category</dt>
            <dd>{myTerm.category}</dd>
            <dt className="text-council-ink/60">Appointment Type</dt>
            <dd>{myTerm.appointment_type}</dd>
            <dt className="text-council-ink/60">Service Category</dt>
            <dd>{myTerm.service_category ?? "—"}</dd>
            <dt className="text-council-ink/60">Term</dt>
            <dd>
              {myTerm.term_start} – {myTerm.term_end}
            </dd>
          </dl>
        )}
      </section>

      <section className="bg-white rounded-card border border-council-navy/10 p-6">
        <h2 className="font-display text-lg text-council-navy mb-3">Current Council Roster</h2>
        <ul className="font-body text-sm divide-y divide-council-navy/10">
          {roster?.map((r, i) => (
            <li key={i} className="py-2 flex justify-between">
              <span>
                {r.first_name} {r.last_name}
              </span>
              <span className="text-council-ink/60">
                {r.category} · {r.appointment_type}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white rounded-card border border-council-navy/10 p-6">
        <h2 className="font-display text-lg text-council-navy mb-3">Published Election Results</h2>
        {resultsByElection.length > 0 ? (
          <div className="space-y-4">
            {resultsByElection.map(({ election, elected }) => (
              <div key={election.id}>
                <p className="font-body text-sm font-medium text-council-navy mb-1">{election.term_label}</p>
                {elected.length > 0 ? (
                  <ul className="font-body text-sm text-council-ink/70 space-y-1 pl-3">
                    {elected.map((c: any, i: number) => (
                      <li key={i}>
                        {c.people?.first_name} {c.people?.last_name} — {c.category}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="font-body text-sm text-council-ink/50 pl-3">
                    Published, but no candidates are marked "Elected" yet.
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="font-body text-sm text-council-ink/60">No results published yet.</p>
        )}
      </section>
    </div>
  );
}
