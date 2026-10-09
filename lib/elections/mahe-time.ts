// Seychelles (Indian/Mahe) is UTC+04:00 all year, with no daylight saving.
// Election times typed into the admin forms are Seychelles wall-clock
// times. The server runs in UTC, so a bare "2026-10-09T10:00" must NOT be
// parsed with `new Date(...)` there (it would be read as 10:00 UTC, i.e.
// 14:00 in Seychelles). These helpers always read and show Seychelles time.

const MAHE_OFFSET = "+04:00";

// "2026-10-09T10:00" (from a datetime-local input) -> ISO instant.
// Strings that already carry a zone (Z or +hh:mm) are left as they are.
export function maheLocalToIso(value: string): string {
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(value);
  const withSeconds = /T\d{2}:\d{2}$/.test(value) ? `${value}:00` : value;
  return new Date(hasZone ? value : `${withSeconds}${MAHE_OFFSET}`).toISOString();
}

// ISO instant -> "YYYY-MM-DDTHH:mm" in Seychelles time, for datetime-local.
export function isoToMaheInput(iso: string | null): string {
  if (!iso) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Indian/Mahe", hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  const hour = get("hour") === "24" ? "00" : get("hour");
  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}
