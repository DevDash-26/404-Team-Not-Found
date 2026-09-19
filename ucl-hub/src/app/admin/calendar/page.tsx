"use client";

import { RequireCapability } from "@/components/layout/RequireCapability";
import { useServices } from "@/components/providers/ServicesProvider";
import { Badge } from "@/components/ui/Badge";
import { toOptions } from "@/components/admin/options";
import { ResourceManager, singlePage } from "@/components/admin/ResourceManager";
import type { FieldDef } from "@/components/admin/fields";
import { CALENDAR_TYPE_LABELS } from "@/features/calendar/logic";
import { calendarEntrySchema, type CalendarEntryInput } from "@/features/calendar/schema";
import { describeAudience } from "@/lib/audience";
import { CALENDAR_TYPES, type CalendarEntry } from "@/types";
import { formatShortDate, parseDateKey } from "@/utils/dates";

const FIELDS: FieldDef[] = [
  { name: "title", label: "Title", type: "text", required: true, maxLength: 140 },
  { name: "type", label: "Type", type: "select", required: true, options: toOptions(CALENDAR_TYPES, CALENDAR_TYPE_LABELS) },
  { name: "startDate", label: "Starts", type: "date", required: true, span: 1 },
  { name: "endDate", label: "Ends", type: "date", required: true, span: 1, hint: "Use the same date for a single-day entry." },
  { name: "description", label: "Details", type: "textarea", rows: 3, maxLength: 2000 },
  { name: "audience", label: "Applies to", type: "audience" },
];

function dateLabel(key: string): string {
  const date = parseDateKey(key);
  return date ? formatShortDate(date) : key;
}

export default function AdminCalendarPage() {
  const { calendar } = useServices();
  return (
    <RequireCapability capability="calendar">
      <ResourceManager<CalendarEntry, CalendarEntryInput>
        title="Academic calendar"
        description="Semester dates, exams, deadlines and holidays. Students see only the entries for their programme and year."
        singular="entry"
        fields={FIELDS}
        schema={calendarEntrySchema}
        defaults={{ type: "other" }}
        loadPage={singlePage(() => calendar.listAll())}
        loadDeps={[calendar]}
        create={(input) => calendar.create(input)}
        update={(item, input) => calendar.update(item.id, input)}
        remove={(item) => calendar.remove(item.id)}
        searchText={(c) => [c.title, c.description, CALENDAR_TYPE_LABELS[c.type]]}
        columns={[
          { header: "Entry", render: (c) => <span className="font-medium text-slate-900">{c.title}</span> },
          { header: "Type", render: (c) => <Badge tone={c.type === "exam" ? "danger" : c.type === "holiday" ? "success" : "brand"}>{CALENDAR_TYPE_LABELS[c.type]}</Badge> },
          {
            header: "Dates",
            render: (c) => (
              <span className="whitespace-nowrap text-slate-700">
                {dateLabel(c.startDate)}
                {c.endDate !== c.startDate && ` – ${dateLabel(c.endDate)}`}
              </span>
            ),
          },
          { header: "Applies to", render: (c) => <span className="text-slate-600">{describeAudience(c.audience)}</span> },
        ]}
      />
    </RequireCapability>
  );
}
