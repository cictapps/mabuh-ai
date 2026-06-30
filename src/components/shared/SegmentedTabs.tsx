import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SegmentedTabsItem<TKey extends string> = {
  key: TKey;
  label: string;
  icon?: (state: { active: boolean }) => ReactNode;
  disabled?: boolean;
};

export type SegmentedTabsTone = "violet" | "sage";

type SegmentedTabsProps<TKey extends string> = {
  items: SegmentedTabsItem<TKey>[];
  activeKey: TKey;
  onChange: (key: TKey) => void;
  ariaLabel: string;
  tone?: SegmentedTabsTone;
  className?: string;
};

type ToneStyles = {
  container: string;
  inactiveText: string;
  activeGradient: string;
  activeText: string;
  activeShadow: string;
  activeFlex: string;
};

const TONE_STYLES: Record<SegmentedTabsTone, ToneStyles> = {
  violet: {
    container: "border border-[var(--border-violet-soft)] bg-[var(--surface-violet-low)]",
    inactiveText: "text-[color:var(--text-kicker)]",
    activeGradient: "bg-gradient-to-r from-primary via-secondary to-primary",
    activeText: "text-primary-foreground",
    activeShadow: "shadow-[0_14px_32px_-18px_var(--surface-violet-icon-hover)]",
    activeFlex: "flex-[2.6] gap-1.5 px-2.5",
  },
  sage: {
    container: "border border-[rgba(109,186,132,0.16)] bg-[rgba(109,186,132,0.04)]",
    inactiveText: "text-[color:var(--text-on-surface-muted)]",
    activeGradient: "bg-gradient-to-r from-[#8fcea3] via-[#a8dfb8] to-[#8fcea3]",
    activeText: "text-[#0f121a]",
    activeShadow: "shadow-[0_14px_32px_-18px_rgba(109,186,132,0.85)]",
    activeFlex: "flex-[2.8] gap-2 px-2.5",
  },
};

export function SegmentedTabs<TKey extends string>({
  items,
  activeKey,
  onChange,
  ariaLabel,
  tone = "violet",
  className,
}: SegmentedTabsProps<TKey>) {
  const styles = TONE_STYLES[tone];
  return (
    <div
      className={cn(
        "flex items-stretch gap-1 rounded-2xl p-1",
        styles.container,
        className,
      )}
      role="tablist"
      aria-label={ariaLabel}
    >
      {items.map((item) => {
        const isActive = item.key === activeKey;
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={item.label}
            disabled={item.disabled}
            onClick={() => {
              if (!item.disabled) onChange(item.key);
            }}
            className={cn(
              "relative flex min-w-0 items-center justify-center rounded-xl py-2.5 transition-all duration-300 ease-out active:scale-[0.97]",
              isActive ? styles.activeFlex : "flex-1 gap-0 px-1",
              isActive
                ? cn(styles.activeGradient, styles.activeText, styles.activeShadow)
                : styles.inactiveText,
              item.disabled && "cursor-not-allowed opacity-40",
            )}
          >
            {item.icon ? item.icon({ active: isActive }) : null}
            <span
              aria-hidden={!isActive}
              className={cn(
                "overflow-hidden whitespace-nowrap text-[11px] font-semibold transition-all duration-300 ease-out",
                isActive ? "max-w-[160px] opacity-100" : "max-w-0 opacity-0",
                isActive && styles.activeText,
              )}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
