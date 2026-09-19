import type { Faq, FaqCategory } from "@/types";
import { FAQ_CATEGORIES } from "@/types";
import { matchesQuery } from "@/utils/text";

export function searchFaqs(items: Faq[], query: string, category: FaqCategory | "all"): Faq[] {
  return items.filter((faq) => {
    if (category !== "all" && faq.category !== category) return false;
    return matchesQuery([faq.question, faq.answer, faq.category], query);
  });
}

/** FAQs grouped by category in a stable, editorially defined order. */
export function groupFaqs(items: Faq[]): Array<{ category: FaqCategory; faqs: Faq[] }> {
  return FAQ_CATEGORIES.map((category) => ({
    category,
    faqs: items.filter((f) => f.category === category).sort((a, b) => a.order - b.order || a.question.localeCompare(b.question)),
  })).filter((group) => group.faqs.length > 0);
}
