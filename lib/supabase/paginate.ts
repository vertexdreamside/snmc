// Supabase/PostgREST silently caps every query's returned rows at a
// server-side maximum (this project's is 1,000) — regardless of what the
// application code asks for. A plain `.select(...)` with no `.limit()`,
// or a `.limit()` set HIGHER than that server cap (e.g. `.limit(2000)`,
// `.limit(5000)`), both come back truncated with no error and nothing in
// the response indicating rows were dropped. The only way `data.length`
// tells you it happened is if you already know the true total.
//
// This was first found and fixed as a one-off in VoterParticipation.tsx
// (Nurse voter counts undercounted by the same mechanism). A live audit
// pass then found the SAME bug independently affecting the Dashboard's
// register-wide breakdown stats, the Register Report, the Licence Expiry
// monitor, and the Data Export module — all because the register (1,356
// people and growing) has now crossed the 1,000-row cap. Concretely: the
// Dashboard's "Expired Licences" tile read 597 when the true count across
// the full register was 665 — a silent ~10% undercount with no error
// anywhere.
//
// This helper is the one fix for the whole bug class: it pages through
// with `.range()` in 1,000-row windows (comfortably under the server cap)
// until a page comes back short, so every caller gets the true, complete
// result set no matter how large the underlying table grows in the
// future — without every call site having to hand-roll its own loop.
//
// Usage: pass a FACTORY that builds a fresh query each call (Supabase
// query builders are single-use once awaited), with every filter/order
// already chained on, but no `.range()`/`.limit()` — this helper adds
// `.range()` itself for each page.
//
//   const rows = await fetchAllRows<PersonRow>(() =>
//     supabase.from("people").select("id, first_name, last_name").eq("is_deceased", false).order("last_name")
//   );
interface RangeableQuery<T> {
  range(from: number, to: number): PromiseLike<{ data: T[] | null; error: unknown }>;
}

export async function fetchAllRows<T>(makeQuery: () => RangeableQuery<T>): Promise<T[]> {
  const PAGE_SIZE = 1000;
  const all: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await makeQuery().range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE_SIZE) break;
  }
  return all;
}
