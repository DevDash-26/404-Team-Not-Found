"use client";

import { Eraser } from "lucide-react";
import { useCurrentUser } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/States";
import { useAssistantChat } from "../../hooks/useAssistantChat";
import { ChatInput } from "../ChatInput";
import { ChatMessageView } from "../ChatMessageView";

/** Lets an administrator ask the assistant a question and see the answer exactly as a student would. */
export function AssistantTester() {
  const { profile } = useCurrentUser();
  const { messages, pending, send, clear } = useAssistantChat();

  return (
    <Card>
      <CardHeader
        title="Ask a question"
        description="Check that a new knowledge entry or FAQ is picked up. Staff see everything, students see content targeted to them."
        action={
          messages.length > 0 ? (
            <Button variant="secondary" size="sm" icon={<Eraser className="size-4" aria-hidden="true" />} onClick={clear}>
              Clear
            </Button>
          ) : undefined
        }
      />
      <CardBody className="space-y-5">
        <div className="space-y-5" role="log" aria-live="polite" aria-label="Test conversation">
          {messages.length === 0 && <p className="text-sm text-slate-500">No test questions yet.</p>}
          {messages.map((message) => (
            <ChatMessageView key={message.id} message={message} userName={profile.name} />
          ))}
          {pending && (
            <p role="status" className="flex items-center gap-2 text-sm text-slate-600">
              <Spinner className="size-4" /> Thinking…
            </p>
          )}
        </div>
        <ChatInput disabled={pending} onSend={(text) => void send(text)} />
      </CardBody>
    </Card>
  );
}
