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
