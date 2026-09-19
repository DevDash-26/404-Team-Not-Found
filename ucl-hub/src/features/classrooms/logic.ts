/**
 * Classroom booking business rules. Pure functions only (no I/O) so they are
 * trivially testable and shared by the UI, the service layer and the seed data.
 */

import { BOOKING_DEFAULTS } from "@/config/app";
import { roomSlotId } from "@/lib/backend/collections";
import type { AppSettings, Booking, BookingStatus, Room } from "@/types";
import { combineDateAndTime, addDays, minutesToTime, parseDateKey, startOfDay, timeToMinutes } from "@/utils/dates";

export interface BookingRules {
  openTime: string;
  closeTime: string;
  maxHours: number;
  advanceDays: number;
  slotMinutes: number;
}

/** Combines admin-editable settings with safe defaults. */
export function rulesFromSettings(settings?: Partial<AppSettings> | null): BookingRules {
  return {
    openTime: settings?.bookingOpenTime || BOOKING_DEFAULTS.openTime,
    closeTime: settings?.bookingCloseTime || BOOKING_DEFAULTS.closeTime,
    maxHours: settings?.bookingMaxHours && settings.bookingMaxHours > 0 ? settings.bookingMaxHours : BOOKING_DEFAULTS.maxHours,
    advanceDays:
      settings?.bookingAdvanceDays && settings.bookingAdvanceDays > 0
        ? settings.bookingAdvanceDays
        : BOOKING_DEFAULTS.advanceBookingDays,
    slotMinutes: BOOKING_DEFAULTS.slotMinutes,
  };
}

export interface BookingRequestInput {
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  attendees: number;
  purpose: string;
}

export interface BookingIssue {
  field: keyof BookingRequestInput;
  message: string;
}

/** Slot start times ("HHmm") covered by [startTime, endTime). */
export function slotStarts(startTime: string, endTime: string, slotMinutes: number): string[] {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return [];
  const starts: string[] = [];
  for (let minute = start; minute < end; minute += slotMinutes) {
    starts.push(minutesToTime(minute).replace(":", ""));
  }
  return starts;
}

/** Ids of the `roomSlots` documents a booking occupies. */
export function buildSlotIds(
  roomId: string,
  date: string,
  startTime: string,
  endTime: string,
  slotMinutes: number = BOOKING_DEFAULTS.slotMinutes,
): string[] {
  return slotStarts(startTime, endTime, slotMinutes).map((slot) => roomSlotId(roomId, date, slot));
}

/** Returns every problem with a booking request; an empty array means it is valid. */
export function validateBookingRequest(
  input: BookingRequestInput,
  room: Room | null,
  rules: BookingRules,
  now: Date,
): BookingIssue[] {
  const issues: BookingIssue[] = [];
  const add = (field: keyof BookingRequestInput, message: string) => issues.push({ field, message });

  if (!room) {
    add("roomId", "Please choose a room.");
  } else if (!room.active) {
    add("roomId", "This room is not available for booking.");
  }

  const day = parseDateKey(input.date);
  if (!day) {
    add("date", "Please choose a valid date.");
  } else {
    const today = startOfDay(now);
    if (day.getTime() < today.getTime()) add("date", "You can't book a room in the past.");
    if (day.getTime() > addDays(today, rules.advanceDays).getTime()) {
      add("date", `Rooms can only be booked up to ${rules.advanceDays} days ahead.`);
    }
  }

  const start = timeToMinutes(input.startTime);
  const end = timeToMinutes(input.endTime);
  const open = timeToMinutes(rules.openTime);
  const close = timeToMinutes(rules.closeTime);

  if (Number.isNaN(start)) add("startTime", "Please choose a start time.");
  if (Number.isNaN(end)) add("endTime", "Please choose an end time.");

  if (!Number.isNaN(start) && !Number.isNaN(end)) {
    if (end <= start) {
      add("endTime", "The end time must be after the start time.");
    } else {
      if (start % rules.slotMinutes !== 0 || end % rules.slotMinutes !== 0) {
        add("startTime", `Times must be on a ${rules.slotMinutes}-minute boundary.`);
      }
      if (start < open || end > close) {
        add("startTime", `Rooms can be booked between ${rules.openTime} and ${rules.closeTime}.`);
      }
      if (end - start > rules.maxHours * 60) {
        add("endTime", `Bookings can be at most ${rules.maxHours} hours.`);
      }
      const startsAt = day ? combineDateAndTime(input.date, input.startTime) : null;
      if (startsAt && startsAt.getTime() <= now.getTime()) add("startTime", "That start time has already passed.");
    }
  }

  if (!Number.isInteger(input.attendees) || input.attendees < 1) {
    add("attendees", "Enter how many people will attend.");
  } else if (room && input.attendees > room.capacity) {
    add("attendees", `${room.name} holds ${room.capacity} people at most.`);
  }

  const purpose = input.purpose.trim();
  if (purpose.length < 3) add("purpose", "Tell us briefly what the room is for.");
  if (purpose.length > 200) add("purpose", "Please keep the purpose under 200 characters.");

  return issues;
}

export interface TimeBand {
  /** "HH:mm" start */
  time: string;
  /** "HHmm" key used in slot ids */
  slot: string;
  free: boolean;
}

/** Every bookable half hour of the day, flagged free or taken. */
export function buildAvailabilityBands(takenSlots: ReadonlySet<string>, rules: BookingRules): TimeBand[] {
  const open = timeToMinutes(rules.openTime);
  const close = timeToMinutes(rules.closeTime);
  if (Number.isNaN(open) || Number.isNaN(close)) return [];
  const bands: TimeBand[] = [];
  for (let minute = open; minute < close; minute += rules.slotMinutes) {
    const time = minutesToTime(minute);
    const slot = time.replace(":", "");
    bands.push({ time, slot, free: !takenSlots.has(slot) });
  }
  return bands;
}

/** Slot ids from `requested` that are already taken. */
export function findConflicts(requested: readonly string[], taken: ReadonlySet<string>): string[] {
  return requested.filter((id) => taken.has(id));
}

/** Slots held by a booking that is pending or approved. Rejected/cancelled bookings hold nothing. */
export function holdsSlots(status: BookingStatus): boolean {
  return status === "pending" || status === "approved";
}

export type BookingActor = "owner" | "staff";

const TRANSITIONS: Record<BookingActor, Record<BookingStatus, BookingStatus[]>> = {
  owner: { pending: ["cancelled"], approved: ["cancelled"], rejected: [], cancelled: [] },
  staff: { pending: ["approved", "rejected", "cancelled"], approved: ["cancelled"], rejected: [], cancelled: [] },
};

export function canTransitionBooking(from: BookingStatus, to: BookingStatus, actor: BookingActor): boolean {
  return TRANSITIONS[actor][from].includes(to);
}

export function nextBookingStatuses(from: BookingStatus, actor: BookingActor): BookingStatus[] {
  return TRANSITIONS[actor][from];
}

/** A booking that is still in the future and can be acted on. */
export function isUpcoming(booking: Pick<Booking, "date" | "endTime">, now: Date): boolean {
  const end = combineDateAndTime(booking.date, booking.endTime);
  return end ? end.getTime() > now.getTime() : false;
}

/**
 * Marks bands that have already started as unavailable when the chosen day is
 * today, so a student cannot pick a time that has passed.
 */
export function markPastBands(bands: TimeBand[], date: string, now: Date): TimeBand[] {
  return bands.map((band) => {
    const startsAt = combineDateAndTime(date, band.time);
    return startsAt && startsAt.getTime() <= now.getTime() ? { ...band, free: false } : band;
  });
}

/**
 * End times a student can choose for a given start: every consecutive free
 * half hour after the start, up to the maximum booking length.
 */
export function endTimeOptions(bands: readonly TimeBand[], startTime: string, rules: BookingRules): string[] {
  const startIndex = bands.findIndex((band) => band.time === startTime);
  if (startIndex < 0 || !bands[startIndex]?.free) return [];
  const maxSlots = Math.floor((rules.maxHours * 60) / rules.slotMinutes);
  const options: string[] = [];
  for (let i = startIndex; i < bands.length && i - startIndex < maxSlots; i += 1) {
    const band = bands[i];
    if (!band || !band.free) break;
    options.push(minutesToTime(timeToMinutes(band.time) + rules.slotMinutes));
  }
  return options;
}
