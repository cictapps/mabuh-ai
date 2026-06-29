import { Sunrise, Plane, MapPin, Flag, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JourneyPhase } from "@/types";

const PHASES: { key: JourneyPhase; label: string; icon: typeof Sunrise }[] = [
  { key: "preflight", label: "Preflight", icon: Sunrise },
  { key: "airborne", label: "Airborne", icon: Plane },
  { key: "checkpoint", label: "Checkpoint", icon: MapPin },
  { key: "final", label: "Final", icon: Flag },
  { key: "rest", label: "Rest", icon: Moon },
];

type PhaseSwitcherProps = {
  active: JourneyPhase;
  onSelect: (phase: JourneyPhase) => void;
};

export function PhaseSwitcher({ active, onSelect }: PhaseSwitcherProps) {
  const activeIndex = PHASES.findIndex((p) => p.key === active);

  return (
    <div
      className="relative flex items-center justify-between gap-1 rounded-2xl border border-[var(--border-violet-soft)] bg-[var(--surface-violet-low)] px-2 py-2"
      role="tablist"
      aria-label="Journey phases"
    >
      {PHASES.map((phase, index) => {
        const Icon = phase.icon;
        const isActive = phase.key === active;
        const isReached = index <= activeIndex;
        const isLast = index === PHASES.length - 1;

        return (
          <div key={phase.key} className="flex flex-1 items-center">
            <button
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect(phase.key)}
              aria-label={phase.label}
              className={cn(
                "group flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 transition-colors active:scale-[0.97]",
              )}
            >
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-full border transition-all duration-300",
                  isActive
                    ? "border-tertiary/50 bg-tertiary/15 text-tertiary shadow-[0_8px_20px_-12px_rgba(255,185,84,0.6)]"
                    : isReached
                      ? "border-[var(--border-violet-high)] bg-[var(--surface-violet-medium)] text-[color:var(--text-on-surface-soft)]"
                      : "border-[var(--border-violet-soft)] bg-transparent text-[color:var(--text-on-surface-softest)]",
                )}
              >
                <Icon className="size-3.5" aria-hidden />
              </span>
              <span
                className={cn(
                  "text-[10px] font-semibold leading-none transition-colors",
                  isActive
                    ? "text-foreground"
                    : isReached
                      ? "text-[color:var(--text-on-surface-soft)]"
                      : "text-[color:var(--text-on-surface-softest)]",
                )}
              >
                {phase.label}
              </span>
            </button>
            {!isLast ? (
              <span
                aria-hidden
                className={cn(
                  "mx-0.5 h-px w-2 shrink-0 transition-colors",
                  isReached && index < activeIndex
                    ? "bg-[var(--surface-violet-icon-hover)]"
                    : "bg-[var(--surface-violet-medium)]",
                )}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export { PHASES };
