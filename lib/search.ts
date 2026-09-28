// Building a single "or=(...)" combinator string by hand for a
// multi-column free-text search is fragile: PostgREST treats comma and
// parentheses as structural inside that specific string (comma separates
// conditions, parentheses group an operator's arguments). Two live
// attempts at escaping around that — first backslash-escaping the
// reserved characters, then PostgREST's own documented double-quote
// wrapping for reserved characters in a value — both still broke on a
// literal comma actually typed into the search box (confirmed live both
// times: searching for "Nathasha, Josephine", an exact real name on
// file, kept returning zero results or an outright query error).
//
// Rather than keep guessing at combinator-string escaping rules that
// aren't fully documented, this sidesteps the problem entirely. A plain,
// single-column filter like `.ilike(column, pattern)` is NOT a combinator
// string — it's one ordinary "key=value" query parameter, where a comma
// in the value is just a character like any other, with no escaping
// question at all. So instead of one OR'd multi-column string, this runs
// one ILIKE query per searchable column, takes the union of matching ids,
// and hands that back for the caller to apply as `.in("id", ids)`
// alongside whatever pagination/ordering/other filters it already has.
export async function searchPersonIds(
  supabase: { from(table: "people"): { select(cols: "id"): { ilike(column: string, pattern: string): PromiseLike<{ data: { id: string }[] | null; error: unknown }> } } },
  term: string,
  columns: string[]
): Promise<string[]> {
  const pattern = `%${term}%`;
  const results = await Promise.all(columns.map((col) => supabase.from("people").select("id").ilike(col, pattern)));
  const ids = new Set<string>();
  for (const { data } of results) {
    for (const row of data ?? []) ids.add(row.id);
  }
  return Array.from(ids);
}

// A UUID that will never match a real row — used so `.in("id", [...])`
// with zero real matches reliably returns zero rows instead of needing
// special-case handling for an empty array at every call site.
export const NO_MATCH_ID = "00000000-0000-0000-0000-000000000000";
