"use client";

import { useState } from "react";
import { Save, Check, Plus, Trash2 } from "lucide-react";
import { saveContent } from "@/app/admin/actions";
import type { Pricing } from "@/lib/content";
import StringListEditor from "@/components/admin/StringListEditor";

type SeasonKey = "low" | "high" | "peak";

export default function PricingEditor({ initial }: { initial: Pricing }) {
  const [pricing, setPricing] = useState<Pricing>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof Pricing>(key: K, value: Pricing[K]) {
    setPricing((p) => ({ ...p, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const result = await saveContent("pricing", pricing);
    setSaving(false);
    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else {
      setError(result.error);
    }
  }

  function updateRate(roomIdx: number, season: SeasonKey, value: number) {
    const next = pricing.rates.map((r, i) => (i === roomIdx ? { ...r, [season]: value } : r));
    set("rates", next);
  }

  function updateSeasonDates(seasonIdx: number, dates: string) {
    const next = pricing.seasons.map((s, i) => (i === seasonIdx ? { ...s, dates } : s));
    set("seasons", next);
  }

  function updateRange(i: number, field: "season" | "start" | "end", value: string) {
    const next = pricing.seasonRanges.map((r, idx) =>
      idx === i ? { ...r, [field]: value } : r
    ) as Pricing["seasonRanges"];
    set("seasonRanges", next);
  }
  function removeRange(i: number) {
    set("seasonRanges", pricing.seasonRanges.filter((_, idx) => idx !== i));
  }
  function addRange() {
    set("seasonRanges", [...pricing.seasonRanges, { season: "low", start: "", end: "" }]);
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl sm:text-2xl font-semibold text-[#16241C] mb-1">Pricing</h1>
      <p className="text-sm text-[#3C4A41] mb-6">
        Rates, seasons and booking terms. Room rates only appear to guests after they select their dates — this
        data drives that calculation, so keep the season date ranges accurate.
      </p>

      {/* Rates */}
      <Section title="Room Rates by Season">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[420px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-[#8C8577]">
                <th className="pb-2 pr-2">Room</th>
                <th className="pb-2 px-2">Low ({pricing.currency})</th>
                <th className="pb-2 px-2">High ({pricing.currency})</th>
                <th className="pb-2 pl-2">Peak ({pricing.currency})</th>
              </tr>
            </thead>
            <tbody>
              {pricing.rates.map((r, i) => (
                <tr key={r.room} className="border-t border-[#EDE3CE]">
                  <td className="py-2 pr-2 font-medium text-[#16241C]">{r.room}</td>
                  {(["low", "high", "peak"] as SeasonKey[]).map((s) => (
                    <td key={s} className="py-2 px-2">
                      <input
                        type="number"
                        value={r[s]}
                        onChange={(e) => updateRate(i, s, Number(e.target.value) || 0)}
                        className="w-24 border border-[#C9C2B4] rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#E3A857]"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-[#8C8577] mt-2">
          Room names here must exactly match the room names in the Rooms section for rates to match up correctly.
        </p>
      </Section>

      {/* Minimum stay */}
      <Section title="Minimum Stay (nights)">
        <div className="grid grid-cols-3 gap-4 max-w-sm">
          {(["low", "high", "peak"] as SeasonKey[]).map((s) => (
            <div key={s}>
              <label className="text-xs font-semibold uppercase tracking-wide text-[#3C4A41] mb-1.5 block capitalize">
                {s}
              </label>
              <input
                type="number"
                value={pricing.minStay[s]}
                onChange={(e) => set("minStay", { ...pricing.minStay, [s]: Number(e.target.value) || 1 })}
                className="w-full border border-[#C9C2B4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E3A857]"
              />
            </div>
          ))}
        </div>
      </Section>

      {/* Season display dates */}
      <Section title="Season Dates (shown to guests)">
        <div className="space-y-3">
          {pricing.seasons.map((s, i) => (
            <div key={s.name}>
              <label className="text-xs font-semibold uppercase tracking-wide text-[#3C4A41] mb-1.5 block">
                {s.name}
              </label>
              <input
                type="text"
                value={s.dates}
                onChange={(e) => updateSeasonDates(i, e.target.value)}
                className="w-full border border-[#C9C2B4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E3A857]"
              />
            </div>
          ))}
        </div>
      </Section>

      {/* Machine-readable season ranges */}
      <Section title="Season Date Ranges (used to calculate rates automatically)">
        <p className="text-xs text-[#8C8577] mb-3">
          These exact date ranges determine which season — and which minimum-stay rule and rate — applies to a
          guest's selected dates. Use YYYY-MM-DD format.
        </p>
        <div className="space-y-2">
          {pricing.seasonRanges.map((r, i) => (
            <div key={i} className="flex flex-wrap gap-2 items-center">
              <select
                value={r.season}
                onChange={(e) => updateRange(i, "season", e.target.value)}
                className="border border-[#C9C2B4] rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#E3A857]"
              >
                <option value="low">Low</option>
                <option value="high">High</option>
                <option value="peak">Peak</option>
              </select>
              <input
                type="date"
                value={r.start}
                onChange={(e) => updateRange(i, "start", e.target.value)}
                className="border border-[#C9C2B4] rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#E3A857]"
              />
              <span className="text-[#8C8577] text-sm">to</span>
              <input
                type="date"
                value={r.end}
                onChange={(e) => updateRange(i, "end", e.target.value)}
                className="border border-[#C9C2B4] rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#E3A857]"
              />
              <button type="button" onClick={() => removeRange(i)} className="text-[#8C8577] hover:text-red-600">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addRange}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#0F3D2E] border border-[#C9C2B4] rounded-full px-3 py-1.5 hover:border-[#E3A857]"
        >
          <Plus size={13} /> Add date range
        </button>
      </Section>

      {/* Offers & extras */}
      <Section title="Offers & Extras">
        <StringListEditor label="" items={pricing.extras} onChange={(v) => set("extras", v)} multiline />
      </Section>

      {/* Deposit / cancellation / occupancy */}
      <Section title="Deposit Terms">
        <StringListEditor label="" items={pricing.prepayment} onChange={(v) => set("prepayment", v)} multiline />
      </Section>
      <Section title="Cancellation Policy">
        <StringListEditor label="" items={pricing.cancellation} onChange={(v) => set("cancellation", v)} multiline />
      </Section>
      <Section title="Occupancy Note">
        <textarea
          value={pricing.occupancy}
          onChange={(e) => set("occupancy", e.target.value)}
          rows={3}
          className="w-full border border-[#C9C2B4] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#E3A857] resize-y"
        />
      </Section>
      <Section title="Validity & Note">
        <div className="space-y-3">
          <input
            type="text"
            value={pricing.validity}
            onChange={(e) => set("validity", e.target.value)}
            className="w-full border border-[#C9C2B4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E3A857]"
          />
          <textarea
            value={pricing.note}
            onChange={(e) => set("note", e.target.value)}
            rows={2}
            className="w-full border border-[#C9C2B4] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#E3A857] resize-y"
          />
        </div>
      </Section>

      {error && (
        <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-2 inline-flex items-center gap-2 bg-[#0F3D2E] text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-[#1D5C41] transition-colors disabled:opacity-60"
      >
        {saved ? <Check size={16} /> : <Save size={16} />}
        {saving ? "Saving…" : saved ? "Saved" : "Save Changes"}
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-[#EDE3CE] p-5 sm:p-6 mb-6">
      <h2 className="text-sm font-semibold text-[#16241C] mb-3">{title}</h2>
      {children}
    </div>
  );
}
