/**
 * Built-in "how do I..." guides for the app itself. They give the assistant
 * accurate step-by-step help for the app's own features and are stored as code
 * because they describe the product, not university content.
 */

import { BOOKING_DEFAULTS } from "@/config/app";
import type { KnowledgeDocument } from "../types";

interface GuideDefinition {
  id: string;
  title: string;
  text: string;
  keywords: string[];
  href: string;
}

const GUIDES: GuideDefinition[] = [
  {
    id: "book-classroom",
    title: "How to book a classroom or study room",
    text: `Open Classrooms from the menu, or press "Find a classroom" on the Dashboard. Choose a date, pick a room that fits your group size, then select a start and end time. Rooms are booked in ${BOOKING_DEFAULTS.slotMinutes}-minute slots between ${BOOKING_DEFAULTS.openTime} and ${BOOKING_DEFAULTS.closeTime}, for up to ${BOOKING_DEFAULTS.maxHours} hours. Press "Request booking". Facilities staff approve requests and you get a notification. If someone else has the time, the app shows it as taken. You can cancel from "My bookings".`,
    keywords: ["book", "booking", "classroom", "study room", "reserve", "room", "lab", "availability", "group work"],
    href: "/classrooms",
  },
  {
    id: "report-facility-issue",
    title: "How to report a facility problem (broken air conditioner, lights, plumbing)",
    text: 'Open Facilities and press "Report an issue". Choose the category (for example Air conditioning, Lighting, Plumbing, Internet, Furniture, Cleanliness or Equipment), enter the location, describe the problem, set a priority and optionally add a photo. You can follow the progress from Submitted to Assigned, In progress and Resolved, and you will be notified about each update. Broken AC, faulty lights and leaks are handled by Facilities Management; internet and equipment problems go to IT Services.',
    keywords: ["report", "issue", "broken", "ac", "air conditioner", "air conditioning", "aircon", "lights", "plumbing", "leak", "maintenance", "repair", "facility", "fix", "damaged"],
    href: "/facilities",
  },
  {
    id: "lost-and-found",
    title: "How to report or find a lost item",
    text: 'Open Lost & Found and search or filter by category and location. If your item is not listed, press "Report an item", choose Lost or Found, describe it, add a photo and tell people how to reach you. You can mark your own report as Claimed or Resolved once the item is back with its owner. Items handed in can also be left at the security desk at the Main Gate.',
    keywords: ["lost", "found", "missing", "misplaced", "left behind", "wallet", "bag", "keys", "phone", "id card"],
    href: "/lost-found",
  },
  {
    id: "event-interest",
    title: "How to find events and register interest",
    text: 'Open Events to browse what is coming up. Filter by category or by today, this week or this month. Press "I\'m interested" on an event to register your interest, which helps organisers plan. You will get a reminder before it starts, and you can cancel your interest at any time.',
    keywords: ["event", "events", "interested", "register", "workshop", "lecture", "happening", "reminder"],
    href: "/events",
  },
  {
    id: "join-society",
    title: "How to join a student society",
    text: 'Open Societies to see every society, its committee and its upcoming activities. Press "Express interest" on the society you like and optionally add a short message. The society committee will contact you with the next steps.',
    keywords: ["society", "societies", "club", "join", "sign up", "committee", "member"],
    href: "/societies",
  },
  {
    id: "academic-support",
    title: "How to request academic support",
    text: 'Open Academic Support and press "New request". Choose peer tutoring, a study group or mentorship, tell us the subject and when you are free. Academic staff review requests and match you with a tutor, group or mentor. You get a notification when you are matched.',
    keywords: ["tutor", "tutoring", "peer", "study group", "mentor", "mentorship", "academic support", "help", "struggling"],
    href: "/academic-support",
  },
  {
    id: "jobs-internships",
    title: "How to find jobs and internships",
    text: 'Open Jobs & Internships to browse part-time jobs, internships, placements, graduate roles and volunteering. Filter by type, location or skill, and hide closed listings. Press "Apply" to open the employer\'s application link. New listings appear in your notifications.',
    keywords: ["job", "jobs", "internship", "internships", "part-time", "placement", "apply", "career", "volunteering"],
    href: "/jobs",
  },
  {
    id: "academic-calendar",
    title: "How to see semester dates, exams and deadlines",
    text: "Open Academic Calendar to see semester dates, exam periods, assignment deadlines, add/drop periods and holidays. Your programme and year are used to show the dates that matter to you. Upcoming dates also appear on your Dashboard.",
    keywords: ["calendar", "semester", "exam", "deadline", "add drop", "holiday", "dates", "timetable"],
    href: "/calendar",
  },
  {
    id: "feedback",
    title: "How to send feedback or ask something that is not answered",
    text: "If you cannot find an answer, use the Feedback form (find it on your Profile page or under Notifications). Tell us what you were looking for. Staff review feedback and update the information. You can also look up the right person in the Staff Directory.",
    keywords: ["feedback", "suggestion", "question", "complaint", "not found", "help"],
    href: "/feedback",
  },
  {
    id: "emergency-info",
    title: "Where to find emergency and safety information",
    text: "Emergency announcements appear in a red banner at the top of every page and in Notifications. For an emergency on campus call the 24-hour security desk on +94 11 555 0999 or go to the Main Gate.",
    keywords: ["emergency", "safety", "security", "urgent", "closure", "weather", "alert"],
    href: "/announcements",
  },
  {
    id: "notifications",
    title: "How notifications work",
    text: "Open Notifications (the bell icon) to see announcements, booking decisions, facility report updates, new internships and reminders for events you are interested in. Unread items are highlighted and you can mark them as read.",
    keywords: ["notification", "notifications", "alerts", "unread", "reminder", "bell"],
    href: "/notifications",
  },
];

export function buildGuideDocuments(): KnowledgeDocument[] {
  return GUIDES.map((guide) => ({
    id: `guide:${guide.id}`,
    kind: "guide" as const,
    title: guide.title,
    text: guide.text,
    keywords: guide.keywords,
    href: guide.href,
  }));
}
