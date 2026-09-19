"use client";

import { Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";

export default function SettingsPage() {
  const { theme, toggle } = useTheme();
  const { signOut } = useAuth();
  const router = useRouter();

  return (
    <>
      <PageHeader title="Settings" description="Manage how UCL Campus Hub looks and behaves for you." />

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader title="Appearance" description="Choose how the app looks on this device." />
          <CardBody className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-900">Theme</p>
              <p className="text-sm text-slate-600">{theme === "dark" ? "Dark mode is on." : "Light mode is on."}</p>
            </div>
            <button
              type="button"
              onClick={toggle}
              aria-pressed={theme === "dark"}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50",
              )}
            >
              {theme === "dark" ? <Sun className="size-4" aria-hidden="true" /> : <Moon className="size-4" aria-hidden="true" />}
              Switch to {theme === "dark" ? "light" : "dark"}
            </button>
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
