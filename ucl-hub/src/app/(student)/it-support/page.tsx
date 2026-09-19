"use client";

import { Wrench } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { CategoryServicesPage } from "@/features/services/components/CategoryServicesPage";

export default function ItSupportPage() {
  return (
    <CategoryServicesPage
      title="IT support"
      description="Wi-Fi, accounts, printing and lab equipment: who to ask and how to report a fault."
      category="it"
      faqCategory="it"
      askAi={["How do I reset my password?", "How do I connect to campus Wi-Fi?"]}
    >
      <Card className="mb-8">
        <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-semibold text-slate-900">
              <Wrench className="size-4 text-brand-600" aria-hidden="true" />
              Something not working?
            </h2>
            <p className="text-sm text-slate-600">Report internet or equipment faults and follow them until they&apos;re fixed. They go straight to IT Services.</p>
          </div>
          <LinkButton href="/facilities">Report an issue</LinkButton>
        </CardBody>
      </Card>
    </CategoryServicesPage>
  );
}
