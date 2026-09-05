import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { ElectionReportClient } from "./ElectionReportClient";

// Election Reports (Section 7 of the platform requirements): Election
// Summary, Voter Turnout, Votes Cast, Candidate Results, Eligible
// Voters, Election Participation — across every election, not just the
// one currently open, and exportable.
export default async function ElectionReportsPage() {
  await requireAdmin(["reports"]);
  const supabase = createClient();

  const { data: elections } = await supabase
    .from("elections")
    .select("id, term_label, status")
    .order("term_label", { ascending: false });

  const report = await Promise.all(
    (elections ?? []).map(async (election) => {
      const categories: ("Nurse" | "Midwife")[] = ["Nurse", "Midwife"];
      const categoryStats = await Promise.all(
        categories.map(async (category) => {
          const { count: eligible } = await supabase
            .from("people")
            .select("*", { count: "exact", head: true })
            .eq("is_deceased", false)
            .eq("category_confirmed", true)
            .or(`professional_category.eq.Both,professional_category.eq.${category}`);

          const { count: voted } = await supabase
            .from("vote_participation")
            .select("*", { count: "exact", head: true })
            .eq("election_id", election.id).eq("round", 2).eq("category", category);

          const { data: ballots } = await supabase
            .from("ballots")
            .select("candidate_id")
            .eq("election_id", election.id).eq("round", 2).eq("category", category);

          const counts = new Map<string, number>();
          (ballots ?? []).forEach((b) => counts.set(b.candidate_id, (counts.get(b.candidate_id) ?? 0) + 1));

          let candidateResults: { name: string; votes: number; elected: boolean }[] = [];
          if (counts.size > 0) {
            const { data: candidates } = await supabase
              .from("candidates")
              .select("id, status, people:person_id(first_name, last_name)")
              .in("id", Array.from(counts.keys()));
            candidateResults = (candidates ?? [])
              .map((c: any) => {
                const p = Array.isArray(c.people) ? c.people[0] : c.people;
                return { name: `${p?.first_name ?? ""} ${p?.last_name ?? ""}`.trim(), votes: counts.get(c.id) ?? 0, elected: c.status === "Elected" };
              })
              .sort((a, b) => b.votes - a.votes);
          }

          return {
            category,
            eligible: eligible ?? 0,
            voted: voted ?? 0,
            turnout: (eligible ?? 0) > 0 ? (((voted ?? 0) / (eligible ?? 1)) * 100).toFixed(1) : "0.0",
            candidateResults,
          };
        })
      );
      return { election, categoryStats };
    })
  );

  return (
    <div className="max-w-4xl">
      <p className="font-body text-sm text-council-ink/60 mb-4">
        Election summary, turnout, and candidate results across every election — this is aggregate participation
        and vote-tally data only; it never reveals what any individual person voted for.
      </p>
      <ElectionReportClient report={report} />
    </div>
  );
}
