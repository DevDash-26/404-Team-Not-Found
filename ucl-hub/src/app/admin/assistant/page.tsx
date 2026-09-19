"use client";

import { useState } from "react";
import { RequireCapability } from "@/components/layout/RequireCapability";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs } from "@/components/ui/Tabs";
import { AssistantTester } from "@/features/ai/components/admin/AssistantTester";
import { KnowledgeManager } from "@/features/ai/components/admin/KnowledgeManager";
import { QuestionLog } from "@/features/ai/components/admin/QuestionLog";

type Tab = "knowledge" | "questions" | "test";

export default function AdminAssistantPage() {
  const [tab, setTab] = useState<Tab>("knowledge");
  return (
    <RequireCapability capability="knowledge">
      <Tabs<Tab>
        label="Assistant management"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "knowledge", label: "Knowledge" },
          { value: "questions", label: "Student questions" },
          { value: "test", label: "Try it" },
        ]}
      />
      {tab === "knowledge" && <KnowledgeManager />}
      {tab === "questions" && <QuestionLog />}
      {tab === "test" && (
        <>
          <PageHeader title="Try the assistant" description="See what students would get for a question." />
          <AssistantTester />
        </>
      )}
    </RequireCapability>
  );
}
