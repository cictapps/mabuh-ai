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
        "relative flex items-stretch gap-1 rounded-2xl border p-1",
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
              "relative flex min-w-0 items-center justify-center rounded-xl py-2.5 transition-all duration-300 ease-out",
              "active:scale-[0.97]",
              isActive
                ? "flex-[2.6] gap-1.5 px-2.5"
                : "flex-1 gap-0 px-1",
              isActive
                ? isPausePhase
                  ? "bg-tertiary text-tertiary-foreground shadow-[0_14px_32px_-18px_rgba(255,185,84,0.85)]"
                  : "bg-gradient-to-r from-primary via-secondary to-primary text-primary-foreground shadow-[0_14px_32px_-18px_rgba(188,194,255,0.85)]"
                : isReached
                  ? "text-foreground"
                  : "text-[#d8d4eb]",
            )}
          >
            <Icon
              className={cn(
                "size-4 shrink-0 transition-colors",
                isActive
                  ? "text-current"
                  : isReached
                    ? "text-foreground"
                    : "text-[#d8d4eb]",
              )}
            />
            <span
              aria-hidden={!isActive}
              className={cn(
                "overflow-hidden whitespace-nowrap text-[11px] font-semibold transition-all duration-300 ease-out",
                isActive
                  ? "max-w-[160px] opacity-100"
                  : "max-w-0 opacity-0",
                isActive
                  ? isPausePhase
                    ? "text-tertiary-foreground"
                    : "text-primary-foreground"
                  : "",
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

export { PHASES };
