import { CalendarSearch, DoorOpen, GraduationCap, PackageSearch, Sparkles, Wrench } from "lucide-react";
import Link from "next/link";

const ACTIONS = [
  { href: "/classrooms", label: "Find a classroom", icon: DoorOpen },
  { href: "/facilities", label: "Report an issue", icon: Wrench },
  { href: "/events", label: "Find an event", icon: CalendarSearch },
  { href: "/assistant", label: "Ask AI", icon: Sparkles },
  { href: "/lost-found", label: "Lost & Found", icon: PackageSearch },
  { href: "/academic-support", label: "Academic support", icon: GraduationCap },
] as const;

export function QuickActions() {
  return (
    <nav aria-label="Quick actions" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {ACTIONS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="group flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center shadow-card transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
        >
          <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 group-hover:bg-brand-800 group-hover:text-white">
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <span className="text-sm font-medium text-slate-800">{label}</span>
        </Link>
      ))}
    </nav>
  );
}
