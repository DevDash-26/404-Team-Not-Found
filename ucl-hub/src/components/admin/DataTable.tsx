import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

export interface Column<T> {
  header: string;
  render: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T extends { id: string }> {
  caption: string;
  columns: readonly Column<T>[];
  rows: readonly T[];
  actions?: (item: T) => ReactNode;
}

/** Simple accessible table. Scrolls sideways on small screens instead of squashing columns. */
export function DataTable<T extends { id: string }>({ caption, columns, rows, actions }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-card">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th key={column.header} scope="col" className={cn("px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500", column.className)}>
                {column.header}
              </th>
            ))}
            {actions && (
              <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.id} className="align-top hover:bg-slate-50/60">
              {columns.map((column) => (
                <td key={column.header} className={cn("px-4 py-3 text-slate-700", column.className)}>
                  {column.render(row)}
                </td>
              ))}
              {actions && <td className="whitespace-nowrap px-4 py-3 text-right">{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
