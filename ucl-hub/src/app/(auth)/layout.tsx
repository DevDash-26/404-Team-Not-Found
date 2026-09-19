import Image from "next/image";
import type { ReactNode } from "react";
import { RedirectIfSignedIn } from "@/features/users/components/RedirectIfSignedIn";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { APP } from "@/config/app";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <RedirectIfSignedIn>
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-50/55 px-4 py-10 backdrop-blur-[2px]">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <div className="flex w-full max-w-md flex-col items-center">
          <Image src="/ucl-logo.png" alt="Universal College Lanka logo" width={120} height={120} priority className="h-auto w-24 rounded-xl object-contain shadow-card" />
          <p className="mt-3 text-lg font-semibold text-slate-900">{APP.name}</p>
          <p className="text-sm text-slate-500">{APP.institution}</p>
          <div className="glass-panel mt-8 w-full rounded-2xl p-6 sm:p-8">{children}</div>
        </div>
      </div>
    </RedirectIfSignedIn>
  );
}
