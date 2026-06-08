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
        "flex items-start gap-2 rounded-2xl border border-[rgba(255,185,84,0.18)] bg-[rgba(255,185,84,0.06)] px-3 py-2.5 text-xs leading-relaxed text-[#d8d4eb]",
        className,
      )}
    >
      <Info className="mt-0.5 size-3.5 shrink-0 text-tertiary" />
      <span>{text}</span>
    </div>
  );
}
