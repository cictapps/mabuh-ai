import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatBadgeTone = "warm" | "calm" | "soft" | "success";

type StatBadgeProps = {
  icon: ReactNode;
  value: ReactNode;
  label: string;
  tone?: StatBadgeTone;
  layout?: "row" | "stacked";
  onPress?: () => void;
  className?: string;
};

const TONE_BG: Record<StatBadgeTone, string> = {
  warm: "bg-[var(--stat-warm-bg)]",
  calm: "bg-[var(--stat-calm-bg)]",
  soft: "bg-[var(--stat-soft-bg)]",
  success: "bg-[var(--stat-success-bg)]",
};

const TONE_BORDER: Record<StatBadgeTone, string> = {
  warm: "border-[var(--stat-warm-border)]",
  calm: "border-[var(--stat-calm-border)]",
  soft: "border-[var(--stat-soft-border)]",
  success: "border-[var(--stat-success-border)]",
};

const TONE_ICON_BG: Record<StatBadgeTone, string> = {
  warm: "bg-[var(--stat-warm-icon-bg)]",
  calm: "bg-[var(--stat-calm-icon-bg)]",
  soft: "bg-[var(--stat-soft-icon-bg)]",
  success: "bg-[var(--stat-success-icon-bg)]",
};

const TONE_ICON: Record<StatBadgeTone, string> = {
  warm: "text-[color:var(--stat-warm-icon)]",
  calm: "text-[color:var(--stat-calm-icon)]",
  soft: "text-foreground",
  success: "text-[color:var(--stat-success-icon)]",
};

const TONE_VALUE: Record<StatBadgeTone, string> = {
  warm: "text-[color:var(--stat-warm-value)]",
  calm: "text-[color:var(--stat-calm-value)]",
  soft: "text-foreground",
  success: "text-[color:var(--stat-success-value)]",
};

const TONE_ACCENT: Record<StatBadgeTone, string> = {
  warm: "var(--stat-warm-accent)",
  calm: "var(--stat-calm-accent)",
  soft: "var(--stat-soft-accent)",
  success: "var(--stat-success-accent)",
};

const TONE_GLOW: Record<StatBadgeTone, string> = {
  warm: "bg-[var(--stat-warm-glow)]",
  calm: "bg-[var(--stat-calm-glow)]",
  soft: "bg-[var(--stat-soft-glow)]",
  success: "bg-[var(--stat-success-glow)]",
};

export function StatBadge({
  icon,
  value,
  label,
  tone = "soft",
  layout = "stacked",
  onPress,
  className,
}: StatBadgeProps) {
  const content = (
    <>
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -right-10 -top-12 size-32 rounded-full blur-2xl",
          TONE_GLOW[tone],
        )}
      />
      <span
        aria-hidden
        className="block h-[2px] w-12 rounded-full"
        style={{
          background: `linear-gradient(to right, transparent, ${TONE_ACCENT[tone]})`,
        }}
      />
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-xl",
          TONE_ICON_BG[tone],
          TONE_ICON[tone],
        )}
        aria-hidden
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span
          className={cn(
            "block font-serif text-[30px] font-medium leading-none tracking-[-0.02em]",
            TONE_VALUE[tone],
          )}
        >
          {value}
        </span>
        <span className="mt-2 block text-[10px] font-semibold uppercase leading-tight tracking-[0.22em] text-[color:var(--text-kicker)]">
          {label}
        </span>
      </span>
    </>
  );

  const sharedClasses = cn(
    "relative isolate flex w-full min-w-0 flex-col gap-3 overflow-hidden rounded-2xl border p-3.5 text-left",
    "shadow-[0_18px_50px_-32px_rgba(74,60,90,0.45)] dark:shadow-[0_22px_60px_-36px_rgba(8,10,18,0.85)]",
    "transition-transform duration-200 ease-out",
    TONE_BG[tone],
    TONE_BORDER[tone],
    layout === "row" ? "flex-row items-center" : "min-h-[100px] justify-between",
    className,
  );

  if (onPress) {
    return (
      <button
        type="button"
        onClick={onPress}
        aria-label={`${label}: ${String(value)}. Open wins`}
        className={cn(
          sharedClasses,
          "active:scale-[0.985] hover:-translate-y-0.5 hover:border-[var(--stat-border-hover)]",
        )}
      >
        {content}
      </button>
    );
  }

  return <div className={sharedClasses}>{content}</div>;
}
