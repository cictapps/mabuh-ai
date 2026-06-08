import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PillProps = {
  label: string;
  value: ReactNode;
  tone?: "default" | "warm" | "calm" | "soft";
  className?: string;
};

const TONE_STYLES: Record<NonNullable<PillProps["tone"]>, string> = {
  default: "border-[rgba(188,194,255,0.10)] bg-[rgba(188,194,255,0.04)] text-foreground",
  warm: "border-[rgba(255,185,84,0.30)] bg-[rgba(255,185,84,0.10)] text-tertiary-foreground",
  calm: "border-[rgba(188,194,255,0.22)] bg-[rgba(188,194,255,0.10)] text-foreground",
  soft: "border-[rgba(188,194,255,0.08)] bg-[rgba(188,194,255,0.02)] text-muted-foreground",
};

export function Pill({ label, value, tone = "default", className }: PillProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-end gap-0.5 rounded-2xl border px-3 py-1.5 leading-none",
        TONE_STYLES[tone],
        className,
      )}
    >
      <span className="flex items-center gap-1 text-sm font-semibold tracking-tight">
        {value}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-90">
        {label}
      </span>
    </div>
  );
}
