import { CalendarRange } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { describeAudience, isEveryone } from "@/lib/audience";
import type { CalendarEntry } from "@/types";
import { cn } from "@/utils/cn";
import { formatDate, daysUntil } from "@/utils/dates";
import { CALENDAR_TYPE_LABELS, isMultiDay } from "../logic";
import { TYPE_STYLES } from "./MonthGrid";

export function EntryList({ entries, now, showRelative = true }: { entries: CalendarEntry[]; now: Date; showRelative?: boolean }) {
  return (
    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-card">
      {entries.map((entry) => {
        const days = daysUntil(entry.startDate, now);
        return (
          <li key={entry.id} className="flex items-start gap-3 p-4">
            <span className={cn("mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg", TYPE_STYLES[entry.type])}>
              <CalendarRange className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium text-slate-900">{entry.title}</h3>
                <Badge>{CALENDAR_TYPE_LABELS[entry.type]}</Badge>
                {showRelative && days >= 0 && days <= 14 && <Badge tone="accent">{days === 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`}</Badge>}
              </div>
              <p className="mt-0.5 text-sm text-slate-600">{isMultiDay(entry) ? `${formatDate(entry.startDate)} to ${formatDate(entry.endDate)}` : formatDate(entry.startDate)}</p>
              {entry.description && <p className="mt-1 text-sm text-slate-500">{entry.description}</p>}
              {!isEveryone(entry.audience) && <p className="mt-1 text-xs text-slate-500">For: {describeAudience(entry.audience)}</p>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
