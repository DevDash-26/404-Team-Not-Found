/** Official campus content: announcements, events, societies, services, FAQs, jobs, calendar. */

import type { ActorRef } from "./user";

export interface Attachment {
  name: string;
  url: string;
  path: string;
}

/**
 * Who a piece of content is for. Empty arrays mean "everyone" for that
 * dimension, so `{ faculties: [], programmes: [], years: [] }` is all students.
 * Targeting controls relevance, it is not a confidentiality boundary.
 */
export interface Audience {
  faculties: string[];
  programmes: string[];
  years: number[];
}

export const EVERYONE: Audience = { faculties: [], programmes: [], years: [] };

// ---------------------------------------------------------------- Announcements

export const ANNOUNCEMENT_CATEGORIES = [
  "general",
  "academic",
  "administrative",
  "finance",
  "facilities",
  "it",
  "events",
  "safety",
] as const;
export type AnnouncementCategory = (typeof ANNOUNCEMENT_CATEGORIES)[number];

export const ANNOUNCEMENT_PRIORITIES = ["normal", "important", "emergency"] as const;
export type AnnouncementPriority = (typeof ANNOUNCEMENT_PRIORITIES)[number];

export interface Announcement {
  id: string;
  title: string;
  description: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  audience: Audience;
  author: ActorRef;
  /** Office or department shown as the trusted source, e.g. "Registrar's Office". */
  source: string;
  attachments: Attachment[];
  createdAt: string;
  /** Optional ISO timestamp after which the announcement stops showing on the dashboard. */
  expiresAt: string | null;
}

// ---------------------------------------------------------------- Events

export const EVENT_CATEGORIES = [
  "academic",
  "career",
  "cultural",
  "sports",
  "technology",
  "community",
  "workshop",
  "guest-lecture",
  "alumni",
] as const;
export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export interface CampusEvent {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  location: string;
  organiser: string;
  /** Set when a society organises the event, so society reps can manage it. */
  societyId: string | null;
  category: EventCategory;
  /** 0 means unlimited. */
  capacity: number;
  interestCount: number;
  imageUrl: string | null;
  imagePath: string | null;
  createdBy: ActorRef;
  createdAt: string;
}

export interface EventInterest {
  id: string;
  eventId: string;
  userId: string;
  createdAt: string;
}

// ---------------------------------------------------------------- Societies

export const SOCIETY_CATEGORIES = [
  "technology",
  "arts-culture",
  "sports",
  "academic",
  "community",
  "business",
] as const;
export type SocietyCategory = (typeof SOCIETY_CATEGORIES)[number];

export interface CommitteeMember {
  role: string;
  name: string;
  email: string;
}

export interface SocietyActivity {
  title: string;
  date: string;
  location: string;
}

export interface Society {
  id: string;
  name: string;
  description: string;
  category: SocietyCategory;
  /** Tailwind-independent brand colour used for the generated logo tile. */
  colour: string;
  logoUrl: string | null;
  logoPath: string | null;
  contactEmail: string;
  committee: CommitteeMember[];
  activities: SocietyActivity[];
  memberCount: number;
  interestCount: number;
  createdAt: string;
}

export interface SocietyInterest {
  id: string;
  societyId: string;
  userId: string;
  userName: string;
  message: string;
  createdAt: string;
}

// ---------------------------------------------------------------- Campus services

export const SERVICE_CATEGORIES = [
  "library",
  "it",
  "finance",
  "student-affairs",
  "wellbeing",
  "printing",
  "dining",
  "sports",
  "admissions",
] as const;
export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export interface OpeningHoursLine {
  days: string;
  hours: string;
}

export interface ServiceLink {
  label: string;
  url: string;
}

export interface CampusService {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  location: string;
  openingHours: OpeningHoursLine[];
  email: string;
  phone: string;
  links: ServiceLink[];
  updatedAt: string;
}

export interface StaffContact {
  id: string;
  name: string;
  title: string;
  department: string;
  email: string;
  phone: string;
  office: string;
  /** Topics a student might contact this person about, used by search and the AI assistant. */
  topics: string[];
  updatedAt: string;
}

// ---------------------------------------------------------------- FAQ

export const FAQ_CATEGORIES = [
  "new-students",
  "academic",
  "finance",
  "it",
  "student-life",
  "facilities",
  "admissions",
  "general",
] as const;
export type FaqCategory = (typeof FAQ_CATEGORIES)[number];

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: FaqCategory;
  /** Lower numbers appear first inside a category. */
  order: number;
  updatedAt: string;
}

// ---------------------------------------------------------------- Jobs

export const JOB_TYPES = ["internship", "part-time", "graduate", "placement", "volunteering"] as const;
export type JobType = (typeof JOB_TYPES)[number];

export interface Job {
  id: string;
  company: string;
  position: string;
  description: string;
  location: string;
  type: JobType;
  deadline: string;
  applyUrl: string;
  skills: string[];
  createdAt: string;
}

// ---------------------------------------------------------------- Academic calendar

export const CALENDAR_TYPES = ["semester", "exam", "assignment", "add-drop", "holiday", "other"] as const;
export type CalendarType = (typeof CALENDAR_TYPES)[number];

export interface CalendarEntry {
  id: string;
  title: string;
  type: CalendarType;
  /** `YYYY-MM-DD` */
  startDate: string;
  /** `YYYY-MM-DD`; equal to `startDate` for single-day entries. */
  endDate: string;
  description: string;
  audience: Audience;
}
