import { requirePortalUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/lib/components/EmptyState";
import { BallotForm } from "./BallotForm";

export default async function VotePage({ params }: { params: { electionId: string } }) {
  const person = await requirePortalUser();
  const supabase = createClient();

  const { data: election } = await supabase
    .from("elections")
    .select("id, term_label, status")
    .eq("id", params.electionId)
    .single();

  if (!election) {
    return <EmptyState message="Election not found." backHref="/portal" backLabel="← Back to portal" />;
  }

  // Round 1 is nomination-only (see /portal/nominate). Round 2 is the
  // actual election vote on the shortlisted nominees — the digitized
  // equivalent of the historical Ballot Paper. There's a single voting
  // round in this model, not "vote in either round."
  const round = 2;
  const isOpen = election.status === "Election Open";

  if (!isOpen) {
    return (
      <EmptyState
        message={`Voting for ${election.term_label} is not currently open.`}
        backHref="/portal"
        backLabel="← Back to portal"
      />
    );
  }

  const eligibleCategories: ("Nurse" | "Midwife")[] =
    person.professional_category === "Both"
      ? ["Nurse", "Midwife"]
      : person.professional_category === "Nurse" || person.professional_category === "Midwife"
        ? [person.professional_category]
        : [];

  const sections = await Promise.all(
    eligibleCategories.map(async (category) => {
      const { data } = await supabase
        .from("candidates")
        .select("id, service_category, people:person_id(first_name, last_name)")
        .eq("election_id", election.id)
        .eq("category", category)
        .eq("status", "Shortlisted")
        .eq("round", round);

      const candidates = (data ?? []).map((c: any) => ({
        id: c.id,
        first_name: c.people?.first_name ?? "",
        last_name: c.people?.last_name ?? "",
        service_category: c.service_category,
      }));

      return { category, candidates };
    })
  );

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl text-council-navy">Election Ballot — {election.term_label}</h1>
        <p className="font-body text-sm text-council-ink/60 mt-1">
          The following candidates have been shortlisted for election to the Council.
        </p>
      </div>

      {eligibleCategories.length === 0 ? (
        <EmptyState message="Your registration status doesn't currently permit voting." backHref="/portal" backLabel="← Back to portal" />
      ) : (
        <BallotForm electionId={election.id} round={round} sections={sections} />
      )}
    </div>
  );
}
