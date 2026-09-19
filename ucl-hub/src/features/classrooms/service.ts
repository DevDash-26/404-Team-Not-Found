import { PAGINATION } from "@/config/app";
import { COLLECTIONS, roomSlotId, SETTINGS_DOC_ID } from "@/lib/backend/collections";
import type { DataStore, Page, WriteOp } from "@/lib/backend/types";
import { createCrudService } from "@/services/crud";
import { notificationOp } from "@/services/notificationOps";
import { readAllPages } from "@/services/paging";
import type { ActorRef, AppSettings, Booking, BookingStatus, Room, RoomSlot } from "@/types";
import { systemClock, type Clock } from "@/utils/clock";
import { AppError, BookingConflictError } from "@/utils/errors";
import { formatDate } from "@/utils/dates";
import { BookingValidationError } from "./errors";
import {
  buildAvailabilityBands,
  buildSlotIds,
  canTransitionBooking,
  findConflicts,
  holdsSlots,
  rulesFromSettings,
  slotStarts,
  validateBookingRequest,
  type BookingActor,
  type BookingRequestInput,
  type BookingRules,
  type TimeBand,
} from "./logic";
import type { RoomInput } from "./schema";

export function createClassroomService(store: DataStore, clock: Clock = systemClock) {
  const rooms = createCrudService<Room>(store, COLLECTIONS.rooms);
  const bookings = createCrudService<Booking>(store, COLLECTIONS.bookings);

  async function getTakenSlots(roomId: string, date: string): Promise<Set<string>> {
    const slots = await readAllPages((after) =>
      store.list<RoomSlot>(COLLECTIONS.roomSlots, {
        where: [
          { field: "roomId", op: "==", value: roomId },
          { field: "date", op: "==", value: date },
        ],
        limit: 100,
        after,
      }),
    );
    return new Set(slots.map((s) => s.slot));
  }

  /** Full slot document ids already taken for a room and day. */
  async function getTakenSlotIds(roomId: string, date: string): Promise<Set<string>> {
    const taken = await getTakenSlots(roomId, date);
    return new Set([...taken].map((slot) => roomSlotId(roomId, date, slot)));
  }

  async function getRules(): Promise<BookingRules> {
    const settings = await store.get<AppSettings>(`${COLLECTIONS.settings}/${SETTINGS_DOC_ID}`);
    return rulesFromSettings(settings);
  }

  /** Ops that release a booking's slots and record its new status. */
  function releaseOps(booking: Booking, patch: Record<string, unknown>): WriteOp[] {
    return [
      { kind: "update", path: `${COLLECTIONS.bookings}/${booking.id}`, data: patch },
      ...booking.slots.map((slotId) => ({ kind: "delete" as const, path: `${COLLECTIONS.roomSlots}/${slotId}` })),
    ];
  }

  return {
    listRooms: () => rooms.listAll({ orderBy: [{ field: "name" }] }),
    getRoom: rooms.get,
    createRoom: (input: RoomInput) => rooms.create(input),
    updateRoom: (id: string, input: RoomInput) => rooms.update(id, input),
    removeRoom: rooms.remove,

    getRules,

    async getSettings(): Promise<AppSettings | null> {
      return store.get<AppSettings>(`${COLLECTIONS.settings}/${SETTINGS_DOC_ID}`);
    },

    /** Every bookable half hour for a room and day, flagged free or taken. */
    async getAvailability(roomId: string, date: string): Promise<TimeBand[]> {
      const [taken, rules] = await Promise.all([getTakenSlots(roomId, date), getRules()]);
      return buildAvailabilityBands(taken, rules);
    },

    /**
     * Requests a room. The booking and one document per half-hour slot are
     * written in a single atomic commit; slot documents can only be created
     * once, so two simultaneous requests for the same time cannot both succeed.
     */
    async requestBooking(input: BookingRequestInput, requester: ActorRef, room: Room): Promise<string> {
      const now = clock.now();
      const rules = await getRules();

      const issues = validateBookingRequest(input, room, rules, now);
      if (issues.length > 0) throw new BookingValidationError(issues);

      const slotStartTimes = slotStarts(input.startTime, input.endTime, rules.slotMinutes);
      const slotIds = buildSlotIds(room.id, input.date, input.startTime, input.endTime, rules.slotMinutes);
      const takenIds = await getTakenSlotIds(room.id, input.date);
      const clashes = findConflicts(slotIds, takenIds);
      if (clashes.length > 0) throw new BookingConflictError(clashes);

      const bookingId = store.newId(COLLECTIONS.bookings);
      const timestamp = now.toISOString();
      const booking: Omit<Booking, "id"> = {
        roomId: room.id,
        roomName: room.name,
        requester,
        date: input.date,
        startTime: input.startTime,
        endTime: input.endTime,
        attendees: input.attendees,
        purpose: input.purpose.trim(),
        status: "pending",
        slots: slotIds,
        decisionNote: "",
        decidedBy: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      try {
        await store.commit([
          { kind: "create", path: `${COLLECTIONS.bookings}/${bookingId}`, data: booking as unknown as Record<string, unknown> },
          ...slotStartTimes.map(
            (slot): WriteOp => ({
              kind: "create",
              path: `${COLLECTIONS.roomSlots}/${roomSlotId(room.id, input.date, slot)}`,
              data: { roomId: room.id, date: input.date, slot, bookingId },
            }),
          ),
        ]);
      } catch (error) {
        // Somebody else may have taken a slot between our check and the write.
        const nowTaken = findConflicts(slotIds, await getTakenSlotIds(room.id, input.date));
        if (nowTaken.length > 0) throw new BookingConflictError(nowTaken);
        throw error;
      }
      return bookingId;
    },

    async listMine(userId: string): Promise<Booking[]> {
      const items = await readAllPages((after) =>
        store.list<Booking>(COLLECTIONS.bookings, {
          where: [{ field: "requester.id", op: "==", value: userId }],
          limit: 100,
          after,
        }),
      );
      return items.sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime));
    },

    /** Booking queue for approvers, newest requests first. */
    listAll(cursor?: unknown, pageSize: number = PAGINATION.adminPageSize): Promise<Page<Booking>> {
      return bookings.list({ orderBy: [{ field: "createdAt", direction: "desc" }], limit: pageSize, after: cursor });
    },

    /** Approves or rejects a pending booking and tells the requester. */
    async decide(booking: Booking, decision: Extract<BookingStatus, "approved" | "rejected">, staff: ActorRef, note: string): Promise<void> {
      if (!canTransitionBooking(booking.status, decision, "staff")) {
        throw new AppError("validation", `A ${booking.status} booking can't be ${decision}.`);
      }
      const patch = { status: decision, decisionNote: note.trim(), decidedBy: staff, updatedAt: clock.now().toISOString() };
      const notify = notificationOp(
        store,
        {
          title: `Booking ${decision}: ${booking.roomName}`,
          body: `${formatDate(booking.date)}, ${booking.startTime} to ${booking.endTime}. ${note.trim()}`.trim(),
          type: "booking",
          link: "/classrooms",
          recipientId: booking.requester.id,
          createdBy: staff.id,
        },
        clock,
      );
      const ops = holdsSlots(decision) ? [{ kind: "update" as const, path: `${COLLECTIONS.bookings}/${booking.id}`, data: patch }] : releaseOps(booking, patch);
      await store.commit([...ops, notify]);
    },

    /** Cancels a booking (by its owner or by staff) and frees the slots for others. */
    async cancel(booking: Booking, actor: ActorRef, by: BookingActor, note = ""): Promise<void> {
      if (!canTransitionBooking(booking.status, "cancelled", by)) {
        throw new AppError("validation", `A ${booking.status} booking can't be cancelled.`);
      }
      const updatedAt = clock.now().toISOString();
      const patch =
        by === "owner"
          ? { status: "cancelled", updatedAt }
          : { status: "cancelled", decisionNote: note.trim(), decidedBy: actor, updatedAt };
      const ops = releaseOps(booking, patch);
      if (by === "staff") {
        ops.push(
          notificationOp(
            store,
            {
              title: `Booking cancelled: ${booking.roomName}`,
              body: note.trim() || "Your booking was cancelled by staff.",
              type: "booking",
              link: "/classrooms",
              recipientId: booking.requester.id,
              createdBy: actor.id,
            },
            clock,
          ),
        );
      }
      await store.commit(ops);
    },
  };
}

export type ClassroomService = ReturnType<typeof createClassroomService>;
