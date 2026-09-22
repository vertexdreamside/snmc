import type { Pricing } from "@/lib/content";

export type Season = "low" | "high" | "peak";

function toDate(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

/** Which season a given date falls into, or null if outside all defined ranges. */
export function seasonForDate(dateISO: string, pricing: Pricing): Season | null {
  const t = toDate(dateISO).getTime();
  for (const r of pricing.seasonRanges) {
    if (t >= toDate(r.start).getTime() && t <= toDate(r.end).getTime()) return r.season;
  }
  return null;
}

export function nightsBetween(arrivalISO: string, departureISO: string): number {
  const ms = toDate(departureISO).getTime() - toDate(arrivalISO).getTime();
  return Math.round(ms / 86400000);
}

export function minNightsForSeason(season: Season | null, pricing: Pricing): number {
  if (!season) return pricing.minStay.low;
  return pricing.minStay[season];
}

export function seasonLabel(season: Season | null): string {
  if (season === "low") return "Low Season";
  if (season === "high") return "High Season";
  if (season === "peak") return "Peak Season";
  return "the selected dates";
}

function rateForRoomSeason(pricing: Pricing, roomName: string, season: Season): number | null {
  const row = pricing.rates.find((r) => r.room === roomName);
  if (!row) return null;
  return row[season];
}

function daysUntil(dateISO: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((toDate(dateISO).getTime() - now.getTime()) / 86400000);
}

export type StaySummary = {
  season: Season | null;
  nights: number;
  minNights: number;
  meetsMinStay: boolean;
  nightlyRate: number | null;
  totalRate: number | null;
  earlyBirdEligible: boolean;
  earlyBirdPct: number;
  longStayEligible: boolean;
  depositText: string;
  cancellationText: string;
};

/**
 * Computes everything the booking UI needs to reveal once a guest has
 * picked their dates (and, on the full booking panel, a room): which
 * season applies, whether the stay meets the minimum-night rule, the
 * rate for that room/season, and which offers + terms apply.
 */
export function computeStay(pricing: Pricing, arrivalISO: string, departureISO: string, roomName?: string): StaySummary {
  const season = seasonForDate(arrivalISO, pricing);
  const nights = nightsBetween(arrivalISO, departureISO);
  const minNights = minNightsForSeason(season, pricing);
  const meetsMinStay = nights >= minNights;

  const nightlyRate = roomName && season ? rateForRoomSeason(pricing, roomName, season) : null;
  const totalRate = nightlyRate != null ? nightlyRate * nights : null;

  const leadDays = daysUntil(arrivalISO);
  const earlyBirdEligible = leadDays >= 60 && nights >= 3 && (season === "low" || season === "high");
  const earlyBirdPct = season === "high" ? 10 : season === "low" ? 5 : 0;
  const longStayEligible = nights >= 7 && season === "high";

  const depositText =
    season === "peak"
      ? "A 100% deposit is due 21 days before arrival."
      : "A 50% deposit is due 7 days before arrival, with the remaining 50% due on check-in.";
  const cancellationText =
    season === "peak"
      ? "Free cancellation 22+ days before arrival. Inside that window, or for no-shows/early departures, the full amount is charged."
      : "Free cancellation 8+ days before arrival. 0–7 days before arrival: 50% charge. No-shows or early departures: full charge.";

  return {
    season,
    nights,
    minNights,
    meetsMinStay,
    nightlyRate,
    totalRate,
    earlyBirdEligible,
    earlyBirdPct,
    longStayEligible,
    depositText,
    cancellationText,
  };
}
