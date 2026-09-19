import { cn } from "@/utils/cn";
import { parseDateKey } from "@/utils/dates";
import type { CalendarEntry, CalendarType } from "@/types";
import { buildMonthGrid, entriesOnDay } from "../logic";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_CHIPS = 2;

export const TYPE_STYLES: Record<CalendarType, string> = {
  semester: "bg-brand-100 text-brand-900",
  exam: "bg-red-100 text-red-900",
  assignment: "bg-amber-100 text-amber-900",
  "add-drop": "bg-sky-100 text-sky-900",
  holiday: "bg-emerald-100 text-emerald-900",
  other: "bg-slate-100 text-slate-800",
};

interface MonthGridProps {
  anchor: Date;
  now: Date;
  entries: CalendarEntry[];
  selectedDay: string | null;
  onSelectDay: (dateKey: string) => void;
}

export function MonthGrid({ anchor, now, entries, selectedDay, onSelectDay }: MonthGridProps) {
  const days = buildMonthGrid(anchor, now);
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayEntries = entriesOnDay(entries, day.dateKey);
          const date = parseDateKey(day.dateKey);
          const selected = selectedDay === day.dateKey;
          return (
            <button
              key={day.dateKey}
              type="button"
              onClick={() => onSelectDay(day.dateKey)}
              aria-pressed={selected}
              aria-label={`${date?.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) ?? day.dateKey}, ${dayEntries.length} ${dayEntries.length === 1 ? "entry" : "entries"}`}
              className={cn(
                "min-h-20 border-b border-r border-slate-100 p-1.5 text-left align-top transition-colors hover:bg-brand-50 sm:min-h-24",
                !day.inMonth && "bg-slate-50/70 text-slate-400",
                selected && "bg-brand-50 ring-2 ring-inset ring-brand-500",
              )}
            >
              <span className={cn("inline-flex size-6 items-center justify-center rounded-full text-xs font-medium", day.isToday && "bg-brand-800 text-white")}>{date?.getDate()}</span>
              <span className="mt-1 hidden space-y-0.5 sm:block">
                {dayEntries.slice(0, MAX_CHIPS).map((entry) => (
                  <span key={entry.id} className={cn("block truncate rounded px-1 py-0.5 text-[11px] font-medium", TYPE_STYLES[entry.type])}>
                    {entry.title}
                  </span>
                ))}
                {dayEntries.length > MAX_CHIPS && <span className="block px-1 text-[11px] text-slate-500">+{dayEntries.length - MAX_CHIPS} more</span>}
              </span>
              {dayEntries.length > 0 && (
                <span className="mt-1 flex gap-0.5 sm:hidden" aria-hidden="true">
                  {dayEntries.slice(0, 3).map((entry) => (
                    <span key={entry.id} className={cn("size-1.5 rounded-full", TYPE_STYLES[entry.type])} />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
