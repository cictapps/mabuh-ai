import { MOODS } from "@/data";
import type { MoodType } from "@/types";
import { cn } from "@/lib/utils";

type MoodPickerProps = {
  value: MoodType | null;
  onChange: (mood: MoodType) => void;
  size?: "sm" | "md";
  className?: string;
};

export function MoodPicker({ value, onChange, size = "md", className }: MoodPickerProps) {
  return (
    <div
      className={cn(
        "grid gap-2",
        size === "sm" ? "grid-cols-5" : "grid-cols-5",
        className,
      )}
    >
      {MOODS.map((mood) => {
        const selected = value === mood.id;
        return (
          <button
            key={mood.id}
            type="button"
            onClick={() => onChange(mood.id)}
            aria-pressed={selected}
            aria-label={mood.label}
            className={cn(
              "flex flex-col items-center gap-1 rounded-2xl px-2 py-2.5 text-[11px] font-semibold transition-all",
              selected
                ? "text-foreground shadow-[0_18px_44px_-28px_rgba(74, 60, 90, 0.28)]"
                : "text-[color:var(--text-kicker)] hover:bg-[var(--surface-violet-low)] hover:text-foreground",
            )}
            style={
              selected
                ? {
                    backgroundColor: `${mood.color}26`,
                    boxShadow: `0 18px 44px -28px ${mood.color}80`,
                  }
                : undefined
            }
          >
            <span
              className="block size-2 rounded-full"
              style={{ backgroundColor: mood.color }}
              aria-hidden
            />
            <span className="truncate">{mood.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function MoodChip({ mood, tone }: { mood: MoodType; tone: "filled" | "soft" }) {
  const meta = MOODS.find((m) => m.id === mood);
  if (!meta) return null;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
      style={
        tone === "filled"
          ? {
              backgroundColor: `${meta.color}26`,
              borderColor: `${meta.color}55`,
              color: "var(--foreground)",
            }
          : {
              backgroundColor: "transparent",
              borderColor: `${meta.color}33`,
              color: meta.color,
            }
      }
    >
      <span
        className="block size-1.5 rounded-full"
        style={{ backgroundColor: meta.color }}
        aria-hidden
      />
      {meta.label}
    </span>
  );
}
