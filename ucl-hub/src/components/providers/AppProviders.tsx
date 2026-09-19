"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "./AuthProvider";
import { ServicesProvider } from "./ServicesProvider";
import { ThemeProvider } from "./ThemeProvider";
import { ToastProvider } from "./ToastProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ServicesProvider>
          <AuthProvider>{children}</AuthProvider>
        </ServicesProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
