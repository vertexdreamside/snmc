import { requirePortalUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { NominationForm } from "./NominationForm";

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
    return <p className="font-body text-council-ink/60 max-w-xl mx-auto">Election not found.</p>;
  }
  if (election.status !== "Planned") {
    return (
      <p className="font-body text-council-ink/60 max-w-xl mx-auto">
        Nominations for {election.term_label} are not currently open.
      </p>
    );
  }

  const eligibleCategories: ("Nurse" | "Midwife")[] =
    person.professional_category === "Both"
      ? ["Nurse", "Midwife"]
      : person.professional_category === "Nurse" || person.professional_category === "Midwife"
        ? [person.professional_category]
        : [];

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl text-council-navy">Nomination — {election.term_label}</h1>
        <p className="font-body text-sm text-council-ink/60 mt-1">
          Nominate a candidate to serve on the Seychelles Nurses and Midwives Council.
        </p>
      </div>

      {eligibleCategories.length === 0 ? (
        <p className="font-body text-council-ink/60">
          Your registration status doesn't currently permit submitting a nomination.
        </p>
      ) : (
        <NominationForm electionId={election.id} eligibleCategories={eligibleCategories} />
      )}
    </div>
  );
}
