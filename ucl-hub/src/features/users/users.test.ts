import { describe, expect, it } from "vitest";
import { validate } from "@/lib/validation";
import { createTestWorld } from "@/test/helpers";
import { MemoryStore } from "@/lib/backend/memory/memoryStore";
import { settingsSchema } from "../settings/schema";
import { accessUpdateSchema, createUserRequestSchema, loginSchema, newUserSchema, profileSchema, registrationSchema } from "./schema";
import { createUserService } from "./service";

const student = { name: "Amaya Perera", studentId: "ucl/23/0142", faculty: "computing", programme: "Software Engineering", year: 2 };

describe("registration and profile forms", () => {
  const registration = { ...student, email: "Amaya@UCL.example", password: "Sup3rSecret", confirmPassword: "Sup3rSecret" };

  it("accepts a complete registration and normalises email and student id", () => {
    const result = validate(registrationSchema, registration);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.email).toBe("amaya@ucl.example");
      expect(result.data.studentId).toBe("UCL/23/0142");
    }
  });

  it("rejects weak or mismatched passwords", () => {
    expect(validate(registrationSchema, { ...registration, password: "short", confirmPassword: "short" }).ok).toBe(false);
    const mismatch = validate(registrationSchema, { ...registration, confirmPassword: "Different1" });
    expect(mismatch.ok).toBe(false);
    if (!mismatch.ok) expect(mismatch.errors.confirmPassword).toMatch(/match/i);
  });

  it("rejects an invalid email address", () => {
    expect(validate(registrationSchema, { ...registration, email: "not-an-email" }).ok).toBe(false);
    expect(validate(registrationSchema, { ...registration, email: "" }).ok).toBe(false);
  });

  it("requires the programme to belong to the chosen faculty", () => {
    const wrong = validate(profileSchema, { ...student, programme: "Civil Engineering" });
    expect(wrong.ok).toBe(false);
    if (!wrong.ok) expect(wrong.errors.programme).toBeDefined();
    expect(validate(profileSchema, student).ok).toBe(true);
  });

  it("rejects an unknown faculty, an invalid year and a malformed student id", () => {
    expect(validate(profileSchema, { ...student, faculty: "law" }).ok).toBe(false);
    expect(validate(profileSchema, { ...student, year: 9 }).ok).toBe(false);
    expect(validate(profileSchema, { ...student, year: 2.5 }).ok).toBe(false);
    expect(validate(profileSchema, { ...student, studentId: "!!" }).ok).toBe(false);
  });

  it("requires both fields to sign in", () => {
    expect(validate(loginSchema, { email: "a@b.co", password: "" }).ok).toBe(false);
    expect(validate(loginSchema, { email: "bad", password: "x" }).ok).toBe(false);
    expect(validate(loginSchema, { email: "a@b.co", password: "x" }).ok).toBe(true);
  });
});

describe("account creation and role changes (administrator forms)", () => {
  const staff = { name: "Nuwan", email: "nuwan@ucl.example", password: "Password1", role: "staff", staffRole: "facilities", societyId: null, department: "" };

  it("accepts a staff account with a staff group", () => {
    expect(validate(newUserSchema, staff).ok).toBe(true);
    expect(validate(createUserRequestSchema, { ...staff, department: null }).ok).toBe(true);
  });

  it("requires a staff group for staff and a society for society representatives", () => {
    const noGroup = validate(newUserSchema, { ...staff, staffRole: null });
    expect(noGroup.ok).toBe(false);
    if (!noGroup.ok) expect(noGroup.errors.staffRole).toBeDefined();
    const noSociety = validate(newUserSchema, { ...staff, staffRole: "society" });
    expect(noSociety.ok).toBe(false);
    if (!noSociety.ok) expect(noSociety.errors.societyId).toBeDefined();
    expect(validate(newUserSchema, { ...staff, staffRole: "society", societyId: "soc-computing" }).ok).toBe(true);
  });

  it("rejects an unknown role, so a request cannot invent a privilege level", () => {
    expect(validate(newUserSchema, { ...staff, role: "superadmin" }).ok).toBe(false);
    expect(validate(accessUpdateSchema, { role: "root", staffRole: null, societyId: null }).ok).toBe(false);
    expect(validate(accessUpdateSchema, { role: "staff", staffRole: "wizard", societyId: null }).ok).toBe(false);
    expect(validate(accessUpdateSchema, { role: "admin", staffRole: null, societyId: null }).ok).toBe(true);
  });
});

describe("user service", () => {
  it("creates student profiles as plain students, whatever the caller passes", async () => {
    const store = new MemoryStore();
    const gateway = { createUser: async () => ({ uid: "x" }), updateAccess: async () => undefined };
    const service = createUserService(store, gateway);
    const profile = await service.createStudentProfile("u1", "amaya@ucl.example", { ...student, studentId: "UCL/23/0142", role: "admin", staffRole: "it" } as never);
    expect(profile).toMatchObject({ role: "student", staffRole: null, societyId: null, department: null });
    const stored = await service.get("u1");
    expect(stored?.role).toBe("student");
  });

  it("lets people change their academic details but never their role", async () => {
    const world = createTestWorld();
    const gateway = { createUser: async () => ({ uid: "x" }), updateAccess: async () => undefined };
    const service = createUserService(world.store, gateway, world.clock);
    await service.updateOwnProfile("u-student1", { ...student, name: "Amaya P.", studentId: "UCL/23/0142", role: "admin" } as never);
    const updated = await service.get("u-student1");
    expect(updated?.name).toBe("Amaya P.");
    expect(updated?.role).toBe("student");
  });

  it("hands role changes to the server gateway instead of writing them directly", async () => {
    const world = createTestWorld();
    const calls: unknown[] = [];
    const gateway = { createUser: async () => ({ uid: "x" }), updateAccess: async (uid: string, update: unknown) => void calls.push([uid, update]) };
    const service = createUserService(world.store, gateway, world.clock);
    await service.updateAccess("u-student1", { role: "staff", staffRole: "it", societyId: null });
    expect(calls).toEqual([["u-student1", { role: "staff", staffRole: "it", societyId: null }]]);
    expect((await service.get("u-student1"))?.role).toBe("student");
  });
});

describe("settings form", () => {
  const valid = { bookingOpenTime: "08:00", bookingCloseTime: "20:00", bookingMaxHours: 3, bookingAdvanceDays: 30, systemMessage: "" };
  it("accepts sensible settings", () => {
    expect(validate(settingsSchema, valid).ok).toBe(true);
  });
  it("rejects closing before opening, bad times and out-of-range limits", () => {
    expect(validate(settingsSchema, { ...valid, bookingCloseTime: "07:00" }).ok).toBe(false);
    expect(validate(settingsSchema, { ...valid, bookingOpenTime: "8am" }).ok).toBe(false);
    expect(validate(settingsSchema, { ...valid, bookingMaxHours: 0 }).ok).toBe(false);
    expect(validate(settingsSchema, { ...valid, bookingMaxHours: 9 }).ok).toBe(false);
    expect(validate(settingsSchema, { ...valid, bookingAdvanceDays: 500 }).ok).toBe(false);
    expect(validate(settingsSchema, { ...valid, systemMessage: "x".repeat(201) }).ok).toBe(false);
  });
});
