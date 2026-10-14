// Safeguard: an election whose name starts with "TEST" is a rehearsal.
// Real register members must never see it (home page, nominate, vote,
// results). Only test accounts — people whose first or last name starts
// with "TEST" — can see and use it.
export function isTestElection(termLabel: string | null | undefined): boolean {
  return /^\s*TEST\b/i.test(termLabel ?? "");
}

export function isTestPerson(p: { first_name?: string | null; last_name?: string | null }): boolean {
  return /^\s*TEST/i.test(p.first_name ?? "") || /^\s*TEST/i.test(p.last_name ?? "");
}

export function canSeeElection(
  termLabel: string | null | undefined,
  p: { first_name?: string | null; last_name?: string | null }
): boolean {
  return !isTestElection(termLabel) || isTestPerson(p);
}
