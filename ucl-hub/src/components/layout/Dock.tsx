"use client";

import Link from "next/link";
import type { NavItem } from "@/config/navigation";
import { cn } from "@/utils/cn";

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin" || href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Floating "liquid glass" quick-access dock for the most used pages, docked bottom-center. */
export function Dock({ items, pathname }: { items: NavItem[]; pathname: string }) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4"
    >
      <ul
        className={cn(
          "flex items-center gap-1 rounded-full border border-white/50 bg-white/55 p-1.5 shadow-pop backdrop-blur-2xl backdrop-saturate-150",
          "ring-1 ring-inset ring-white/60 supports-[backdrop-filter]:bg-white/35",
          "dark:border-white/10 dark:bg-black/35 dark:ring-white/10 dark:supports-[backdrop-filter]:bg-black/25",
        )}
      >
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                title={item.label}
                className={cn(
                  "flex size-11 items-center justify-center rounded-full transition-all",
                  active
                    ? "bg-brand-800 text-white shadow-sm"
                    : "text-slate-600 hover:scale-105 hover:bg-white/70 dark:text-slate-300 dark:hover:bg-white/10",
                )}
              >
                <item.icon className="size-5" aria-hidden="true" />
                <span className="sr-only">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
