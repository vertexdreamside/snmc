// PostgREST's filter mini-language treats comma, period, colon, and
// parentheses as structural characters: a comma separates the conditions
// inside an `.or(...)` string, and parentheses group an operator's
// argument list. Several of this app's free-text search boxes build one
// `.or()` string by interpolating the person's typed search text directly
// into it, to match against first/last name and reg. no. in a single
// OR'd condition — so a comma or parenthesis actually typed by the admin
// (not a special syntax they intended) corrupts the filter instead of
// being matched literally.
//
// Confirmed live: searching the register for "Nathasha, Josephine" — an
// exact, verbatim match of a real person's first name on file — returned
// zero results, because the embedded comma split the `.or()` string into
// extra malformed conditions. Several names in this register legitimately
// contain commas (e.g. "Jessy, Una", "Marcia, and Erica Dorby"), so this
// wasn't a hypothetical edge case.
//
// PostgREST's documented way to include a reserved character literally in
// a filter value is to wrap the WHOLE value in double quotes (see
// https://docs.postgrest.org/en/v12/references/api/url_grammar.html and
// https://github.com/PostgREST/postgrest/discussions/3466), escaping any
// backslash or embedded double-quote within it — an earlier version of
// this helper instead backslash-escaped the reserved characters directly,
// which is NOT how PostgREST's grammar actually treats them and did not
// fix the bug (confirmed live: the exact repro above still returned zero
// results with that version deployed). This produces the full
// double-quoted `%...%` ilike pattern ready to drop straight after
// `.ilike.` in the filter string — callers no longer add their own `%`
// wildcards, since this returns them already included.
export function ilikeAnywhere(term: string): string {
  const escaped = term.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"%${escaped}%"`;
}
