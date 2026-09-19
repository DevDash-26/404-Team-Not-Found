import { z } from "zod";
import { FIELD_LIMITS } from "@/config/app";
import { text } from "@/lib/schemas";
import { FEEDBACK_CATEGORIES } from "@/types";

export const feedbackSchema = z.object({
  category: z.enum(FEEDBACK_CATEGORIES, { error: "Choose a category." }),
  message: text("Message", 10, FIELD_LIMITS.message),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;
