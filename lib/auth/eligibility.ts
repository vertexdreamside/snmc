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
