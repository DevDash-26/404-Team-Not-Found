import { GraduationCap } from "lucide-react";
import type { ReactNode } from "react";
import { RedirectIfSignedIn } from "@/features/users/components/RedirectIfSignedIn";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { APP } from "@/config/app";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <RedirectIfSignedIn>
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-10">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <div className="flex w-full max-w-md flex-col items-center">
          <span className="flex size-12 items-center justify-center rounded-xl bg-brand-800 text-white">
            <GraduationCap className="size-6" aria-hidden="true" />
          </span>
          <p className="mt-3 text-lg font-semibold text-slate-900">{APP.name}</p>
          <p className="text-sm text-slate-500">{APP.institution}</p>
          <div className="mt-8 w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">{children}</div>
        </div>
      </div>
    </RedirectIfSignedIn>
  );
}
