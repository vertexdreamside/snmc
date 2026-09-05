import { Check } from "lucide-react";

// Section 30's 11-step wizard, shown as a progress stepper rather than
// forced Next/Back navigation — an election's real lifecycle spans
// weeks (2-week nomination, 1-week voting, then admin review), so a
// modal-style wizard an admin clicks through once doesn't fit how this
// page actually gets used: the same admin returns to it repeatedly over
// that whole span. What Section 38 actually asks for — "always know
// what stage you're at" — is served better by this always-visible
// stepper than by gating content behind Next/Back.
//
// Honest about where this doesn't map 1:1: Steps 1-2 (Details, Voting
// Groups) only exist at creation time (see CreateElectionForm) and are
// always "done" once an election exists to view. Steps 4-5 (Review
// Nominations / Candidate Acceptance) and 7-8 (Open Election / Monitor)
// happen together in this system rather than as separate sequential
// pages, since ranking and accept/decline both occur during the same
// "Nomination Closed" status, and opening the election and monitoring
// it both happen during "Election Open."
const STEPS = [
  "Election Details",
  "Voting Groups",
  "Nomination",
  "Review Nominations",
  "Candidate Acceptance",
  "Final Candidate List",
  "Open Election",
  "Monitor Voting",
  "Close Election",
  "Approval",
  "Publish",
];

function currentStepIndex(election: { status: string; approval_status?: string; results_published?: boolean }): number {
  const { status, approval_status, results_published } = election;
  if (results_published) return 10;
  if (status === "Planned") return 2;
  if (status === "Nomination Open") return 2;
  if (status === "Nomination Closed") return 4;
  if (status === "Election Open") return 7;
  if (status === "Election Closed") {
    if (approval_status === "Approved") return 9;
    return 8;
  }
  if (status === "Completed") return 10;
  return 0;
}

export function ElectionStageStepper({ election }: { election: { status: string; approval_status?: string; results_published?: boolean } }) {
  const current = currentStepIndex(election);

  return (
    <div className="bg-white rounded-card border border-council-navy/10 p-4 overflow-x-auto">
      <div className="flex items-center gap-1 min-w-max">
        {STEPS.map((label, i) => {
          const done = i < current;
          const isCurrent = i === current;
          return (
            <div key={label} className="flex items-center gap-1">
              <div className="flex flex-col items-center gap-1 w-20">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                    done ? "bg-status-active text-white" : isCurrent ? "bg-council-navy text-white" : "bg-council-navy/10 text-council-ink/40"
                  }`}
                >
                  {done ? <Check size={12} aria-hidden="true" /> : i + 1}
                </span>
                <span className={`font-body text-[10px] text-center leading-tight ${isCurrent ? "text-council-navy font-medium" : "text-council-ink/40"}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && <div className={`w-4 h-0.5 ${done ? "bg-status-active" : "bg-council-navy/10"}`} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
