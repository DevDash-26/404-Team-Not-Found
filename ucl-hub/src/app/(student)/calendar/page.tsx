"use client";

import { CalendarRange, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { useCurrentUser } from "@/components/providers/AuthProvider";
import { useServices } from "@/components/providers/ServicesProvider";
import { Button } from "@/components/ui/Button";
import { FilterChips } from "@/components/ui/FilterChips";
import { SelectInput } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingRows } from "@/components/ui/States";
import { FACULTIES, YEARS, facultyById } from "@/config/academics";
import { EntryList } from "@/features/calendar/components/EntryList";
import { MonthGrid } from "@/features/calendar/components/MonthGrid";
import { CALENDAR_TYPE_LABELS, entriesForSelection, entriesOnDay, filterByType, gridRange, shiftMonth, upcomingEntries } from "@/features/calendar/logic";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useNow } from "@/hooks/useNow";
import { CALENDAR_TYPES, type CalendarType } from "@/types";
import { formatDate, toDateKey } from "@/utils/dates";

type View = "month" | "agenda";

export default function CalendarPage() {
  const { calendar } = useServices();
  const { profile, access } = useCurrentUser();
  const now = useNow(10 * 60_000);
  const isStudent = access.role === "student";

  const [view, setView] = useState<View>("month");
  const [anchor, setAnchor] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [faculty, setFaculty] = useState(isStudent ? (profile.faculty ?? "") : "");
  const [programme, setProgramme] = useState(isStudent ? (profile.programme ?? "") : "");
  const [year, setYear] = useState(isStudent && profile.year ? String(profile.year) : "");
  const [type, setType] = useState<CalendarType | "all">("all");
  const [selectedDay, setSelectedDay] = useState<string | null>(() => toDateKey(now));

  const range = useMemo(() => gridRange(anchor), [anchor]);
  const { data, loading, error, reload } = useAsyncData(
    () => (view === "agenda" ? calendar.listFrom(toDateKey(now), 200) : calendar.listRange(range.from, range.to)),
    [calendar, view, range.from, range.to],
  );

  const entries = useMemo(
    () => filterByType(entriesForSelection(data ?? [], { faculty, programme, year: year ? Number(year) : null }), type),
    [data, faculty, programme, year, type],
  );
  const dayEntries = selectedDay ? entriesOnDay(entries, selectedDay) : [];
  const agenda = useMemo(() => upcomingEntries(entries, now), [entries, now]);
  const programmes = facultyById(faculty)?.programmes ?? FACULTIES.flatMap((f) => f.programmes);

  const monthLabel = anchor.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <>
      <PageHeader title="Academic calendar" description="Semester dates, exams, deadlines and holidays, filtered to your programme and year." />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <SelectInput
          label="Faculty"
          value={faculty}
          onChange={(e) => {
            setFaculty(e.target.value);
            setProgramme("");
          }}
          placeholder="All faculties"
          options={FACULTIES.map((f) => ({ value: f.id, label: f.name }))}
        />
        <SelectInput label="Programme" value={programme} onChange={(e) => setProgramme(e.target.value)} placeholder="All programmes" options={programmes.map((p) => ({ value: p, label: p }))} />
        <SelectInput label="Year" value={year} onChange={(e) => setYear(e.target.value)} placeholder="All years" options={YEARS.map((y) => ({ value: String(y), label: `Year ${y}` }))} />
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <FilterChips
          label="Entry type"
          value={type}
          onChange={setType}
          options={[{ value: "all", label: "All" }, ...CALENDAR_TYPES.map((t) => ({ value: t, label: CALENDAR_TYPE_LABELS[t] }))]}
        />
        <FilterChips
          label="View"
          value={view}
          onChange={setView}
          options={[
            { value: "month", label: "Month" },
            { value: "agenda", label: "Upcoming list" },
          ]}
        />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : view === "month" ? (
        <>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900" aria-live="polite">{monthLabel}</h2>
            <div className="flex gap-1">
              <Button variant="secondary" size="sm" aria-label="Previous month" onClick={() => setAnchor((a) => shiftMonth(a, -1))}>
                <ChevronLeft className="size-4" aria-hidden="true" />
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setAnchor(new Date(now.getFullYear(), now.getMonth(), 1))}>
                Today
              </Button>
              <Button variant="secondary" size="sm" aria-label="Next month" onClick={() => setAnchor((a) => shiftMonth(a, 1))}>
                <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
          {loading ? (
            <LoadingRows count={6} />
          ) : (
            <>
              <MonthGrid anchor={anchor} now={now} entries={entries} selectedDay={selectedDay} onSelectDay={setSelectedDay} />
              {selectedDay && (
                <section className="mt-5" aria-live="polite">
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">{formatDate(selectedDay)}</h3>
                  {dayEntries.length === 0 ? <p className="text-sm text-slate-600">Nothing scheduled for this day.</p> : <EntryList entries={dayEntries} now={now} />}
                </section>
              )}
            </>
          )}
        </>
      ) : loading ? (
        <LoadingRows />
      ) : agenda.length === 0 ? (
        <EmptyState icon={<CalendarRange className="size-6" aria-hidden="true" />} title="Nothing coming up" description="No dates match these filters. Try selecting all years or programmes." />
      ) : (
        <EntryList entries={agenda} now={now} />
      )}
    </>
  );
}
