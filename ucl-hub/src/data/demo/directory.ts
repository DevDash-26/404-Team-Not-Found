/** Demo data: campus services, staff directory, FAQs, AI knowledge entries and jobs. */

import type { CampusService, Faq, Job, KnowledgeEntry, StaffContact } from "@/types";
import { toCollection, type DemoCollection, type DemoContext } from "./context";

export function buildServices({ at }: DemoContext): DemoCollection {
  const updatedAt = at(-14, "09:00");
  const items: CampusService[] = [
    {
      id: "svc-library",
      name: "University Library",
      category: "library",
      description:
        "Print and digital collections, quiet study floors, group discussion rooms, self-service book loans and research help desks. Borrow up to 8 books for 14 days with your student ID.",
      location: "Library Building, Ground to Third Floor",
      openingHours: [
        { days: "Monday to Friday", hours: "8:00 AM to 8:00 PM" },
        { days: "Saturday", hours: "9:00 AM to 5:00 PM" },
        { days: "Sunday and public holidays", hours: "Closed" },
      ],
      email: "library@ucl.example",
      phone: "+94 11 555 0101",
      links: [
        { label: "Library catalogue", url: "https://library.ucl.example/catalogue" },
        { label: "E-journals and databases", url: "https://library.ucl.example/e-resources" },
      ],
      updatedAt,
    },
    {
      id: "svc-it",
      name: "IT Service Desk",
      category: "it",
      description:
        "Help with student accounts, password resets, campus Wi-Fi, the learning portal and software licences. Bring your laptop to the desk for hardware checks.",
      location: "Block C, Room C105",
      openingHours: [
        { days: "Monday to Friday", hours: "8:30 AM to 5:00 PM" },
        { days: "Saturday", hours: "9:00 AM to 1:00 PM" },
      ],
      email: "servicedesk@ucl.example",
      phone: "+94 11 555 0140",
      links: [
        { label: "Reset your password", url: "https://it.ucl.example/reset" },
        { label: "Wi-Fi setup guide", url: "https://it.ucl.example/wifi" },
      ],
      updatedAt,
    },
    {
      id: "svc-finance",
      name: "Finance Office",
      category: "finance",
      description:
        "Tuition payments, receipts, payment plans, scholarships and bursaries. Students facing hardship can request a confidential appointment.",
      location: "Administration Building, Ground Floor",
      openingHours: [
        { days: "Monday to Friday", hours: "9:00 AM to 3:30 PM" },
        { days: "Saturday and Sunday", hours: "Closed" },
      ],
      email: "finance@ucl.example",
      phone: "+94 11 555 0120",
      links: [
        { label: "Scholarships and bursaries", url: "https://finance.ucl.example/scholarships" },
        { label: "Pay fees online", url: "https://finance.ucl.example/pay" },
      ],
      updatedAt,
    },
    {
      id: "svc-affairs",
      name: "Student Affairs Office",
      category: "student-affairs",
      description:
        "Student ID cards, societies, clubs and events support, disciplinary matters and general guidance for new students.",
      location: "Administration Building, First Floor",
      openingHours: [{ days: "Monday to Friday", hours: "8:30 AM to 4:30 PM" }],
      email: "studentaffairs@ucl.example",
      phone: "+94 11 555 0130",
      links: [{ label: "New student guide", url: "https://affairs.ucl.example/new-students" }],
      updatedAt,
    },
  ];
  return toCollection(items);
}

export function buildStaffDirectory({ at }: DemoContext): DemoCollection {
  const updatedAt = at(-20, "09:00");
  const items: StaffContact[] = [
    {
      id: "staff-registrar",
      name: "Mrs. Kumari Athukorala",
      title: "Registrar",
      department: "Registrar's Office",
      email: "registrar@ucl.example",
      phone: "+94 11 555 0110",
      office: "Administration Building, Room 1",
      topics: ["transcripts", "enrolment letters", "registration", "graduation"],
      updatedAt,
    },
    {
      id: "staff-finance",
      name: "Ishani Gunasekara",
      title: "Finance Officer",
      department: "Finance Office",
      email: "finance@ucl.example",
      phone: "+94 11 555 0120",
      office: "Administration Building, Room 4",
      topics: ["fees", "payments", "scholarships", "bursary", "payment plan", "refunds", "finance"],
      updatedAt,
    },
    {
      id: "staff-it",
      name: "Suresh Wickramasinghe",
      title: "IT Services Manager",
      department: "IT Services",
      email: "servicedesk@ucl.example",
      phone: "+94 11 555 0140",
      office: "Block C, Room C105",
      topics: ["wifi", "password", "student account", "software", "laptop", "network"],
      updatedAt,
    },
    {
      id: "staff-facilities",
      name: "Mahesh Rathnayake",
      title: "Facilities Manager",
      department: "Facilities Management",
      email: "facilities@ucl.example",
      phone: "+94 11 555 0175",
      office: "Maintenance Building",
      topics: ["repairs", "air conditioning", "maintenance", "lighting", "furniture", "cleaning"],
      updatedAt,
    },
    {
      id: "staff-counsellor",
      name: "Dr. Anoma Perera",
      title: "Head of Counselling",
      department: "Wellbeing Centre",
      email: "wellbeing@ucl.example",
      phone: "+94 11 555 0150",
      office: "Student Centre, Room S12",
      topics: ["counselling", "stress", "anxiety", "wellbeing", "mental health"],
      updatedAt,
    },
    {
      id: "staff-librarian",
      name: "Mr. Sunil Herath",
      title: "Chief Librarian",
      department: "University Library",
      email: "library@ucl.example",
      phone: "+94 11 555 0101",
      office: "Library Building, Room L01",
      topics: ["books", "borrowing", "research help", "journals", "study rooms"],
      updatedAt,
    },
    {
      id: "staff-careers",
      name: "Ms. Thilini Ranasinghe",
      title: "Careers Adviser",
      department: "Careers & Placement Office",
      email: "careers@ucl.example",
      phone: "+94 11 555 0190",
      office: "Block B, Room B104",
      topics: ["internships", "jobs", "cv", "interview", "placement"],
      updatedAt,
    },
    {
      id: "staff-computing-dean",
      name: "Dr. Nadeesha Jayawardena",
      title: "Deputy Dean, Faculty of Computing",
      department: "Faculty of Computing",
      email: "academic@ucl.example",
      phone: "+94 11 555 0201",
      office: "Block C, Room C210",
      topics: ["computing", "software engineering", "projects", "module changes", "academic support"],
      updatedAt,
    },
    {
      id: "staff-business-dean",
      name: "Prof. Rohan Jayasekara",
      title: "Dean, Faculty of Business",
      department: "Faculty of Business",
      email: "business.dean@ucl.example",
      phone: "+94 11 555 0301",
      office: "Block A, Room A301",
      topics: ["business", "management", "accounting", "marketing", "module changes"],
      updatedAt,
    },
    {
      id: "staff-engineering-dean",
      name: "Prof. Chandana Gunawardena",
      title: "Dean, Faculty of Engineering",
      department: "Faculty of Engineering",
      email: "engineering.dean@ucl.example",
      phone: "+94 11 555 0401",
      office: "Block D, Room D401",
      topics: ["engineering", "labs", "practicals", "module changes"],
      updatedAt,
    },
    {
      id: "staff-student-affairs",
      name: "Mr. Dinesh Kodikara",
      title: "Student Affairs Officer",
      department: "Student Affairs Office",
      email: "studentaffairs@ucl.example",
      phone: "+94 11 555 0130",
      office: "Administration Building, Room 12",
      topics: ["student id", "societies", "clubs", "events", "discipline", "orientation"],
      updatedAt,
    },
    {
      id: "staff-security",
      name: "Campus Security Control Room",
      title: "24-hour security desk",
      department: "Security",
      email: "security@ucl.example",
      phone: "+94 11 555 0999",
      office: "Main Gate",
      topics: ["emergency", "security", "lost property", "safety", "accident"],
      updatedAt,
    },
  ];
  return toCollection(items);
}

export function buildFaqs({ at }: DemoContext): DemoCollection {
  const updatedAt = at(-10, "09:00");
  const raw: Array<Omit<Faq, "updatedAt">> = [
    // ---- New students (onboarding)
    { id: "faq-first-week", category: "new-students", order: 1, question: "I'm a new student. What should I do in my first week?", answer: "Collect your student ID card from Student Affairs, activate your student email and Wi-Fi with the IT Service Desk, register for modules in the student portal, and check the Academic Calendar for orientation and add/drop dates." },
    { id: "faq-whom-to-ask", category: "new-students", order: 2, question: "I'm new and don't know who to ask. Where do I start?", answer: "Ask the AI Assistant, search the FAQs, or open the Staff Directory. Student Affairs is the friendly first stop for anything you're unsure about." },
    // ---- Academic
    { id: "faq-register", category: "academic", order: 1, question: "How do I register for modules?", answer: "Log in to the student portal, open Course Registration and choose your modules for the semester. Registration windows are listed in the Academic Calendar. Speak to your programme coordinator if two modules clash." },
    { id: "faq-support", category: "academic", order: 2, question: "Where can I find extra help with my studies?", answer: "Use Academic Support to request peer tutoring, a study group or a mentor. Faculty staff review requests and match you within a few working days." },
  ];
  return toCollection(raw.map((faq) => ({ ...faq, updatedAt })));
}

export function buildKnowledge({ at }: DemoContext): DemoCollection {
  const items: KnowledgeEntry[] = [
    {
      id: "kn-shuttle",
      title: "Campus shuttle bus timetable",
      content:
        "The free campus shuttle runs between the Main Gate, the railway station and the hostels every 20 minutes from 7:00 AM to 6:00 PM on weekdays. There is no shuttle on Sundays or public holidays.",
      keywords: ["shuttle", "bus", "transport", "station", "hostel"],
      link: "/services",
      active: true,
      updatedAt: at(-7, "09:00"),
    },
    {
      id: "kn-eduroam",
      title: "Wi-Fi networks on campus",
      content:
        "Students connect to the UCL-Students Wi-Fi network using their student email and password. Guests use UCL-Guest, which requires a daily voucher from the front desk.",
      keywords: ["wifi", "internet", "network", "guest"],
      link: "/it-support",
      active: true,
      updatedAt: at(-7, "09:00"),
    },
    {
      id: "kn-lockers",
      title: "Student lockers",
      content:
        "Lockers are available in Block A and the Library Building. Apply at the Student Affairs Office with your student ID. A refundable deposit applies.",
      keywords: ["locker", "storage", "deposit"],
      link: "/services",
      active: true,
      updatedAt: at(-7, "09:00"),
    },
    {
      id: "kn-prayer",
      title: "Prayer and quiet rooms",
      content:
        "Multi-faith prayer rooms and a quiet reflection room are located on the first floor of the Student Centre. They are open during normal campus hours.",
      keywords: ["prayer", "quiet", "reflection", "faith"],
      link: "/wellbeing",
      active: true,
      updatedAt: at(-7, "09:00"),
    },
  ];
  return toCollection(items);
}

export function buildJobs({ at, day }: DemoContext): DemoCollection {
  const items: Job[] = [
    {
      id: "job-software-intern",
      company: "Lanka Digital Labs",
      position: "Software Engineering Intern",
      description:
        "Join a product team building web applications used by thousands of Sri Lankan customers. You will pair with senior engineers, fix bugs and ship small features within your first month.",
      location: "Colombo (hybrid)",
      type: "internship",
      deadline: day(18),
      applyUrl: "https://careers.example.com/lanka-digital-labs/swe-intern",
      skills: ["TypeScript", "React", "Git", "SQL"],
      createdAt: at(-2, "09:00"),
    },
    {
      id: "job-data-intern",
      company: "Ceylon Analytics",
      position: "Data Analyst Intern",
      description:
        "Support analysts on retail and tourism dashboards, clean datasets and present weekly findings to clients.",
      location: "Colombo",
      type: "internship",
      deadline: day(21),
      applyUrl: "https://careers.example.com/ceylon-analytics/data-intern",
      skills: ["Python", "SQL", "Excel", "Data visualisation"],
      createdAt: at(-4, "09:00"),
    },
    {
      id: "job-cyber-intern",
      company: "Northstar Secure",
      position: "Cyber Security Intern",
      description: "Assist with vulnerability assessments and security awareness sessions under the guidance of certified professionals.",
      location: "Colombo",
      type: "internship",
      deadline: day(12),
      applyUrl: "https://careers.example.com/northstar/cyber-intern",
      skills: ["Networking", "Linux", "Security fundamentals"],
      createdAt: at(-6, "09:00"),
    },
    {
      id: "job-civil-placement",
      company: "GreenGrid Engineering",
      position: "Civil Engineering Placement Student",
      description: "A 6-month industrial placement on infrastructure projects, including site visits and design support.",
      location: "Kandy",
      type: "placement",
      deadline: day(30),
      applyUrl: "https://careers.example.com/greengrid/civil-placement",
      skills: ["AutoCAD", "Structural analysis", "Site safety"],
      createdAt: at(-3, "09:00"),
    },
    {
      id: "job-marketing-parttime",
      company: "Serendib Foods",
      position: "Social Media Assistant (part-time)",
      description: "Create short posts and reels, schedule content and report weekly engagement. Flexible hours around classes.",
      location: "Remote / Colombo",
      type: "part-time",
      deadline: day(9),
      applyUrl: "https://careers.example.com/serendib-foods/social-media",
      skills: ["Content creation", "Canva", "Copywriting"],
      createdAt: at(-1, "09:00"),
    },
    {
      id: "job-library-parttime",
      company: "UCL University Library",
      position: "Library Assistant (student part-time)",
      description: "Help at the circulation desk for up to 12 hours a week during term time. Training provided.",
      location: "UCL Campus",
      type: "part-time",
      deadline: day(15),
      applyUrl: "https://careers.example.com/ucl/library-assistant",
      skills: ["Customer service", "Organisation"],
      createdAt: at(-5, "09:00"),
    },
    {
      id: "job-graduate-dev",
      company: "OceanPay",
      position: "Graduate Backend Developer",
      description: "A structured 12-month graduate programme with rotations in payments, fraud and platform engineering.",
      location: "Colombo",
      type: "graduate",
      deadline: day(40),
      applyUrl: "https://careers.example.com/oceanpay/graduate-backend",
      skills: ["Java", "Node.js", "APIs", "Databases"],
      createdAt: at(-8, "09:00"),
    },
    {
      id: "job-accounting-intern",
      company: "Hemas & Partners Audit",
      position: "Audit Trainee Intern",
      description: "Assist audit teams with reconciliations and documentation across manufacturing and services clients.",
      location: "Colombo",
      type: "internship",
      deadline: day(24),
      applyUrl: "https://careers.example.com/audit-partners/trainee",
      skills: ["Accounting", "Excel", "Attention to detail"],
      createdAt: at(-9, "09:00"),
    },
    {
      id: "job-volunteer-teach",
      company: "Rotaract Community Outreach",
      position: "Weekend Volunteer Tutor",
      description: "Tutor secondary students in mathematics and English at a nearby community centre every Saturday morning.",
      location: "Community Centre, Mount Lavinia",
      type: "volunteering",
      deadline: day(20),
      applyUrl: "https://careers.example.com/rotaract/volunteer-tutor",
      skills: ["Teaching", "Patience", "Communication"],
      createdAt: at(-2, "13:00"),
    },
    {
      id: "job-expired",
      company: "Kandy Creative Studio",
      position: "Junior UI Designer Intern",
      description: "Design mobile and web interfaces for local start-ups and learn design systems in practice.",
      location: "Kandy (remote possible)",
      type: "internship",
      deadline: day(-3),
      applyUrl: "https://careers.example.com/kandy-creative/ui-intern",
      skills: ["Figma", "UI design", "Prototyping"],
      createdAt: at(-20, "09:00"),
    },
  ];
  return toCollection(items);
}
