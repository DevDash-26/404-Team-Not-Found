import { ChevronDown } from "lucide-react";
import type { Faq } from "@/types";

/** Accessible accordion built on native <details>, so it works without JavaScript state. */
export function FaqList({ faqs }: { faqs: Faq[] }) {
  return (
    <div className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
      {faqs.map((faq) => (
        <details key={faq.id} className="group">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 text-left font-medium text-slate-900 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
            {faq.question}
            <ChevronDown className="mt-0.5 size-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="whitespace-pre-line px-5 pb-4 text-sm text-slate-700">{faq.answer}</div>
        </details>
      ))}
    </div>
  );
}
