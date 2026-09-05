import { createClient } from "@/lib/supabase/server";

// Section 8: admins can see WHO has voted, never WHAT they voted for.
// Queries vote_participation only — never ballots.
export async function VoterParticipation({ electionId, round, category }: { electionId: string; round: number; category: "Nurse" | "Midwife" }) {
  const supabase = createClient();
  const regCol = category === "Nurse" ? "nurse_reg_no" : "midwife_reg_no";

  const { data: eligibleVoters } = await supabase
    .from("people")
    .select(`id, first_name, last_name, ${regCol}, professional_category, registration_status`)
    .eq("is_deceased", false)
    .eq("category_confirmed", true)
    .or(`professional_category.eq.Both,professional_category.eq.${category}`)
    .order("last_name")
    .limit(500);

  const { data: participation } = await supabase
    .from("vote_participation")
    .select("voter_id")
    .eq("election_id", electionId).eq("round", round).eq("category", category);

  const votedIds = new Set((participation ?? []).map((p) => p.voter_id));
  const voters = eligibleVoters ?? [];
  const votedCount = voters.filter((v: any) => votedIds.has(v.id)).length;
  const turnout = voters.length > 0 ? ((votedCount / voters.length) * 100).toFixed(1) : "0.0";

  return (
    <div className="bg-white rounded-card border border-council-navy/10 overflow-hidden">
      <div className="p-4 border-b border-council-navy/10 flex items-center justify-between">
        <h3 className="font-display text-sm text-council-navy">{category} Voter Participation</h3>
        <p className="font-body text-xs text-council-ink/60">{votedCount} of {voters.length} voted ({turnout}% turnout)</p>
      </div>
      <table className="w-full font-body text-sm">
        <thead className="bg-council-cream text-council-ink/60 text-left">
          <tr><th className="px-4 py-2">Name</th><th className="px-4 py-2">Reg. No.</th><th className="px-4 py-2">Type</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Vote Status</th></tr>
        </thead>
        <tbody className="divide-y divide-council-navy/10">
          {voters.map((v: any) => (
            <tr key={v.id}>
              <td className="px-4 py-2">{v.first_name} {v.last_name}</td>
              <td className="px-4 py-2 text-council-ink/60">{v[regCol] || "—"}</td>
              <td className="px-4 py-2 text-council-ink/60">{v.professional_category}</td>
              <td className="px-4 py-2 text-council-ink/60">{v.registration_status}</td>
              <td className="px-4 py-2">{votedIds.has(v.id) ? <span className="text-status-active font-medium">Voted</span> : <span className="text-council-ink/40">Not Voted</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
