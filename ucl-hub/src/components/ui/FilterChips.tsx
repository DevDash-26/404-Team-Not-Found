"use client";

import { cn } from "@/utils/cn";

export interface ChipOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface FilterChipsProps<T extends string> {
  label: string;
  options: readonly ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/** Single-choice pill filter (radio semantics), used for status and category filters. */
export function FilterChips<T extends string>({ label, options, value, onChange, className }: FilterChipsProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
              selected ? "border-brand-800 bg-brand-800 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50",
            )}
          >
            {option.label}
            {option.count !== undefined && <span className={cn("ml-1.5 text-xs", selected ? "text-brand-200" : "text-slate-500")}>{option.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
