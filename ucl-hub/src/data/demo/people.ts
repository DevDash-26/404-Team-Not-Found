/** Demo accounts. All demo accounts share one password, documented in the README. */

import type { ActorRef, UserProfile } from "@/types";

export const DEMO_PASSWORD = "Demo@1234";

export interface DemoAccount {
  uid: string;
  email: string;
  password: string;
  profile: Omit<UserProfile, "id" | "createdAt">;
}

const blank = {
  studentId: null,
  faculty: null,
  programme: null,
  year: null,
  societyId: null,
  department: null,
} as const;

function account(uid: string, email: string, profile: Omit<UserProfile, "id" | "createdAt" | "email">): DemoAccount {
  return { uid, email, password: DEMO_PASSWORD, profile: { ...profile, email } };
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  // ---- Administrator and staff
  account("u-admin", "admin@ucl.example", {
    ...blank,
    name: "Ruwan Fernando",
    role: "admin",
    staffRole: null,
    department: "Administration",
  }),
  account("u-academic", "academic@ucl.example", {
    ...blank,
    name: "Dr. Nadeesha Jayawardena",
    role: "staff",
    staffRole: "academic",
    faculty: "computing",
    department: "Faculty of Computing",
  }),
  account("u-society", "society@ucl.example", {
    ...blank,
    name: "Dilan Senanayake",
    role: "staff",
    staffRole: "society",
    societyId: "soc-computing",
    department: "Student Affairs",
  }),
  account("u-facilities", "facilities@ucl.example", {
    ...blank,
    name: "Mahesh Rathnayake",
    role: "staff",
    staffRole: "facilities",
    department: "Facilities Management",
  }),
  account("u-finance", "finance@ucl.example", {
    ...blank,
    name: "Ishani Gunasekara",
    role: "staff",
    staffRole: "finance",
    department: "Finance Office",
  }),
  account("u-it", "it@ucl.example", {
    ...blank,
    name: "Suresh Wickramasinghe",
    role: "staff",
    staffRole: "it",
    department: "IT Services",
  }),
  // ---- Students
  account("u-student1", "student@ucl.example", {
    ...blank,
    name: "Amaya Perera",
    role: "student",
    staffRole: null,
    studentId: "UCL/23/0142",
    faculty: "computing",
    programme: "Software Engineering",
    year: 2,
  }),
  account("u-student2", "kasun@ucl.example", {
    ...blank,
    name: "Kasun Silva",
    role: "student",
    staffRole: null,
    studentId: "UCL/25/0311",
    faculty: "business",
    programme: "Marketing",
    year: 1,
  }),
  account("u-student3", "tharushi@ucl.example", {
    ...blank,
    name: "Tharushi Fonseka",
    role: "student",
    staffRole: null,
    studentId: "UCL/22/0078",
    faculty: "engineering",
    programme: "Civil Engineering",
    year: 3,
  }),
  account("u-student4", "nimal@ucl.example", {
    ...blank,
    name: "Nimal De Zoysa",
    role: "student",
    staffRole: null,
    studentId: "UCL/25/0420",
    faculty: "computing",
    programme: "Data Science",
    year: 1,
  }),
  account("u-student5", "sachini@ucl.example", {
    ...blank,
    name: "Sachini Abeysekara",
    role: "student",
    staffRole: null,
    studentId: "UCL/23/0255",
    faculty: "business",
    programme: "Accounting & Finance",
    year: 2,
  }),
];

export function actorOf(uid: string): ActorRef {
  const found = DEMO_ACCOUNTS.find((a) => a.uid === uid);
  if (!found) throw new Error(`Unknown demo account ${uid}`);
  return { id: found.uid, name: found.profile.name };
}
