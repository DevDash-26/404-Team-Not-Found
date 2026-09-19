/**
 * Converts the app's structured records into `KnowledgeDocument`s.
 * Pure functions: the same data always produces the same documents.
 */

import { facultyById } from "@/config/academics";
import { matchesAudience, type TargetProfile } from "@/lib/audience";
import { isActive } from "@/features/announcements/logic";
import { isJobOpen } from "@/features/jobs/logic";
import { summariseHours } from "@/features/services/logic";
import type {
  Announcement,
  CalendarEntry,
  CampusEvent,
  CampusService,
  Faq,
  Job,
  KnowledgeEntry,
  Room,
  Society,
  StaffContact,
} from "@/types";
import { combineDateAndTime, formatDate, formatDateTime, formatTime } from "@/utils/dates";
import { humanize } from "@/utils/text";
import { buildGuideDocuments } from "./guides";
import type { KnowledgeDocument } from "../types";

/** Raw, unfiltered records as loaded from the data store. */
export interface RawKnowledge {
  announcements: Announcement[];
  events: CampusEvent[];
  faqs: Faq[];
  services: CampusService[];
  staff: StaffContact[];
  jobs: Job[];
  calendar: CalendarEntry[];
  rooms: Room[];
  societies: Society[];
  notes: KnowledgeEntry[];
}

export const EMPTY_KNOWLEDGE: RawKnowledge = {
  announcements: [],
  events: [],
  faqs: [],
  services: [],
  staff: [],
  jobs: [],
  calendar: [],
  rooms: [],
  societies: [],
  notes: [],
};

function announcementDoc(a: Announcement): KnowledgeDocument {
  return {
    id: `announcement:${a.id}`,
    kind: "announcement",
    title: a.title,
    text: `${a.description} Published by ${a.source} on ${formatDate(a.createdAt)}.`,
    keywords: ["announcement", "news", "notice", humanize(a.category), a.priority],
    href: "/announcements",
    startsAt: a.createdAt,
    facts: { when: formatDate(a.createdAt) },
  };
}

function eventDoc(e: CampusEvent): KnowledgeDocument {
  const when = `${formatDateTime(e.startsAt)} to ${formatTime(e.endsAt)}`;
  const capacity = e.capacity > 0 ? ` Capacity ${e.capacity}.` : "";
  return {
    id: `event:${e.id}`,
    kind: "event",
    title: e.title,
    text: `${e.description} When: ${when}. Where: ${e.location}. Organised by ${e.organiser}.${capacity}`,
    keywords: ["event", "events", "happening", humanize(e.category), e.organiser],
    href: "/events",
    startsAt: e.startsAt,
    endsAt: e.endsAt,
    facts: { when, location: e.location },
  };
}

function faqDoc(f: Faq): KnowledgeDocument {
  return {
    id: `faq:${f.id}`,
    kind: "faq",
    title: f.question,
    text: f.answer,
    keywords: ["faq", "question", humanize(f.category)],
    href: "/faqs",
  };
}

function serviceDoc(s: CampusService): KnowledgeDocument {
  const hours = summariseHours(s);
  const contact = [s.email, s.phone].filter(Boolean).join(", ");
  return {
    id: `service:${s.id}`,
    kind: "service",
    title: s.name,
    text: `${s.description} Location: ${s.location}. Opening hours: ${hours}.${contact ? ` Contact: ${contact}.` : ""}`,
    keywords: ["service", "opening hours", "open", "close", "hours", humanize(s.category)],
    href: s.category === "library" ? "/library" : s.category === "it" ? "/it-support" : s.category === "wellbeing" ? "/wellbeing" : "/services",
    facts: { hours, location: s.location, contact },
  };
}

function staffDoc(c: StaffContact): KnowledgeDocument {
  const contact = [c.email, c.phone].filter(Boolean).join(", ");
  return {
    id: `staff:${c.id}`,
    kind: "staff",
    title: `${c.name}, ${c.title}`,
    text: `${c.name} is the ${c.title} in ${c.department}. Office: ${c.office}. Contact: ${contact}. Can help with: ${c.topics.join(", ")}.`,
    keywords: ["contact", "who", "email", "phone", "staff", c.department, ...c.topics],
    href: "/staff-directory",
    facts: { contact, location: c.office },
  };
}

function jobDoc(j: Job): KnowledgeDocument {
  return {
    id: `job:${j.id}`,
    kind: "job",
    title: `${j.position} at ${j.company}`,
    text: `${j.description} Type: ${humanize(j.type)}. Location: ${j.location}. Skills: ${j.skills.join(", ")}. Apply by ${j.deadline}.`,
    keywords: ["job", "jobs", "internship", "career", humanize(j.type), ...j.skills],
    href: "/jobs",
    facts: { deadline: j.deadline, location: j.location },
  };
}

function calendarDoc(c: CalendarEntry): KnowledgeDocument {
  const range = c.endDate === c.startDate ? c.startDate : `${c.startDate} to ${c.endDate}`;
  const start = combineDateAndTime(c.startDate, "00:00");
  const end = combineDateAndTime(c.endDate, "23:59");
  return {
    id: `calendar:${c.id}`,
    kind: "calendar",
    title: c.title,
    text: `${c.title} (${humanize(c.type)}): ${range}. ${c.description}`,
    keywords: ["calendar", "date", "deadline", "semester", "academic", humanize(c.type)],
    href: "/calendar",
    startsAt: start?.toISOString(),
    endsAt: end?.toISOString(),
    facts: { when: c.endDate === c.startDate ? formatDate(start) : `${formatDate(start)} to ${formatDate(end)}` },
  };
}

function roomDoc(r: Room): KnowledgeDocument {
  return {
    id: `room:${r.id}`,
    kind: "room",
    title: r.name,
    text: `${r.name} in ${r.building}, floor ${r.floor}. Holds ${r.capacity} people. Facilities: ${r.facilities.join(", ")}. It can be requested through Classrooms.`,
    keywords: ["room", "classroom", "book", humanize(r.type), r.building],
    href: "/classrooms",
    facts: { location: `${r.building}, floor ${r.floor}` },
  };
}

function societyDoc(s: Society): KnowledgeDocument {
  return {
    id: `society:${s.id}`,
    kind: "society",
    title: s.name,
    text: `${s.description} Contact: ${s.contactEmail}. Committee: ${s.committee.map((c) => `${c.role} ${c.name}`).join(", ")}.`,
    keywords: ["society", "club", "join", humanize(s.category)],
    href: "/societies",
    facts: { contact: s.contactEmail },
  };
}

function noteDoc(n: KnowledgeEntry): KnowledgeDocument {
  return {
    id: `note:${n.id}`,
    kind: "note",
    title: n.title,
    text: n.content,
    keywords: n.keywords,
    href: n.link || "/faqs",
  };
}

function describeTarget(target: TargetProfile | null): string {
  if (!target) return "";
  const faculty = target.faculty ? facultyById(target.faculty)?.name : null;
  return [faculty, target.programme, target.year ? `Year ${target.year}` : null].filter(Boolean).join(" · ");
}

/**
 * Builds the documents visible to one user. Announcements and calendar entries
 * are filtered by the user's audience; expired announcements and closed jobs
 * are left out so the assistant never recommends something that has ended.
 */
export function buildKnowledgeDocuments(raw: RawKnowledge, target: TargetProfile | null, now: Date): KnowledgeDocument[] {
  return [
    ...raw.announcements.filter((a) => isActive(a, now) && matchesAudience(a.audience, target)).map(announcementDoc),
    ...raw.events.filter((e) => new Date(e.endsAt).getTime() >= now.getTime()).map(eventDoc),
    ...raw.faqs.map(faqDoc),
    ...raw.services.map(serviceDoc),
    ...raw.staff.map(staffDoc),
    ...raw.jobs.filter((j) => isJobOpen(j, now)).map(jobDoc),
    ...raw.calendar.filter((c) => matchesAudience(c.audience, target)).map(calendarDoc),
    ...raw.rooms.filter((r) => r.active).map(roomDoc),
    ...raw.societies.map(societyDoc),
    ...raw.notes.filter((n) => n.active).map(noteDoc),
    ...buildGuideDocuments(),
  ];
}

export { describeTarget };
