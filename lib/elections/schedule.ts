// Section 7: "Prevent voting before the configured voting start date.
// Automatically stop voting after the configured voting end date." This
// is the shared logic behind that — both the actual enforcement (used
// in the nominate/vote API routes) and the simplified three-state
// display label (Scheduled/Active/Closed) the spec asks for, which is
// intentionally separate from and simpler than the existing detailed
// election.status field elsewhere in this system.

export interface ScheduleFields {
  round1_open_at: string | null;
  round1_close_at: string | null;
  round2_open_at: string | null;
  round2_close_at: string | null;
}

export type RoundScheduleState = "Not Scheduled" | "Scheduled" | "Active" | "Closed";

// Round 1 = Nomination, Round 2 = Election/Voting — matching this
// project's established terminology throughout.
export function computeRoundScheduleState(openAt: string | null, closeAt: string | null): RoundScheduleState {
  const now = Date.now();
  if (!openAt) return "Not Scheduled";
  const opens = new Date(openAt).getTime();
  if (now < opens) return "Scheduled";
  if (closeAt && now >= new Date(closeAt).getTime()) return "Closed";
  return "Active";
}

// The actual enforcement — checked in the vote/nominate API routes
// directly, independent of whatever the election's own status field
// currently says. A scheduled start/end time is real even if an admin
// hasn't (or has forgotten to) manually advance the status yet.
export function isWithinScheduledWindow(openAt: string | null, closeAt: string | null): { allowed: boolean; reason?: string } {
  const now = Date.now();
  if (openAt && now < new Date(openAt).getTime()) {
    return { allowed: false, reason: `This isn't open yet — it's scheduled to open on ${new Date(openAt).toLocaleString()}.` };
  }
  if (closeAt && now >= new Date(closeAt).getTime()) {
    return { allowed: false, reason: `This closed on ${new Date(closeAt).toLocaleString()} and is no longer accepting submissions.` };
  }
  return { allowed: true };
}
