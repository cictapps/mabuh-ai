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

const ICON_TONE: Record<StatBadgeTone, string> = {
  warm: "text-tertiary",
  calm: "text-primary",
  soft: "text-foreground",
};

const VALUE_TONE: Record<StatBadgeTone, string> = {
  warm: "text-[color:var(--tertiary)]",
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
        <span className="mt-1 block text-[9px] font-semibold uppercase leading-tight tracking-[0.14em] text-[color:var(--text-kicker)]">
          {label}
        </span>
      </span>
    </>
  );

  const baseClasses = cn(
    "flex rounded-2xl transition-all duration-200 active:scale-[0.98]",
    layout === "stacked"
      ? "min-h-[88px] flex-col items-start justify-between gap-2.5 p-3"
      : "items-center gap-3 px-2 py-2.5",
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
          "w-full text-left hover:bg-[var(--surface-violet-low)]",
        )}
      >
        {content}
      </button>
    );
  }

  return <div className={baseClasses}>{content}</div>;
}
