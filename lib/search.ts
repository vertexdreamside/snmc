// PostgREST's filter mini-language treats comma and parentheses as
// structural characters: a comma separates the conditions inside an
// `.or(...)` string, and parentheses group an operator's argument list
// (e.g. `not.in.(1,2,3)`). Several of this app's free-text search boxes
// build one `.or()` string by interpolating the person's typed search
// text directly into it, to match against first/last name and reg. no.
// in a single OR'd condition — so a comma or parenthesis actually typed
// by the admin (not a special syntax they intended) corrupts the filter
// instead of being matched literally.
//
// Confirmed live: searching the register for "Nathasha, Josephine" — an
// exact, verbatim match of a real person's first name on file — returned
// zero results, because the embedded comma split the `.or()` string into
// extra malformed conditions. Several names in this register legitimately
// contain commas (e.g. "Jessy, Una", "Marcia, and Erica Dorby"), so this
// wasn't a hypothetical edge case.
//
// PostgREST's own escaping rule for a literal occurrence of a structural
// character in a filter value is a backslash prefix. This applies that
// escaping to whatever the admin typed, so the search box matches the
// data as it actually is instead of silently failing on real names.
export function escapePostgrestFilterValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/[,()]/g, "\\$&");
}
