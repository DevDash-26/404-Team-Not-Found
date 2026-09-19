import { z } from "zod";
import { FIELD_LIMITS } from "@/config/app";
import { positiveInt, text } from "@/lib/schemas";
import { FAQ_CATEGORIES } from "@/types";

export const faqSchema = z.object({
  question: text("Question", 5, 200),
  answer: text("Answer", 10, FIELD_LIMITS.description),
  category: z.enum(FAQ_CATEGORIES, { error: "Choose a category." }),
  order: positiveInt("Order", 0, 1000),
});

export type FaqInput = z.infer<typeof faqSchema>;
