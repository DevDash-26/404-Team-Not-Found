import { z } from "zod";
import { FIELD_LIMITS } from "@/config/app";
import { attachmentSchema, audienceSchema, text } from "@/lib/schemas";
import { ANNOUNCEMENT_CATEGORIES, ANNOUNCEMENT_PRIORITIES } from "@/types";

export const announcementSchema = z.object({
  title: text("Title", 3, FIELD_LIMITS.title),
  description: text("Description", 10, FIELD_LIMITS.description),
  category: z.enum(ANNOUNCEMENT_CATEGORIES, { error: "Choose a category." }),
  priority: z.enum(ANNOUNCEMENT_PRIORITIES, { error: "Choose a priority." }),
  source: text("Source office", 2, FIELD_LIMITS.name),
  audience: audienceSchema,
  attachments: z.array(attachmentSchema).max(5, "You can attach up to 5 files."),
  expiresAt: z.string().nullable(),
});

export type AnnouncementInput = z.infer<typeof announcementSchema>;
