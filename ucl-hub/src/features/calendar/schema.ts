import { z } from "zod";
import { FIELD_LIMITS } from "@/config/app";
import { audienceSchema, dateKeyField, optionalText, text } from "@/lib/schemas";
import { CALENDAR_TYPES } from "@/types";

export const calendarEntrySchema = z
  .object({
    title: text("Title", 3, FIELD_LIMITS.title),
    type: z.enum(CALENDAR_TYPES, { error: "Choose a type." }),
    startDate: dateKeyField,
    endDate: dateKeyField,
    description: optionalText("Description", FIELD_LIMITS.message),
    audience: audienceSchema,
  })
  .superRefine((value, ctx) => {
    if (value.endDate < value.startDate) {
      ctx.addIssue({ code: "custom", path: ["endDate"], message: "The end date can't be before the start date." });
    }
  });

export type CalendarEntryInput = z.infer<typeof calendarEntrySchema>;
