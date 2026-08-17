import { requirePortalUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { ClipboardCheck, Vote, ArrowRight } from "lucide-react";

export default async function PortalHome() {
  const person = await requirePortalUser();
  const supabase = createClient();

  const [{ data: openElections }, { data: nominationElections }] = await Promise.all([
    supabase.from("elections").select("id, term_label, status").in("status", ["Round 1 Open", "Round 2 Open"]),
    supabase.from("elections").select("id, term_label, status").eq("status", "Planned"),
  ]);

  const hasNominations = nominationElections && nominationElections.length > 0;
  const hasVoting = openElections && openElections.length > 0;

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

      {hasNominations && (
        <section className="bg-white rounded-card border border-council-navy/20 overflow-hidden">
          <h2 className="font-display text-lg text-council-navy px-6 pt-5 pb-1">Nominations Open</h2>
          {nominationElections!.map((e) => (
            <ActionRow key={e.id} href={`/portal/nominate/${e.id}`} icon={ClipboardCheck} label={e.term_label} sub="Submit a nomination" />
          ))}
        </section>
      )}

      {hasVoting && (
        <section className="bg-white rounded-card border border-council-cyan overflow-hidden">
          <h2 className="font-display text-lg text-council-navy px-6 pt-5 pb-1">Voting Open</h2>
          {openElections!.map((e) => (
            <ActionRow key={e.id} href={`/portal/vote/${e.id}`} icon={Vote} label={e.term_label} sub={e.status} />
          ))}
        </section>
      )}

      {!hasNominations && !hasVoting && (
        <section className="bg-white rounded-card border border-council-navy/10 p-6 text-center">
          <p className="font-body text-sm text-council-ink/50">
            Nothing needs your attention right now — no nominations or voting are currently open.
          </p>
        </section>
      )}
    </div>
  );
}

function ActionRow({
  href,
  icon: Icon,
  label,
  sub,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  sub: string;
}) {
  return (
    <a href={href} className="flex items-center gap-3 px-6 py-4 border-t border-council-navy/10 first-of-type:border-t-0 hover:bg-council-cream transition-colors">
      <Icon size={18} strokeWidth={1.75} className="text-council-cyan shrink-0" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="font-body text-sm text-council-navy">{label}</p>
        <p className="font-body text-xs text-council-ink/50">{sub}</p>
      </div>
      <ArrowRight size={16} className="text-council-ink/30 shrink-0" aria-hidden="true" />
    </a>
  );
}
