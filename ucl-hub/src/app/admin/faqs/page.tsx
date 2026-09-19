"use client";

import { RequireCapability } from "@/components/layout/RequireCapability";
import { useServices } from "@/components/providers/ServicesProvider";
import { Badge } from "@/components/ui/Badge";
import { toOptions } from "@/components/admin/options";
import { ResourceManager, singlePage } from "@/components/admin/ResourceManager";
import type { FieldDef } from "@/components/admin/fields";
import { faqSchema, type FaqInput } from "@/features/faq/schema";
import { FAQ_CATEGORIES, type Faq } from "@/types";
import { humanize, truncate } from "@/utils/text";

const FIELDS: FieldDef[] = [
  { name: "question", label: "Question", type: "text", required: true, maxLength: 200 },
  { name: "answer", label: "Answer", type: "textarea", required: true, rows: 6, maxLength: 4000 },
  { name: "category", label: "Category", type: "select", required: true, span: 1, options: toOptions(FAQ_CATEGORIES) },
  { name: "order", label: "Order", type: "number", min: 0, span: 1, hint: "Lower numbers appear first within a category." },
];

export default function AdminFaqsPage() {
  const { faqs } = useServices();
  return (
    <RequireCapability capability="faqs">
      <ResourceManager<Faq, FaqInput>
        title="FAQs"
        description="Answers to common questions. The AI assistant uses these too, so keep them accurate."
        singular="FAQ"
        fields={FIELDS}
        schema={faqSchema}
        defaults={{ category: "general", order: 10 }}
        loadPage={singlePage(() => faqs.listAll())}
        loadDeps={[faqs]}
        create={(input) => faqs.create(input)}
        update={(item, input) => faqs.update(item.id, input)}
        remove={(item) => faqs.remove(item.id)}
        searchText={(f) => [f.question, f.answer, f.category]}
        columns={[
          {
            header: "Question",
            render: (f) => (
              <div className="min-w-64 max-w-lg">
                <p className="font-medium text-slate-900">{f.question}</p>
                <p className="mt-0.5 text-xs text-slate-500">{truncate(f.answer, 110)}</p>
              </div>
            ),
          },
          { header: "Category", render: (f) => <Badge>{humanize(f.category)}</Badge> },
          { header: "Order", render: (f) => <span className="tabular-nums">{f.order}</span> },
        ]}
      />
    </RequireCapability>
  );
}
