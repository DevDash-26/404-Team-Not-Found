import { z } from "zod";
import { FIELD_LIMITS } from "@/config/app";
import { dateKeyField, text } from "@/lib/schemas";
import { CONTACT_METHODS, LOST_FOUND_CATEGORIES, LOST_FOUND_TYPES } from "@/types";
import { toDateKey } from "@/utils/dates";

const contactSchema = z.object({
  type: z.enum(CONTACT_METHODS, { error: "Choose how people can reach you." }),
  value: z.string().trim().max(120),
});

export const lostFoundSchema = z
  .object({
    type: z.enum(LOST_FOUND_TYPES, { error: "Choose lost or found." }),
    title: text("Title", 3, 100),
    description: text("Description", 10, FIELD_LIMITS.message),
    category: z.enum(LOST_FOUND_CATEGORIES, { error: "Choose a category." }),
    location: text("Location", 2, FIELD_LIMITS.shortText),
    date: dateKeyField,
    imageUrl: z.string().nullable(),
    imagePath: z.string().nullable(),
    contact: contactSchema,
  })
  .superRefine((value, ctx) => {
    if (value.date > toDateKey(new Date())) {
      ctx.addIssue({ code: "custom", path: ["date"], message: "The date can't be in the future." });
    }
    const { type, value: contact } = value.contact;
    if (type === "email" && !z.email().safeParse(contact).success) {
      ctx.addIssue({ code: "custom", path: ["contact.value"], message: "Enter a valid email address." });
    }
    if (type === "phone" && !/^[+()\d\s-]{7,20}$/.test(contact)) {
      ctx.addIssue({ code: "custom", path: ["contact.value"], message: "Enter a valid phone number." });
    }
  });

export type LostFoundInput = z.infer<typeof lostFoundSchema>;
