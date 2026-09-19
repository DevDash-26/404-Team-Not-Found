import { z } from "zod";
import { FIELD_LIMITS } from "@/config/app";
import { positiveInt, text } from "@/lib/schemas";
import { ROOM_TYPES } from "@/types";

export const roomSchema = z.object({
  name: text("Room name", 2, FIELD_LIMITS.name),
  building: text("Building", 2, FIELD_LIMITS.name),
  floor: positiveInt("Floor", 0, 50),
  capacity: positiveInt("Capacity", 1, 2000),
  type: z.enum(ROOM_TYPES, { error: "Choose a room type." }),
  facilities: z.array(z.string().trim().min(1).max(60)).max(20),
  active: z.boolean(),
});

export type RoomInput = z.infer<typeof roomSchema>;

/**
 * Shape check for the booking form. The business rules (opening hours, maximum
 * length, capacity, conflicts) live in `validateBookingRequest`, which the
 * service runs on every request regardless of what the UI allowed.
 */
export const bookingRequestSchema = z.object({
  roomId: z.string().min(1, "Please choose a room."),
  date: z.string().min(1, "Please choose a date."),
  startTime: z.string().min(1, "Choose a start time."),
  endTime: z.string().min(1, "Choose an end time."),
  attendees: z.number({ error: "Enter how many people will attend." }).int("Enter a whole number.").min(1, "Enter how many people will attend."),
  purpose: text("Purpose", 3, 200),
});

export type BookingRequestFormInput = z.infer<typeof bookingRequestSchema>;
