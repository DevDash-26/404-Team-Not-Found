/** Firestore collection names and document path helpers. */

export const COLLECTIONS = {
  users: "users",
  announcements: "announcements",
  events: "events",
  eventInterests: "eventInterests",
  societies: "societies",
  societyInterests: "societyInterests",
  lostFound: "lostFound",
  rooms: "rooms",
  bookings: "bookings",
  roomSlots: "roomSlots",
  facilityIssues: "facilityIssues",
  supportRequests: "supportRequests",
  calendar: "calendar",
  jobs: "jobs",
  services: "services",
  staffDirectory: "staffDirectory",
  faqs: "faqs",
  notifications: "notifications",
  notificationReads: "notificationReads",
  feedback: "feedback",
  knowledge: "knowledge",
  assistantLogs: "assistantLogs",
  settings: "settings",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

export const SETTINGS_DOC_ID = "app";

export function docPath(collection: CollectionName, id: string): string {
  return `${collection}/${id}`;
}

/** Deterministic id of a user's interest in an event (one per user per event). */
export function eventInterestId(eventId: string, userId: string): string {
  return `${eventId}_${userId}`;
}

export function societyInterestId(societyId: string, userId: string): string {
  return `${societyId}_${userId}`;
}

/** Deterministic id of a room slot: `<roomId>_<YYYY-MM-DD>_<HHmm>`. */
export function roomSlotId(roomId: string, date: string, slot: string): string {
  return `${roomId}_${date}_${slot}`;
}

export function notificationReadId(userId: string, notificationId: string): string {
  return `${userId}_${notificationId}`;
}
