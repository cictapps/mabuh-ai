import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PillProps = {
  label: string;
  value: ReactNode;
  tone?: "default" | "warm" | "calm" | "soft";
  className?: string;
};

const TONE_STYLES: Record<NonNullable<PillProps["tone"]>, string> = {
  default: "text-foreground",
  warm: "text-[color:var(--tertiary)]",
  calm: "text-foreground",
  soft: "text-[color:var(--text-kicker)]",
};

export function Pill({ label, value, tone = "default", className }: PillProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-end gap-0.5 rounded-2xl px-2 py-1.5 leading-none",
        TONE_STYLES[tone],
        className,
      )}
    >
      <span className="flex items-center gap-1 text-sm font-semibold tracking-tight text-foreground">
        {value}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-kicker)]">
        {label}
      </span>
    </div>
  );
}
