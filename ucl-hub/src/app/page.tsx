"use client";

import { BriefcaseBusiness, GraduationCap, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { VideoBackground } from "@/components/layout/VideoBackground";
import { AssistantWidget } from "@/components/layout/AssistantWidget";
import { LinkButton } from "@/components/ui/Button";
import { homeFor } from "@/lib/redirect";

const SPLASH_DURATION_MS = 900;

/** The public landing page gives each campus audience a clear entry point. */
export default function RootPage() {
  const { status, access } = useAuth();
  const router = useRouter();
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSplashDone(true), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (status === "signed-in") router.replace(homeFor(access));
  }, [status, access, router]);

  const ready = splashDone && status !== "loading";
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10 text-center">
      <VideoBackground />
      <div className="relative z-10 flex flex-col items-center">
        <h1 className="oneuni-wordmark animate-logo-in">OneUni</h1>
      </div>

      {!ready && (
        <div className="mt-8 size-6 animate-spin rounded-full border-2 border-white/40 border-t-white" role="status" aria-label="Loading" />
      )}

      {ready && status === "signed-out" && (
        <div className="relative z-10 mt-10 grid w-full max-w-3xl gap-3 animate-fade-in sm:grid-cols-3">
          <LinkButton href="/login?role=student" size="lg" className="landing-entry" icon={<GraduationCap className="size-5" aria-hidden="true" />}>
            Student account
          </LinkButton>
          <LinkButton href="/login?role=staff" size="lg" className="landing-entry" icon={<BriefcaseBusiness className="size-5" aria-hidden="true" />}>
            Staff account
          </LinkButton>
          <LinkButton href="/login?role=admin" size="lg" className="landing-entry" icon={<ShieldCheck className="size-5" aria-hidden="true" />}>
            Admin account
          </LinkButton>
        </div>
      )}

      <AssistantWidget />
    </div>
  );
}
