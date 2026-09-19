import type { ReactNode } from "react";
import { Card } from "./Card";

export function StatCard({ label, value, icon, hint }: { label: string; value: ReactNode; icon?: ReactNode; hint?: string }) {
  return (
    <Card className="flex items-center gap-4 p-4">
      {icon && <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">{icon}</div>}
      <div className="min-w-0">
        <p className="text-sm text-slate-600">{label}</p>
        <p className="text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
        {hint && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
    </Card>
  );
}
