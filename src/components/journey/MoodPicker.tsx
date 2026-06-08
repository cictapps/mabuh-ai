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
              "flex flex-col items-center gap-1 rounded-2xl border px-2 py-2.5 text-[11px] font-semibold transition-all",
              selected
                ? "border-transparent text-foreground shadow-[0_18px_44px_-28px_rgba(8,10,18,0.9)]"
                : "border-[rgba(188,194,255,0.08)] bg-[rgba(188,194,255,0.04)] text-muted-foreground hover:bg-[rgba(188,194,255,0.07)] hover:text-foreground",
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
              color: "#f5f1ff",
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
