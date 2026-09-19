"use client";

import { SendHorizonal } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { AI } from "@/config/app";

export function ChatInput({ disabled, onSend }: { disabled: boolean; onSend: (text: string) => void }) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const remaining = AI.maxQuestionChars - value.length;

  function submit() {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
    ref.current?.focus();
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="flex items-end gap-2"
    >
      <div className="relative flex-1">
        <label htmlFor="assistant-input" className="sr-only">
          Ask a question
        </label>
        <textarea
          id="assistant-input"
          ref={ref}
          value={value}
          rows={1}
          maxLength={AI.maxQuestionChars}
          placeholder="Ask about events, rooms, deadlines, contacts…"
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          className="max-h-32 min-h-11 w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
        />
        {remaining < 80 && <span className="absolute bottom-1.5 right-3 text-[11px] text-slate-400" aria-live="polite">{remaining}</span>}
      </div>
      <Button type="submit" size="lg" disabled={disabled || value.trim() === ""} aria-label="Send question" className="size-11 !px-0">
        <SendHorizonal className="size-5" aria-hidden="true" />
      </Button>
    </form>
  );
}
