"use client";

import { CircleHelp } from "lucide-react";
import { useMemo, useState } from "react";
import { useServices } from "@/components/providers/ServicesProvider";
import { LinkButton } from "@/components/ui/Button";
import { FilterChips } from "@/components/ui/FilterChips";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { EmptyState, ErrorState, LoadingRows } from "@/components/ui/States";
import { FaqList } from "@/features/faq/components/FaqList";
import { groupFaqs, searchFaqs } from "@/features/faq/logic";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { FAQ_CATEGORIES, type FaqCategory } from "@/types";
import { humanize } from "@/utils/text";

export default function FaqsPage() {
  const { faqs } = useServices();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<FaqCategory | "all">("all");
  const query = useDebouncedValue(search);
  const { data, loading, error, reload } = useAsyncData(() => faqs.listAll(), [faqs]);
  const groups = useMemo(() => groupFaqs(searchFaqs(data ?? [], query, category)), [data, query, category]);

  return (
    <>
      <PageHeader title="Frequently asked questions" description="Quick answers about studying, fees, IT, facilities and student life." />
      <div className="mb-5 space-y-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search questions and answers" label="Search FAQs" className="sm:max-w-md" />
        <FilterChips label="FAQ category" value={category} onChange={setCategory} options={[{ value: "all", label: "All" }, ...FAQ_CATEGORIES.map((c) => ({ value: c, label: humanize(c) }))]} />
      </div>
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <LoadingRows />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={<CircleHelp className="size-6" aria-hidden="true" />}
          title="No answers found"
          description="Try different words, or ask our AI assistant."
          action={<LinkButton href={`/assistant${query ? `?q=${encodeURIComponent(query)}` : ""}`}>Ask the AI assistant</LinkButton>}
        />
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.category} aria-labelledby={`faq-${group.category}`}>
              <h2 id={`faq-${group.category}`} className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                {humanize(group.category)}
              </h2>
              <FaqList faqs={group.faqs} />
            </section>
          ))}
        </div>
      )}
    </>
  );
}
