import {
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  CalendarDays,
  CalendarRange,
  CircleHelp,
  Contact,
  DoorOpen,
  GraduationCap,
  HeartPulse,
  LayoutDashboard,
  Laptop,
  Library,
  Megaphone,
  MessageSquareText,
  PackageSearch,
  Settings,
  Sparkles,
  UserRound,
  Users,
  UsersRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { Capability } from "@/lib/permissions";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Admin items are shown only to staff who hold this capability. */
  capability?: Capability;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const STUDENT_NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/assistant", label: "AI Assistant", icon: Sparkles },
      { href: "/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    label: "Campus life",
    items: [
      { href: "/announcements", label: "Announcements", icon: Megaphone },
      { href: "/events", label: "Events", icon: CalendarDays },
      { href: "/societies", label: "Societies", icon: UsersRound },
      { href: "/lost-found", label: "Lost & Found", icon: PackageSearch },
    ],
  },
  {
    label: "Study",
    items: [
      { href: "/classrooms", label: "Classrooms", icon: DoorOpen },
      { href: "/academic-support", label: "Academic Support", icon: GraduationCap },
      { href: "/calendar", label: "Academic Calendar", icon: CalendarRange },
      { href: "/library", label: "Library", icon: Library },
      { href: "/jobs", label: "Jobs & Internships", icon: Briefcase },
    ],
  },
  {
    label: "Services & help",
    items: [
      { href: "/services", label: "Campus Services", icon: Building2 },
      { href: "/facilities", label: "Facilities", icon: Wrench },
      { href: "/it-support", label: "IT Support", icon: Laptop },
      { href: "/wellbeing", label: "Wellbeing", icon: HeartPulse },
      { href: "/staff-directory", label: "Staff Directory", icon: Contact },
      { href: "/faqs", label: "FAQs", icon: CircleHelp },
      { href: "/feedback", label: "Feedback", icon: MessageSquareText },
      { href: "/profile", label: "Profile", icon: UserRound },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export const ADMIN_NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/announcements", label: "Announcements", icon: Megaphone, capability: "announcements" },
      { href: "/admin/events", label: "Events", icon: CalendarDays, capability: "events" },
      { href: "/admin/societies", label: "Societies", icon: UsersRound, capability: "societies" },
      { href: "/admin/calendar", label: "Academic Calendar", icon: CalendarRange, capability: "calendar" },
      { href: "/admin/jobs", label: "Jobs & Internships", icon: Briefcase, capability: "jobs" },
      { href: "/admin/faqs", label: "FAQs", icon: CircleHelp, capability: "faqs" },
      { href: "/admin/services", label: "Services", icon: Building2, capability: "services" },
      { href: "/admin/notifications", label: "Notifications", icon: Bell, capability: "notifications" },
    ],
  },
  {
    label: "Requests",
    items: [
      { href: "/admin/bookings", label: "Classroom Bookings", icon: DoorOpen, capability: "bookings" },
      { href: "/admin/facility-issues", label: "Facility Issues", icon: Wrench, capability: "facilityIssues" },
      { href: "/admin/lost-found", label: "Lost & Found", icon: PackageSearch, capability: "lostFoundModeration" },
      { href: "/admin/academic-support", label: "Academic Support", icon: GraduationCap, capability: "academicSupport" },
      { href: "/admin/feedback", label: "Feedback", icon: MessageSquareText, capability: "feedback" },
    ],
  },
  {
    label: "Platform",
    items: [
      { href: "/admin/users", label: "Users", icon: Users, capability: "users" },
      { href: "/admin/assistant", label: "AI Assistant", icon: Sparkles, capability: "knowledge" },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3, capability: "analytics" },
      { href: "/admin/settings", label: "Settings", icon: Settings, capability: "settings" },
    ],
  },
];
