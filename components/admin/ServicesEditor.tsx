"use client";

import { useState } from "react";
import { Save, Check, Trash2, Plus } from "lucide-react";
import { saveContent } from "@/app/admin/actions";
import type { ServiceItem } from "@/lib/content";
import ImageUploadField from "@/components/admin/ImageUploadField";
import StringListEditor from "@/components/admin/StringListEditor";

function blankService(): ServiceItem {
  return { id: "", name: "New Service", tagline: "", description: "", highlights: [], image: "" };
}

export default function ServicesEditor({ initial }: { initial: ServiceItem[] }) {
  const [services, setServices] = useState<ServiceItem[]>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof ServiceItem>(i: number, key: K, value: ServiceItem[K]) {
    setServices((prev) => prev.map((s, idx) => (idx === i ? { ...s, [key]: value } : s)));
    setSaved(false);
  }
  function remove(i: number) {
    setServices((prev) => prev.filter((_, idx) => idx !== i));
    setSaved(false);
  }
  function add() {
    setServices((prev) => [...prev, blankService()]);
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const result = await saveContent("services", services);
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
      <h1 className="text-xl sm:text-2xl font-semibold text-[#16241C] mb-1">Services</h1>
      <p className="text-sm text-[#3C4A41] mb-6">
        Boat, buggy, bike and any other excursions shown on the Services page. The{" "}
        <span className="font-medium">ID</span> is used for the page anchor (e.g. <code>/services#boat</code>) and
        the WhatsApp enquiry message uses each service&apos;s Name.
      </p>

      <div className="space-y-6">
        {services.map((service, i) => (
          <div key={i} className="bg-white rounded-xl border border-[#EDE3CE] p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#8C8577]">Service {i + 1}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
              >
                <Trash2 size={13} /> Remove
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <TextField label="Name" value={service.name} onChange={(v) => update(i, "name", v)} />
              <TextField
                label="ID (anchor)"
                value={service.id}
                onChange={(v) => update(i, "id", v)}
                placeholder="boat"
              />
            </div>

            <TextField label="Tagline" value={service.tagline} onChange={(v) => update(i, "tagline", v)} />

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-[#3C4A41] mb-1.5 block">
                Description
              </label>
              <textarea
                value={service.description}
                onChange={(e) => update(i, "description", e.target.value)}
                rows={4}
                className="w-full border border-[#C9C2B4] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#E3A857] resize-y"
              />
            </div>

            <StringListEditor
              label="Highlights"
              items={service.highlights}
              onChange={(v) => update(i, "highlights", v)}
              placeholder="e.g. Half-day & full-day options"
            />

            <ImageUploadField label="Photo" value={service.image} onChange={(v) => update(i, "image", v)} />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={add}
        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#0F3D2E] border border-[#C9C2B4] rounded-lg px-4 py-2 hover:border-[#E3A857]"
      >
        <Plus size={15} /> Add Service
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-[#3C4A41] mb-1.5 block">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-[#C9C2B4] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#E3A857]"
      />
    </div>
  );
}
