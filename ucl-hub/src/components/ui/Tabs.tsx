"use client";

import { cn } from "@/utils/cn";

export interface TabOption<T extends string> {
  value: T;
  label: string;
  /** Small count shown next to the label. */
  count?: number;
}

/** A row of tabs that switch views in place. Arrow keys are handled natively by the buttons' tab order. */
export function Tabs<T extends string>({ label, tabs, value, onChange, className }: { label: string; tabs: readonly TabOption<T>[]; value: T; onChange: (value: T) => void; className?: string }) {
  return (
    <div role="tablist" aria-label={label} className={cn("mb-5 flex gap-1 overflow-x-auto border-b border-slate-200", className)}>
      {tabs.map((tab) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.value)}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              selected ? "border-brand-600 text-brand-700" : "border-transparent text-slate-600 hover:text-slate-900",
            )}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">{tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
