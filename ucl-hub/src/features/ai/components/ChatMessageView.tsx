import { ArrowRight, BookMarked, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/utils/cn";
import type { ChatMessage } from "../hooks/useAssistantChat";
import { AnswerText } from "./AnswerText";

function AssistantMark() {
  return (
    <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-400 text-sm font-bold text-brand-950">
      AI
    </span>
  );
}

export function ChatMessageView({ message, userName }: { message: ChatMessage; userName: string }) {
  if (message.role === "user") {
    return (
      <div className="flex items-start justify-end gap-3">
        <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-brand-800 px-4 py-2.5 text-sm text-white">{message.content}</p>
        <Avatar name={userName} />
      </div>
    );
  }

  const response = message.response;
  return (
    <div className="flex items-start gap-3">
      <AssistantMark />
      <div className="min-w-0 max-w-[90%]">
        <div
          className={cn(
            "rounded-2xl rounded-tl-sm border px-4 py-3",
            message.error ? "border-red-200 bg-red-50" : "border-slate-200 bg-white shadow-card",
          )}
        >
          {message.error ? (
            <p role="alert" className="flex items-start gap-2 text-sm text-red-800">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {message.content}
            </p>
          ) : (
            <AnswerText text={message.content} />
          )}
        </div>

        {response && response.actions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {response.actions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800 hover:bg-brand-100"
              >
                {action.label}
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            ))}
          </div>
        )}

        {response && response.sources.length > 0 && (
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
            <BookMarked className="size-3.5" aria-hidden="true" />
            <span>Based on:</span>
            {response.sources.map((source) => (
              <Link key={`${source.kind}-${source.title}`} href={source.href} className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700 hover:bg-slate-200">
                {source.title}
              </Link>
            ))}
          </p>
        )}
        {response?.degraded && <p className="mt-1 text-xs text-amber-700">The AI service is unavailable right now, so this answer came straight from campus data.</p>}
      </div>
    </div>
  );
}
