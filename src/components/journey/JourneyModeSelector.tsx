import { Leaf, Lock, Plane } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JourneyMode } from "@/types";

type JourneyModeSelectorProps = {
  mode: JourneyMode;
  locked: boolean;
  onSelect: (mode: JourneyMode) => void;
};

const MODES = [
  {
    id: "flight" as const,
    label: "Flight",
    description: "Move through waypoints at your own pace.",
    icon: Plane,
  },
  {
    id: "garden" as const,
    label: "Garden",
    description: "Care for a plant through today's weather.",
    icon: Leaf,
  },
];

export function JourneyModeSelector({
  mode,
  locked,
  onSelect,
}: JourneyModeSelectorProps) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--text-kicker)]">
            Today&apos;s path
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-on-surface-strong)]">
            {locked
              ? `${mode === "flight" ? "Flight" : "Garden"} is set for today.`
              : "Choose before you begin. Your XP stays together."}
          </p>
        </div>
        {locked ? (
          <Lock
            className="size-3.5 shrink-0 text-[color:var(--text-kicker)]"
            aria-hidden
          />
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {MODES.map((option) => {
          const Icon = option.icon;
          const selected = mode === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              disabled={locked}
              aria-pressed={selected}
              className={cn(
                "rounded-2xl p-3 text-left transition-all duration-200 active:scale-[0.98]",
                selected
                  ? "bg-[var(--surface-violet-medium)]"
                  : "hover:bg-[var(--surface-violet-low)]",
                locked && !selected && "opacity-45",
              )}
            >
              <span
                className={cn(
                  "grid size-9 place-items-center rounded-xl",
                  option.id === "garden"
                    ? "text-[color:var(--icon-success)]"
                    : "text-primary",
                )}
              >
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="mt-2 block text-sm font-semibold text-foreground">
                {option.label}
              </span>
              <span className="mt-0.5 block text-[11px] leading-relaxed text-[color:var(--text-kicker)]">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
