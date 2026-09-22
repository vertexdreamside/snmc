"use client";

import { useState } from "react";
import { Save, Check, Trash2, Plus } from "lucide-react";
import { saveContent } from "@/app/admin/actions";
import type { RestaurantPhoto } from "@/lib/content";
import ImageUploadField from "@/components/admin/ImageUploadField";

function blankPhoto(): RestaurantPhoto {
  return { title: "New Photo", description: "", image: "" };
}

export default function RestaurantEditor({ initial }: { initial: RestaurantPhoto[] }) {
  const [photos, setPhotos] = useState<RestaurantPhoto[]>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof RestaurantPhoto>(i: number, key: K, value: RestaurantPhoto[K]) {
    setPhotos((prev) => prev.map((p, idx) => (idx === i ? { ...p, [key]: value } : p)));
    setSaved(false);
  }
  function remove(i: number) {
    setPhotos((prev) => prev.filter((_, idx) => idx !== i));
    setSaved(false);
  }
  function add() {
    setPhotos((prev) => [...prev, blankPhoto()]);
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const result = await saveContent("restaurant_photos", photos);
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
      <h1 className="text-xl sm:text-2xl font-semibold text-[#16241C] mb-1">Restaurant &amp; Bar</h1>
      <p className="text-sm text-[#3C4A41] mb-6">
        Photo cards shown on the Restaurant &amp; Bar page. The first photo is also used as that page&apos;s banner
        image.
      </p>

      <div className="space-y-6">
        {photos.map((photo, i) => (
          <div key={i} className="bg-white rounded-xl border border-[#EDE3CE] p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#8C8577]">
                Photo {i + 1}
                {i === 0 && <span className="ml-1.5 text-[#E3A857]">(banner)</span>}
              </span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
              >
                <Trash2 size={13} /> Remove
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-[#3C4A41] mb-1.5 block">
                Title
              </label>
              <input
                type="text"
                value={photo.title}
                onChange={(e) => update(i, "title", e.target.value)}
                className="w-full border border-[#C9C2B4] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#E3A857]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-[#3C4A41] mb-1.5 block">
                Description
              </label>
              <textarea
                value={photo.description}
                onChange={(e) => update(i, "description", e.target.value)}
                rows={3}
                className="w-full border border-[#C9C2B4] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#E3A857] resize-y"
              />
            </div>

            <ImageUploadField label="Photo" value={photo.image} onChange={(v) => update(i, "image", v)} />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={add}
        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#0F3D2E] border border-[#C9C2B4] rounded-lg px-4 py-2 hover:border-[#E3A857]"
      >
        <Plus size={15} /> Add Photo
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
