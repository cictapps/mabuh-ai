import { Sunrise, Plane, MapPin, Heart, Flag, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JourneyPhase } from "@/types";

const PHASES: { key: JourneyPhase; label: string; icon: typeof Sunrise }[] = [
  { key: "preflight", label: "Preflight", icon: Sunrise },
  { key: "airborne", label: "Airborne", icon: Plane },
  { key: "checkpoint", label: "Checkpoint", icon: MapPin },
  { key: "pause", label: "Pause", icon: Heart },
  { key: "final", label: "Final", icon: Flag },
  { key: "rest", label: "Rest", icon: Moon },
];

type PhaseSwitcherProps = {
  active: JourneyPhase;
  onSelect: (phase: JourneyPhase) => void;
};

export function PhaseSwitcher({ active, onSelect }: PhaseSwitcherProps) {
  const activeIndex = PHASES.findIndex((p) => p.key === active);
  const isPause = active === "pause";

  return (
    <div
      className={cn(
        "flex items-stretch gap-1 rounded-2xl border p-1",
        isPause
          ? "border-[rgba(255,185,84,0.28)] bg-[rgba(255,185,84,0.06)]"
          : "border-[rgba(188,194,255,0.10)] bg-[rgba(188,194,255,0.03)]",
      )}
      role="tablist"
      aria-label="Journey phases"
    >
      {PHASES.map((phase, index) => {
        const Icon = phase.icon;
        const isActive = phase.key === active;
        const isReached = index <= activeIndex;
        const isPausePhase = phase.key === "pause";

        return (
          <button
            key={phase.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(phase.key)}
            aria-label={phase.label}
            className={cn(
              "group relative flex min-w-0 flex-1 items-center justify-center gap-1.5 overflow-hidden rounded-xl px-1.5 py-2 transition-colors",
              "active:scale-[0.97]",
              isActive
                ? isPausePhase
                  ? "bg-tertiary text-tertiary-foreground shadow-[0_10px_28px_-18px_rgba(255,185,84,0.7)]"
                  : "bg-gradient-to-r from-primary via-secondary to-primary text-primary-foreground shadow-[0_10px_28px_-18px_rgba(188,194,255,0.7)]"
                : isReached
                  ? "text-foreground"
                  : "text-muted-foreground",
            )}
          >
            <Icon
              className={cn(
                "size-4 shrink-0 transition-colors",
                isActive
                  ? "text-current"
                  : isReached
                    ? "text-foreground"
                    : "text-muted-foreground",
              )}
            />
            {isActive ? (
              <span
                className={cn(
                  "truncate text-[10px] font-semibold uppercase tracking-[0.14em]",
                  isPausePhase ? "text-tertiary-foreground" : "text-primary-foreground",
                )}
              >
                {phase.label}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export { PHASES };
