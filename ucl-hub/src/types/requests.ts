/** Student-initiated records: lost & found, bookings, facility issues, support requests, feedback. */

import type { ActorRef } from "./user";

// ---------------------------------------------------------------- Lost & found

export const LOST_FOUND_TYPES = ["lost", "found"] as const;
export type LostFoundType = (typeof LOST_FOUND_TYPES)[number];

export const LOST_FOUND_STATUSES = ["open", "claimed", "resolved"] as const;
export type LostFoundStatus = (typeof LOST_FOUND_STATUSES)[number];

export const LOST_FOUND_CATEGORIES = [
  "electronics",
  "documents-ids",
  "bags",
  "keys",
  "clothing",
  "accessories",
  "books-stationery",
  "other",
] as const;
export type LostFoundCategory = (typeof LOST_FOUND_CATEGORIES)[number];

export const CONTACT_METHODS = ["email", "phone", "front-desk"] as const;
export type ContactMethodType = (typeof CONTACT_METHODS)[number];

export interface ContactMethod {
  type: ContactMethodType;
  /** Email address or phone number; ignored for `front-desk`. */
  value: string;
}

export interface LostFoundItem {
  id: string;
  type: LostFoundType;
  title: string;
  description: string;
  category: LostFoundCategory;
  location: string;
  /** `YYYY-MM-DD` the item was lost or found. */
  date: string;
  imageUrl: string | null;
  imagePath: string | null;
  contact: ContactMethod;
  status: LostFoundStatus;
  reporter: ActorRef;
  createdAt: string;
}

// ---------------------------------------------------------------- Rooms and bookings

export const ROOM_TYPES = ["lecture-hall", "study-room", "computer-lab", "seminar-room"] as const;
export type RoomType = (typeof ROOM_TYPES)[number];

export interface Room {
  id: string;
  name: string;
  building: string;
  floor: number;
  capacity: number;
  type: RoomType;
  facilities: string[];
  active: boolean;
}

export const BOOKING_STATUSES = ["pending", "approved", "rejected", "cancelled"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export interface Booking {
  id: string;
  roomId: string;
  roomName: string;
  requester: ActorRef;
  /** `YYYY-MM-DD` */
  date: string;
  /** "HH:mm" */
  startTime: string;
  endTime: string;
  attendees: number;
  purpose: string;
  status: BookingStatus;
  /** Ids of the `roomSlots` documents this booking holds. Freed on reject/cancel. */
  slots: string[];
  decisionNote: string;
  decidedBy: ActorRef | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * One document per room per half hour. Because a slot document can only be
 * created once, the database itself prevents double booking, even when two
 * students submit at the same instant.
 */
export interface RoomSlot {
  id: string;
  roomId: string;
  /** `YYYY-MM-DD` */
  date: string;
  /** "HHmm" start of the slot */
  slot: string;
  bookingId: string;
}

// ---------------------------------------------------------------- Facility issues

export const FACILITY_CATEGORIES = [
  "air-conditioning",
  "furniture",
  "lighting",
  "internet",
  "plumbing",
  "cleanliness",
  "equipment",
  "other",
] as const;
export type FacilityCategory = (typeof FACILITY_CATEGORIES)[number];

export const FACILITY_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type FacilityPriority = (typeof FACILITY_PRIORITIES)[number];

export const FACILITY_STATUSES = ["submitted", "assigned", "in-progress", "resolved"] as const;
export type FacilityStatus = (typeof FACILITY_STATUSES)[number];

export interface FacilityUpdate {
  status: FacilityStatus;
  note: string;
  by: string;
  at: string;
}

export interface FacilityIssue {
  id: string;
  category: FacilityCategory;
  location: string;
  description: string;
  priority: FacilityPriority;
  status: FacilityStatus;
  imageUrl: string | null;
  imagePath: string | null;
  reporter: ActorRef;
  assignedTo: ActorRef | null;
  updates: FacilityUpdate[];
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------- Academic support

export const SUPPORT_TYPES = ["peer-tutoring", "study-group", "mentorship"] as const;
export type SupportType = (typeof SUPPORT_TYPES)[number];

export const SUPPORT_STATUSES = ["open", "matched", "closed"] as const;
export type SupportStatus = (typeof SUPPORT_STATUSES)[number];

export interface SupportRequest {
  id: string;
  type: SupportType;
  subject: string;
  description: string;
  preferredTimes: string;
  status: SupportStatus;
  requester: ActorRef;
  faculty: string | null;
  programme: string | null;
  year: number | null;
  matchedWith: { name: string; email: string } | null;
  staffNote: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------- Feedback

export const FEEDBACK_CATEGORIES = ["suggestion", "content-issue", "bug", "question", "other"] as const;
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export const FEEDBACK_STATUSES = ["new", "reviewed"] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export interface Feedback {
  id: string;
  category: FeedbackCategory;
  message: string;
  status: FeedbackStatus;
  from: ActorRef;
  createdAt: string;
}
