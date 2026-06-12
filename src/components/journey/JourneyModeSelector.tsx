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
    <section className="rounded-[1.75rem] border border-[rgba(188,194,255,0.10)] bg-card p-4 shadow-[0_28px_80px_-40px_rgba(8,10,18,0.85)] backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d8d4eb]">
            Today&apos;s path
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[rgba(216,212,235,0.65)]">
            {locked
              ? `${mode === "flight" ? "Flight" : "Garden"} is set for today.`
              : "Choose before you begin. Your XP stays together."}
          </p>
        </div>
        {locked ? (
          <Lock className="size-3.5 shrink-0 text-[#d8d4eb]" aria-hidden />
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
                "rounded-2xl border p-3 text-left transition-all duration-200 active:scale-[0.98]",
                selected
                  ? option.id === "garden"
                    ? "border-[rgba(109,186,132,0.34)] bg-[rgba(109,186,132,0.10)]"
                    : "border-[rgba(188,194,255,0.28)] bg-[rgba(188,194,255,0.08)]"
                  : "border-[rgba(188,194,255,0.08)] bg-[rgba(188,194,255,0.02)]",
                locked && !selected && "opacity-45",
              )}
            >
              <span
                className={cn(
                  "grid size-9 place-items-center rounded-xl",
                  option.id === "garden"
                    ? "bg-[rgba(109,186,132,0.14)] text-[#a8dfb8]"
                    : "bg-[rgba(188,194,255,0.14)] text-primary",
                )}
              >
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="mt-2 block text-sm font-semibold text-foreground">
                {option.label}
              </span>
              <span className="mt-0.5 block text-[11px] leading-relaxed text-[#d8d4eb]">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
