/**
 * Built-in answer engine ("mock" provider). It writes answers directly from
 * the retrieved documents with no language model, so the whole assistant works
 * (and is testable) without an API key. It is also the fallback when a real
 * provider is down.
 */

import { formatDate } from "@/utils/dates";
import { truncate } from "@/utils/text";
import type { Intent, KnowledgeDocument, KnowledgeKind, TimeWindow } from "../types";

export const NO_ANSWER_MESSAGE =
  "I couldn't find that in the campus information I have. Try rephrasing, check the Staff Directory for the right person, or send it through Feedback so we can add it.";

interface ComposeInput {
  documents: KnowledgeDocument[];
  intents: Intent[];
  window: TimeWindow | null;
  now: Date;
  question?: string;
}

const MAX_EVENTS = 4;
const MAX_JOBS = 3;
const MAX_STAFF = 2;
const SNIPPET_LENGTH = 380;

export function composeExtractiveAnswer({ documents, intents, window, now, question = "" }: ComposeInput): string {
  const top = documents[0];
  if (!top) return NO_ANSWER_MESSAGE;

  const has = (id: string) => intents.some((intent) => intent.id === id);
  const ofKind = (kind: KnowledgeKind) => documents.filter((doc) => doc.kind === kind);

  const events = ofKind("event");
  if (has("events") && events.length > 0) {
    const intro = window ? `Here's what's on ${window.label}:` : "Here are upcoming events that match:";
    const chronological = [...events].sort((a, b) => (a.startsAt ?? "").localeCompare(b.startsAt ?? ""));
    const lines = chronological.slice(0, MAX_EVENTS).map((e) => `• ${e.title}: ${e.facts?.when ?? ""}, ${e.facts?.location ?? ""}`);
    return [intro, ...lines].join("\n");
  }

  const jobs = ofKind("job");
  if (has("jobs") && jobs.length > 0) {
    const lines = jobs.slice(0, MAX_JOBS).map((j) => `• ${j.title}, ${j.facts?.location ?? ""} (apply by ${j.facts?.deadline ?? "the deadline"})`);
    return ["Yes, these openings are currently listed:", ...lines].join("\n");
  }

  const staff = ofKind("staff");
  if (has("contact") && staff.length > 0) {
    const lines = staff.slice(0, MAX_STAFF).map((s) => `• ${s.title}: ${s.facts?.contact ?? ""}. Office: ${s.facts?.location ?? "see the directory"}.`);
    return ["The best people to contact are:", ...lines].join("\n");
  }

  if (has("hours") && top.kind === "service" && top.facts?.hours) {
    return `${top.title} hours: ${top.facts.hours}. You'll find it at ${top.facts.location ?? "the campus"}.`;
  }

  const calendar = ofKind("calendar");
  if (has("calendar") && calendar.length > 0) {
    // "When does X start?" wants one date; "exam dates" wants the upcoming few, in order.
    const single = /\b(start|starts|starting|begin|begins|beginning)\b/i.test(question);
    const upcoming = calendar
      .filter((c) => !c.endsAt || new Date(c.endsAt).getTime() >= now.getTime())
      .sort((a, b) => (a.startsAt ?? "").localeCompare(b.startsAt ?? ""));
    const chosen = single ? [calendar[0]] : upcoming.slice(0, 3);
    const lines = chosen.filter((c): c is KnowledgeDocument => Boolean(c)).map((c) => `${c.title}: ${c.facts?.when ?? formatDate(c.startsAt)}.`);
    return lines.length > 0 ? lines.join("\n") : truncate(top.text, SNIPPET_LENGTH);
  }

  if (top.kind === "faq" || top.kind === "guide" || top.kind === "note") return truncate(top.text, SNIPPET_LENGTH * 1.5);
  if (top.kind === "service") return `${top.title}: ${truncate(top.text, SNIPPET_LENGTH)}`;
  return `${top.title}: ${truncate(top.text, SNIPPET_LENGTH)}`;
}
