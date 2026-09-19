"use client";

import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/data/demo/people";
import { STAFF_ROLE_LABELS } from "@/types";

function labelFor(role: string, staffRole: keyof typeof STAFF_ROLE_LABELS | null): string {
  if (role === "admin") return "Administrator";
  if (role === "staff" && staffRole) return STAFF_ROLE_LABELS[staffRole];
  return "Student";
}

/** One-click demo sign-in shortcuts, shown only in demo mode or when explicitly enabled. */
export function DemoAccounts({ onPick }: { onPick: (email: string, password: string) => void }) {
  return (
    <section aria-labelledby="demo-heading" className="mt-8 rounded-xl border border-accent-200 bg-accent-50/60 p-4">
      <h2 id="demo-heading" className="text-sm font-semibold text-accent-700">
        Demo accounts
      </h2>
      <p className="mt-0.5 text-xs text-slate-600">
        Choose one to fill the form. Password for all: <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px]">{DEMO_PASSWORD}</code>
      </p>
      <ul className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {DEMO_ACCOUNTS.map((account) => (
          <li key={account.uid}>
            <button
              type="button"
              onClick={() => onPick(account.email, account.password)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs hover:border-brand-300 hover:bg-brand-50"
            >
              <span className="block font-medium text-slate-900">{labelFor(account.profile.role, account.profile.staffRole)}</span>
              <span className="block truncate text-slate-500">{account.email}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
