"use client";

import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { useServices } from "@/components/providers/ServicesProvider";
import { LinkButton } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingCards } from "@/components/ui/States";
import { FaqList } from "@/features/faq/components/FaqList";
import { useAsyncData } from "@/hooks/useAsyncData";
import type { FaqCategory, ServiceCategory } from "@/types";
import { ServiceCard } from "./ServiceCard";

interface CategoryServicesPageProps {
  title: string;
  description: string;
  category: ServiceCategory;
  faqCategory: FaqCategory;
  /** Ideas for the AI assistant, shown as one-tap questions. */
  askAi: string[];
  /** Extra page-specific content (tips, helplines, quick links). */
  children?: ReactNode;
}

/** Shared layout for the Library, IT Support and Wellbeing pages: live services + related FAQs + AI shortcuts. */
export function CategoryServicesPage({ title, description, category, faqCategory, askAi, children }: CategoryServicesPageProps) {
  const { directory, faqs } = useServices();
  const services = useAsyncData(async () => (await directory.listServices()).filter((s) => s.category === category), [directory, category]);
  const related = useAsyncData(async () => (await faqs.listAll()).filter((f) => f.category === faqCategory), [faqs, faqCategory]);

  return (
    <>
      <PageHeader title={title} description={description} />

      {children}

      <section aria-labelledby="services-heading" className="mb-8">
        <h2 id="services-heading" className="mb-3 text-lg font-semibold text-slate-900">
          Hours, locations &amp; contacts
        </h2>
        {services.error ? (
          <ErrorState message={services.error} onRetry={services.reload} />
        ) : services.loading ? (
          <LoadingCards count={2} />
        ) : (services.data ?? []).length === 0 ? (
          <EmptyState title="No services listed yet" description="Contact Student Affairs if you need help right now." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">{(services.data ?? []).map((service) => <ServiceCard key={service.id} service={service} />)}</div>
        )}
      </section>

      <Card className="mb-8 border-accent-200 bg-accent-50/50">
        <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-semibold text-slate-900">
              <Sparkles className="size-4 text-accent-600" aria-hidden="true" />
              Ask the AI assistant
            </h2>
            <p className="text-sm text-slate-600">Quick answers from official UCL information.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {askAi.map((question) => (
              <LinkButton key={question} href={`/assistant?q=${encodeURIComponent(question)}`} variant="secondary" size="sm">
                {question}
              </LinkButton>
            ))}
          </div>
        </CardBody>
      </Card>

      <section aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="mb-3 text-lg font-semibold text-slate-900">
          Common questions
        </h2>
        {related.error ? (
          <ErrorState message={related.error} onRetry={related.reload} />
        ) : related.loading ? (
          <LoadingCards count={2} />
        ) : (related.data ?? []).length === 0 ? (
          <p className="text-sm text-slate-600">No questions listed yet.</p>
        ) : (
          <FaqList faqs={related.data ?? []} />
        )}
      </section>
    </>
  );
}
