"use client";

import { useState } from "react";
import { RequireCapability } from "@/components/layout/RequireCapability";
import { useAuth } from "@/components/providers/AuthProvider";
import { useServices } from "@/components/providers/ServicesProvider";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs } from "@/components/ui/Tabs";
import { toOptions } from "@/components/admin/options";
import { ResourceManager, singlePage } from "@/components/admin/ResourceManager";
import type { FieldDef } from "@/components/admin/fields";
import { BookingQueue } from "@/features/classrooms/components/BookingQueue";
import { roomSchema, type RoomInput } from "@/features/classrooms/schema";
import { ROOM_TYPES, type Room } from "@/types";
import { humanize } from "@/utils/text";

const ROOM_FIELDS: FieldDef[] = [
  { name: "name", label: "Room name", type: "text", required: true, span: 1, placeholder: "e.g. LT-2" },
  { name: "building", label: "Building", type: "text", required: true, span: 1 },
  { name: "floor", label: "Floor", type: "number", min: 0, max: 50, span: 1 },
  { name: "capacity", label: "Capacity", type: "number", min: 1, span: 1 },
  { name: "type", label: "Room type", type: "select", required: true, span: 1, options: toOptions(ROOM_TYPES) },
  { name: "active", label: "Availability", type: "checkbox", span: 1, description: "Bookable by students" },
  { name: "facilities", label: "Facilities", type: "tags", placeholder: "Projector, Whiteboard, Air conditioning" },
];

type Tab = "requests" | "rooms";

export default function AdminBookingsPage() {
  const { classrooms } = useServices();
  const { can } = useAuth();
  const [tab, setTab] = useState<Tab>("requests");
  const canRooms = can("rooms");
  const active: Tab = canRooms ? tab : "requests";

  return (
    <RequireCapability capability="bookings">
      {canRooms && (
        <Tabs<Tab>
          label="Booking sections"
          value={active}
          onChange={setTab}
          tabs={[
            { value: "requests", label: "Booking requests" },
            { value: "rooms", label: "Rooms" },
          ]}
        />
      )}
      {active === "requests" ? (
        <>
          <PageHeader title="Classroom bookings" description="Approve or reject room requests. A rejected or cancelled booking frees the room straight away." />
          <BookingQueue />
        </>
      ) : (
        <ResourceManager<Room, RoomInput>
          title="Rooms"
          description="Lecture halls, labs and study rooms students can request."
          singular="room"
          fields={ROOM_FIELDS}
          schema={roomSchema}
          defaults={{ type: "study-room", active: true, floor: 0, capacity: 10 }}
          loadPage={singlePage(() => classrooms.listRooms())}
          loadDeps={[classrooms]}
          create={(input) => classrooms.createRoom(input)}
          update={(item, input) => classrooms.updateRoom(item.id, input)}
          remove={(item) => classrooms.removeRoom(item.id)}
          searchText={(r) => [r.name, r.building, r.type, ...r.facilities]}
          modalSize="md"
          columns={[
            {
              header: "Room",
              render: (r) => (
                <div>
                  <p className="font-medium text-slate-900">{r.name}</p>
                  <p className="text-xs text-slate-500">{r.building} · floor {r.floor}</p>
                </div>
              ),
            },
            { header: "Type", render: (r) => <Badge>{humanize(r.type)}</Badge> },
            { header: "Seats", render: (r) => <span className="tabular-nums">{r.capacity}</span> },
            { header: "Facilities", render: (r) => <span className="text-slate-600">{r.facilities.join(", ") || "—"}</span> },
            { header: "Status", render: (r) => (r.active ? <Badge tone="success">Bookable</Badge> : <Badge tone="neutral">Hidden</Badge>) },
          ]}
        />
      )}
    </RequireCapability>
  );
}
