import { requirePortalUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/lib/components/EmptyState";
import { BallotForm } from "./BallotForm";
import { isEligible, serviceCategoryMatches } from "@/lib/auth/eligibility";

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
  // actual election vote on the ACCEPTED nominees — the digitized
  // equivalent of the historical Ballot Paper.
  const round = 2;
  const isOpen = election.status === "Election Open";

  if (!isOpen) {
    return (
      <EmptyState message={`Voting for ${election.term_label} is not currently open.`} backHref="/portal" backLabel="← Back to portal" />
    );
  }

  // Eligibility now goes through lib/auth/eligibility (Section 4/13 of
  // the confirmed election rules) — previously this checked
  // professional_category directly with no is_deceased or
  // category_confirmed check at all. The vote API itself already
  // enforced this correctly, but showing an ineligible person a ballot
  // page they can't actually submit was a real UX/consistency gap.
  const eligibleCategories: ("Nurse" | "Midwife")[] = (["Nurse", "Midwife"] as const).filter(
    (c) => isEligible(person, c).eligible
  );

  // Only ACCEPTED candidates ever reach the ballot (Section 3 of the
  // confirmed rules) — replaces the old 'Shortlisted' status. Deliberately
  // no nomination_count in this select: showing Round 1 popularity data
  // here would let a voter see who's "ahead" before casting a Round 2
  // vote, undermining the independence of that vote.
  //
  // Service-category filtering (confirmed addendum): a Hospital voter
  // only sees Hospital candidates, a Community voter only sees Community
  // candidates — serviceCategoryMatches handles the "unspecified/Private
  // = eligible for both" fallback so the ~two-thirds of the register
  // without a service_category on file aren't silently locked out.
  const sections = await Promise.all(
    eligibleCategories.map(async (category) => {
      const { data } = await supabase
        .from("candidates")
        .select("id, service_category, people:person_id(first_name, last_name)")
        .eq("election_id", election.id)
        .eq("category", category)
        .eq("status", "Accepted")
        .eq("round", round);

      const candidates = (data ?? [])
        .filter((c: any) => serviceCategoryMatches(person.service_category, c.service_category))
        .map((c: any) => ({
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
          The following candidates have accepted their nomination for election to the Council.
        </p>
      </div>

      {eligibleCategories.length === 0 ? (
        <EmptyState message="You're not currently eligible to vote." backHref="/portal" backLabel="← Back to portal" />
      ) : (
        <BallotForm electionId={election.id} round={round} sections={sections} />
      )}
    </div>
  );
}
