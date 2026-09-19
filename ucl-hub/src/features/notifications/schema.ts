import { z } from "zod";
import { audienceSchema, text } from "@/lib/schemas";
import { NOTIFICATION_TYPES } from "@/types";

/** A manually composed broadcast notification. */
export const broadcastSchema = z.object({
  title: text("Title", 3, 140),
  body: text("Message", 5, 240),
  type: z.enum(NOTIFICATION_TYPES),
  link: z
    .string()
    .trim()
    .refine((v) => v.startsWith("/") || /^https?:\/\//.test(v), "Use an in-app path such as /events."),
  audience: audienceSchema,
});

export type BroadcastInput = z.infer<typeof broadcastSchema>;
