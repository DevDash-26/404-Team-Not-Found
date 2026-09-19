import { z } from "zod";
import { FIELD_LIMITS } from "@/config/app";
import { text } from "@/lib/schemas";
import { splitList } from "@/utils/text";

/** Links the assistant may attach: an in-app route or an http(s) URL, or nothing. */
const linkField = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\/[a-z0-9\-/]*$/i.test(v) || /^https?:\/\/[^\s]+$/i.test(v), "Use an app page such as /services or a full https:// link.")
  .default("");

/** Extra knowledge an administrator teaches the assistant (opening-hour changes, policies, contacts...). */
export const knowledgeSchema = z.object({
  title: text("Title", 3, FIELD_LIMITS.title),
  content: text("Content", 10, FIELD_LIMITS.description),
  keywords: z.union([z.string().transform(splitList), z.array(z.string())]).transform((list) => list.slice(0, 20)),
  link: linkField,
  active: z.boolean().default(true),
});

export type KnowledgeInput = z.infer<typeof knowledgeSchema>;
