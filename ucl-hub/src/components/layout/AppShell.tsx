"use client";

import Image from "next/image";
import { ChevronDown, LogOut, Menu, ShieldCheck, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { APP } from "@/config/app";
import { ADMIN_NAV, ADMIN_DOCK, STUDENT_DOCK, STUDENT_NAV, type NavGroup } from "@/config/navigation";
import { isStaffOrAdmin } from "@/lib/permissions";
import { STAFF_ROLE_LABELS } from "@/types";
import { cn } from "@/utils/cn";
import { Dock } from "./Dock";
import { EmergencyBanner } from "./EmergencyBanner";
import { NotificationBell } from "./NotificationBell";
import { OfflineBanner } from "./OfflineBanner";
import { SystemMessageBanner } from "./SystemMessageBanner";

type Area = "student" | "admin";

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin" || href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function roleLabel(role: string, staffRole: keyof typeof STAFF_ROLE_LABELS | null): string {
  if (role === "admin") return "Administrator";
  if (role === "staff" && staffRole) return STAFF_ROLE_LABELS[staffRole];
  return "Student";
}

function Brand({ area }: { area: Area }) {
  return (
    <Link href={area === "admin" ? "/admin" : "/dashboard"} className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center overflow-hidden rounded-lg bg-accent-400 text-brand-950">
        <Image src="/ucl-logo.png" alt="UCL logo" width={36} height={36} className="size-9 object-cover" />
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold text-white">{APP.name}</span>
        <span className="block text-xs text-brand-200">{area === "admin" ? "Staff workspace" : APP.institution}</span>
      </span>
    </Link>
  );
}

function NavList({ groups, pathname, onNavigate }: { groups: NavGroup[]; pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label={groups === ADMIN_NAV ? "Staff navigation" : "Main navigation"} className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
      {groups.map((group) =>
        group.items.length === 0 ? null : (
          <div key={group.label}>
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-brand-300/80">{group.label}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active ? "bg-white/10 text-white" : "text-brand-100 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <item.icon className={cn("size-[18px] shrink-0", active ? "text-accent-300" : "text-brand-300")} aria-hidden="true" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ),
      )}
    </nav>
  );
}

function UserMenu({ area }: { area: Area }) {
  const { profile, access, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent) {
        if (event.key === "Escape") setOpen(false);
      } else if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  if (!profile || !access) return null;
  const staff = isStaffOrAdmin(access);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-100"
      >
        <Avatar name={profile.name} />
        <span className="hidden text-left leading-tight sm:block">
          <span className="block max-w-40 truncate text-sm font-medium text-slate-900">{profile.name}</span>
          <span className="block text-xs text-slate-500">{roleLabel(access.role, access.staffRole)}</span>
        </span>
        <ChevronDown className="hidden size-4 text-slate-400 sm:block" aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-40 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-pop dark:border-slate-700">
          <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
            <p className="truncate text-sm font-medium text-slate-900">{profile.name}</p>
            <p className="truncate text-xs text-slate-500">{profile.email}</p>
            <Badge tone="brand" className="mt-1.5">
              {roleLabel(access.role, access.staffRole)}
            </Badge>
          </div>
          <Link role="menuitem" href="/profile" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
            Your profile
          </Link>
          {staff && (
            <Link
              role="menuitem"
              href={area === "admin" ? "/dashboard" : "/admin"}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <ShieldCheck className="size-4 text-slate-400" aria-hidden="true" />
              {area === "admin" ? "Open student view" : "Open staff workspace"}
            </Link>
          )}
          <button
            role="menuitem"
            type="button"
            onClick={async () => {
              await signOut();
              router.replace("/");
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            <LogOut className="size-4 text-slate-400" aria-hidden="true" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function AppShell({ area, children }: { area: Area; children: ReactNode }) {
  const pathname = usePathname();
  const { can } = useAuth();
  const [drawerPath, setDrawerPath] = useState<string | null>(null);
  // The drawer is tied to the route it was opened on, so navigating closes it without an effect.
  const drawerOpen = drawerPath === pathname;

  const groups =
    area === "admin"
      ? ADMIN_NAV.map((group) => ({ ...group, items: group.items.filter((item) => !item.capability || can(item.capability)) }))
      : STUDENT_NAV;
  const bottomItems = (area === "admin" ? ADMIN_NAV : STUDENT_NAV)
    .flatMap((group) => group.items)
    .filter((item) => !item.capability || can(item.capability))
    .slice(0, 5);
  const assistantHref = area === "admin" ? "/admin/assistant" : "/assistant";

  const dockItems = area === "admin" ? ADMIN_DOCK.filter((item) => !item.capability || can(item.capability)) : STUDENT_DOCK;

  const sidebar = (
    <div className="glass-sidebar flex h-full flex-col bg-brand-950/75">
      <div className="flex h-16 shrink-0 items-center justify-between px-5">
        <Brand area={area} />
        <button type="button" onClick={() => setDrawerPath(null)} aria-label="Close menu" className="rounded-lg p-1.5 text-brand-200 hover:bg-white/10">
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>
      <NavList groups={groups} pathname={pathname} onNavigate={() => setDrawerPath(null)} />
    </div>
  );

  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-pop">
        Skip to main content
      </a>

      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-brand-950/60" onClick={() => setDrawerPath(null)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] shadow-pop">{sidebar}</aside>
        </div>
      )}

      <div className="flex min-h-screen flex-col">
        <OfflineBanner />
        <SystemMessageBanner />
        {area === "student" && <EmergencyBanner />}
        <header className="glass-header sticky top-3 z-20 mx-3 flex h-16 items-center gap-2 rounded-2xl px-4 sm:mx-6 sm:px-6">
          <button type="button" onClick={() => setDrawerPath(pathname)} aria-label="Open menu" className="-ml-1 rounded-lg p-2 text-slate-600 hover:bg-slate-100">
            <Menu className="size-5" aria-hidden="true" />
          </button>
          {area === "admin" && <Badge tone="accent">Staff workspace</Badge>}
          <div className="flex-1" />
          <ThemeToggle />
          <NotificationBell />
          <UserMenu area={area} />
        </header>

        <main id="main" className="glass-page mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-24 sm:px-6 lg:py-8 lg:pb-8">
          {children}
        </main>
        <nav className="glass-bottom-nav fixed bottom-3 left-1/2 z-30 flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 items-center gap-1 rounded-2xl px-2 py-1.5 lg:hidden" aria-label="Quick navigation">
          {bottomItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link key={item.href} href={item.href} aria-label={item.label} className={cn("flex size-9 items-center justify-center rounded-xl", active ? "bg-brand-800/10 text-brand-800" : "text-slate-600 hover:bg-white/60 hover:text-brand-800")}>
                <item.icon className="size-[17px]" aria-hidden="true" />
              </Link>
            );
          })}
        </nav>
      </div>

      <Dock items={dockItems} pathname={pathname} />

      <Link
        href={area === "admin" ? "/admin/assistant" : "/assistant"}
        aria-label="Ask the AI assistant"
        title="Ask the AI assistant"
        className="animate-glow fixed bottom-24 right-4 z-40 flex size-14 items-center justify-center rounded-full bg-brand-800 text-white transition-transform hover:scale-105 hover:bg-brand-700 sm:right-6"
      >
        <Sparkles className="size-6" aria-hidden="true" />
      </Link>
    </div>
  );
}
