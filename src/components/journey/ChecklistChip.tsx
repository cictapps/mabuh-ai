import { cn } from "@/lib/utils";

type ChecklistChipProps = {
  emoji: string;
  label: string;
  done: boolean;
  onPress: () => void;
  className?: string;
};

export function ChecklistChip({
  emoji,
  label,
  done,
  onPress,
  className,
}: ChecklistChipProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      aria-pressed={done}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left text-sm transition-colors",
        done
          ? "border-[rgba(255,185,84,0.32)] bg-[rgba(255,185,84,0.08)] text-foreground"
          : "border-[rgba(188,194,255,0.10)] bg-[rgba(188,194,255,0.03)] text-foreground hover:bg-[rgba(188,194,255,0.06)]",
        className,
      )}
    >
      <span
        className={cn(
          "grid size-6 shrink-0 place-items-center rounded-full border text-[11px] font-bold transition-colors",
          done
            ? "border-tertiary/60 bg-tertiary text-tertiary-foreground"
            : "border-[rgba(188,194,255,0.18)] bg-transparent text-transparent",
        )}
        aria-hidden
      >
        ✓
      </span>
      <span className="flex-1 font-medium">{label}</span>
      <span aria-hidden className="text-lg">
        {emoji}
      </span>
    </button>
  );
}
