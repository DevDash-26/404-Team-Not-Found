import { z } from "zod";
import { FIELD_LIMITS } from "@/config/app";
import { isoField, positiveInt, text } from "@/lib/schemas";
import { EVENT_CATEGORIES } from "@/types";

export const eventSchema = z
  .object({
    title: text("Event name", 3, FIELD_LIMITS.title),
    description: text("Description", 10, FIELD_LIMITS.description),
    startsAt: isoField,
    endsAt: isoField,
    location: text("Location", 2, FIELD_LIMITS.shortText),
    organiser: text("Organiser", 2, FIELD_LIMITS.name),
    societyId: z.string().nullable(),
    category: z.enum(EVENT_CATEGORIES, { error: "Choose a category." }),
    capacity: positiveInt("Capacity", 0, 100_000),
    imageUrl: z.string().nullable(),
    imagePath: z.string().nullable(),
  })
  .superRefine((value, ctx) => {
    if (new Date(value.endsAt).getTime() <= new Date(value.startsAt).getTime()) {
      ctx.addIssue({ code: "custom", path: ["endsAt"], message: "The end time must be after the start time." });
    }
  });

export type EventInput = z.infer<typeof eventSchema>;
