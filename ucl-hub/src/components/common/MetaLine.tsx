import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** A small "icon + text" line used for dates, places and contacts on cards. */
export function MetaLine({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-sm text-slate-600">
      <Icon className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden="true" />
      <span className="min-w-0">{children}</span>
    </p>
  );
}
