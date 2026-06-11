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
 * Rather than painting each check-in as a separate coloured block, the bar
 * is rendered as a single linear gradient whose colour stops are anchored
 * to the horizontal position of every entry. The result is one smooth,
 * unified gradient that still tells the mood story of the period.
 *
 * Invisible hit-target segments are laid on top of the gradient so each
 * entry remains individually clickable and screen-reader friendly.
 */
export function MoodGradientBar({
  entries,
  period,
  onEntryClick,
}: MoodGradientBarProps) {
  const height = period === "week" ? 36 : 28;

  const segments = useMemo(() => buildSegments(entries), [entries]);
  const gradientStops = useMemo(
    () => buildGradientStops(segments),
    [segments],
  );

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
        borderRadius: 999,
        overflow: "hidden",
        background:
          gradientStops.length > 1
            ? `linear-gradient(90deg, ${gradientStops.join(", ")})`
            : getMoodMeta(segments[0].entry.mood).color,
        boxShadow:
          "inset 0 0 0 1px rgba(0,0,0,0.10), 0 8px 22px -16px rgba(0,0,0,0.6)",
      }}
      role="list"
      aria-label={`Mood check-ins for this ${period}`}
    >
      {/* Invisible hit targets keep each entry individually clickable
          and announce each mood to assistive tech, while the visible
          fill is a single continuous gradient underneath. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          gap: 2,
        }}
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
                background: "transparent",
                borderTopRightRadius: isLast ? 999 : 0,
                borderBottomRightRadius: isLast ? 999 : 0,
                cursor: interactive ? "pointer" : "default",
                transition: "background-color 0.18s ease",
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
              onMouseEnter={(e) => {
                if (!interactive) return;
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              tabIndex={interactive ? 0 : -1}
              aria-label={`${meta.label} at ${formatTime(seg.entry.timestamp)}`}
            />
          );
        })}
      </div>
    </div>
  );
}

interface Segment {
  entry: MoodEntry;
  /** Flex weight relative to the other segments. */
  weight: number;
  /** Midpoint of this segment as a 0-100 percentage of the bar. */
  center: number;
}

/**
 * Convert a flat list of check-ins into weighted segments and record the
 * midpoint of each segment so the parent can build a single linear
 * gradient that flows through every check-in's mood colour.
 */
function buildSegments(entries: MoodEntry[]): Segment[] {
  if (entries.length === 0) return [];
  if (entries.length === 1) {
    return [{ entry: entries[0], weight: 1, center: 50 }];
  }

  const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp);
  const start = sorted[0].timestamp;
  const end = sorted[sorted.length - 1].timestamp + 60 * 60 * 1000; // +1h padding on the right
  const totalSpan = Math.max(end - start, 1);

  // Each segment's width is the time gap until the next entry, with a
  // 5-minute minimum so a single check-in still fills the bar.
  const weights: number[] = sorted.map((entry, i) => {
    if (i === sorted.length - 1) {
      const prev = sorted[i - 1].timestamp;
      return Math.max(entry.timestamp - prev, 5 * 60 * 1000);
    }
    const next = sorted[i + 1].timestamp;
    return Math.max(next - entry.timestamp, 5 * 60 * 1000);
  });

  // Pre-pad the first entry so it never disappears on a crowded bar.
  const firstGap = sorted[1].timestamp - sorted[0].timestamp;
  if (firstGap > 30 * 60 * 1000) {
    weights[0] = 15 * 60 * 1000;
  }

  const total = weights.reduce((s, w) => s + w, 0);
  let cumulative = 0;
  return sorted.map((entry, i) => {
    const weightFrac = Math.max(weights[i] / total, MIN_SEGMENT_PX / totalSpan);
    const startPct = (cumulative / total) * 100;
    cumulative += weights[i];
    return {
      entry,
      weight: weightFrac,
      center: startPct + (weightFrac * 100) / 2,
    };
  });
}

/**
 * Translate weighted segments into a list of CSS gradient colour stops.
 * Each stop is anchored to the centre of its segment, and we always
 * start at 0% / end at 100% so the gradient fills the bar edge-to-edge.
 */
function buildGradientStops(segments: Segment[]): string[] {
  if (segments.length === 0) return [];
  if (segments.length === 1) {
    const color = getMoodMeta(segments[0].entry.mood).color;
    return [`${color} 0%`, `${color} 100%`];
  }

  const first = getMoodMeta(segments[0].entry.mood).color;
  const last = getMoodMeta(segments[segments.length - 1].entry.mood).color;
  const stops: string[] = [`${first} 0%`];
  for (let i = 1; i < segments.length - 1; i += 1) {
    const color = getMoodMeta(segments[i].entry.mood).color;
    stops.push(`${color} ${segments[i].center.toFixed(2)}%`);
  }
  stops.push(`${last} 100%`);
  return stops;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}
