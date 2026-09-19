import { z } from "zod";
import { FIELD_LIMITS } from "@/config/app";
import { emailField, optionalText, text } from "@/lib/schemas";
import { SUPPORT_STATUSES, SUPPORT_TYPES } from "@/types";

export const supportRequestSchema = z.object({
  type: z.enum(SUPPORT_TYPES, { error: "Choose the kind of support you need." }),
  subject: text("Subject", 3, 120),
  description: text("Details", 10, FIELD_LIMITS.message),
  preferredTimes: optionalText("Preferred times", 200),
});

export type SupportRequestInput = z.infer<typeof supportRequestSchema>;

/** Fields staff fill in when matching or closing a request. */
export const supportDecisionSchema = z
  .object({
    status: z.enum(SUPPORT_STATUSES),
    matchedName: optionalText("Matched with", 120),
    matchedEmail: z
      .string()
      .trim()
      .toLowerCase()
      .refine((v) => v === "" || emailField.safeParse(v).success, "Enter a valid email address.")
      .default(""),
    staffNote: optionalText("Note", 500),
  })
  .superRefine((value, ctx) => {
    if (value.status === "matched" && !value.matchedName) {
      ctx.addIssue({ code: "custom", path: ["matchedName"], message: "Say who the student is matched with." });
    }
  });

export type SupportDecisionInput = z.infer<typeof supportDecisionSchema>;
