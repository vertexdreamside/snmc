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
        {publishedElections && publishedElections.length > 0 ? (
          <ul className="font-body text-sm space-y-1">
            {publishedElections.map((e) => (
              <li key={e.id}>{e.term_label} — results published</li>
            ))}
          </ul>
        ) : (
          <p className="font-body text-sm text-council-ink/60">No results published yet.</p>
        )}
      </section>
    </div>
  );
}
