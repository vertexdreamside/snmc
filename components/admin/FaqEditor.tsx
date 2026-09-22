"use client";

import { useState } from "react";
import { Save, Check, Trash2, Plus } from "lucide-react";
import { saveContent } from "@/app/admin/actions";
import type { Faq } from "@/lib/content";

function blankItem() {
  return { question: "New question?", answer: "" };
}

export default function FaqEditor({ initial }: { initial: Faq }) {
  const [faq, setFaq] = useState<Faq>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof Faq>(key: K, value: Faq[K]) {
    setFaq((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  function updateHours(i: number, field: "label" | "time", value: string) {
    const next = faq.restaurantHours.map((h, idx) => (idx === i ? { ...h, [field]: value } : h));
    set("restaurantHours", next);
  }

  function updateItem(i: number, field: "question" | "answer", value: string) {
    const next = faq.items.map((it, idx) => (idx === i ? { ...it, [field]: value } : it));
    set("items", next);
  }
  function removeItem(i: number) {
    set("items", faq.items.filter((_, idx) => idx !== i));
  }
  function addItem() {
    set("items", [...faq.items, blankItem()]);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const result = await saveContent("faq", faq);
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
      <h1 className="text-xl sm:text-2xl font-semibold text-[#16241C] mb-1">FAQ</h1>
      <p className="text-sm text-[#3C4A41] mb-6">
        Check-in/out times, restaurant hours, and the questions shown on the FAQ page.
      </p>

      <Section title="Check-in / Check-out">
        <div className="grid sm:grid-cols-2 gap-4">
          <TextField label="Check-in time" value={faq.checkIn} onChange={(v) => set("checkIn", v)} />
          <TextField label="Check-out time" value={faq.checkOut} onChange={(v) => set("checkOut", v)} />
        </div>
        <div className="mt-4">
          <label className="text-xs font-semibold uppercase tracking-wide text-[#3C4A41] mb-1.5 block">
            Early/late note
          </label>
          <textarea
            value={faq.checkInOutNote}
            onChange={(e) => set("checkInOutNote", e.target.value)}
            rows={3}
            className="w-full border border-[#C9C2B4] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#E3A857] resize-y"
          />
        </div>
      </Section>

      <Section title="Restaurant Hours">
        <div className="space-y-3">
          {faq.restaurantHours.map((h, i) => (
            <div key={i} className="grid sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={h.label}
                onChange={(e) => updateHours(i, "label", e.target.value)}
                placeholder="Breakfast"
                className="border border-[#C9C2B4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E3A857]"
              />
              <input
                type="text"
                value={h.time}
                onChange={(e) => updateHours(i, "time", e.target.value)}
                placeholder="07:00hrs – 10:00hrs"
                className="border border-[#C9C2B4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E3A857]"
              />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Questions & Answers">
        <div className="space-y-4">
          {faq.items.map((item, i) => (
            <div key={i} className="border border-[#EDE3CE] rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#8C8577]">
                  Question {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
                >
                  <Trash2 size={13} /> Remove
                </button>
              </div>
              <input
                type="text"
                value={item.question}
                onChange={(e) => updateItem(i, "question", e.target.value)}
                className="w-full border border-[#C9C2B4] rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-[#E3A857]"
              />
              <textarea
                value={item.answer}
                onChange={(e) => updateItem(i, "answer", e.target.value)}
                rows={3}
                className="w-full border border-[#C9C2B4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E3A857] resize-y"
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addItem}
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#0F3D2E] border border-[#C9C2B4] rounded-lg px-4 py-2 hover:border-[#E3A857]"
        >
          <Plus size={15} /> Add Question
        </button>
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

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-[#3C4A41] mb-1.5 block">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-[#C9C2B4] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#E3A857]"
      />
    </div>
  );
}
