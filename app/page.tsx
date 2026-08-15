import { requirePortalUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export default async function PortalHome() {
  const person = await requirePortalUser();
  const supabase = createClient();

  const [{ data: openElections }, { data: nominationElections }] = await Promise.all([
    supabase.from("elections").select("id, term_label, status").in("status", ["Round 1 Open", "Round 2 Open"]),
    supabase.from("elections").select("id, term_label, status").eq("status", "Planned"),
  ]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <section className="bg-white rounded-card border border-council-navy/10 p-6">
        <h2 className="font-display text-lg text-council-navy mb-3">Your Profile</h2>
        <dl className="grid grid-cols-2 gap-y-2 font-body text-sm">
          <dt className="text-council-ink/60">Status</dt>
          <dd>{person.registration_status}</dd>
          <dt className="text-council-ink/60">Category</dt>
          <dd>{person.professional_category ?? "—"}</dd>
          <dt className="text-council-ink/60">Profile</dt>
          <dd>{person.profile_status}</dd>
        </dl>
      </section>

      {nominationElections && nominationElections.length > 0 && (
        <section className="bg-white rounded-card border border-council-navy/20 p-6">
          <h2 className="font-display text-lg text-council-navy mb-3">Nominations Open</h2>
          {nominationElections.map((e) => (
            <a key={e.id} href={`/portal/nominate/${e.id}`} className="block font-body text-council-navy underline">
              {e.term_label} — submit a nomination
            </a>
          ))}
        </section>
      )}

      {openElections && openElections.length > 0 && (
        <section className="bg-white rounded-card border border-council-cyan p-6">
          <h2 className="font-display text-lg text-council-navy mb-3">Voting Open</h2>
          {openElections.map((e) => (
            <a key={e.id} href={`/portal/vote/${e.id}`} className="block font-body text-council-navy underline">
              {e.term_label} — {e.status}
            </a>
          ))}
        </section>
      )}
    </div>
  );
}
