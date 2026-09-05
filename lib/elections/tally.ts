// Section 9 of the confirmed rules: whether per-candidate vote totals are
// visible while voting is still open is now an admin-configurable setting
// per election, not a fixed platform behavior. Overall turnout is always
// visible regardless — this only gates the per-candidate breakdown, and
// it never affects what a voter (as opposed to an admin) can see — see
// app/portal/(authenticated)/results/page.tsx for that separate, harder
// rule.
import type { Election } from "@/lib/types/database";

export function isTallyVisible(election: Pick<Election, "status" | "live_results_visible">): boolean {
  if (election.status === "Election Closed" || election.status === "Completed") return true;
  if (election.status === "Election Open" && election.live_results_visible) return true;
  return false;
}

// Section 38: "At all times show a clear status" — a single plain-
// language phrase combining round, approval, and dispute state,
// matching the exact examples given: "Round 1 – Nomination Open",
// "Round 1 Closed – Review Nominees", "Election Closed – Awaiting
// Minister Approval". Previously the round status and the approval
// chain were two separate fields shown (or not shown) inconsistently
// across the elections list and detail pages — this is the one place
// that combines them correctly, used by both.
export function computeElectionStageLabel(election: {
  status: string;
  approval_status?: string;
  results_published?: boolean;
}): string {
  const { status, approval_status, results_published } = election;
  if (status === "Planned") return "Not yet started";
  if (status === "Nomination Open") return "Round 1 – Nomination Open";
  if (status === "Nomination Closed") return "Round 1 Closed – Review Nominees";
  if (status === "Election Open") return "Round 2 – Election Open";
  if (status === "Election Closed") {
    if (results_published) return "Published";
    if (approval_status === "Disputed") return "Election Closed – Disputed, Awaiting Resolution";
    if (approval_status === "Approved") return "Approved – Ready to Publish";
    return "Election Closed – Awaiting Minister Approval";
  }
  if (status === "Completed") return results_published ? "Published" : "Completed";
  return status;
}
