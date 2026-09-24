import { Trophy } from "lucide-react";

interface CandidateEntry {
  id: string;
  status: string;
  people: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null;
}

function personName(people: CandidateEntry["people"]): string {
  const p = Array.isArray(people) ? people[0] : people;
  return `${p?.first_name ?? ""} ${p?.last_name ?? ""}`;
}

// Shown once an election is Completed. Lists whoever was actually marked
// "Elected" — a decision an admin made deliberately via the Mark Elected
// button on each candidate row, not something computed here. This is
// the "Election Summary" / "Winning candidate" view the platform
// requirements ask for, built from a real recorded decision rather than
// auto-declaring a winner from vote counts alone (the Council's actual
// composition rule — how many seats per category — was never confirmed
// to this system).
export function ElectionSummary({
  nurseCandidates,
  midwifeCandidates,
  voteCounts,
}: {
  nurseCandidates: CandidateEntry[];
  midwifeCandidates: CandidateEntry[];
  voteCounts: Map<string, number>;
}) {
  const electedNurses = nurseCandidates.filter((c) => c.status === "Elected");
  const electedMidwives = midwifeCandidates.filter((c) => c.status === "Elected");

  return (
    <div className="bg-white rounded-card border-2 border-status-active/40 p-6">
      <h2 className="font-display text-base text-council-navy mb-4 flex items-center gap-2">
        <Trophy size={16} className="text-status-active" aria-hidden="true" /> Election Summary
      </h2>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="font-body text-xs text-council-ink/50 mb-2">Elected — Nurse</p>
          {electedNurses.length === 0 ? (
            <p className="font-body text-sm text-council-ink/40 italic">None marked elected yet.</p>
          ) : (
            <ul className="space-y-1">
              {electedNurses.map((c) => (
                <li key={c.id} className="font-body text-sm text-council-navy">
                  {personName(c.people)}{" "}
                  <span className="text-council-ink/50 text-xs">({voteCounts.get(c.id) ?? 0} votes)</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <p className="font-body text-xs text-council-ink/50 mb-2">Elected — Midwife</p>
          {electedMidwives.length === 0 ? (
            <p className="font-body text-sm text-council-ink/40 italic">None marked elected yet.</p>
          ) : (
            <ul className="space-y-1">
              {electedMidwives.map((c) => (
                <li key={c.id} className="font-body text-sm text-council-navy">
                  {personName(c.people)}{" "}
                  <span className="text-council-ink/50 text-xs">({voteCounts.get(c.id) ?? 0} votes)</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
