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

const PAUSE_INDEX = PHASES.findIndex((p) => p.key === "pause");

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
        "flex items-center gap-1 rounded-full border px-2 py-1.5",
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
            className={cn(
              "group flex flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors",
              isActive
                ? isPausePhase
                  ? "bg-tertiary text-tertiary-foreground shadow-[0_10px_28px_-18px_rgba(255,185,84,0.7)]"
                  : "bg-gradient-to-r from-primary via-secondary to-primary text-primary-foreground shadow-[0_10px_28px_-18px_rgba(188,194,255,0.7)]"
                : isReached
                  ? "text-foreground/95"
                  : "text-muted-foreground",
            )}
          >
            <Icon
              className={cn(
                "size-3.5 transition-colors",
                isActive
                  ? "text-current"
                  : isReached
                    ? "text-foreground/90"
                    : "text-muted-foreground",
              )}
            />
            <span
              className={cn(
                "hidden sm:inline",
                isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100",
              )}
            >
              {phase.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export { PHASES, PAUSE_INDEX };
