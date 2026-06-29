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
        "flex w-full items-center gap-3 rounded-2xl px-2 py-3 text-left text-sm transition-colors",
        done ? "text-foreground" : "text-foreground hover:bg-[var(--surface-violet-low)]",
        className,
      )}
    >
      <span
        className={cn(
          "grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold transition-colors",
          done ? "bg-tertiary text-tertiary-foreground" : "text-transparent",
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
