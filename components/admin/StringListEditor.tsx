"use client";

import { Plus, Trash2 } from "lucide-react";

export default function StringListEditor({
  label,
  items,
  onChange,
  placeholder,
  multiline = false,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  function update(i: number, value: string) {
    const next = [...items];
    next[i] = value;
    onChange(next);
  }
  function remove(i: number) {
    onChange(items.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...items, ""]);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-[#3C4A41]">{label}</label>
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1 text-xs font-medium text-[#0F3D2E] hover:underline"
        >
          <Plus size={13} /> Add
        </button>
      </div>
      <div className="space-y-2">
        {items.length === 0 && <p className="text-xs text-[#8C8577]">Nothing here yet — click Add.</p>}
        {items.map((item, i) =>
          multiline ? (
            <div key={i} className="flex gap-2 items-start">
              <textarea
                value={item}
                onChange={(e) => update(i, e.target.value)}
                placeholder={placeholder}
                rows={2}
                className="flex-1 border border-[#C9C2B4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E3A857] resize-y"
              />
              <button type="button" onClick={() => remove(i)} className="text-[#8C8577] hover:text-red-600 mt-2">
                <Trash2 size={15} />
              </button>
            </div>
          ) : (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="text"
                value={item}
                onChange={(e) => update(i, e.target.value)}
                placeholder={placeholder}
                className="flex-1 border border-[#C9C2B4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E3A857]"
              />
              <button type="button" onClick={() => remove(i)} className="text-[#8C8577] hover:text-red-600">
                <Trash2 size={15} />
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}
