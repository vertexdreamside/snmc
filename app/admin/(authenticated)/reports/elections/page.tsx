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

          // Nomination Report — Round 1 data (ranked by nomination count,
          // with acceptance status), previously never surfaced as its
          // own report anywhere; only visible live during an active
          // election via the ranking panel, not retained as history.
          const { data: nominationRows } = await supabase
            .from("candidates")
            .select("id, status, service_category, nomination_count, people:person_id(first_name, last_name)")
            .eq("election_id", election.id)
            .eq("category", category)
            .order("nomination_count", { ascending: false });

          const nominationReport = (nominationRows ?? []).map((n: any, i: number) => {
            const p = Array.isArray(n.people) ? n.people[0] : n.people;
            return {
              rank: i + 1,
              name: `${p?.first_name ?? ""} ${p?.last_name ?? ""}`.trim(),
              votingGroup: n.service_category ?? "—",
              nominationCount: n.nomination_count ?? 0,
              status: n.status,
            };
          });

          return {
            category,
            eligible: eligible ?? 0,
            voted: voted ?? 0,
            turnout: (eligible ?? 0) > 0 ? (((voted ?? 0) / (eligible ?? 1)) * 100).toFixed(1) : "0.0",
            candidateResults,
            nominationReport,
          };
        })
      );
      return { election, categoryStats };
    })
  );

  return (
    <div className="max-w-4xl">
      <p className="font-body text-sm text-council-ink/60 mb-4">
        Three separate reports per election — Nomination Report, Voting Results, and Voter Participation. Voter
        Participation is aggregate turnout only; it never reveals what any individual person voted for.
      </p>
      <ElectionReportClient report={report} />
    </div>
  );
}
