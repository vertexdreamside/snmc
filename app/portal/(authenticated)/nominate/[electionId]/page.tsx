import { requirePortalUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/lib/components/EmptyState";
import { NominationForm } from "./NominationForm";
import { isEligible } from "@/lib/auth/eligibility";

// Digital equivalent of the paper Nomination Form. See the historical
// instructions quoted in lib/auth's nominate/vote eligibility comments —
// the same "who may nominate whom" rule applies here as at voting time.
export default async function NominatePage({ params }: { params: { electionId: string } }) {
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
  // Round 1 = nomination collection, per the historical process. Round 2
  // is the actual election vote on the shortlisted nominees.
  if (election.status !== "Nomination Open") {
    return (
      <EmptyState
        message={`Nominations for ${election.term_label} are not currently open.`}
        backHref="/portal"
        backLabel="← Back to portal"
      />
    );
  }

  // Eligibility now goes through lib/auth/eligibility (Section 4/13 of
  // the confirmed election rules) — is_deceased is the actual gate, not
  // registration_status/professional_category alone.
  const eligibleCategories: ("Nurse" | "Midwife")[] = (["Nurse", "Midwife"] as const).filter(
    (c) => isEligible(person, c).eligible
  );

  // Section 10 of the confirmed Elections & Voting module: one
  // nomination per voter per category, not one per candidate — checked
  // here so the form can be disabled up front, not just after a failed
  // submission attempt.
  const { data: alreadySubmitted } = await supabase
    .from("nominations")
    .select("category")
    .eq("election_id", election.id)
    .eq("nominated_by", person.id);
  const submittedCategories = new Set((alreadySubmitted ?? []).map((n) => n.category));

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl text-council-navy">Nomination — {election.term_label}</h1>
        <p className="font-body text-sm text-council-ink/60 mt-1">
          Nominate a candidate to serve on the Seychelles Nurses and Midwives Council.
        </p>
      </div>

      {eligibleCategories.length === 0 ? (
        <EmptyState
          message="Your registration status doesn't currently permit submitting a nomination."
          backHref="/portal"
          backLabel="← Back to portal"
        />
      ) : (
        <NominationForm electionId={election.id} eligibleCategories={eligibleCategories} submittedCategories={Array.from(submittedCategories)} />
      )}
    </div>
  );
}
