"use client";

import { Eraser, Grip, Send, Sparkles, X } from "lucide-react";
import { useRef, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useAssistantName } from "@/hooks/useAssistantName";
import { useAssistantChat } from "@/features/ai/hooks/useAssistantChat";
import { cn } from "@/utils/cn";

type Corner = "bottom-right" | "bottom-left" | "top-right" | "top-left";
const CORNERS: Corner[] = ["bottom-right", "bottom-left", "top-right", "top-left"];
const CORNER_KEY = "ucl-hub-assistant-corner";
const SUGGESTIONS = [
  "What events are happening this week?",
  "How do I book a classroom?",
  "What time does the library close?",
  "How do I report a facility issue?",
];

function cornerClasses(corner: Corner): string {
  return {
    "bottom-right": "bottom-5 right-5 items-end",
    "bottom-left": "bottom-5 left-5 items-start",
    "top-right": "top-20 right-5 items-end",
    "top-left": "top-20 left-5 items-start",
  }[corner];
}

export function AssistantWidget() {
  const { profile, access } = useAuth();
  const { name } = useAssistantName();
  const [open, setOpen] = useState(false);
  const [corner, setCorner] = useState<Corner>(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(CORNER_KEY) : null;
    return stored && CORNERS.includes(stored as Corner) ? (stored as Corner) : "bottom-right";
  });
  const dragStart = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const { messages, pending, send, clear } = useAssistantChat({
    profile: {
      name: profile?.name ?? "Visitor",
      role: access?.role === "student" ? "student" : (access?.staffRole ?? access?.role ?? "student"),
      faculty: profile?.faculty ?? null,
      programme: profile?.programme ?? null,
      year: profile?.year ?? null,
    },
    storageId: `widget:${profile?.id ?? "public"}`,
  });

  function startDrag(event: React.PointerEvent<HTMLButtonElement>) {
    dragStart.current = { x: event.clientX, y: event.clientY, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: React.PointerEvent<HTMLButtonElement>) {
    if (!dragStart.current) return;
    if (Math.hypot(event.clientX - dragStart.current.x, event.clientY - dragStart.current.y) > 8) dragStart.current.moved = true;
  }

  function finishDrag(event: React.PointerEvent<HTMLButtonElement>) {
    const drag = dragStart.current;
    dragStart.current = null;
    if (!drag?.moved) {
      setOpen((value) => !value);
      return;
    }
    const horizontal = event.clientX < window.innerWidth / 2 ? "left" : "right";
    const vertical = event.clientY < window.innerHeight / 2 ? "top" : "bottom";
    const next = `${vertical}-${horizontal}` as Corner;
    setCorner(next);
    window.localStorage.setItem(CORNER_KEY, next);
  }

  const lastMessage = messages.at(-1);
  return (
    <>
      {pending && <div className="ai-thinking-overlay" aria-hidden="true" />}
      <div className={cn("fixed z-[60] flex flex-col gap-3", cornerClasses(corner))}>
      {open && (
        <section className="assistant-widget-panel glass-panel w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl bg-white/90 shadow-pop dark:bg-slate-950/90" aria-label={`${name} assistant`}>
          <header className="flex items-center justify-between border-b border-slate-200/70 px-4 py-3 dark:border-slate-700/70">
            <div className="flex items-center gap-2"><Sparkles className="size-4 text-brand-600" /><span className="font-semibold text-slate-900 dark:text-slate-100">{name}</span></div>
            <div className="flex items-center gap-1"><button type="button" onClick={clear} aria-label="Clear chat" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><Eraser className="size-4" /></button><button type="button" onClick={() => setOpen(false)} aria-label="Close assistant" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="size-4" /></button></div>
          </header>
          <div className="max-h-64 space-y-2 overflow-y-auto p-3" role="log" aria-live="polite">
            {messages.length === 0 && <p className="text-sm text-slate-600 dark:text-slate-300">Ask me about campus services, events, the library, or classrooms.</p>}
            {messages.length === 0 && (
              <div className="mt-3 flex flex-wrap gap-2" aria-label="Suggested questions">
                {SUGGESTIONS.map((suggestion) => (
                  <button key={suggestion} type="button" disabled={pending} onClick={() => void send(suggestion)} className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-left text-xs text-brand-900 transition-colors hover:border-brand-400 hover:bg-brand-100 disabled:opacity-50 dark:border-brand-700 dark:bg-brand-950/60 dark:text-brand-100 dark:hover:bg-brand-900/70">
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            {messages.slice(-4).map((message) => <p key={message.id} className={cn("rounded-xl px-3 py-2 text-sm", message.role === "user" ? "ml-6 bg-brand-50 text-brand-950 dark:bg-brand-900/50 dark:text-brand-100" : "mr-6 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200")}>{message.content}</p>)}
            {pending && (
              <div className="flex items-center gap-2 text-xs text-slate-500" role="status" aria-label={`${name} is thinking`}>
                <span>{name} is thinking</span>
                <span className="ai-thinking-dots" aria-hidden="true"><i /><i /><i /></span>
              </div>
            )}
          </div>
          <form className="flex gap-2 border-t border-slate-200/70 p-3 dark:border-slate-700/70" onSubmit={(event) => { event.preventDefault(); const input = event.currentTarget.elements.namedItem("message"); if (input instanceof HTMLInputElement && input.value.trim()) { void send(input.value); input.value = ""; } }}>
            <input name="message" disabled={pending} placeholder={`Ask ${name}...`} className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" />
            <button type="submit" disabled={pending} aria-label="Send message" className="rounded-lg bg-brand-700 px-3 text-white hover:bg-brand-600 disabled:opacity-50"><Send className="size-4" /></button>
          </form>
        </section>
      )}
      <button type="button" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={finishDrag} className="assistant-widget-button group flex items-center gap-2 rounded-full bg-brand-800 px-4 py-3 text-sm font-semibold text-white shadow-pop" aria-label={`Open ${name} assistant`} title="Click to open. Drag to move.">
        <Grip className="size-4 opacity-60 transition-opacity group-hover:opacity-100" aria-hidden="true" />
        <Sparkles className="size-5" aria-hidden="true" />
        <span>{name}</span>
        {lastMessage?.role === "assistant" && !open && <span className="size-2 rounded-full bg-white" aria-label="New assistant response" />}
      </button>
      </div>
    </>
  );
}