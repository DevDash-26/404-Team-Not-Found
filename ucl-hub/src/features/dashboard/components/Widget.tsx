import Link from "next/link";
import type { ReactNode } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { ErrorState, LoadingRows } from "@/components/ui/States";

interface WidgetProps {
  title: string;
  href?: string;
  linkLabel?: string;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  empty: boolean;
  emptyText: string;
  children: ReactNode;
}

/** A dashboard panel with its own loading, error and empty states, so one failing panel never blanks the page. */
export function Widget({ title, href, linkLabel = "View all", loading, error, onRetry, empty, emptyText, children }: WidgetProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader
        title={title}
        action={
          href ? (
            <Link href={href} className="text-sm font-medium text-brand-700 hover:underline">
              {linkLabel}
            </Link>
          ) : undefined
        }
      />
      <div className="flex-1 p-4">
        {error ? <ErrorState message={error} onRetry={onRetry} /> : loading ? <LoadingRows count={3} /> : empty ? <p className="py-4 text-center text-sm text-slate-500">{emptyText}</p> : children}
      </div>
    </Card>
  );
}
