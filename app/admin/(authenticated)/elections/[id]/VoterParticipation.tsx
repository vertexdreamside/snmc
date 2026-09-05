import { createClient } from "@/lib/supabase/server";
import { VoterParticipationTable } from "./VoterParticipationTable";

// Section 8: admins can see WHO has voted, never WHAT they voted for.
// Queries vote_participation only — never ballots.
export async function VoterParticipation({ electionId, round, category }: { electionId: string; round: number; category: "Nurse" | "Midwife" }) {
  const supabase = createClient();
  const regCol = category === "Nurse" ? "nurse_reg_no" : "midwife_reg_no";

  const { data: eligibleVoters } = await supabase
    .from("people")
    .select(`id, first_name, last_name, ${regCol}, professional_category, registration_status, phone_mobile`)
    .eq("is_deceased", false)
    .eq("category_confirmed", true)
    .or(`professional_category.eq.Both,professional_category.eq.${category}`)
    .order("last_name")
    .limit(500);

  const { data: participation } = await supabase
    .from("vote_participation")
    .select("voter_id")
    .eq("election_id", electionId).eq("round", round).eq("category", category);

  const votedIds = (participation ?? []).map((p) => p.voter_id);
  const voters = (eligibleVoters ?? []).map((v: any) => ({ ...v, regNo: v[regCol] }));

  return <VoterParticipationTable category={category} voters={voters} votedIds={votedIds} />;
}
