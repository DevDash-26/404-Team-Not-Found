/**
 * Builds the write operation that creates a notification, so any service can
 * add "notify people" to the same atomic commit as the change it announces.
 */

import { COLLECTIONS } from "@/lib/backend/collections";
import type { DataStore, WriteOp } from "@/lib/backend/types";
import { EVERYONE, type Audience, type NotificationType } from "@/types";
import { systemClock, type Clock } from "@/utils/clock";
import { truncate } from "@/utils/text";

const NOTIFICATION_BODY_MAX = 240;

export interface NotificationInput {
  title: string;
  body: string;
  type: NotificationType;
  /** In-app route to open, e.g. "/events". */
  link: string;
  /** Null (default) broadcasts to `audience`; a user id makes it personal. */
  recipientId?: string | null;
  audience?: Audience;
  createdBy: string;
}

export function notificationOp(store: DataStore, input: NotificationInput, clock: Clock = systemClock): WriteOp {
  const id = store.newId(COLLECTIONS.notifications);
  return {
    kind: "create",
    path: `${COLLECTIONS.notifications}/${id}`,
    data: {
      title: truncate(input.title, 140),
      body: truncate(input.body, NOTIFICATION_BODY_MAX),
      type: input.type,
      link: input.link,
      recipientId: input.recipientId ?? null,
      audience: input.audience ?? EVERYONE,
      createdBy: input.createdBy,
      createdAt: clock.now().toISOString(),
    },
  };
}
