"use client";

import { HeartHandshake, Phone } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { CategoryServicesPage } from "@/features/services/components/CategoryServicesPage";

const HELPLINES = [
  { name: "National Mental Health Helpline", number: "1926", note: "Free, 24 hours, in Sinhala, Tamil and English." },
  { name: "CCC Foundation crisis line", number: "1333", note: "Confidential emotional support." },
];

export default function WellbeingPage() {
  return (
    <CategoryServicesPage
      title="Wellbeing"
      description="Counselling, support and healthy habits. Asking for help is a sign of strength."
      category="wellbeing"
      faqCategory="student-life"
      askAi={["How can I talk to a counsellor?", "I feel overwhelmed with exams"]}
    >
      <Card className="mb-8 border-emerald-200 bg-emerald-50/60">
        <CardBody>
          <h2 className="flex items-center gap-2 font-semibold text-emerald-900">
            <HeartHandshake className="size-4" aria-hidden="true" />
            If you need to talk to someone right now
          </h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {HELPLINES.map((line) => (
              <li key={line.number} className="rounded-lg bg-white p-3 ring-1 ring-emerald-200">
                <p className="text-sm font-medium text-slate-900">{line.name}</p>
                <a href={`tel:${line.number}`} className="mt-0.5 flex items-center gap-1.5 text-lg font-semibold text-emerald-800 hover:underline">
                  <Phone className="size-4" aria-hidden="true" />
                  {line.number}
                </a>
                <p className="text-xs text-slate-600">{line.note}</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-slate-700">In an emergency, contact campus security or call your local emergency number.</p>
          <div className="mt-3">
            <LinkButton href="/academic-support" variant="secondary" size="sm">
              Academic support &amp; mentoring
            </LinkButton>
          </div>
        </CardBody>
      </Card>
    </CategoryServicesPage>
  );
}
