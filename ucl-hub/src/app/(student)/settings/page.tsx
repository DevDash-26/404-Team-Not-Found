"use client";

import { Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { type AccentTheme, useTheme } from "@/components/providers/ThemeProvider";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";

export default function SettingsPage() {
  const { theme, toggle, accent, setAccent } = useTheme();
  const { signOut } = useAuth();
  const router = useRouter();

  return (
    <>
      <PageHeader title="Settings" description="Manage how UCL Campus Hub looks and behaves for you." />

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader title="Appearance" description="Choose how the app looks on this device." />
          <CardBody className="space-y-5">
            <div>
              <p className="text-sm font-medium text-slate-900">Theme</p>
              <p className="text-sm text-slate-600">{theme === "dark" ? "Dark mode is on." : "Light mode is on."}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={toggle}
                aria-pressed={theme === "dark"}
                className={cn("inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800")}
              >
                {theme === "dark" ? <Sun className="size-4" aria-hidden="true" /> : <Moon className="size-4" aria-hidden="true" />}
                Switch to {theme === "dark" ? "light" : "dark"}
              </button>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Color theme</p>
              <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Color theme">
                {(["red", "blue", "green", "yellow", "violet"] as AccentTheme[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setAccent(option)}
                    aria-label={`${option} color theme`}
                    aria-pressed={accent === option}
                    className={cn("size-9 rounded-full border-2 border-transparent shadow-sm transition-transform hover:scale-110", accent === option && "border-slate-900 ring-2 ring-slate-300 dark:border-white dark:ring-slate-600")}
                    style={{ backgroundColor: { red: "#ff0000", blue: "#2563eb", green: "#16a34a", yellow: "#eab308", violet: "#8b5cf6" }[option] }}
                  />
                ))}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Account" description="Manage your session." />
          <CardBody>
            <Button
              variant="secondary"
              onClick={async () => {
                await signOut();
                router.replace("/");
              }}
            >
              Sign out
            </Button>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
