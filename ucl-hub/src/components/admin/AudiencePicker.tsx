"use client";

import { Users } from "lucide-react";
import { FACULTIES, YEARS } from "@/config/academics";
import { isEveryone } from "@/lib/audience";
import type { Audience } from "@/types";
import { cn } from "@/utils/cn";

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function Group({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{legend}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function Chip({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className={cn("flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-sm", checked ? "border-brand-700 bg-brand-50 text-brand-900" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50")}>
      <input type="checkbox" checked={checked} onChange={onChange} className="size-3.5 rounded border-slate-300 text-brand-700 focus:ring-brand-500" />
      {label}
    </label>
  );
}

/** Chooses who an item is for. Nothing selected in a group means "everyone" for that group. */
export function AudiencePicker({ label, value, onChange }: { label: string; value: Audience; onChange: (value: Audience) => void }) {
  const visibleFaculties = value.faculties.length > 0 ? FACULTIES.filter((f) => value.faculties.includes(f.id)) : FACULTIES;

  return (
    <fieldset className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
      <legend className="px-1 text-sm font-medium text-slate-800">{label}</legend>
      <p className="flex items-center gap-1.5 text-xs text-slate-600">
        <Users className="size-3.5" aria-hidden="true" />
        {isEveryone(value) ? "Shown to all students. Pick faculties, programmes or years to narrow it." : "Shown only to students matching every group below."}
      </p>
      <Group legend="Faculties">
        {FACULTIES.map((faculty) => (
          <Chip
            key={faculty.id}
            label={faculty.name}
            checked={value.faculties.includes(faculty.id)}
            onChange={() => {
              const faculties = toggle(value.faculties, faculty.id);
              // Drop programmes that belong to a faculty that is no longer selected.
              const allowed = new Set((faculties.length > 0 ? FACULTIES.filter((f) => faculties.includes(f.id)) : FACULTIES).flatMap((f) => f.programmes));
              onChange({ ...value, faculties, programmes: value.programmes.filter((p) => allowed.has(p)) });
            }}
          />
        ))}
      </Group>
      <Group legend="Programmes">
        {visibleFaculties.flatMap((f) => f.programmes).map((programme) => (
          <Chip key={programme} label={programme} checked={value.programmes.includes(programme)} onChange={() => onChange({ ...value, programmes: toggle(value.programmes, programme) })} />
        ))}
      </Group>
      <Group legend="Years">
        {YEARS.map((year) => (
          <Chip key={year} label={`Year ${year}`} checked={value.years.includes(year)} onChange={() => onChange({ ...value, years: toggle(value.years, year).sort() })} />
        ))}
      </Group>
    </fieldset>
  );
}
