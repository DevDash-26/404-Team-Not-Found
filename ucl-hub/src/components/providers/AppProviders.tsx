"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "./AuthProvider";
import { ServicesProvider } from "./ServicesProvider";
import { ToastProvider } from "./ToastProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ServicesProvider>
        <AuthProvider>{children}</AuthProvider>
      </ServicesProvider>
    </ToastProvider>
  );
}
