import { requirePortalUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { ClipboardCheck, Vote, ArrowRight, Info } from "lucide-react";
import Link from "next/link";
import { NomineeResponseBanner } from "./NomineeResponseBanner";

export default async function PortalHome() {
  const person = await requirePortalUser();
  const supabase = createClient();

  const [{ data: openElections }, { data: nominationElections }, { data: pendingCandidacies }] = await Promise.all([
    supabase.from("elections").select("id, term_label, status").eq("status", "Election Open"),
    supabase.from("elections").select("id, term_label, status").eq("status", "Nomination Open"),
    supabase
      .from("candidates")
      .select("id, category, elections(term_label)")
      .eq("person_id", person.id)
      .eq("status", "Pending"),
  ]);

  const hasNominations = nominationElections && nominationElections.length > 0;
  const hasVoting = openElections && openElections.length > 0;
  const pendingNominations = (pendingCandidacies ?? []).map((c: any) => ({
    id: c.id,
    category: c.category,
    election_term: c.elections?.term_label ?? "",
  }));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <NomineeResponseBanner nominations={pendingNominations} />
      <section className="bg-white rounded-card border border-council-navy/10 p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg text-council-navy">Your Profile</h2>
          <Link href="/portal/profile" className="font-body text-xs text-council-cyan underline">
            View / Edit full details
          </Link>
        </div>
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
          <div className="px-6 pt-5">
            <h2 className="font-display text-lg text-council-navy mb-1">Nominations Open — Round 1</h2>
            <ElectionRules kind="nominate" />
          </div>
          {nominationElections!.map((e) => (
            <ActionRow key={e.id} href={`/portal/nominate/${e.id}`} icon={ClipboardCheck} label={e.term_label} sub="Submit a nomination" />
          ))}
        </section>
      )}

      {hasVoting && (
        <section className="bg-white rounded-card border border-council-cyan overflow-hidden">
          <div className="px-6 pt-5">
            <h2 className="font-display text-lg text-council-navy mb-1">Voting Open — Round 2</h2>
            <ElectionRules kind="vote" />
          </div>
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

// Guidance drawn directly from the historical Nomination Form and Ballot
// Form this platform digitizes — the same eligibility and voting rules
// stated on those paper forms, just shown at the moment they're actually
// relevant instead of buried in a printed instruction sheet.
function ElectionRules({ kind }: { kind: "nominate" | "vote" }) {
  return (
    <div className="flex gap-2 bg-council-cream rounded-card px-3 py-2.5 mb-3">
      <Info size={16} className="text-council-cyan shrink-0 mt-0.5" aria-hidden="true" />
      {kind === "nominate" ? (
        <p className="font-body text-xs text-council-ink/70">
          A Registered Licensed Nurse Midwife may nominate a Nurse and a Midwife. A Registered Licensed Nurse
          (only) may nominate a Nurse only. A Licensed Midwife who is not also a Registered Nurse may only
          nominate a Midwife.
        </p>
      ) : (
        <p className="font-body text-xs text-council-ink/70">
          Make a tick against one candidate of your choice in each category you're eligible to vote in. You may
          cast one vote per category, and your choice is recorded anonymously.
        </p>
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
