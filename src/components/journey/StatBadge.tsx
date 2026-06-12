import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatBadgeTone = "warm" | "calm" | "soft";

type StatBadgeProps = {
  icon: ReactNode;
  value: ReactNode;
  label: string;
  tone?: StatBadgeTone;
  layout?: "row" | "stacked";
  onPress?: () => void;
  className?: string;
};

const TONE_STYLES: Record<StatBadgeTone, string> = {
  warm: "border-[rgba(255,185,84,0.30)] bg-[rgba(255,185,84,0.10)]",
  calm: "border-[rgba(188,194,255,0.22)] bg-[rgba(188,194,255,0.10)]",
  soft: "border-[rgba(188,194,255,0.12)] bg-[rgba(188,194,255,0.04)]",
};

const ICON_TONE: Record<StatBadgeTone, string> = {
  warm: "bg-[rgba(255,185,84,0.18)] text-tertiary",
  calm: "bg-[rgba(188,194,255,0.16)] text-primary",
  soft: "bg-[rgba(188,194,255,0.08)] text-foreground",
};

const VALUE_TONE: Record<StatBadgeTone, string> = {
  warm: "text-[#ffd99a]",
  calm: "text-foreground",
  soft: "text-foreground",
};

export function StatBadge({
  icon,
  value,
  label,
  tone = "soft",
  layout = "row",
  onPress,
  className,
}: StatBadgeProps) {
  const content = (
    <>
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-xl",
          ICON_TONE[tone],
        )}
        aria-hidden
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span
          className={cn(
            "block font-mono text-2xl font-bold leading-none tracking-tight",
            VALUE_TONE[tone],
          )}
        >
          {value}
        </span>
        <span className="mt-1 block text-[9px] font-semibold uppercase leading-tight tracking-[0.14em] text-[#d8d4eb]">
          {label}
        </span>
      </span>
    </>
  );

  const baseClasses = cn(
    "flex rounded-2xl border transition-all duration-200 active:scale-[0.98]",
    layout === "stacked"
      ? "min-h-[88px] flex-col items-start justify-between gap-2.5 p-3"
      : "items-center gap-3 px-3 py-2.5",
    TONE_STYLES[tone],
    className,
  );

  if (onPress) {
    return (
      <button
        type="button"
        onClick={onPress}
        aria-label={`${label}: ${String(value)}. Open wins`}
        className={cn(
          baseClasses,
          "w-full text-left hover:border-[rgba(188,194,255,0.28)] hover:bg-[rgba(188,194,255,0.08)]",
        )}
      >
        {content}
      </button>
    );
  }

  return <div className={baseClasses}>{content}</div>;
}
