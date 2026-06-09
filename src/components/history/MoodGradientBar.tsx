import { useMemo } from "react";
import type { MoodEntry } from "../../types";
import { getMoodMeta } from "../../data";

interface MoodGradientBarProps {
  /**
   * Time-ordered check-ins spanning the period. Empty array renders an
   * empty track.
   */
  entries: MoodEntry[];
  /**
   * Logical period the bar represents. Used only for the height + label
   * ("7 days" / "30 days"). The bar itself is sized by its container.
   */
  period: "week" | "month";
  /**
   * Optional click handler — receives the entry that was clicked.
   */
  onEntryClick?: (entry: MoodEntry) => void;
}

const MIN_SEGMENT_PX = 6;

/**
 * A continuous horizontal strip of mood check-ins.
 *
 * Each check-in becomes a colored segment whose width is proportional to the
 * time between its `logged_at` and the next check-in (or the period edge for
 * the last one). With one check-in, the segment fills the whole bar. Empty
 * days inside the period leave transparent gaps so a sparse month still
 * shows a rhythm.
 */
export function MoodGradientBar({
  entries,
  period,
  onEntryClick,
}: MoodGradientBarProps) {
  const height = period === "week" ? 36 : 28;

  const segments = useMemo(() => buildSegments(entries), [entries]);

  if (segments.length === 0) {
    return (
      <div
        className="mood-gradient-bar mood-gradient-bar--empty"
        style={{
          height,
          borderRadius: 999,
          background:
            "linear-gradient(90deg, rgba(188,194,255,0.04), rgba(188,194,255,0.06), rgba(188,194,255,0.04))",
        }}
        aria-label={`No check-ins yet for this ${period}`}
      />
    );
  }

  return (
    <div
      className="mood-gradient-bar"
      style={{
        position: "relative",
        height,
        display: "flex",
        gap: 2,
        borderRadius: 999,
        overflow: "hidden",
        background: "rgba(188,194,255,0.04)",
      }}
      role="list"
      aria-label={`Mood check-ins for this ${period}`}
    >
      {segments.map((seg, i) => {
        const meta = getMoodMeta(seg.entry.mood);
        const isLast = i === segments.length - 1;
        const interactive = Boolean(onEntryClick);
        return (
          <div
            key={seg.entry.id}
            role="listitem"
            className="mood-gradient-bar__seg"
            style={{
              flex: `${seg.weight} 1 0`,
              minWidth: MIN_SEGMENT_PX,
              background: meta.color,
              borderTopRightRadius: isLast ? 999 : 0,
              borderBottomRightRadius: isLast ? 999 : 0,
              boxShadow: `inset 0 0 0 1px rgba(0,0,0,0.10), inset 0 0 0 1px ${hexToRgba(meta.color, 0.4)}`,
              cursor: interactive ? "pointer" : "default",
              transition: "transform 0.18s ease",
            }}
            title={`${meta.label} · ${formatTime(seg.entry.timestamp)}`}
            onClick={interactive ? () => onEntryClick?.(seg.entry) : undefined}
            onKeyDown={
              interactive
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onEntryClick?.(seg.entry);
                    }
                  }
                : undefined
            }
            tabIndex={interactive ? 0 : -1}
            aria-label={`${meta.label} at ${formatTime(seg.entry.timestamp)}`}
          />
        );
      })}
    </div>
  );
}

interface Segment {
  entry: MoodEntry;
  weight: number;
}

/**
 * Convert a flat list of check-ins into weighted segments.
 *
 * The bar's "time axis" is the period that the parent passes in. We weight
 * each entry by the gap until the next entry, with a minimum weight so a
 * single check-in still fills the bar.
 */
function buildSegments(entries: MoodEntry[]): Segment[] {
  if (entries.length === 0) return [];
  if (entries.length === 1) return [{ entry: entries[0], weight: 1 }];

  const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp);
  const start = sorted[0].timestamp;
  const end = sorted[sorted.length - 1].timestamp + 60 * 60 * 1000; // +1h padding on the right
  const totalSpan = Math.max(end - start, 1);

  // We use the difference between consecutive entries as each segment's
  // width, and pre-pad a small weight on the first entry so it never
  // disappears on a crowded bar.
  const weights: number[] = sorted.map((entry, i) => {
    if (i === sorted.length - 1) {
      // Last entry: width = span from previous up to end+padding.
      const prev = sorted[i - 1].timestamp;
      return Math.max(entry.timestamp - prev, 5 * 60 * 1000);
    }
    const next = sorted[i + 1].timestamp;
    return Math.max(next - entry.timestamp, 5 * 60 * 1000);
  });

  // Pre-pad the first entry.
  const firstGap = sorted[1].timestamp - sorted[0].timestamp;
  if (firstGap > 30 * 60 * 1000) {
    weights[0] = 15 * 60 * 1000;
  }

  // Normalize to a percentage of totalSpan for flex weights.
  const total = weights.reduce((s, w) => s + w, 0);
  return sorted.map((entry, i) => ({
    entry,
    weight: Math.max(weights[i] / total, MIN_SEGMENT_PX / totalSpan),
  }));
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function hexToRgba(hex: string, alpha: number): string {
  const m = hex.match(/^#?([0-9a-f]{6})$/i);
  if (!m) return hex;
  const intVal = parseInt(m[1], 16);
  const r = (intVal >> 16) & 0xff;
  const g = (intVal >> 8) & 0xff;
  const b = intVal & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
