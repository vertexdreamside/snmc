"use client";

import { useState } from "react";
import { Save, Check, Trash2 } from "lucide-react";
import Calendar from "@/components/Calendar";
import { saveContent } from "@/app/admin/actions";
import type { Availability, Room } from "@/lib/content";
import { fromISODate, startOfMonth } from "@/lib/date";

export default function AvailabilityEditor({
  initial,
  rooms,
}: {
  initial: Availability;
  rooms: Room[];
}) {
  const [availability, setAvailability] = useState<Availability>(initial);
  const [activeRoom, setActiveRoom] = useState(rooms[0]?.slug ?? "");
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const blocked = availability.blockedDates[activeRoom] ?? [];

  function toggleDate(iso: string) {
    setAvailability((prev) => {
      const current = prev.blockedDates[activeRoom] ?? [];
      const next = current.includes(iso) ? current.filter((d) => d !== iso) : [...current, iso].sort();
      return { ...prev, blockedDates: { ...prev.blockedDates, [activeRoom]: next } };
    });
    setSaved(false);
  }

  function clearRoom() {
    setAvailability((prev) => ({ ...prev, blockedDates: { ...prev.blockedDates, [activeRoom]: [] } }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const result = await saveContent("availability", availability);
    setSaving(false);
    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl sm:text-2xl font-semibold text-[#16241C] mb-1">Availability</h1>
      <p className="text-sm text-[#3C4A41] mb-6">
        Tap a date to block or unblock it for the selected room. Blocked dates can&apos;t be picked on the public
        booking calendar.
      </p>

      <div className="flex flex-wrap gap-2 mb-5">
        {rooms.map((r) => (
          <button
            key={r.slug}
            onClick={() => setActiveRoom(r.slug)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeRoom === r.slug
                ? "bg-[#0F3D2E] text-white"
                : "bg-white border border-[#EDE3CE] text-[#3C4A41] hover:border-[#E3A857]"
            }`}
          >
            {r.name}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <Calendar
          month={month}
          onMonthChange={setMonth}
          blockedDates={[]}
          selectedDates={blocked}
          onSelect={(iso) => toggleDate(iso)}
        />

        <div className="bg-white rounded-xl border border-[#EDE3CE] p-4 flex-1 w-full sm:max-w-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#16241C]">
              Blocked dates <span className="text-[#8C8577] font-normal">({blocked.length})</span>
            </h3>
            {blocked.length > 0 && (
              <button onClick={clearRoom} className="text-xs text-red-600 flex items-center gap-1 hover:underline">
                <Trash2 size={13} /> Clear all
              </button>
            )}
          </div>
          {blocked.length === 0 ? (
            <p className="text-xs text-[#8C8577]">No dates blocked — this room shows as fully open.</p>
          ) : (
            <ul className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {blocked.map((iso) => (
                <li key={iso} className="flex items-center justify-between text-xs text-[#3C4A41]">
                  <span>{fromISODate(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                  <button onClick={() => toggleDate(iso)} className="text-[#8C8577] hover:text-red-600">
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-5 inline-flex items-center gap-2 bg-[#0F3D2E] text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-[#1D5C41] transition-colors disabled:opacity-60"
      >
        {saved ? <Check size={16} /> : <Save size={16} />}
        {saving ? "Saving…" : saved ? "Saved" : "Save Changes"}
      </button>
    </div>
  );
}
