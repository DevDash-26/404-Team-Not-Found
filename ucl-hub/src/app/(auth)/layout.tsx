import { GraduationCap, ShieldCheck, Sparkles, CalendarDays } from "lucide-react";
import type { ReactNode } from "react";
import { RedirectIfSignedIn } from "@/features/users/components/RedirectIfSignedIn";
import { APP } from "@/config/app";

const HIGHLIGHTS = [
  { icon: Sparkles, text: "Ask the AI assistant anything about campus" },
  { icon: CalendarDays, text: "Events, classrooms and your academic calendar in one place" },
  { icon: ShieldCheck, text: "Official information you can trust, straight from UCL" },
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <RedirectIfSignedIn>
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <aside className="hidden flex-col justify-between bg-brand-900 p-10 text-white lg:flex">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-accent-400 text-brand-950">
              <GraduationCap className="size-6" aria-hidden="true" />
            </span>
            <div className="leading-tight">
              <p className="text-lg font-semibold">{APP.name}</p>
              <p className="text-sm text-brand-200">{APP.institution}</p>
            </div>
          </div>
          <div>
            <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-tight">One trusted digital platform for students and staff.</h2>
            <ul className="mt-8 space-y-4">
              {HIGHLIGHTS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-brand-100">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                    <Icon className="size-[18px] text-accent-300" aria-hidden="true" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-brand-300">Built for DevDash&apos;26</p>
        </aside>
        <main className="flex items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>
    </RedirectIfSignedIn>
  );
}
