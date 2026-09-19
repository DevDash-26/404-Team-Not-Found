import { Fragment, type ReactNode } from "react";

const BULLET = /^\s*(?:[•\-*]|\d+[.)])\s+(.*)$/;

/** **bold** spans only. Everything else is rendered as plain text, so answers can never inject markup. */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={index}>{part.slice(2, -2)}</strong> : <Fragment key={index}>{part}</Fragment>,
  );
}

/** Renders an assistant answer: paragraphs and bullet lists, as React text nodes (never as HTML). */
export function AnswerText({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];

  const flush = () => {
    if (bullets.length === 0) return;
    const items = bullets;
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="ml-4 list-disc space-y-1">
        {items.map((item, i) => (
          <li key={i}>{inline(item)}</li>
        ))}
      </ul>,
    );
    bullets = [];
  };

  for (const line of text.split("\n")) {
    const match = BULLET.exec(line);
    if (match?.[1] !== undefined) {
      bullets.push(match[1]);
    } else if (line.trim() !== "") {
      flush();
      blocks.push(<p key={`p-${blocks.length}`}>{inline(line)}</p>);
    }
  }
  flush();

  return <div className="space-y-2 text-sm leading-relaxed text-slate-800">{blocks}</div>;
}
