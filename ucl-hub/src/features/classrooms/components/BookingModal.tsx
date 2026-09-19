"use client";

import { Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useCurrentUser } from "@/components/providers/AuthProvider";
import { useServices } from "@/components/providers/ServicesProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";
import { SelectInput, TextArea, TextInput } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { ErrorState, InlineError, LoadingRows } from "@/components/ui/States";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useForm } from "@/hooks/useForm";
import { useNow } from "@/hooks/useNow";
import type { Room } from "@/types";
import { BookingConflictError } from "@/utils/errors";
import { addDays, minutesToTime, timeToMinutes, toDateKey, startOfDay } from "@/utils/dates";
import { BookingValidationError } from "../errors";
import { endTimeOptions, markPastBands } from "../logic";
import { bookingRequestSchema } from "../schema";
import { AvailabilityGrid } from "./AvailabilityGrid";

interface BookingModalProps {
  room: Room | null;
  initialDate: string;
  onClose: () => void;
  onBooked: () => void;
}

export function BookingModal({ room, initialDate, onClose, onBooked }: BookingModalProps) {
  return (
    <Modal open={room !== null} onClose={onClose} title={room ? `Request ${room.name}` : "Request a room"} description={room ? `${room.building}, floor ${room.floor} · holds ${room.capacity}` : undefined} size="md">
      {room && <BookingForm room={room} initialDate={initialDate} onClose={onClose} onBooked={onBooked} />}
    </Modal>
  );
}

function BookingForm({ room, initialDate, onClose, onBooked }: { room: Room; initialDate: string; onClose: () => void; onBooked: () => void }) {
  const { classrooms } = useServices();
  const { user, profile } = useCurrentUser();
  const toast = useToast();
  const now = useNow();
  const [refresh, setRefresh] = useState(0);

  const rulesData = useAsyncData(() => classrooms.getRules(), [classrooms]);
  const rules = rulesData.data;

  const form = useForm({
    initial: { roomId: room.id, date: initialDate, startTime: "", endTime: "", attendees: "", purpose: "" },
    schema: bookingRequestSchema,
    prepare: (values) => ({ ...values, attendees: values.attendees === "" ? Number.NaN : Number(values.attendees) }),
    onSubmit: async (data) => {
      try {
        await classrooms.requestBooking(data, { id: user.uid, name: profile.name }, room);
      } catch (error) {
        if (error instanceof BookingConflictError) {
          // Someone got there first: refresh availability and clear the chosen time.
          form.setValue("startTime", "");
          form.setValue("endTime", "");
          setRefresh((n) => n + 1);
          form.setFormError("Sorry, someone just booked part of that time. Please choose another slot.");
          return;
        }
        if (error instanceof BookingValidationError) {
          form.setErrors(Object.fromEntries(error.issues.map((issue) => [issue.field, issue.message])));
          return;
        }
        throw error;
      }
      toast.success("Request sent. You'll be notified when staff respond.");
      onBooked();
      onClose();
    },
  });

  const date = form.values.date;
  const availability = useAsyncData(() => classrooms.getAvailability(room.id, date), [classrooms, room.id, date, refresh]);
  const bands = useMemo(() => (availability.data ? markPastBands(availability.data, date, now) : []), [availability.data, date, now]);
  const endOptions = useMemo(() => (rules ? endTimeOptions(bands, form.values.startTime, rules) : []), [bands, form.values.startTime, rules]);

  const today = startOfDay(now);
  const minDate = toDateKey(today);
  const maxDate = toDateKey(addDays(today, rules?.advanceDays ?? 30));
  const slotMinutes = rules?.slotMinutes ?? 30;

  function pick(time: string) {
    if (!rules) return;
    const { startTime } = form.values;
    // Tapping a later slot stretches the current range to it; anything else starts a new range.
    if (startTime !== "" && timeToMinutes(time) > timeToMinutes(startTime)) {
      const end = minutesToTime(timeToMinutes(time) + slotMinutes);
      if (endTimeOptions(bands, startTime, rules).includes(end)) {
        form.setValue("endTime", end);
        return;
      }
    }
    form.setValue("startTime", time);
    form.setValue("endTime", endTimeOptions(bands, time, rules)[0] ?? "");
  }

  return (
    <form onSubmit={form.submit} noValidate className="space-y-4">
      <InlineError message={form.formError} />
      <TextInput label="Date" type="date" min={minDate} max={maxDate} required value={date} error={form.errors.date} onChange={(e) => { form.setValue("date", e.target.value); form.setValue("startTime", ""); form.setValue("endTime", ""); }} />

      <div>
        <p className="mb-1.5 text-sm font-medium text-slate-800">Pick a time</p>
        {availability.error ? (
          <ErrorState message={availability.error} onRetry={availability.reload} />
        ) : availability.loading || !rules ? (
          <LoadingRows count={2} />
        ) : bands.length === 0 ? (
          <p className="text-sm text-slate-600">Bookings are closed on this day.</p>
        ) : (
          <>
            <AvailabilityGrid bands={bands} startTime={form.values.startTime} endTime={form.values.endTime} slotMinutes={slotMinutes} onPick={pick} />
            <p className="mt-2 text-xs text-slate-500">
              Tap a start time, then tap a later slot to stretch the booking. Green is free, grey is taken. Up to {rules.maxHours} hours per booking.
            </p>
          </>
        )}
        {(form.errors.startTime || form.errors.endTime) && <p role="alert" className="mt-1 text-xs font-medium text-red-700">{form.errors.startTime ?? form.errors.endTime}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectInput
          label="Start"
          required
          placeholder="Start time"
          options={bands.filter((b) => b.free).map((b) => ({ value: b.time, label: b.time }))}
          value={form.values.startTime}
          onChange={(e) => { form.setValue("startTime", e.target.value); form.setValue("endTime", ""); }}
        />
        <SelectInput label="End" required placeholder={form.values.startTime ? "End time" : "Pick a start first"} disabled={!form.values.startTime} options={endOptions.map((t) => ({ value: t, label: t }))} {...form.bind("endTime")} />
      </div>

      <TextInput
        label="Number of people"
        type="number"
        min={1}
        max={room.capacity}
        inputMode="numeric"
        required
        hint={`This room holds up to ${room.capacity}.`}
        {...form.bind("attendees")}
      />
      <TextArea label="What is it for?" rows={2} maxLength={200} required placeholder="e.g. Group project meeting for SE2010" {...form.bind("purpose")} />

      <p className="flex items-center gap-2 text-xs text-slate-500">
        <Users className="size-3.5" aria-hidden="true" />
        Facilities staff review every request. The time is held for you while it is pending.
      </p>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" onClick={onClose} disabled={form.submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={form.submitting}>
          Request booking
        </Button>
      </div>
    </form>
  );
}
