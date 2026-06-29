import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ContextualHintProps = {
  text: string;
  className?: string;
};

export function ContextualHint({ text, className }: ContextualHintProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 px-1 py-2 text-xs leading-relaxed text-[color:var(--text-kicker)]",
        className,
      )}
    >
      <Info className="mt-0.5 size-3.5 shrink-0 text-tertiary" />
      <span>{text}</span>
    </div>
  );
}
