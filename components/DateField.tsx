"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import Calendar from "@/components/Calendar";
import { fromISODate, startOfMonth } from "@/lib/date";

export default function DateField({
  label,
  value,
  onChange,
  blockedDates = [],
  minDate,
}: {
  label: string;
  value: string; // ISO yyyy-mm-dd, or ""
  onChange: (iso: string) => void;
  blockedDates?: string[];
  minDate?: Date;
}) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(startOfMonth(value ? fromISODate(value) : minDate ?? new Date()));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const display = value
    ? fromISODate(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "Select date";

  return (
    <div className="relative" ref={ref}>
      <label className="text-[0.72rem] uppercase tracking-wide text-ink-soft font-semibold block mb-1.5">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="field-input w-full flex items-center justify-between gap-2 text-left"
      >
        <span className={value ? "text-ink" : "text-ink-soft"}>{display}</span>
        <CalendarDays size={16} className="text-green-deep shrink-0" />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 left-0 right-0 sm:right-auto flex justify-start">
          <Calendar
            month={month}
            onMonthChange={setMonth}
            selectedDates={value ? [value] : []}
            blockedDates={blockedDates}
            minDate={minDate}
            onSelect={(iso) => {
              onChange(iso);
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
