"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Spinner } from "@/components/ui/States";
import { Button } from "@/components/ui/Button";
import { getServices, type Services } from "@/services/registry";
import { toUserMessage } from "@/utils/errors";

const ServicesContext = createContext<Services | null>(null);

/** Starts the backend once and only renders the app when it is ready (or shows a retry screen). */
export function ServicesProvider({ children }: { children: ReactNode }) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ attempt: number; services: Services | null; error: string | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getServices().then(
      (services) => !cancelled && setState({ attempt, services, error: null }),
      (error: unknown) => !cancelled && setState({ attempt, services: null, error: toUserMessage(error) }),
    );
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const current = state?.attempt === attempt ? state : null;
  const value = useMemo(() => current?.services ?? null, [current]);

  if (current?.error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center" role="alert">
        <h1 className="text-xl font-semibold text-slate-900">We couldn&apos;t start UCL Campus Hub</h1>
        <p className="max-w-md text-sm text-slate-600">{current.error}</p>
        <Button onClick={() => setAttempt((n) => n + 1)}>Try again</Button>
      </div>
    );
  }
  if (!value) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Loading">
        <Spinner className="size-8 text-brand-700" />
      </div>
    );
  }
  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>;
}

export function useServices(): Services {
  const services = useContext(ServicesContext);
  if (!services) throw new Error("useServices must be used inside <ServicesProvider>.");
  return services;
}
