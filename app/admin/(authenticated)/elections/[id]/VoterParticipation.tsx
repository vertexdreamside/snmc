import { createClient } from "@/lib/supabase/server";
import { VoterParticipationTable } from "./VoterParticipationTable";

// Section 8: admins can see WHO has voted, never WHAT they voted for.
// Queries vote_participation only — never ballots.
export async function VoterParticipation({ electionId, round, category }: { electionId: string; round: number; category: "Nurse" | "Midwife" }) {
  const supabase = await createClient();
  const regCol = category === "Nurse" ? "nurse_reg_no" : "midwife_reg_no";

  // This list must include every eligible voter in the category, not just
  // a first page. It previously capped at 500 rows via .limit(500), which
  // silently undercounted the total (e.g. showed "0 of 500" for Nurse when
  // there are actually 1,283 eligible), and dropped anyone outside that
  // first alphabetical window from the "Not Voted Only" filter and the
  // "Export Non-Voters" CSV entirely — including people who HAD voted,
  // making the turnout figure wrong too.
  //
  // A single request still isn't safe even without an explicit .limit():
  // PostgREST applies its own server-side max-rows cap (commonly 1000)
  // regardless of what the client asks for, and Nurse alone already
  // exceeds that. So this fetches in pages until everything is in.
  const PAGE_SIZE = 1000;
  const eligibleVoters: any[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data: page, error } = await supabase
      .from("people")
      .select(`id, first_name, last_name, ${regCol}, professional_category, registration_status, phone_mobile`)
      .eq("is_deceased", false)
      .eq("category_confirmed", true)
      .or(`professional_category.eq.Both,professional_category.eq.${category}`)
      .order("last_name")
      .range(from, from + PAGE_SIZE - 1);
    if (error || !page || page.length === 0) break;
    eligibleVoters.push(...page);
    if (page.length < PAGE_SIZE) break;
  }

  const { data: participation } = await supabase
    .from("vote_participation")
    .select("voter_id")
    .eq("election_id", electionId).eq("round", round).eq("category", category);

  const votedIds = (participation ?? []).map((p) => p.voter_id);
  const voters = eligibleVoters.map((v: any) => ({ ...v, regNo: v[regCol] }));

  return <VoterParticipationTable category={category} voters={voters} votedIds={votedIds} />;
}
