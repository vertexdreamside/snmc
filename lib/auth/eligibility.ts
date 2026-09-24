// Implements Section 4 and Section 13 of the Council's confirmed election
// rules — the single source of truth for "can this person participate,"
// replacing scattered `registration_status !== 'Practising'` checks that
// were WRONG under the confirmed rules: Active, Retired, and Non-Active
// professionals are all eligible. The only thing that disqualifies
// someone is being deceased. registration_status and is_deceased are
// deliberately separate concepts (Section 14) — this function is the one
// place they're combined into an actual eligibility decision.

import type { Person } from "@/lib/types/database";

export function isEligible(
  person: Pick<Person, "is_deceased" | "category_confirmed" | "professional_category">,
  category: "Nurse" | "Midwife"
): { eligible: boolean; reason?: string } {
  if (person.is_deceased) {
    return { eligible: false, reason: "This record is marked deceased." };
  }
  if (!person.category_confirmed) {
    return { eligible: false, reason: "Your Nurse/Midwife category hasn't been confirmed by the Council yet." };
  }
  const canParticipateInCategory =
    person.professional_category === "Both" || person.professional_category === category;
  if (!canParticipateInCategory) {
    return { eligible: false, reason: `You're only eligible to participate in the ${person.professional_category} category.` };
  }
  return { eligible: true };
}

// Service-category matching for voting/nominating specifically — a later
// confirmed addendum, not in the original rules document:
//   "A community nurse/midwife can vote for people in community...
//    A hospital nurse can vote for people in hospital... A community
//    midwife can vote for people in [community]... A hospital midwife
//    can vote for people in hospital... A private sector nurse can vote
//    for private sector nurses."
// A voter's own service_category (Hospital/Community/Private) now gates
// which candidates' service_category they can vote for or nominate, ON
// TOP OF the existing Nurse/Midwife license check above. All three are
// now genuinely separate, mutually exclusive pools — Private is NOT a
// wildcard.
//
// Deliberate fallback, not an oversight: roughly two-thirds of the
// register has no service_category on file at all (only ever populated
// from a 2026 roll that didn't cover everyone). Locking those people out
// of voting/nominating entirely over a data gap would be a severe, almost
// certainly unintended consequence — so anyone with NO service_category
// recorded at all (genuinely blank, not "Private") is treated as eligible
// for every pool until the Council fills in their actual workplace.
// Revisit once coverage is more complete.
export function serviceCategoryMatches(
  voterServiceCategory: string | null,
  candidateServiceCategory: string | null
): boolean {
  const RESTRICTED = ["Hospital", "Community", "Private"];
  if (!voterServiceCategory || !RESTRICTED.includes(voterServiceCategory)) return true;
  if (!candidateServiceCategory || !RESTRICTED.includes(candidateServiceCategory)) return true;
  return voterServiceCategory === candidateServiceCategory;
}
