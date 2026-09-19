/**
 * Demo data for student-initiated records and system documents: lost & found,
 * rooms and bookings, facility issues, support requests, notifications,
 * feedback, assistant logs, interests and settings.
 */

import { roomSlotId, SETTINGS_DOC_ID } from "@/lib/backend/collections";
import { BOOKING_DEFAULTS } from "@/config/app";
import { buildSlotIds, holdsSlots, slotStarts } from "@/features/classrooms/logic";
import type {
  AppNotification,
  AppSettings,
  AssistantLog,
  Booking,
  Feedback,
  FacilityIssue,
  LostFoundItem,
  Room,
  RoomSlot,
  SupportRequest,
} from "@/types";
import { EVERYONE } from "@/types";
import { actorOf } from "./people";
import { toCollection, type DemoCollection, type DemoContext } from "./context";

export function buildLostFound({ at, day }: DemoContext): DemoCollection {
  const items: LostFoundItem[] = [
    {
      id: "lf-charger", type: "lost", title: "Black Dell laptop charger", category: "electronics",
      description: "65W charger with a small strip of blue tape on the cable. Left near the group study tables.",
      location: "Library, second floor", date: day(-1), imageUrl: null, imagePath: null,
      contact: { type: "email", value: "kasun@ucl.example" }, status: "open",
      reporter: actorOf("u-student2"), createdAt: at(-1, "17:30"),
    },
    {
      id: "lf-bottle", type: "found", title: "Blue insulated water bottle", category: "accessories",
      description: "Found on a bench outside Block B. Has a sticker of a mountain on the side.",
      location: "Outside Block B", date: day(0), imageUrl: null, imagePath: null,
      contact: { type: "front-desk", value: "" }, status: "open",
      reporter: actorOf("u-student4"), createdAt: at(0, "09:10"),
    },
    {
      id: "lf-id", type: "lost", title: "Student ID card", category: "documents-ids",
      description: "Engineering student ID in a clear plastic holder. Please hand it to Student Affairs if found.",
      location: "Between Block D and the canteen", date: day(-2), imageUrl: null, imagePath: null,
      contact: { type: "email", value: "tharushi@ucl.example" }, status: "open",
      reporter: actorOf("u-student3"), createdAt: at(-2, "13:00"),
    },
    {
      id: "lf-keys", type: "found", title: "Keys with a red keychain", category: "keys",
      description: "Three keys and a small red fabric keychain. Handed to the canteen counter.",
      location: "Main canteen", date: day(-3), imageUrl: null, imagePath: null,
      contact: { type: "front-desk", value: "" }, status: "claimed",
      reporter: actorOf("u-student5"), createdAt: at(-3, "12:40"),
    },
    {
      id: "lf-hoodie", type: "lost", title: "Grey hoodie", category: "clothing",
      description: "Plain grey zip hoodie, size M, left after a cricket practice session.",
      location: "Sports ground pavilion", date: day(-4), imageUrl: null, imagePath: null,
      contact: { type: "phone", value: "+94 71 555 0142" }, status: "open",
      reporter: actorOf("u-student1"), createdAt: at(-4, "18:20"),
    },
    {
      id: "lf-calculator", type: "found", title: "Casio fx-991 scientific calculator", category: "electronics",
      description: "Found under a desk after the morning lecture. Initials 'S.A.' written on the back.",
      location: "Lecture Hall A102", date: day(-1), imageUrl: null, imagePath: null,
      contact: { type: "email", value: "nimal@ucl.example" }, status: "open",
      reporter: actorOf("u-student4"), createdAt: at(-1, "11:05"),
    },
    {
      id: "lf-backpack", type: "lost", title: "Black backpack with laptop", category: "bags",
      description: "Black backpack with a grey 14-inch laptop and lecture notes.",
      location: "Auditorium", date: day(-6), imageUrl: null, imagePath: null,
      contact: { type: "email", value: "sachini@ucl.example" }, status: "resolved",
      reporter: actorOf("u-student5"), createdAt: at(-6, "16:00"),
    },
    {
      id: "lf-glasses", type: "found", title: "Prescription glasses, black frame", category: "accessories",
      description: "Found on a seat in the auditorium after the guest lecture. Kept at the security desk.",
      location: "Auditorium", date: day(-2), imageUrl: null, imagePath: null,
      contact: { type: "front-desk", value: "" }, status: "open",
      reporter: actorOf("u-student2"), createdAt: at(-2, "16:45"),
    },
    {
      id: "lf-textbook", type: "lost", title: "Database System Concepts textbook", category: "books-stationery",
      description: "Hardcover, name written on the first page. Last seen in the library reading hall.",
      location: "Library, reading hall", date: day(-3), imageUrl: null, imagePath: null,
      contact: { type: "email", value: "student@ucl.example" }, status: "open",
      reporter: actorOf("u-student1"), createdAt: at(-3, "15:30"),
    },
    {
      id: "lf-earbuds", type: "found", title: "White wireless earbuds case", category: "electronics",
      description: "Small white charging case, no name. Found on the steps of Block C.",
      location: "Block C steps", date: day(0), imageUrl: null, imagePath: null,
      contact: { type: "email", value: "sachini@ucl.example" }, status: "open",
      reporter: actorOf("u-student5"), createdAt: at(0, "10:20"),
    },
  ];
  return toCollection(items);
}

export function buildRooms(): DemoCollection {
  const rooms: Room[] = [
    { id: "room-101", name: "Classroom 101", building: "Main Building", floor: 1, capacity: 40, type: "lecture-hall", facilities: ["Projector", "Whiteboard", "Air conditioning"], active: true },
    { id: "room-102", name: "Classroom 102", building: "Main Building", floor: 1, capacity: 40, type: "lecture-hall", facilities: ["Projector", "Whiteboard", "Air conditioning"], active: true },
    { id: "room-201", name: "Classroom 201", building: "Main Building", floor: 2, capacity: 35, type: "study-room", facilities: ["Whiteboard", "Power sockets", "Air conditioning"], active: true },
    { id: "room-202", name: "Classroom 202", building: "Main Building", floor: 2, capacity: 35, type: "study-room", facilities: ["Whiteboard", "Power sockets"], active: true },
    { id: "room-203", name: "Classroom 203", building: "Main Building", floor: 2, capacity: 35, type: "study-room", facilities: ["Whiteboard", "Power sockets", "Air conditioning"], active: true },
    { id: "room-204", name: "Classroom 204", building: "Main Building", floor: 2, capacity: 35, type: "study-room", facilities: ["Whiteboard", "Power sockets"], active: true },
    { id: "room-205", name: "Classroom 205", building: "Main Building", floor: 2, capacity: 35, type: "study-room", facilities: ["Whiteboard", "Power sockets"], active: true },
    { id: "room-206", name: "Classroom 206", building: "Main Building", floor: 2, capacity: 35, type: "study-room", facilities: ["Whiteboard", "Power sockets", "Air conditioning"], active: true },
    { id: "room-it-lab-1", name: "IT Lab 1", building: "Labs Building", floor: 1, capacity: 30, type: "computer-lab", facilities: ["30 PCs", "Projector", "Air conditioning"], active: true },
    { id: "room-it-lab-2", name: "IT Lab 2", building: "Labs Building", floor: 1, capacity: 30, type: "computer-lab", facilities: ["30 PCs", "Projector", "Air conditioning"], active: true },
    { id: "room-bio-lab-1", name: "Bio Lab 1", building: "Labs Building", floor: 2, capacity: 24, type: "seminar-room", facilities: ["Lab benches", "Safety equipment", "Air conditioning"], active: true },
    { id: "room-chem-lab-1", name: "Chemistry Lab 1", building: "Labs Building", floor: 2, capacity: 24, type: "seminar-room", facilities: ["Lab benches", "Safety equipment", "Fume hood"], active: true },
    { id: "room-engineering-lab-1", name: "Engineering Lab 1", building: "Labs Building", floor: 3, capacity: 24, type: "seminar-room", facilities: ["Workshop benches", "Safety equipment", "Projector"], active: true },
    { id: "room-board-1", name: "Board Room 1", building: "Administration Building", floor: 1, capacity: 12, type: "seminar-room", facilities: ["Large screen", "Conference table", "Video conferencing"], active: true },
    { id: "room-board-2", name: "Board Room 2", building: "Administration Building", floor: 1, capacity: 12, type: "seminar-room", facilities: ["Large screen", "Conference table", "Video conferencing"], active: true },
    { id: "room-501", name: "Classroom 501", building: "Main Building", floor: 5, capacity: 40, type: "lecture-hall", facilities: ["Projector", "Whiteboard", "Air conditioning"], active: true },
    { id: "room-502", name: "Classroom 502", building: "Main Building", floor: 5, capacity: 40, type: "lecture-hall", facilities: ["Projector", "Whiteboard", "Air conditioning"], active: true },
    { id: "room-503", name: "Classroom 503", building: "Main Building", floor: 5, capacity: 40, type: "lecture-hall", facilities: ["Projector", "Whiteboard", "Air conditioning"], active: true },
  ];
  return toCollection(rooms);
}

interface BookingSeed {
  id: string;
  roomId: string;
  roomName: string;
  requester: string;
  dayOffset: number;
  start: string;
  end: string;
  attendees: number;
  purpose: string;
  status: Booking["status"];
  decisionNote?: string;
}

export function buildBookings({ at, day }: DemoContext): { bookings: DemoCollection; roomSlots: DemoCollection } {
  const seeds: BookingSeed[] = [
    { id: "bk-1", roomId: "room-201", roomName: "Classroom 201", requester: "u-student2", dayOffset: 1, start: "10:00", end: "12:00", attendees: 5, purpose: "Marketing group assignment", status: "approved" },
    { id: "bk-2", roomId: "room-201", roomName: "Classroom 201", requester: "u-student5", dayOffset: 1, start: "14:00", end: "15:30", attendees: 4, purpose: "Accounting study group", status: "pending" },
    { id: "bk-3", roomId: "room-board-1", roomName: "Board Room 1", requester: "u-student4", dayOffset: 1, start: "15:00", end: "17:00", attendees: 12, purpose: "Data Science club planning session", status: "approved" },
    { id: "bk-4", roomId: "room-201", roomName: "Classroom 201", requester: "u-student1", dayOffset: 2, start: "16:00", end: "17:30", attendees: 5, purpose: "Group project stand-up", status: "approved", decisionNote: "Approved. Please leave the room tidy." },
    { id: "bk-5", roomId: "room-202", roomName: "Classroom 202", requester: "u-student1", dayOffset: 3, start: "13:00", end: "15:00", attendees: 4, purpose: "Database Systems revision", status: "pending" },
    { id: "bk-6", roomId: "room-203", roomName: "Classroom 203", requester: "u-student1", dayOffset: -1, start: "11:00", end: "12:00", attendees: 9, purpose: "Team retrospective", status: "rejected", decisionNote: "The room was reserved for a faculty meeting." },
    { id: "bk-7", roomId: "room-it-lab-1", roomName: "IT Lab 1", requester: "u-student3", dayOffset: 2, start: "09:00", end: "11:00", attendees: 20, purpose: "CAD practice session", status: "approved" },
    { id: "bk-8", roomId: "room-102", roomName: "Classroom 102", requester: "u-student2", dayOffset: 4, start: "09:00", end: "10:30", attendees: 3, purpose: "Case study discussion", status: "cancelled" },
  ];

  const bookings: Booking[] = [];
  const slots: Array<RoomSlot> = [];

  for (const seed of seeds) {
    const date = day(seed.dayOffset);
    const slotIds = buildSlotIds(seed.roomId, date, seed.start, seed.end, BOOKING_DEFAULTS.slotMinutes);
    const decided = seed.status === "approved" || seed.status === "rejected";

    bookings.push({
      id: seed.id,
      roomId: seed.roomId,
      roomName: seed.roomName,
      requester: actorOf(seed.requester),
      date,
      startTime: seed.start,
      endTime: seed.end,
      attendees: seed.attendees,
      purpose: seed.purpose,
      status: seed.status,
      slots: holdsSlots(seed.status) ? slotIds : [],
      decisionNote: seed.decisionNote ?? "",
      decidedBy: decided ? actorOf("u-facilities") : null,
      createdAt: at(-1, "09:00"),
      updatedAt: at(-1, "10:00"),
    });

    if (holdsSlots(seed.status)) {
      slotStarts(seed.start, seed.end, BOOKING_DEFAULTS.slotMinutes).forEach((slot) => {
        slots.push({ id: roomSlotId(seed.roomId, date, slot), roomId: seed.roomId, date, slot, bookingId: seed.id });
      });
    }
  }

  return { bookings: toCollection(bookings), roomSlots: toCollection(slots) };
}

export function buildFacilityIssues({ at }: DemoContext): DemoCollection {
  const items: FacilityIssue[] = [
    {
      id: "fac-ac", category: "air-conditioning", location: "Computer Lab C302", priority: "high", status: "in-progress",
      description: "The air conditioner is running but the room stays hot and the lab gets very uncomfortable after an hour.",
      imageUrl: null, imagePath: null, reporter: actorOf("u-student1"), assignedTo: actorOf("u-facilities"),
      updates: [
        { status: "submitted", note: "Issue reported.", by: "Amaya Perera", at: at(-3, "10:00") },
        { status: "assigned", note: "Assigned to the facilities team.", by: "Mahesh Rathnayake", at: at(-3, "13:30") },
        { status: "in-progress", note: "Technician inspected the unit and ordered a replacement compressor part.", by: "Mahesh Rathnayake", at: at(-1, "11:15") },
      ],
      createdAt: at(-3, "10:00"), updatedAt: at(-1, "11:15"),
    },
    {
      id: "fac-chair", category: "furniture", location: "Library, second floor", priority: "low", status: "submitted",
      description: "Two chairs near the window desks have broken armrests.",
      imageUrl: null, imagePath: null, reporter: actorOf("u-student1"), assignedTo: null,
      updates: [{ status: "submitted", note: "Issue reported.", by: "Amaya Perera", at: at(0, "08:50") }],
      createdAt: at(0, "08:50"), updatedAt: at(0, "08:50"),
    },
    {
      id: "fac-lights", category: "lighting", location: "Block A, first floor corridor", priority: "medium", status: "assigned",
      description: "Two tube lights are flickering and one has gone out completely.",
      imageUrl: null, imagePath: null, reporter: actorOf("u-student2"), assignedTo: actorOf("u-facilities"),
      updates: [
        { status: "submitted", note: "Issue reported.", by: "Kasun Silva", at: at(-2, "15:00") },
        { status: "assigned", note: "Electrician scheduled for tomorrow morning.", by: "Mahesh Rathnayake", at: at(-1, "09:00") },
      ],
      createdAt: at(-2, "15:00"), updatedAt: at(-1, "09:00"),
    },
    {
      id: "fac-wifi", category: "internet", location: "Seminar Room D110", priority: "high", status: "in-progress",
      description: "Wi-Fi drops every few minutes during presentations.",
      imageUrl: null, imagePath: null, reporter: actorOf("u-student3"), assignedTo: actorOf("u-it"),
      updates: [
        { status: "submitted", note: "Issue reported.", by: "Tharushi Fonseka", at: at(-2, "12:00") },
        { status: "assigned", note: "Assigned to IT Services.", by: "Suresh Wickramasinghe", at: at(-2, "14:00") },
        { status: "in-progress", note: "Access point replacement scheduled for Sunday maintenance window.", by: "Suresh Wickramasinghe", at: at(-1, "10:30") },
      ],
      createdAt: at(-2, "12:00"), updatedAt: at(-1, "10:30"),
    },
    {
      id: "fac-leak", category: "plumbing", location: "Block B ground floor washroom", priority: "urgent", status: "resolved",
      description: "Water is leaking from a tap onto the floor.",
      imageUrl: null, imagePath: null, reporter: actorOf("u-student4"), assignedTo: actorOf("u-facilities"),
      updates: [
        { status: "submitted", note: "Issue reported.", by: "Nimal De Zoysa", at: at(-5, "09:00") },
        { status: "assigned", note: "Plumber called.", by: "Mahesh Rathnayake", at: at(-5, "09:20") },
        { status: "in-progress", note: "Plumber is on site.", by: "Mahesh Rathnayake", at: at(-5, "11:00") },
        { status: "resolved", note: "Tap washer replaced and floor cleaned.", by: "Mahesh Rathnayake", at: at(-5, "13:00") },
      ],
      createdAt: at(-5, "09:00"), updatedAt: at(-5, "13:00"),
    },
    {
      id: "fac-projector", category: "equipment", location: "Lecture Hall A102", priority: "medium", status: "submitted",
      description: "The projector remote control is missing, so the lecturer cannot change inputs.",
      imageUrl: null, imagePath: null, reporter: actorOf("u-student5"), assignedTo: null,
      updates: [{ status: "submitted", note: "Issue reported.", by: "Sachini Abeysekara", at: at(0, "10:05") }],
      createdAt: at(0, "10:05"), updatedAt: at(0, "10:05"),
    },
  ];
  return toCollection(items);
}

export function buildSupportRequests({ at }: DemoContext): DemoCollection {
  const items: SupportRequest[] = [
    {
      id: "sup-1", type: "peer-tutoring", subject: "Database normalisation", status: "matched",
      description: "I find 3NF and BCNF confusing and would like a tutor who can walk through examples.",
      preferredTimes: "Weekday afternoons after 3 PM",
      requester: actorOf("u-student1"), faculty: "computing", programme: "Software Engineering", year: 2,
      matchedWith: { name: "Hiruni Madushani (Year 4, Computing)", email: "hiruni.m@ucl.example" },
      staffNote: "Hiruni scored an A in this module. She will contact you within two days.",
      createdAt: at(-6, "10:00"), updatedAt: at(-4, "14:00"),
    },
    {
      id: "sup-2", type: "study-group", subject: "Calculus revision group", status: "open",
      description: "Looking for 3 to 5 classmates to revise Calculus II before the mid-semester tests.",
      preferredTimes: "Library, Tuesday or Thursday evenings",
      requester: actorOf("u-student3"), faculty: "engineering", programme: "Civil Engineering", year: 3,
      matchedWith: null, staffNote: "", createdAt: at(-2, "16:00"), updatedAt: at(-2, "16:00"),
    },
    {
      id: "sup-3", type: "mentorship", subject: "Career guidance for data science", status: "open",
      description: "Would like a mentor working in data science to advise on projects and internships.",
      preferredTimes: "Flexible",
      requester: actorOf("u-student4"), faculty: "computing", programme: "Data Science", year: 1,
      matchedWith: null, staffNote: "", createdAt: at(-1, "12:30"), updatedAt: at(-1, "12:30"),
    },
    {
      id: "sup-4", type: "peer-tutoring", subject: "Financial accounting basics", status: "closed",
      description: "Needed help with journal entries.",
      preferredTimes: "Weekends",
      requester: actorOf("u-student5"), faculty: "business", programme: "Accounting & Finance", year: 2,
      matchedWith: { name: "Ruchira Dias (Year 3, Business)", email: "ruchira.d@ucl.example" },
      staffNote: "Completed after three sessions.", createdAt: at(-14, "09:00"), updatedAt: at(-7, "17:00"),
    },
  ];
  return toCollection(items);
}

export function buildNotifications({ at }: DemoContext): DemoCollection {
  const broadcast = (
    id: string,
    type: AppNotification["type"],
    title: string,
    body: string,
    link: string,
    createdBy: string,
    createdAt: string,
    audience: AppNotification["audience"] = EVERYONE,
  ): AppNotification => ({ id, type, title, body, link, recipientId: null, audience, createdBy, createdAt });

  const personal = (
    id: string,
    type: AppNotification["type"],
    title: string,
    body: string,
    link: string,
    createdBy: string,
    createdAt: string,
    recipientId: string,
  ): AppNotification => ({ id, type, title, body, link, recipientId, audience: EVERYONE, createdBy, createdAt });

  const items: AppNotification[] = [
    broadcast("nt-weather", "emergency", "Weather advisory: evening classes move online", "Classes after 4:00 PM today run online. The shuttle stops at 5:30 PM.", "/announcements", "u-admin", at(0, "07:46")),
    broadcast("nt-registration", "announcement", "Semester 2 registration closes Friday", "Register before 5:00 PM on Friday to avoid late fees.", "/announcements", "u-academic", at(-1, "09:01")),
    broadcast("nt-fees", "announcement", "Tuition instalment reminder", "The second instalment is due next Thursday.", "/announcements", "u-finance", at(-2, "11:01")),
    broadcast("nt-job", "job", "New internship: Software Engineering Intern", "Lanka Digital Labs is hiring interns. Applications close in 18 days.", "/jobs", "u-academic", at(-2, "09:01")),
  ];
  return toCollection(items);
}

export function buildFeedback({ at }: DemoContext): DemoCollection {
  const items: Feedback[] = [
    { id: "fb-1", category: "suggestion", message: "It would be great to see the canteen menu for the whole week in one place.", status: "new", from: actorOf("u-student2"), createdAt: at(-2, "12:00") },
    { id: "fb-2", category: "content-issue", message: "The Library closing time on the services page still shows 6 PM on Saturdays.", status: "reviewed", from: actorOf("u-student3"), createdAt: at(-5, "17:00") },
    { id: "fb-3", category: "question", message: "Is there a place where I can print posters for a society event?", status: "new", from: actorOf("u-student4"), createdAt: at(-1, "10:30") },
  ];
  return toCollection(items);
}

export function buildAssistantLogs({ at }: DemoContext): DemoCollection {
  const items: AssistantLog[] = [
    { id: "al-1", question: "what time does the library close", answered: true, sourceCount: 3, provider: "mock", createdAt: at(-1, "10:00") },
    { id: "al-2", question: "how do i book a classroom", answered: true, sourceCount: 2, provider: "mock", createdAt: at(-1, "10:05") },
    { id: "al-3", question: "is there a gym membership fee", answered: false, sourceCount: 0, provider: "mock", createdAt: at(-1, "11:20") },
    { id: "al-4", question: "where can I print my poster", answered: true, sourceCount: 2, provider: "mock", createdAt: at(0, "08:15") },
    { id: "al-5", question: "can i bring a guest to the career fair", answered: false, sourceCount: 0, provider: "mock", createdAt: at(0, "09:40") },
  ];
  return toCollection(items);
}

export function buildSettings(): DemoCollection {
  const settings: AppSettings = {
    id: SETTINGS_DOC_ID,
    bookingOpenTime: BOOKING_DEFAULTS.openTime,
    bookingCloseTime: BOOKING_DEFAULTS.closeTime,
    bookingMaxHours: BOOKING_DEFAULTS.maxHours,
    bookingAdvanceDays: BOOKING_DEFAULTS.advanceBookingDays,
    systemMessage: "",
  };
  return toCollection([settings]);
}

export function buildInterests({ at }: DemoContext): { eventInterests: DemoCollection; societyInterests: DemoCollection } {
  const student = "u-student1";
  const eventInterests = ["evt-hack-night", "evt-ai-lecture", "evt-cv-clinic"].map((eventId, index) => ({
    id: `${eventId}_${student}`,
    eventId,
    userId: student,
    createdAt: at(-1, `1${index}:00`),
  }));
  const societyInterests = [
    {
      id: `soc-computing_${student}`,
      societyId: "soc-computing",
      userId: student,
      userName: "Amaya Perera",
      message: "I'd love to help organise hackathons.",
      createdAt: at(-4, "11:00"),
    },
  ];
  return { eventInterests: toCollection(eventInterests), societyInterests: toCollection(societyInterests) };
}
