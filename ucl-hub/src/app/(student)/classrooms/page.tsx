"use client";

import { Building, DoorClosed, Projector } from "lucide-react";
import { useMemo, useState } from "react";
import { useServices } from "@/components/providers/ServicesProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FilterChips } from "@/components/ui/FilterChips";
import { SelectInput, TextInput } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { EmptyState, ErrorState, LoadingCards } from "@/components/ui/States";
import { BookingModal } from "@/features/classrooms/components/BookingModal";
import { MyBookings } from "@/features/classrooms/components/MyBookings";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useNow } from "@/hooks/useNow";
import { ROOM_TYPES, type Room, type RoomType } from "@/types";
import { toDateKey } from "@/utils/dates";
import { matchesQuery, humanize } from "@/utils/text";

type Tab = "rooms" | "mine";

export default function ClassroomsPage() {
  const { classrooms } = useServices();
  const now = useNow(5 * 60_000);
  const [tab, setTab] = useState<Tab>("rooms");
  const [search, setSearch] = useState("");
  const [type, setType] = useState<RoomType | "all">("all");
  const [minCapacity, setMinCapacity] = useState("");
  const [date, setDate] = useState(() => toDateKey(new Date()));
  const [selected, setSelected] = useState<Room | null>(null);
  const [bookingsVersion, setBookingsVersion] = useState(0);

  const rooms = useAsyncData(() => classrooms.listRooms(), [classrooms]);

  const visible = useMemo(() => {
    const capacity = Number(minCapacity);
    return (rooms.data ?? [])
      .filter((room) => room.active)
      .filter((room) => type === "all" || room.type === type)
      .filter((room) => !capacity || room.capacity >= capacity)
      .filter((room) => matchesQuery([room.name, room.building, ...room.facilities], search));
  }, [rooms.data, type, minCapacity, search]);

  return (
    <>
      <PageHeader title="Classrooms" description="Find a free room for a study group, meeting or club session and send a booking request." />

      <FilterChips
        label="View"
        className="mb-4"
        options={[
          { value: "rooms", label: "Find a room" },
          { value: "mine", label: "My bookings" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "mine" ? (
        <MyBookings refreshKey={bookingsVersion} />
      ) : (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_11rem_10rem_9rem]">
            <SearchInput value={search} onChange={setSearch} placeholder="Search rooms, buildings, equipment" label="Search rooms" />
            <SelectInput
              label="Room type"
              fieldClassName="[&>label]:sr-only"
              value={type}
              onChange={(e) => setType(e.target.value as RoomType | "all")}
              options={[{ value: "all", label: "All types" }, ...ROOM_TYPES.map((t) => ({ value: t, label: humanize(t) }))]}
            />
            <TextInput label="Minimum capacity" fieldClassName="[&>label]:sr-only" type="number" min={1} inputMode="numeric" placeholder="Min. people" value={minCapacity} onChange={(e) => setMinCapacity(e.target.value)} />
            <TextInput label="Date" fieldClassName="[&>label]:sr-only" type="date" min={toDateKey(now)} value={date} onChange={(e) => setDate(e.target.value || toDateKey(now))} />
          </div>

          {rooms.error ? (
            <ErrorState message={rooms.error} onRetry={rooms.reload} />
          ) : rooms.loading ? (
            <LoadingCards />
          ) : visible.length === 0 ? (
            <EmptyState icon={<DoorClosed className="size-6" aria-hidden="true" />} title="No rooms match" description="Try a smaller group size, another room type or clear the search." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((room) => (
                <Card key={room.id} className="flex flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-slate-900">{room.name}</h3>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-600">
                        <Building className="size-4 text-slate-400" aria-hidden="true" />
                        {room.building}, floor {room.floor}
                      </p>
                    </div>
                    <Badge tone="brand">{humanize(room.type)}</Badge>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-800">Seats {room.capacity}</p>
                  {room.facilities.length > 0 && (
                    <p className="mt-1 flex items-start gap-1.5 text-sm text-slate-600">
                      <Projector className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden="true" />
                      {room.facilities.join(", ")}
                    </p>
                  )}
                  <div className="mt-4 flex-1" />
                  <Button className="w-full" onClick={() => setSelected(room)}>
                    Check times &amp; request
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <BookingModal
        room={selected}
        initialDate={date}
        onClose={() => setSelected(null)}
        onBooked={() => {
          setBookingsVersion((v) => v + 1);
          setTab("mine");
        }}
      />
    </>
  );
}
