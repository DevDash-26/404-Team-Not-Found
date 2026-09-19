"use client";

import { Eraser, Sparkles } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/States";
import { ChatInput } from "@/features/ai/components/ChatInput";
import { ChatMessageView } from "@/features/ai/components/ChatMessageView";
import { useAssistantChat } from "@/features/ai/hooks/useAssistantChat";

const SUGGESTIONS = ["What time does the library close?", "What events are happening this week?", "How do I book a classroom?", "Who should I contact for finance issues?"];

function PublicAssistantChat() {
  const { messages, pending, send, clear } = useAssistantChat({ profile: { name: "Visitor", role: "student", faculty: null, programme: null, year: null }, storageId: "public" });
  const params = useSearchParams();
  const bottomRef = useRef<HTMLDivElement>(null);
  const autoAsked = useRef(false);
  const initial = params.get("q");

  useEffect(() => {
    if (initial && !autoAsked.current) {
      autoAsked.current = true;
      void send(initial);
    }
  }, [initial, send]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, pending]);

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-8">
      <PageHeader title="AI assistant" description="Ask questions about UCL campus information without signing in." actions={messages.length > 0 ? <Button variant="secondary" size="sm" icon={<Eraser className="size-4" aria-hidden="true" />} onClick={clear}>New chat</Button> : undefined} />
      <div className="flex-1 space-y-5 pb-4" role="log" aria-live="polite" aria-label="Conversation">
        {messages.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-accent-100 text-accent-700"><Sparkles className="size-5" aria-hidden="true" /></span>
              <div><h2 className="font-semibold text-slate-900">How can I help?</h2><p className="text-sm text-slate-600">Ask about campus services, events, calendars, and more.</p></div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">{SUGGESTIONS.map((question) => <button key={question} type="button" onClick={() => void send(question)} className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:border-brand-400 hover:bg-brand-50">{question}</button>)}</div>
          </div>
        )}
        {messages.map((message) => <ChatMessageView key={message.id} message={message} userName="Visitor" />)}
        {pending && <div className="flex items-center gap-3" role="status"><span aria-hidden="true" className="flex size-9 items-center justify-center rounded-full bg-accent-400 text-sm font-bold text-brand-950">AI</span><p className="flex items-center gap-2 text-sm text-slate-600"><Spinner className="size-4" /> Looking through campus information…</p></div>}
        <div ref={bottomRef} />
      </div>
      <div className="sticky bottom-0 border-t border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur sm:rounded-xl sm:border"><ChatInput disabled={pending} onSend={(text) => void send(text)} /><p className="mt-2 text-center text-xs text-slate-500">You can sign in later for personalized campus information.</p></div>
    </div>
  );
}

export default function PublicAssistantPage() {
  return <Suspense fallback={null}><PublicAssistantChat /></Suspense>;
}