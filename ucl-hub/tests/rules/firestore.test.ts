import { assertFails, assertSucceeds, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, deleteDoc, doc, getDoc, getDocs, increment, query, setDoc, updateDoc, where, writeBatch } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { as, at, createEnv, db, person, uidOf } from "./harness";

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await createEnv();
});
afterAll(async () => {
  await env.cleanup();
});

/** Baseline documents written with rules disabled, before each test. */
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const store = ctx.firestore();
    const seed = async (path: string, data: Record<string, unknown>) => setDoc(doc(store, path), data);
    await seed("users/u-student1", { name: "Amaya", email: "student@ucl.example", role: "student", staffRole: null, studentId: "UCL/1", faculty: "computing", programme: "Software Engineering", year: 2, societyId: null, department: null, createdAt: at() });
    await seed("users/u-student2", { name: "Kasun", email: "kasun@ucl.example", role: "student", staffRole: null, studentId: "UCL/2", faculty: "business", programme: "Marketing", year: 1, societyId: null, department: null, createdAt: at() });
    await seed("rooms/room-1", { name: "B201", building: "B", floor: 2, capacity: 8, type: "study-room", facilities: [], active: true });
    await seed("events/ev-open", { title: "Open event", description: "Anyone can come along.", startsAt: at(24), endsAt: at(26), location: "Hall", organiser: "UCL", societyId: null, category: "community", capacity: 0, interestCount: 0, imageUrl: null, imagePath: null, createdBy: person("admin"), createdAt: at() });
    await seed("events/ev-full", { title: "Small event", description: "Only two places left.", startsAt: at(24), endsAt: at(26), location: "Hall", organiser: "UCL", societyId: null, category: "community", capacity: 1, interestCount: 1, imageUrl: null, imagePath: null, createdBy: person("admin"), createdAt: at() });
    await seed("events/ev-computing", { title: "Hack night", description: "Computing Society evening.", startsAt: at(24), endsAt: at(26), location: "Lab", organiser: "Computing Society", societyId: "soc-computing", category: "technology", capacity: 0, interestCount: 0, imageUrl: null, imagePath: null, createdBy: person("societyRep"), createdAt: at() });
    await seed("events/ev-drama", { title: "Play", description: "Drama Society production.", startsAt: at(24), endsAt: at(26), location: "Theatre", organiser: "Drama Society", societyId: "soc-drama", category: "cultural", capacity: 0, interestCount: 0, imageUrl: null, imagePath: null, createdBy: person("otherSocietyRep"), createdAt: at() });
    await seed("societies/soc-computing", { name: "Computing Society", description: "Everything computing related.", category: "technology", colour: "#123456", logoUrl: null, logoPath: null, contactEmail: "c@ucl.example", committee: [], activities: [], memberCount: 10, interestCount: 0, createdAt: at() });
    await seed("lostFound/lf-1", { type: "lost", title: "Black charger", description: "Left in the library.", category: "electronics", location: "Library", date: "2026-09-15", imageUrl: null, imagePath: null, contact: { type: "front-desk", value: "" }, status: "open", reporter: person("student"), createdAt: at() });
    await seed("facilityIssues/fi-1", { category: "air-conditioning", location: "A102", description: "Leaking onto the front row.", priority: "high", status: "submitted", imageUrl: null, imagePath: null, reporter: person("student"), assignedTo: null, updates: [{ status: "submitted", note: "Issue reported.", by: "Amaya", at: at() }], createdAt: at(), updatedAt: at() });
    await seed("supportRequests/sr-1", { type: "peer-tutoring", subject: "Calculus", description: "Need help with limits.", preferredTimes: "", status: "open", requester: person("student"), faculty: "computing", programme: "Software Engineering", year: 2, matchedWith: null, staffNote: "", createdAt: at(), updatedAt: at() });
    await seed("notifications/n-broadcast", { title: "Welcome", body: "Welcome back to campus.", type: "system", link: "/dashboard", recipientId: null, audience: { faculties: [], programmes: [], years: [] }, createdBy: "u-admin", createdAt: at() });
    await seed("notifications/n-student1", { title: "Your booking", body: "Approved.", type: "booking", link: "/classrooms", recipientId: "u-student1", audience: { faculties: [], programmes: [], years: [] }, createdBy: "u-facilities", createdAt: at() });
    await seed("notifications/n-student2", { title: "Private", body: "For Kasun only.", type: "booking", link: "/classrooms", recipientId: "u-student2", audience: { faculties: [], programmes: [], years: [] }, createdBy: "u-facilities", createdAt: at() });
    await seed("knowledge/k-1", { title: "Exam week hours", content: "Library open until midnight.", keywords: [], link: "", active: true, updatedAt: at() });
    await seed("assistantLogs/l-1", { question: "hello", answered: true, sourceCount: 1, provider: "mock", createdAt: at() });
    await seed("settings/app", { bookingOpenTime: "08:00", bookingCloseTime: "20:00", bookingMaxHours: 3, bookingAdvanceDays: 30, systemMessage: "" });
    await seed("announcements/an-1", { title: "Library hours", description: "Extended opening hours this week.", category: "general", priority: "normal", audience: { faculties: [], programmes: [], years: [] }, author: person("academic"), source: "Library", attachments: [], createdAt: at(), expiresAt: null });
    await seed("faqs/f-1", { question: "Where is the library?", answer: "Next to Block A.", category: "general", order: 1, updatedAt: at() });
    await seed("feedback/fb-1", { category: "suggestion", message: "More study rooms please.", status: "new", from: person("student"), createdAt: at() });
  });
});

const announcement = (author = person("facilities")) => ({
  title: "Water outage",
  description: "Water will be off between 2 and 4 pm.",
  category: "facilities",
  priority: "important",
  audience: { faculties: [], programmes: [], years: [] },
  author,
  source: "Facilities",
  attachments: [],
  createdAt: at(),
  expiresAt: null,
});

describe("signed-out visitors", () => {
  it("cannot read or write anything", async () => {
    const anon = db(env, "anonymous");
    await assertFails(getDoc(doc(anon, "announcements/an-1")));
    await assertFails(getDoc(doc(anon, "settings/app")));
    await assertFails(setDoc(doc(anon, "feedback/x"), { message: "hi" }));
  });
});

describe("users and roles", () => {
  it("lets a new account create its own profile, always as a student", async () => {
    const student = db(env, "student");
    const base = { name: "New Student", email: "student@ucl.example", staffRole: null, studentId: "UCL/9", faculty: "computing", programme: "Data Science", year: 1, societyId: null, department: null, createdAt: at() };
    await env.withSecurityRulesDisabled(async (ctx) => deleteDoc(doc(ctx.firestore(), "users/u-student1")));
    await assertSucceeds(setDoc(doc(student, "users/u-student1"), { ...base, role: "student" }));
  });

  it("refuses a profile that claims a higher role, or is created for someone else", async () => {
    const student = db(env, "student");
    const base = { name: "Sneaky", email: "student@ucl.example", staffRole: null, studentId: "UCL/9", faculty: "computing", programme: "Data Science", year: 1, societyId: null, department: null, createdAt: at() };
    await env.withSecurityRulesDisabled(async (ctx) => deleteDoc(doc(ctx.firestore(), "users/u-student1")));
    await assertFails(setDoc(doc(student, "users/u-student1"), { ...base, role: "admin" }));
    await assertFails(setDoc(doc(student, "users/u-student1"), { ...base, role: "student", staffRole: "it" }));
    await assertFails(setDoc(doc(student, "users/u-someone-else"), { ...base, role: "student" }));
  });

  it("lets people edit their own academic details but never their role", async () => {
    const student = db(env, "student");
    await assertSucceeds(updateDoc(doc(student, "users/u-student1"), { name: "Amaya P.", year: 3 }));
    await assertFails(updateDoc(doc(student, "users/u-student1"), { role: "admin" }));
    await assertFails(updateDoc(doc(student, "users/u-student1"), { staffRole: "it" }));
    await assertFails(updateDoc(doc(student, "users/u-student1"), { societyId: "soc-computing" }));
  });

  it("does not let an administrator change roles from the browser either (the server does that)", async () => {
    await assertFails(updateDoc(doc(db(env, "admin"), "users/u-student1"), { role: "admin" }));
  });

  it("lets students read only their own profile; administrators read everyone's", async () => {
    await assertSucceeds(getDoc(doc(db(env, "student"), "users/u-student1")));
    await assertFails(getDoc(doc(db(env, "student"), "users/u-student2")));
    await assertSucceeds(getDoc(doc(db(env, "admin"), "users/u-student2")));
    await assertFails(getDoc(doc(db(env, "facilities"), "users/u-student2")));
  });

  it("ignores a role claim that is not a real one", async () => {
    const forged = env.authenticatedContext("u-forger", { role: "superuser" }).firestore();
    await assertFails(setDoc(doc(forged, "announcements/forged"), announcement(person("student"))));
  });
});

describe("official content: students cannot modify it", () => {
  it("lets any signed-in user read announcements, events, FAQs and settings", async () => {
    const student = db(env, "student");
    for (const path of ["announcements/an-1", "events/ev-open", "faqs/f-1", "settings/app", "societies/soc-computing"]) {
      await assertSucceeds(getDoc(doc(student, path)));
    }
  });

  it("stops students creating, editing or deleting official content", async () => {
    const student = db(env, "student");
    await assertFails(setDoc(doc(student, "announcements/x"), announcement(person("student"))));
    await assertFails(updateDoc(doc(student, "announcements/an-1"), { title: "Hacked title" }));
    await assertFails(deleteDoc(doc(student, "announcements/an-1")));
    await assertFails(updateDoc(doc(student, "events/ev-open"), { title: "Hacked event" }));
    await assertFails(deleteDoc(doc(student, "events/ev-open")));
    await assertFails(setDoc(doc(student, "faqs/x"), { question: "Free money?", answer: "Yes, click here.", category: "general", order: 1, updatedAt: at() }));
    await assertFails(setDoc(doc(student, "settings/app"), { bookingOpenTime: "00:00" }));
    await assertFails(setDoc(doc(student, "jobs/x"), { position: "Fake", company: "Scam", description: "Send money now please", applyUrl: "https://x.example" }));
    await assertFails(setDoc(doc(student, "calendar/x"), { title: "Fake holiday", startDate: "2026-09-20", endDate: "2026-09-20" }));
    await assertFails(setDoc(doc(student, "services/x"), { name: "Fake", description: "Not a real service." }));
  });

  it("lets each staff group manage only its own areas", async () => {
    await assertSucceeds(setDoc(doc(db(env, "facilities"), "announcements/f1"), announcement(person("facilities"))));
    await assertSucceeds(setDoc(doc(db(env, "finance"), "announcements/f2"), announcement(person("finance"))));
    await assertSucceeds(setDoc(doc(db(env, "finance"), "faqs/f2"), { question: "How do I pay fees?", answer: "Through the finance portal.", category: "finance", order: 2, updatedAt: at() }));
    await assertFails(setDoc(doc(db(env, "finance"), "jobs/j1"), { position: "Intern", company: "Acme", description: "A great internship", applyUrl: "https://acme.example" }));
    await assertSucceeds(setDoc(doc(db(env, "academic"), "jobs/j1"), { position: "Intern", company: "Acme", description: "A great internship", applyUrl: "https://acme.example" }));
    await assertFails(setDoc(doc(db(env, "academic"), "rooms/r2"), { name: "Room", building: "B", floor: 1, capacity: 10, type: "study-room", facilities: [], active: true }));
    await assertSucceeds(setDoc(doc(db(env, "facilities"), "rooms/r2"), { name: "Room", building: "B", floor: 1, capacity: 10, type: "study-room", facilities: [], active: true }));
  });

  it("does not let staff impersonate another author", async () => {
    await assertFails(setDoc(doc(db(env, "facilities"), "announcements/f1"), announcement(person("admin"))));
  });

  it("keeps administration-only collections away from staff", async () => {
    for (const who of ["facilities", "academic", "finance", "it", "societyRep"] as const) {
      await assertFails(getDoc(doc(db(env, who), "knowledge/k-1")));
      await assertFails(setDoc(doc(db(env, who), "settings/app"), { bookingOpenTime: "01:00" }));
      await assertFails(getDoc(doc(db(env, who), "assistantLogs/l-1")));
    }
    await assertSucceeds(getDoc(doc(db(env, "admin"), "knowledge/k-1")));
    await assertSucceeds(updateDoc(doc(db(env, "admin"), "settings/app"), { systemMessage: "Maintenance tonight" }));
  });

  it("makes the AI question log write-protected for everyone", async () => {
    await assertFails(setDoc(doc(db(env, "admin"), "assistantLogs/new"), { question: "x", answered: true, sourceCount: 0, provider: "mock", createdAt: at() }));
    await assertFails(setDoc(doc(db(env, "student"), "assistantLogs/new"), { question: "x", answered: true, sourceCount: 0, provider: "mock", createdAt: at() }));
    await assertSucceeds(getDoc(doc(db(env, "admin"), "assistantLogs/l-1")));
  });
});

describe("society representatives", () => {
  const eventFor = (societyId: string | null, by = person("societyRep")) => ({ title: "Society night", description: "A fun evening for members.", startsAt: at(48), endsAt: at(50), location: "Hall", organiser: "Society", societyId, category: "community", capacity: 0, interestCount: 0, imageUrl: null, imagePath: null, createdBy: by, createdAt: at() });

  it("can create and edit events for their own society", async () => {
    const rep = db(env, "societyRep");
    await assertSucceeds(setDoc(doc(rep, "events/new-own"), eventFor("soc-computing")));
    await assertSucceeds(updateDoc(doc(rep, "events/ev-computing"), { title: "Hack night v2" }));
    await assertSucceeds(deleteDoc(doc(rep, "events/ev-computing")));
  });

  it("cannot create events for another society or for the whole campus", async () => {
    const rep = db(env, "societyRep");
    await assertFails(setDoc(doc(rep, "events/x"), eventFor("soc-drama")));
    await assertFails(setDoc(doc(rep, "events/y"), eventFor(null)));
  });

  it("cannot touch another society's events or move an event to another society", async () => {
    const rep = db(env, "societyRep");
    await assertFails(updateDoc(doc(rep, "events/ev-drama"), { title: "Takeover" }));
    await assertFails(deleteDoc(doc(rep, "events/ev-drama")));
    await assertFails(updateDoc(doc(rep, "events/ev-computing"), { societyId: "soc-drama" }));
    await assertFails(updateDoc(doc(rep, "events/ev-open"), { title: "Campus event takeover" }));
  });

  it("can edit their own society page but cannot create societies or edit others", async () => {
    await assertSucceeds(updateDoc(doc(db(env, "societyRep"), "societies/soc-computing"), { description: "An updated description of the society." }));
    await assertFails(updateDoc(doc(db(env, "otherSocietyRep"), "societies/soc-computing"), { description: "Not my society at all, sorry." }));
    await assertFails(setDoc(doc(db(env, "societyRep"), "societies/new"), { name: "Fake Society", description: "Fake society description.", interestCount: 0 }));
    await assertSucceeds(setDoc(doc(db(env, "admin"), "societies/new"), { name: "Chess Club", description: "Weekly chess and tournaments.", category: "community", colour: "#123456", logoUrl: null, logoPath: null, contactEmail: "chess@ucl.example", committee: [], activities: [], memberCount: 3, interestCount: 0, createdAt: at() }));
  });

  it("cannot publish announcements", async () => {
    await assertFails(setDoc(doc(db(env, "societyRep"), "announcements/x"), announcement(person("societyRep"))));
  });
});

describe("event interest counters", () => {
  const registerBatch = (who: "student" | "student2", eventId: string, currentCount: number) => {
    const store = db(env, who);
    const batch = writeBatch(store);
    batch.set(doc(store, `eventInterests/${eventId}_${uidOf(who)}`), { eventId, userId: uidOf(who), createdAt: at() });
    batch.update(doc(store, `events/${eventId}`), { interestCount: currentCount + 1 });
    return batch;
  };

  it("registers interest with the matching counter increment", async () => {
    await assertSucceeds(registerBatch("student", "ev-open", 0).commit());
  });

  it("refuses a counter change with no interest record, or a jump of more than one", async () => {
    const store = db(env, "student");
    await assertFails(updateDoc(doc(store, "events/ev-open"), { interestCount: increment(1) }));
    const batch = writeBatch(store);
    batch.set(doc(store, `eventInterests/ev-open_${uidOf("student")}`), { eventId: "ev-open", userId: uidOf("student"), createdAt: at() });
    batch.update(doc(store, "events/ev-open"), { interestCount: 5 });
    await assertFails(batch.commit());
  });

  it("refuses an interest record written for somebody else, or with a made-up id", async () => {
    const store = db(env, "student");
    const b1 = writeBatch(store);
    b1.set(doc(store, `eventInterests/ev-open_${uidOf("student2")}`), { eventId: "ev-open", userId: uidOf("student2"), createdAt: at() });
    b1.update(doc(store, "events/ev-open"), { interestCount: 1 });
    await assertFails(b1.commit());
    const b2 = writeBatch(store);
    b2.set(doc(store, "eventInterests/random-id"), { eventId: "ev-open", userId: uidOf("student"), createdAt: at() });
    b2.update(doc(store, "events/ev-open"), { interestCount: 1 });
    await assertFails(b2.commit());
  });

  it("does not allow registering twice (the interest record is create-only)", async () => {
    await assertSucceeds(registerBatch("student", "ev-open", 0).commit());
    await assertFails(registerBatch("student", "ev-open", 1).commit());
  });

  it("stops registrations beyond the event's capacity", async () => {
    await assertFails(registerBatch("student", "ev-full", 1).commit());
  });

  it("cancels interest together with a decrement, and only your own", async () => {
    await assertSucceeds(registerBatch("student", "ev-open", 0).commit());
    const store = db(env, "student");
    const cancel = writeBatch(store);
    cancel.delete(doc(store, `eventInterests/ev-open_${uidOf("student")}`));
    cancel.update(doc(store, "events/ev-open"), { interestCount: 0 });
    await assertSucceeds(cancel.commit());
    await assertSucceeds(registerBatch("student2", "ev-open", 0).commit());
    await assertFails(deleteDoc(doc(db(env, "student"), `eventInterests/ev-open_${uidOf("student2")}`)));
  });

  it("lets students read only their own interest records", async () => {
    await assertSucceeds(registerBatch("student", "ev-open", 0).commit());
    const own = query(collection(db(env, "student"), "eventInterests"), where("userId", "==", uidOf("student")));
    await assertSucceeds(getDocs(own));
    await assertFails(getDocs(collection(db(env, "student"), "eventInterests")));
  });
});

describe("classroom booking and double-booking prevention", () => {
  const booking = (who: "student" | "student2", slots: string[], overrides: Record<string, unknown> = {}) => ({
    roomId: "room-1",
    roomName: "B201",
    requester: person(who),
    date: "2026-09-25",
    startTime: "10:00",
    endTime: "11:00",
    attendees: 4,
    purpose: "Group revision",
    status: "pending",
    slots,
    decisionNote: "",
    decidedBy: null,
    createdAt: at(),
    updatedAt: at(),
    ...overrides,
  });
  const slotIds = ["room-1_2026-09-25_1000", "room-1_2026-09-25_1030"];

  async function request(who: "student" | "student2", bookingId: string, overrides: Record<string, unknown> = {}, ids = slotIds) {
    const store = db(env, who);
    const batch = writeBatch(store);
    batch.set(doc(store, `bookings/${bookingId}`), booking(who, ids, overrides));
    for (const id of ids) {
      const slot = id.split("_")[2] ?? "";
      batch.set(doc(store, `roomSlots/${id}`), { roomId: "room-1", date: "2026-09-25", slot, bookingId });
    }
    return batch.commit();
  }

  it("lets a student request a room, reserving its slots in the same commit", async () => {
    await assertSucceeds(request("student", "b1"));
  });

  it("refuses a second request for the same time, even from another student (no double booking)", async () => {
    await assertSucceeds(request("student", "b1"));
    await assertFails(request("student2", "b2"));
    await assertFails(request("student2", "b3", {}, ["room-1_2026-09-25_1030", "room-1_2026-09-25_1100"]));
    await assertSucceeds(request("student2", "b4", { startTime: "11:00", endTime: "12:00" }, ["room-1_2026-09-25_1100", "room-1_2026-09-25_1130"]));
  });

  it("refuses requests made in someone else's name, or that start as approved", async () => {
    const store = db(env, "student");
    const stolen = writeBatch(store);
    stolen.set(doc(store, "bookings/x"), booking("student2", slotIds));
    stolen.set(doc(store, `roomSlots/${slotIds[0]}`), { roomId: "room-1", date: "2026-09-25", slot: "1000", bookingId: "x" });
    await assertFails(stolen.commit());
    await assertFails(request("student", "y", { status: "approved" }));
    await assertFails(request("student", "z", { attendees: 50 }));
  });

  it("refuses a booking without any slot documents, and slot documents attached to an existing booking", async () => {
    await assertFails(setDoc(doc(db(env, "student"), "bookings/nolock"), booking("student", slotIds)));
    await assertSucceeds(request("student", "b1"));
    await assertFails(setDoc(doc(db(env, "student"), "roomSlots/room-1_2026-09-25_1200"), { roomId: "room-1", date: "2026-09-25", slot: "1200", bookingId: "b1" }));
  });

  it("shows availability to everyone signed in, but bookings only to their owner and approvers", async () => {
    await assertSucceeds(request("student", "b1"));
    await assertSucceeds(getDoc(doc(db(env, "student2"), `roomSlots/${slotIds[0]}`)));
    await assertFails(getDoc(doc(db(env, "student2"), "bookings/b1")));
    await assertSucceeds(getDoc(doc(db(env, "student"), "bookings/b1")));
    await assertSucceeds(getDoc(doc(db(env, "facilities"), "bookings/b1")));
    await assertFails(getDoc(doc(db(env, "finance"), "bookings/b1")));
  });

  it("lets facilities staff approve, but not the requester and not other staff groups", async () => {
    await assertSucceeds(request("student", "b1"));
    const decision = { status: "approved", decisionNote: "Enjoy", decidedBy: person("facilities"), updatedAt: at(1) };
    await assertFails(updateDoc(doc(db(env, "student"), "bookings/b1"), decision));
    await assertFails(updateDoc(doc(db(env, "finance"), "bookings/b1"), { ...decision, decidedBy: person("finance") }));
    await assertSucceeds(updateDoc(doc(db(env, "facilities"), "bookings/b1"), decision));
  });

  it("frees the slots when staff reject or the owner cancels, and only then", async () => {
    await assertSucceeds(request("student", "b1"));
    // Deleting slots without changing the booking would silently free a held room.
    await assertFails(deleteDoc(doc(db(env, "student"), `roomSlots/${slotIds[0]}`)));

    const store = db(env, "student");
    const cancel = writeBatch(store);
    cancel.update(doc(store, "bookings/b1"), { status: "cancelled", updatedAt: at(2) });
    for (const id of slotIds) cancel.delete(doc(store, `roomSlots/${id}`));
    await assertSucceeds(cancel.commit());
    await assertSucceeds(request("student2", "b2"));
  });

  it("does not let a student edit the details of a booking or cancel someone else's", async () => {
    await assertSucceeds(request("student", "b1"));
    await assertFails(updateDoc(doc(db(env, "student"), "bookings/b1"), { attendees: 1, purpose: "Changed" }));
    await assertFails(updateDoc(doc(db(env, "student2"), "bookings/b1"), { status: "cancelled", updatedAt: at(2) }));
  });
});

describe("facility issues", () => {
  const report = (overrides: Record<string, unknown> = {}) => ({
    category: "lighting",
    location: "Block C corridor",
    description: "Two ceiling lights are not working.",
    priority: "medium",
    status: "submitted",
    imageUrl: null,
    imagePath: null,
    reporter: person("student"),
    assignedTo: null,
    updates: [{ status: "submitted", note: "Issue reported.", by: "Amaya", at: at() }],
    createdAt: at(),
    updatedAt: at(),
    ...overrides,
  });
  const step = (status: string, previous: unknown[]) => ({ status, assignedTo: person("facilities"), updates: [...previous, { status, note: "Progress", by: "Nuwan", at: at(3) }], updatedAt: at(3) });
  const history = [{ status: "submitted", note: "Issue reported.", by: "Amaya", at: at() }];

  it("lets a student report an issue as themselves, starting at submitted", async () => {
    await assertSucceeds(setDoc(doc(db(env, "student"), "facilityIssues/new"), report()));
    await assertFails(setDoc(doc(db(env, "student"), "facilityIssues/a"), report({ status: "resolved" })));
    await assertFails(setDoc(doc(db(env, "student"), "facilityIssues/b"), report({ reporter: person("student2") })));
    await assertFails(setDoc(doc(db(env, "student"), "facilityIssues/c"), report({ assignedTo: person("facilities") })));
  });

  it("shows an issue to its reporter and to facilities/IT staff, not to other students", async () => {
    await assertSucceeds(getDoc(doc(db(env, "student"), "facilityIssues/fi-1")));
    await assertFails(getDoc(doc(db(env, "student2"), "facilityIssues/fi-1")));
    await assertSucceeds(getDoc(doc(db(env, "facilities"), "facilityIssues/fi-1")));
    await assertSucceeds(getDoc(doc(db(env, "it"), "facilityIssues/fi-1")));
    await assertFails(getDoc(doc(db(env, "finance"), "facilityIssues/fi-1")));
  });

  it("lets staff move an issue forward one step at a time, with a history entry", async () => {
    const staff = db(env, "facilities");
    await assertSucceeds(updateDoc(doc(staff, "facilityIssues/fi-1"), step("assigned", history)));
  });

  it("refuses skipping steps, going backwards, or changing history without a new entry", async () => {
    const staff = db(env, "facilities");
    await assertFails(updateDoc(doc(staff, "facilityIssues/fi-1"), step("resolved", history)));
    await assertFails(updateDoc(doc(staff, "facilityIssues/fi-1"), { status: "assigned", assignedTo: person("facilities"), updates: history, updatedAt: at(3) }));
    await assertSucceeds(updateDoc(doc(staff, "facilityIssues/fi-1"), step("assigned", history)));
    await assertFails(updateDoc(doc(staff, "facilityIssues/fi-1"), step("submitted", history)));
  });

  it("stops the reporter, other students and unrelated staff changing the status", async () => {
    await assertFails(updateDoc(doc(db(env, "student"), "facilityIssues/fi-1"), step("resolved", history)));
    await assertFails(updateDoc(doc(db(env, "student2"), "facilityIssues/fi-1"), step("assigned", history)));
    await assertFails(updateDoc(doc(db(env, "finance"), "facilityIssues/fi-1"), step("assigned", history)));
  });
});

describe("lost and found", () => {
  const post = (overrides: Record<string, unknown> = {}) => ({ type: "found", title: "Grey hoodie", description: "Found in the canteen.", category: "clothing", location: "Canteen", date: "2026-09-15", imageUrl: null, imagePath: null, contact: { type: "front-desk", value: "" }, status: "open", reporter: person("student2"), createdAt: at(), ...overrides });

  it("lets any student post as themselves, as open", async () => {
    await assertSucceeds(setDoc(doc(db(env, "student2"), "lostFound/new"), post()));
    await assertFails(setDoc(doc(db(env, "student2"), "lostFound/a"), post({ reporter: person("student") })));
    await assertFails(setDoc(doc(db(env, "student2"), "lostFound/b"), post({ status: "resolved" })));
  });

  it("lets everyone signed in browse the board", async () => {
    await assertSucceeds(getDoc(doc(db(env, "student2"), "lostFound/lf-1")));
  });

  it("lets only the reporter or a moderator change the status", async () => {
    await assertSucceeds(updateDoc(doc(db(env, "student"), "lostFound/lf-1"), { status: "claimed" }));
    await assertFails(updateDoc(doc(db(env, "student2"), "lostFound/lf-1"), { status: "resolved" }));
    await assertSucceeds(updateDoc(doc(db(env, "facilities"), "lostFound/lf-1"), { status: "resolved" }));
    await assertFails(updateDoc(doc(db(env, "finance"), "lostFound/lf-1"), { status: "open" }));
  });

  it("does not let the status change together with other fields, or skip the workflow", async () => {
    await assertFails(updateDoc(doc(db(env, "student"), "lostFound/lf-1"), { status: "claimed", title: "Something else" }));
    await assertSucceeds(updateDoc(doc(db(env, "student"), "lostFound/lf-1"), { status: "resolved" }));
    await assertFails(updateDoc(doc(db(env, "student"), "lostFound/lf-1"), { status: "open" }));
  });

  it("lets the reporter or a moderator delete a post, nobody else", async () => {
    await assertFails(deleteDoc(doc(db(env, "student2"), "lostFound/lf-1")));
    await assertSucceeds(deleteDoc(doc(db(env, "student"), "lostFound/lf-1")));
  });
});

describe("academic support and feedback", () => {
  it("lets a student ask for support, see only their own, and withdraw", async () => {
    const request = { type: "study-group", subject: "Web project", description: "Looking for a team of four.", preferredTimes: "", status: "open", requester: person("student2"), faculty: "business", programme: "Marketing", year: 1, matchedWith: null, staffNote: "", createdAt: at(), updatedAt: at() };
    await assertSucceeds(setDoc(doc(db(env, "student2"), "supportRequests/new"), request));
    await assertFails(setDoc(doc(db(env, "student2"), "supportRequests/matched"), { ...request, status: "matched" }));
    await assertFails(getDoc(doc(db(env, "student2"), "supportRequests/sr-1")));
    await assertSucceeds(updateDoc(doc(db(env, "student"), "supportRequests/sr-1"), { status: "closed", updatedAt: at(1) }));
  });

  it("lets academic staff match requests but not other staff groups or students", async () => {
    const match = { status: "matched", matchedWith: { name: "Ishara", email: "ishara@ucl.example" }, staffNote: "Tuesday 5pm", updatedAt: at(1) };
    await assertSucceeds(updateDoc(doc(db(env, "academic"), "supportRequests/sr-1"), match));
    await assertFails(updateDoc(doc(db(env, "finance"), "supportRequests/sr-1"), match));
    await assertFails(updateDoc(doc(db(env, "student"), "supportRequests/sr-1"), match));
  });

  it("lets anyone send feedback, but only administrators read or manage it", async () => {
    const feedback = { category: "bug", message: "The calendar page is slow.", status: "new", from: person("student2"), createdAt: at() };
    await assertSucceeds(setDoc(doc(db(env, "student2"), "feedback/new"), feedback));
    await assertFails(setDoc(doc(db(env, "student2"), "feedback/spoof"), { ...feedback, from: person("student") }));
    await assertFails(getDoc(doc(db(env, "student"), "feedback/fb-1")));
    await assertFails(getDoc(doc(db(env, "academic"), "feedback/fb-1")));
    await assertSucceeds(getDoc(doc(db(env, "admin"), "feedback/fb-1")));
    await assertSucceeds(updateDoc(doc(db(env, "admin"), "feedback/fb-1"), { status: "reviewed" }));
    await assertFails(updateDoc(doc(db(env, "admin"), "feedback/fb-1"), { message: "Edited" }));
  });
});

describe("notifications", () => {
  const notification = (createdBy: string, overrides: Record<string, unknown> = {}) => ({ title: "Notice", body: "Something happened.", type: "system", link: "/announcements", recipientId: null, audience: { faculties: [], programmes: [], years: [] }, createdBy, createdAt: at(), ...overrides });

  it("lets a student read broadcasts and their own notifications only", async () => {
    const student = db(env, "student");
    await assertSucceeds(getDoc(doc(student, "notifications/n-broadcast")));
    await assertSucceeds(getDoc(doc(student, "notifications/n-student1")));
    await assertFails(getDoc(doc(student, "notifications/n-student2")));
    await assertSucceeds(getDocs(query(collection(student, "notifications"), where("recipientId", "==", uidOf("student")))));
    await assertFails(getDocs(collection(student, "notifications")));
  });

  it("stops students creating, editing or deleting notifications", async () => {
    const student = db(env, "student");
    await assertFails(setDoc(doc(student, "notifications/x"), notification(uidOf("student"))));
    await assertFails(updateDoc(doc(student, "notifications/n-broadcast"), { title: "Hacked" }));
    await assertFails(deleteDoc(doc(student, "notifications/n-broadcast")));
  });

  it("lets notification-capable staff send them, as themselves", async () => {
    await assertSucceeds(setDoc(doc(db(env, "academic"), "notifications/x"), notification(uidOf("academic"))));
    await assertFails(setDoc(doc(db(env, "academic"), "notifications/y"), notification(uidOf("admin"))));
  });

  it("keeps read receipts private to their owner", async () => {
    const student = db(env, "student");
    await assertSucceeds(setDoc(doc(student, `notificationReads/${uidOf("student")}_n-broadcast`), { userId: uidOf("student"), notificationId: "n-broadcast", readAt: at() }));
    await assertFails(setDoc(doc(student, `notificationReads/${uidOf("student2")}_n-broadcast`), { userId: uidOf("student2"), notificationId: "n-broadcast", readAt: at() }));
    await assertFails(setDoc(doc(student, "notificationReads/random"), { userId: uidOf("student"), notificationId: "n-broadcast", readAt: at() }));
    await assertSucceeds(getDoc(doc(student, `notificationReads/${uidOf("student")}_n-broadcast`)));
    await assertFails(getDoc(doc(db(env, "student2"), `notificationReads/${uidOf("student")}_n-broadcast`)));
  });
});

describe("the whole database is closed by default", () => {
  it("denies collections the app does not define", async () => {
    await assertFails(setDoc(doc(db(env, "admin"), "mystery/doc"), { a: 1 }));
    await assertFails(getDoc(doc(db(env, "admin"), "mystery/doc")));
  });

  it("gives an administrator access to management data but never to fake identities", async () => {
    const admin = db(env, "admin");
    await assertSucceeds(getDocs(collection(admin, "bookings")));
    await assertSucceeds(getDocs(collection(admin, "supportRequests")));
    await assertFails(setDoc(doc(as(env, "student").firestore(), "settings/app"), { bookingOpenTime: "00:00" }));
  });
});
