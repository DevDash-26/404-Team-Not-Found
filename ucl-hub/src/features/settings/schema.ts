import { z } from "zod";
import { positiveInt, optionalText } from "@/lib/schemas";
import { timeToMinutes } from "@/utils/dates";

const timeField = z.string().refine((v) => !Number.isNaN(timeToMinutes(v)), "Use the format HH:mm, for example 08:00.");

export const settingsSchema = z
  .object({
    bookingOpenTime: timeField,
    bookingCloseTime: timeField,
    bookingMaxHours: positiveInt("Maximum booking length", 1, 8),
    bookingAdvanceDays: positiveInt("Advance booking window", 1, 180),
    systemMessage: optionalText("System message", 200),
  })
  .superRefine((value, ctx) => {
    if (timeToMinutes(value.bookingCloseTime) <= timeToMinutes(value.bookingOpenTime)) {
      ctx.addIssue({ code: "custom", path: ["bookingCloseTime"], message: "Closing time must be after opening time." });
    }
  });

export type SettingsInput = z.infer<typeof settingsSchema>;
