/**
 * Lightweight intent detection. Intents do two jobs: they bias retrieval
 * towards the kind of content likely to answer the question, and they decide
 * which "take me there" buttons the assistant offers.
 */

import { plainQuery } from "./text";
import type { Intent } from "../types";

interface IntentRule extends Intent {
  pattern: RegExp;
}

const RULES: IntentRule[] = [
  {
    id: "hours",
    pattern: /\b(open|opens|opening|close|closes|closing|closed|hours|until|what time)\b/,
    boost: { service: 1.5 },
    actions: [{ label: "Campus services", href: "/services" }],
  },
  {
    id: "contact",
    pattern: /\b(who|contact|email|phone|call|speak|reach|talk to|reception|office)\b/,
    boost: { staff: 1.8, service: 1.2 },
    actions: [{ label: "Staff directory", href: "/staff-directory" }],
  },
  {
    id: "events",
    pattern: /\b(events?|happening|going on|workshops?|lectures?|talks?|fairs?|competitions?|whats on|what s on|programmes?)\b/,
    boost: { event: 1.8 },
    actions: [{ label: "Browse events", href: "/events" }],
  },
  {
    id: "jobs",
    pattern: /\b(jobs?|interns?|internships?|vacanc\w*|part time|placements?|careers?|hiring|volunteer\w*)\b/,
    boost: { job: 2.2 },
    actions: [{ label: "Jobs & internships", href: "/jobs" }],
  },
  {
    id: "calendar",
    pattern: /\b(semester|term|exams?|examinations?|deadlines?|calendar|add drop|holidays?|registration|starts?|start|begins?|when (is|does|are))\b/,
    boost: { calendar: 1.7 },
    actions: [{ label: "Academic calendar", href: "/calendar" }],
  },
  {
    id: "howto",
    pattern: /\b(how (do|can|to|should)|where (do|can|should)|steps|process|procedure)\b/,
    boost: { guide: 1.6, faq: 1.4 },
    actions: [],
  },
  {
    id: "report-issue",
    pattern: /\b(broken|repair|leak\w*|fix|not working|damaged|maintenance|report (a|an|the)|air condition\w*|aircon|ac|faulty|flicker\w*)\b/,
    boost: { guide: 2, faq: 1.5 },
    actions: [{ label: "Report an issue", href: "/facilities" }],
  },
  {
    id: "book-room",
    pattern: /\b(book|booking|reserve|classroom|study room|meeting room|lab)\b/,
    boost: { guide: 1.6, room: 1.4, faq: 1.3 },
    actions: [{ label: "Find a classroom", href: "/classrooms" }],
  },
  {
    id: "lost",
    pattern: /\b(lost|found|missing|misplaced|left behind)\b/,
    boost: { guide: 1.5, faq: 1.3 },
    actions: [{ label: "Lost & Found", href: "/lost-found" }],
  },
  {
    id: "announcements",
    pattern: /\b(announcements?|news|notices?|updates?|latest)\b/,
    boost: { announcement: 1.8 },
    actions: [{ label: "Announcements", href: "/announcements" }],
  },
  {
    id: "societies",
    pattern: /\b(societ\w+|clubs?|join)\b/,
    boost: { society: 1.8, faq: 1.2 },
    actions: [{ label: "Browse societies", href: "/societies" }],
  },
  {
    id: "support",
    pattern: /\b(tutor\w*|study group|mentor\w*|academic support|extra help)\b/,
    boost: { guide: 1.6, faq: 1.3 },
    actions: [{ label: "Academic support", href: "/academic-support" }],
  },
  {
    id: "wellbeing",
    pattern: /\b(stress\w*|anxi\w*|counsel\w*|wellbeing|mental|depress\w*|overwhelmed|sad|lonely)\b/,
    boost: { service: 1.6, faq: 1.3 },
    actions: [{ label: "Wellbeing support", href: "/wellbeing" }],
  },
];

export function detectIntents(query: string): Intent[] {
  const q = plainQuery(query);
  return RULES.filter((rule) => rule.pattern.test(q)).map(({ pattern: _pattern, ...intent }) => intent);
}

/** Combined multiplier for a document kind across all detected intents. */
export function boostFor(intents: Intent[], kind: keyof Intent["boost"]): number {
  return intents.reduce((multiplier, intent) => Math.max(multiplier, intent.boost[kind] ?? 1), 1);
}
