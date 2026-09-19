/** Cross-cutting records: notifications, settings, AI knowledge and logs. */

import type { Audience } from "./campus";

export const NOTIFICATION_TYPES = [
  "announcement",
  "emergency",
  "event",
  "booking",
  "facility",
  "job",
  "society",
  "support",
  "system",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/**
 * A notification is either a broadcast (`recipientId === null`, filtered by
 * `audience`) or personal (`recipientId` is a user id). Read state is stored
 * separately per user, so broadcasts never need one write per recipient.
 */
export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  /** In-app route the notification opens, e.g. "/events". */
  link: string;
  recipientId: string | null;
  audience: Audience;
  createdBy: string;
  createdAt: string;
}

export interface NotificationRead {
  id: string;
  userId: string;
  notificationId: string;
  readAt: string;
}

/** A notification prepared for display with its read state resolved. */
export interface NotificationView extends AppNotification {
  read: boolean;
  /** True for reminders computed on the device (they are not stored). */
  derived: boolean;
}

export interface AppSettings {
  id: string;
  bookingOpenTime: string;
  bookingCloseTime: string;
  bookingMaxHours: number;
  bookingAdvanceDays: number;
  /** Shown as a banner on every page when non-empty. */
  systemMessage: string;
}

export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  keywords: string[];
  /** Optional in-app or external link the assistant offers alongside the answer. */
  link: string;
  active: boolean;
  updatedAt: string;
}

/** Anonymous record of an assistant question (no user id is stored). */
export interface AssistantLog {
  id: string;
  question: string;
  answered: boolean;
  sourceCount: number;
  provider: string;
  createdAt: string;
}
