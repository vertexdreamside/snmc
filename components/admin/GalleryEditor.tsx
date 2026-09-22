"use client";

import { useState } from "react";
import { Save, Check, Trash2, Plus } from "lucide-react";
import { saveContent } from "@/app/admin/actions";
import ImageUploadField from "@/components/admin/ImageUploadField";

export default function GalleryEditor({ initial }: { initial: string[] }) {
  const [images, setImages] = useState<string[]>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(i: number, value: string) {
    setImages((prev) => prev.map((img, idx) => (idx === i ? value : img)));
    setSaved(false);
  }
  function remove(i: number) {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
    setSaved(false);
  }
  function add() {
    setImages((prev) => [...prev, ""]);
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const result = await saveContent("gallery_images", images);
    setSaving(false);
    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl sm:text-2xl font-semibold text-[#16241C] mb-1">Gallery</h1>
      <p className="text-sm text-[#3C4A41] mb-6">The photo grid shown near the bottom of the homepage.</p>

      <div className="grid sm:grid-cols-2 gap-4">
        {images.map((img, i) => (
          <div key={i} className="bg-white rounded-xl border border-[#EDE3CE] p-4">
            <ImageUploadField label={`Image ${i + 1}`} value={img} onChange={(v) => update(i, v)} />
            <button
              type="button"
              onClick={() => remove(i)}
              className="mt-3 inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
            >
              <Trash2 size={13} /> Remove
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={add}
        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#0F3D2E] border border-[#C9C2B4] rounded-lg px-4 py-2 hover:border-[#E3A857]"
      >
        <Plus size={15} /> Add Image
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
