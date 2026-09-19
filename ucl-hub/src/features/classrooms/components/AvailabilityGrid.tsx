import { cn } from "@/utils/cn";
import { minutesToTime, timeToMinutes } from "@/utils/dates";
import type { TimeBand } from "../logic";

interface AvailabilityGridProps {
  bands: TimeBand[];
  startTime: string;
  endTime: string;
  slotMinutes: number;
  /** Called with the band the user clicked. */
  onPick: (time: string) => void;
}

/** Half-hour strip for one room and day: free, taken and the currently selected range. */
export function AvailabilityGrid({ bands, startTime, endTime, slotMinutes, onPick }: AvailabilityGridProps) {
  const start = startTime ? timeToMinutes(startTime) : Number.NaN;
  const end = endTime ? timeToMinutes(endTime) : Number.NaN;

  return (
    <div role="group" aria-label="Available times" className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
      {bands.map((band) => {
        const minute = timeToMinutes(band.time);
        const selected = !Number.isNaN(start) && minute >= start && (Number.isNaN(end) ? minute === start : minute < end);
        const label = `${band.time} to ${minutesToTime(minute + slotMinutes)}`;
        return (
          <button
            key={band.slot}
            type="button"
            disabled={!band.free}
            aria-pressed={selected}
            aria-label={`${label}, ${band.free ? "available" : "taken"}`}
            onClick={() => onPick(band.time)}
            className={cn(
              "rounded-lg border px-2 py-1.5 text-xs font-medium tabular-nums transition-colors",
              selected && "border-brand-800 bg-brand-800 text-white",
              !selected && band.free && "border-emerald-200 bg-emerald-50 text-emerald-900 hover:border-emerald-400",
              !band.free && "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 line-through",
            )}
          >
            {band.time}
          </button>
        );
      })}
    </div>
  );
}
