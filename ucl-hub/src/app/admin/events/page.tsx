"use client";

import { useMemo } from "react";
import { RequireCapability } from "@/components/layout/RequireCapability";
import { useCurrentUser } from "@/components/providers/AuthProvider";
import { useServices } from "@/components/providers/ServicesProvider";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { toOptions } from "@/components/admin/options";
import { ResourceManager } from "@/components/admin/ResourceManager";
import type { FieldDef } from "@/components/admin/fields";
import { eventStatus, spotsLeft, type EventStatus } from "@/features/events/logic";
import { eventSchema, type EventInput } from "@/features/events/schema";
import { useActor } from "@/hooks/useActor";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useNow } from "@/hooks/useNow";
import { canManageEvent } from "@/lib/permissions";
import { EVENT_CATEGORIES, type CampusEvent } from "@/types";
import { formatDateTime } from "@/utils/dates";
import { humanize } from "@/utils/text";

const STATUS_TONE: Record<EventStatus, BadgeTone> = { upcoming: "info", ongoing: "success", past: "neutral" };

export default function AdminEventsPage() {
  const { events, societies } = useServices();
  const { access } = useCurrentUser();
  const actor = useActor();
  const now = useNow();
  const societyList = useAsyncData(() => societies.listAll(), [societies]);

  const isSocietyRep = access.role === "staff" && access.staffRole === "society";

  const fields = useMemo<FieldDef[]>(() => {
    const options = (societyList.data ?? [])
      .filter((s) => !isSocietyRep || s.id === access.societyId)
      .map((s) => ({ value: s.id, label: s.name }));
    return [
      { name: "title", label: "Event name", type: "text", required: true, maxLength: 140 },
      { name: "description", label: "Description", type: "textarea", required: true, rows: 5, maxLength: 4000 },
      { name: "startsAt", label: "Starts", type: "datetime", required: true, span: 1 },
      { name: "endsAt", label: "Ends", type: "datetime", required: true, span: 1 },
      { name: "location", label: "Location", type: "text", required: true, span: 1 },
      { name: "category", label: "Category", type: "select", required: true, span: 1, options: toOptions(EVENT_CATEGORIES) },
      { name: "organiser", label: "Organiser", type: "text", required: true, span: 1 },
      {
        name: "societyId",
        label: "Organising society",
        type: "select",
        span: 1,
        nullable: true,
        required: isSocietyRep,
        placeholder: isSocietyRep ? "Choose…" : "Not a society event",
        options,
        hint: isSocietyRep ? "You can only run events for your own society." : "Society representatives can then manage this event.",
      },
      { name: "capacity", label: "Capacity", type: "number", min: 0, span: 1, hint: "0 means unlimited places." },
      { name: "imageUrl", label: "Event image", type: "image", pathName: "imagePath", folder: "content/events" },
    ];
  }, [societyList.data, isSocietyRep, access.societyId]);

  return (
    <RequireCapability capability="events">
      <ResourceManager<CampusEvent, EventInput>
        title="Events"
        description={isSocietyRep ? "Create and manage events for your society. Students register interest and you see the numbers here." : "Create campus events and track how many students are interested."}
        singular="event"
        fields={fields}
        schema={eventSchema}
        defaults={{ category: "community", capacity: 0, societyId: isSocietyRep ? access.societyId : null }}
        loadPage={(cursor) => events.listAll(cursor)}
        loadDeps={[events]}
        create={(input) => events.create(input, actor)}
        update={(item, input) => events.update(item.id, input)}
        remove={(item) => events.remove(item.id)}
        canEdit={(event) => canManageEvent(access, event)}
        canDelete={(event) => canManageEvent(access, event)}
        searchText={(e) => [e.title, e.location, e.organiser, e.category]}
        deleteMessage={(e) => `"${e.title}" and its ${e.interestCount} registrations of interest will be removed.`}
        columns={[
          {
            header: "Event",
            render: (e) => (
              <div className="min-w-56 max-w-md">
                <p className="font-medium text-slate-900">{e.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{e.organiser} · {e.location}</p>
              </div>
            ),
          },
          { header: "Category", render: (e) => <Badge>{humanize(e.category)}</Badge> },
          {
            header: "When",
            render: (e) => {
              const status = eventStatus(e, now);
              return (
                <div className="space-y-1">
                  <p className="whitespace-nowrap text-slate-700">{formatDateTime(e.startsAt)}</p>
                  <Badge tone={STATUS_TONE[status]}>{humanize(status)}</Badge>
                </div>
              );
            },
          },
          {
            header: "Interested",
            render: (e) => {
              const left = spotsLeft(e);
              return (
                <div className="whitespace-nowrap">
                  <p className="font-semibold tabular-nums text-slate-900">
                    {e.interestCount}
                    {e.capacity > 0 && <span className="font-normal text-slate-500"> / {e.capacity}</span>}
                  </p>
                  {left === 0 && <p className="text-xs font-medium text-amber-700">Full</p>}
                </div>
              );
            },
          },
        ]}
      />
    </RequireCapability>
  );
}
