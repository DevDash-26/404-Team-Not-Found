"use client";

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { AI } from "@/config/app";

const IDEAS = ["What events are happening this week?", "How do I book a classroom?", "Are there any internships available?"];

/** Entry point to the assistant from the dashboard: a question typed here opens the chat and is answered there. */
export function AskAiBox() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function ask(question: string) {
    const text = question.trim();
    if (text) router.push(`/assistant?q=${encodeURIComponent(text.slice(0, AI.maxQuestionChars))}`);
  }

  return (
    <section aria-labelledby="ask-ai-heading" className="rounded-2xl bg-gradient-to-br from-brand-900 to-brand-700 p-5 text-white shadow-card sm:p-6">
      <h2 id="ask-ai-heading" className="flex items-center gap-2 text-lg font-semibold">
        <Sparkles className="size-5 text-accent-300" aria-hidden="true" />
        Ask the campus assistant
      </h2>
      <p className="mt-1 text-sm text-brand-100">Get quick answers from official UCL information, with links to the right place.</p>
      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          ask(value);
        }}
      >
        <label htmlFor="dashboard-ask" className="sr-only">
          Your question
        </label>
        <input
          id="dashboard-ask"
          value={value}
          maxLength={AI.maxQuestionChars}
          onChange={(event) => setValue(event.target.value)}
          placeholder="e.g. What time does the library close?"
          className="h-11 flex-1 rounded-lg border-0 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-300"
        />
        <Button type="submit" variant="accent" size="lg" disabled={value.trim() === ""}>
          Ask
        </Button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {IDEAS.map((idea) => (
          <button key={idea} type="button" onClick={() => ask(idea)} className="rounded-full bg-white/10 px-3 py-1 text-xs text-brand-50 hover:bg-white/20">
            {idea}
          </button>
        ))}
      </div>
    </section>
  );
}
