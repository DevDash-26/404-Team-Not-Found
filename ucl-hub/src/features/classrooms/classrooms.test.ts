import { describe, expect, it } from "vitest";
import { createTestWorld, TEST_NOW } from "@/test/helpers";
import type { Booking, Room } from "@/types";
import { BookingConflictError, AppError } from "@/utils/errors";
import { toDateKey, addDays } from "@/utils/dates";
import { BookingValidationError } from "./errors";
import {
  buildAvailabilityBands,
  buildSlotIds,
  canTransitionBooking,
  endTimeOptions,
  findConflicts,
  holdsSlots,
  markPastBands,
  rulesFromSettings,
  slotStarts,
  validateBookingRequest,
} from "./logic";
import { createClassroomService } from "./service";
import { bookingRequestSchema } from "./schema";

const rules = rulesFromSettings(null);
const room: Room = { id: "room-x", name: "X1", building: "Block X", floor: 1, capacity: 10, type: "study-room", facilities: [], active: true };
const DAY = toDateKey(addDays(TEST_NOW, 20));
const base = { roomId: "room-x", date: DAY, startTime: "10:00", endTime: "11:00", attendees: 4, purpose: "Group revision" };
const fields = (input: Partial<typeof base>, target: Room | null = room) =>
  validateBookingRequest({ ...base, ...input }, target, rules, TEST_NOW).map((issue) => issue.field);

describe("booking validation", () => {
  it("accepts a normal request", () => {
    expect(fields({})).toEqual([]);
  });

  it("rejects dates in the past and beyond the booking window", () => {
    expect(fields({ date: toDateKey(addDays(TEST_NOW, -1)) })).toContain("date");
    expect(fields({ date: toDateKey(addDays(TEST_NOW, 31)) })).toContain("date");
    expect(fields({ date: "2026-02-30" })).toContain("date");
  });

  it("rejects an end time that is not after the start time (invalid dates and times)", () => {
    expect(fields({ startTime: "11:00", endTime: "10:00" })).toContain("endTime");
    expect(fields({ startTime: "11:00", endTime: "11:00" })).toContain("endTime");
    expect(fields({ startTime: "", endTime: "" })).toEqual(expect.arrayContaining(["startTime", "endTime"]));
  });

  it("enforces opening hours, the maximum length and the half-hour grid", () => {
    expect(fields({ startTime: "07:00", endTime: "08:00" })).toContain("startTime");
    expect(fields({ startTime: "19:30", endTime: "20:30" })).toContain("startTime");
    expect(fields({ startTime: "09:00", endTime: "13:00" })).toContain("endTime");
    expect(fields({ startTime: "09:10", endTime: "10:00" })).toContain("startTime");
  });

  it("rejects a start time that has already passed today", () => {
    const today = toDateKey(TEST_NOW);
    expect(fields({ date: today, startTime: "09:00", endTime: "10:00" })).toContain("startTime");
    expect(fields({ date: today, startTime: "14:00", endTime: "15:00" })).toEqual([]);
  });

  it("checks capacity, attendees and purpose", () => {
    expect(fields({ attendees: 11 })).toContain("attendees");
    expect(fields({ attendees: 0 })).toContain("attendees");
    expect(fields({ attendees: 2.5 })).toContain("attendees");
    expect(fields({ purpose: " " })).toContain("purpose");
    expect(fields({ purpose: "x".repeat(201) })).toContain("purpose");
  });

  it("rejects a missing or inactive room", () => {
    expect(fields({}, null)).toContain("roomId");
    expect(fields({}, { ...room, active: false })).toContain("roomId");
  });

  it("uses administrator settings when they are present", () => {
    const custom = rulesFromSettings({ bookingOpenTime: "09:00", bookingCloseTime: "17:00", bookingMaxHours: 2, bookingAdvanceDays: 7 });
    const issues = validateBookingRequest({ ...base, date: toDateKey(addDays(TEST_NOW, 10)), startTime: "08:00", endTime: "09:00" }, room, custom, TEST_NOW);
    expect(issues.map((i) => i.field)).toEqual(expect.arrayContaining(["date", "startTime"]));
  });

  it("validates the shape of the form before the rules run", () => {
    expect(bookingRequestSchema.safeParse({ ...base, attendees: Number.NaN }).success).toBe(false);
    expect(bookingRequestSchema.safeParse({ ...base, purpose: "" }).success).toBe(false);
    expect(bookingRequestSchema.safeParse(base).success).toBe(true);
  });
});

describe("slots and availability", () => {
  it("expands a booking into half-hour slot ids", () => {
    expect(slotStarts("10:00", "11:30", 30)).toEqual(["1000", "1030", "1100"]);
    expect(buildSlotIds("r1", "2026-10-06", "10:00", "11:00")).toEqual(["r1_2026-10-06_1000", "r1_2026-10-06_1030"]);
    expect(slotStarts("11:00", "10:00", 30)).toEqual([]);
  });

  it("detects overlaps between requested and taken slots", () => {
    expect(findConflicts(["a", "b"], new Set(["b", "c"]))).toEqual(["b"]);
    expect(findConflicts(["a"], new Set())).toEqual([]);
  });

  it("marks taken bands and offers only consecutive free end times", () => {
    const bands = buildAvailabilityBands(new Set(["1030"]), rules);
    expect(bands.find((b) => b.slot === "1030")?.free).toBe(false);
    expect(endTimeOptions(bands, "10:00", rules)).toEqual(["10:30"]);
    expect(endTimeOptions(bands, "10:30", rules)).toEqual([]);
    expect(endTimeOptions(bands, "11:00", rules)).toEqual(["11:30", "12:00", "12:30", "13:00", "13:30", "14:00"]);
  });

  it("caps end times at the maximum booking length", () => {
    const bands = buildAvailabilityBands(new Set(), rules);
    expect(endTimeOptions(bands, "08:00", rules)).toHaveLength(6);
  });

  it("greys out times that have already passed today", () => {
    const bands = markPastBands(buildAvailabilityBands(new Set(), rules), toDateKey(TEST_NOW), TEST_NOW);
    expect(bands.find((b) => b.time === "09:30")?.free).toBe(false);
    expect(bands.find((b) => b.time === "10:00")?.free).toBe(false);
    expect(bands.find((b) => b.time === "10:30")?.free).toBe(true);
  });

  it("only pending and approved bookings hold slots", () => {
    expect(holdsSlots("pending")).toBe(true);
    expect(holdsSlots("approved")).toBe(true);
    expect(holdsSlots("rejected")).toBe(false);
    expect(holdsSlots("cancelled")).toBe(false);
  });
});

describe("status transitions", () => {
  it("lets students only cancel, and only while a booking is active", () => {
    expect(canTransitionBooking("pending", "cancelled", "owner")).toBe(true);
    expect(canTransitionBooking("pending", "approved", "owner")).toBe(false);
    expect(canTransitionBooking("rejected", "cancelled", "owner")).toBe(false);
  });

  it("lets staff approve, reject or cancel, but never revive a closed booking", () => {
    expect(canTransitionBooking("pending", "approved", "staff")).toBe(true);
    expect(canTransitionBooking("pending", "rejected", "staff")).toBe(true);
    expect(canTransitionBooking("approved", "cancelled", "staff")).toBe(true);
    expect(canTransitionBooking("approved", "rejected", "staff")).toBe(false);
    expect(canTransitionBooking("cancelled", "approved", "staff")).toBe(false);
  });
});

describe("booking service with conflict prevention", () => {
  const amaya = { id: "u-student1", name: "Amaya" };
  const kasun = { id: "u-student2", name: "Kasun" };
  const staff = { id: "u-facilities", name: "Facilities" };

  async function setup() {
    const world = createTestWorld();
    const service = createClassroomService(world.store, world.clock);
    const target = await service.getRoom("room-d111");
    if (!target) throw new Error("demo room missing");
    const request = { roomId: target.id, date: DAY, startTime: "10:00", endTime: "11:00", attendees: 5, purpose: "Team meeting" };
    return { world, service, target, request };
  }

  it("creates a pending booking and reserves its slots", async () => {
    const { world, service, target, request } = await setup();
    const id = await service.requestBooking(request, amaya, target);
    const booking = await world.store.get<Booking>(`bookings/${id}`);
    expect(booking?.status).toBe("pending");
    expect(booking?.slots).toHaveLength(2);
    const availability = await service.getAvailability(target.id, DAY);
    expect(availability.filter((b) => !b.free).map((b) => b.time)).toEqual(["10:00", "10:30"]);
  });

  it("refuses an overlapping request from another student", async () => {
    const { service, target, request } = await setup();
    await service.requestBooking(request, amaya, target);
    await expect(service.requestBooking({ ...request, startTime: "10:30", endTime: "11:30" }, kasun, target)).rejects.toBeInstanceOf(BookingConflictError);
    // Back-to-back is fine: the first booking ends when the second begins.
    await expect(service.requestBooking({ ...request, startTime: "11:00", endTime: "12:00" }, kasun, target)).resolves.toBeTruthy();
  });

  it("lets exactly one of two simultaneous requests win", async () => {
    const { service, target, request } = await setup();
    const results = await Promise.allSettled([service.requestBooking(request, amaya, target), service.requestBooking(request, kasun, target)]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const failed = results.find((r) => r.status === "rejected");
    expect(failed && failed.status === "rejected" && failed.reason).toBeInstanceOf(BookingConflictError);
  });

  it("throws a validation error listing every problem, and writes nothing", async () => {
    const { world, service, target, request } = await setup();
    const before = await world.store.count("bookings");
    const error = await service.requestBooking({ ...request, attendees: 99, purpose: "" }, amaya, target).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(BookingValidationError);
    expect((error as BookingValidationError).issues.map((i) => i.field)).toEqual(expect.arrayContaining(["attendees", "purpose"]));
    expect(await world.store.count("bookings")).toBe(before);
  });

  it("frees the time again when staff reject, and notifies the student", async () => {
    const { world, service, target, request } = await setup();
    const id = await service.requestBooking(request, amaya, target);
    const booking = (await world.store.get<Booking>(`bookings/${id}`))!;
    await service.decide(booking, "rejected", staff, "Lab is closed for maintenance");
    expect((await world.store.get<Booking>(`bookings/${id}`))?.status).toBe("rejected");
    await expect(service.requestBooking(request, kasun, target)).resolves.toBeTruthy();
    const notes = await world.store.list("notifications", { where: [{ field: "recipientId", op: "==", value: amaya.id }] });
    expect(notes.items.some((n) => String((n as unknown as { title: string }).title).includes("rejected"))).toBe(true);
  });

  it("keeps the time held after approval and frees it when the owner cancels", async () => {
    const { world, service, target, request } = await setup();
    const id = await service.requestBooking(request, amaya, target);
    let booking = (await world.store.get<Booking>(`bookings/${id}`))!;
    await service.decide(booking, "approved", staff, "");
    await expect(service.requestBooking(request, kasun, target)).rejects.toBeInstanceOf(BookingConflictError);
    booking = (await world.store.get<Booking>(`bookings/${id}`))!;
    await service.cancel(booking, amaya, "owner");
    await expect(service.requestBooking(request, kasun, target)).resolves.toBeTruthy();
  });

  it("blocks decisions that the workflow does not allow", async () => {
    const { world, service, target, request } = await setup();
    const id = await service.requestBooking(request, amaya, target);
    let booking = (await world.store.get<Booking>(`bookings/${id}`))!;
    await service.decide(booking, "rejected", staff, "No");
    booking = (await world.store.get<Booking>(`bookings/${id}`))!;
    await expect(service.decide(booking, "approved", staff, "")).rejects.toBeInstanceOf(AppError);
    await expect(service.cancel(booking, amaya, "owner")).rejects.toBeInstanceOf(AppError);
  });

  it("uses administrator-changed opening hours", async () => {
    const { world, service, target, request } = await setup();
    await world.store.commit([{ kind: "update", path: "settings/app", data: { bookingCloseTime: "10:30" } }]);
    await expect(service.requestBooking(request, amaya, target)).rejects.toBeInstanceOf(BookingValidationError);
  });
});
