"use client";

import { useState } from "react";
import { Save, Check, Trash2, Plus } from "lucide-react";
import { saveContent } from "@/app/admin/actions";
import type { Room } from "@/lib/content";
import ImageUploadField from "@/components/admin/ImageUploadField";
import StringListEditor from "@/components/admin/StringListEditor";

function blankRoom(): Room {
  return {
    slug: "",
    name: "New Room",
    tagline: "",
    description: "",
    bedding: "",
    occupancy: "",
    guestOptions: [],
    highlights: [],
    image: "",
    priceFrom: 0,
  };
}

export default function RoomsEditor({ initial }: { initial: Room[] }) {
  const [rooms, setRooms] = useState<Room[]>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof Room>(i: number, key: K, value: Room[K]) {
    setRooms((prev) => prev.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
    setSaved(false);
  }
  function remove(i: number) {
    setRooms((prev) => prev.filter((_, idx) => idx !== i));
    setSaved(false);
  }
  function add() {
    setRooms((prev) => [...prev, blankRoom()]);
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const result = await saveContent("rooms", rooms);
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
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl sm:text-2xl font-semibold text-[#16241C]">Rooms</h1>
      </div>
      <p className="text-sm text-[#3C4A41] mb-6">
        Room details shown on the homepage and Rooms page. Note: the{" "}
        <span className="font-medium">URL Slug</span> is used in links (e.g. <code>/rooms#superior</code>) and in
        the Pricing section to match rates to a room — keep it lowercase with no spaces, and update Pricing if you
        rename it.
      </p>

      <div className="space-y-6">
        {rooms.map((room, i) => (
          <div key={i} className="bg-white rounded-xl border border-[#EDE3CE] p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#8C8577]">
                Room {i + 1}
              </span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
              >
                <Trash2 size={13} /> Remove room
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <TextField label="Name" value={room.name} onChange={(v) => update(i, "name", v)} />
              <TextField
                label="URL Slug"
                value={room.slug}
                onChange={(v) => update(i, "slug", v)}
                placeholder="superior"
              />
            </div>

            <TextField label="Tagline" value={room.tagline} onChange={(v) => update(i, "tagline", v)} />

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-[#3C4A41] mb-1.5 block">
                Description
              </label>
              <textarea
                value={room.description}
                onChange={(e) => update(i, "description", e.target.value)}
                rows={4}
                className="w-full border border-[#C9C2B4] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#E3A857] resize-y"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <TextField label="Bedding" value={room.bedding} onChange={(v) => update(i, "bedding", v)} />
              <TextField label="Occupancy (shown as text)" value={room.occupancy} onChange={(v) => update(i, "occupancy", v)} />
            </div>

            <StringListEditor
              label="Guest Options (booking form dropdown)"
              items={room.guestOptions}
              onChange={(v) => update(i, "guestOptions", v)}
              placeholder="e.g. 2 Adults + 1 Child (6–11 yrs)"
            />

            <StringListEditor
              label="Highlights"
              items={room.highlights}
              onChange={(v) => update(i, "highlights", v)}
              placeholder="e.g. Private balcony"
            />

            <ImageUploadField label="Photo" value={room.image} onChange={(v) => update(i, "image", v)} />

            <TextField
              label="Reference price (informational — actual rates live in Pricing)"
              value={String(room.priceFrom)}
              onChange={(v) => update(i, "priceFrom", Number(v) || 0)}
              type="number"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={add}
        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#0F3D2E] border border-[#C9C2B4] rounded-lg px-4 py-2 hover:border-[#E3A857]"
      >
        <Plus size={15} /> Add Room
      </button>

      {error && (
        <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-5 inline-flex items-center gap-2 bg-[#0F3D2E] text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-[#1D5C41] transition-colors disabled:opacity-60"
        >
          {saved ? <Check size={16} /> : <Save size={16} />}
          {saving ? "Saving…" : saved ? "Saved" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-[#3C4A41] mb-1.5 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-[#C9C2B4] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#E3A857]"
      />
    </div>
  );
}
