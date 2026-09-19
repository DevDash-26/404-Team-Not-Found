"use client";

import { ArrowRight, GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { VideoBackground } from "@/components/layout/VideoBackground";
import { LinkButton } from "@/components/ui/Button";
import { APP } from "@/config/app";
import { homeFor } from "@/lib/redirect";

const SPLASH_DURATION_MS = 900;

/** The public landing page keeps the entry point focused: brand, video and sign-in. */
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
        <span className="flex size-16 items-center justify-center rounded-2xl bg-brand-800 text-white shadow-pop animate-logo-in">
          <GraduationCap className="size-8" aria-hidden="true" />
        </span>
        <p className="mt-4 text-lg font-semibold text-white drop-shadow animate-logo-in">{APP.name}</p>
        <p className="text-sm text-white/80 drop-shadow animate-logo-in">{APP.institution}</p>
      </div>

      {!ready && (
        <div className="mt-8 size-6 animate-spin rounded-full border-2 border-white/40 border-t-white" role="status" aria-label="Loading" />
      )}

      {ready && status === "signed-out" && (
        <div className="relative z-10 mt-10 animate-fade-in">
          <LinkButton href="/login" size="lg" className="landing-sign-in" icon={<ArrowRight className="size-5" aria-hidden="true" />}>
            Sign in
          </LinkButton>
        </div>
      )}
    </div>
  );
}
