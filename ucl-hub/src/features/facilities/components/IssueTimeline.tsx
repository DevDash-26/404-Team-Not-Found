import { FacilityStatusBadge } from "@/components/common/StatusBadges";
import type { FacilityUpdate } from "@/types";
import { formatDateTime } from "@/utils/dates";

/** Chronological history of an issue: who moved it to which status and why. */
export function IssueTimeline({ updates }: { updates: FacilityUpdate[] }) {
  return (
    <ol className="relative ml-2 space-y-4 border-l border-slate-200 pl-5">
      {updates.map((update, index) => (
        <li key={`${update.at}-${index}`} className="relative">
          <span className="absolute -left-[27px] top-1.5 size-2.5 rounded-full bg-brand-600 ring-4 ring-white" aria-hidden="true" />
          <div className="flex flex-wrap items-center gap-2">
            <FacilityStatusBadge status={update.status} />
            <span className="text-xs text-slate-500">{formatDateTime(update.at)}</span>
          </div>
          <p className="mt-1 text-sm text-slate-700">{update.note}</p>
          <p className="text-xs text-slate-500">{update.by}</p>
        </li>
      ))}
    </ol>
  );
}
