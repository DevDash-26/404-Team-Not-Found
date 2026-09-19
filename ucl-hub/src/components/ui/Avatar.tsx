import { cn } from "@/utils/cn";
import { initials } from "@/utils/text";

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-800", className)}
    >
      {initials(name)}
    </span>
  );
}
