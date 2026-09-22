"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addMonths,
  getMonthGrid,
  isSameDay,
  MONTH_LABEL,
  startOfMonth,
  startOfToday,
  toISODate,
  WEEKDAY_LABELS,
} from "@/lib/date";

export default function Calendar({
  month: controlledMonth,
  onMonthChange,
  selectedDates = [],
  blockedDates = [],
  onSelect,
  minDate,
  className = "",
}: {
  /** Initial month shown; component manages its own paging if onMonthChange isn't passed. */
  month?: Date;
  onMonthChange?: (month: Date) => void;
  /** ISO yyyy-mm-dd strings that should render as selected/highlighted. */
  selectedDates?: string[];
  /** ISO yyyy-mm-dd strings that can't be picked. */
  blockedDates?: string[];
  onSelect: (isoDate: string, date: Date) => void;
  minDate?: Date;
  className?: string;
}) {
  const [internalMonth, setInternalMonth] = useState(startOfMonth(controlledMonth ?? new Date()));
  const month = controlledMonth ?? internalMonth;
  const setMonth = onMonthChange ?? setInternalMonth;

  const today = startOfToday();
  const floor = minDate ?? today;
  const cells = getMonthGrid(month);
  const blockedSet = new Set(blockedDates);
  const selectedSet = new Set(selectedDates);

  return (
    <div className={`bg-white rounded-2xl shadow-soft p-3.5 sm:p-4 select-none w-[min(300px,88vw)] ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setMonth(addMonths(month, -1))}
          className="w-8 h-8 rounded-full flex items-center justify-center text-green-deep hover:bg-green-pale transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="font-display text-sm text-green-deep">{MONTH_LABEL(month)}</span>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setMonth(addMonths(month, 1))}
          className="w-8 h-8 rounded-full flex items-center justify-center text-green-deep hover:bg-green-pale transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LABELS.map((d) => (
          <span key={d} className="text-[0.68rem] text-center text-ink-soft font-medium py-1">
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map(({ date, inMonth }) => {
          const iso = toISODate(date);
          const isPast = date < floor;
          const isBlocked = blockedSet.has(iso);
          const isSelected = selectedSet.has(iso);
          const isToday = isSameDay(date, today);
          const disabled = isPast || isBlocked;

          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(iso, date)}
              className={[
                "aspect-square rounded-lg text-xs flex items-center justify-center transition-colors relative",
                !inMonth ? "text-granite-light/50" : "text-ink",
                disabled ? "cursor-not-allowed line-through text-granite-light/60" : "hover:bg-green-pale cursor-pointer",
                isSelected ? "bg-green-deep text-white hover:bg-green-deep" : "",
                isToday && !isSelected ? "font-bold text-gold-deep" : "",
              ].join(" ")}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
