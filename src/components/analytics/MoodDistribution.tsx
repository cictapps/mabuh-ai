import React, { useEffect, useRef, useState } from "react";
import { MoodType, MOOD_ORDER } from "../../types";
import { getMoodMeta } from "../../data";

interface DistItem {
  mood: MoodType;
  count: number;
  pct: number;
}

interface MoodDistributionProps {
  data: DistItem[];
}

export const MoodDistribution: React.FC<MoodDistributionProps> = ({ data }) => {
  const [animated, setAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 120);
    return () => clearTimeout(timer);
  }, []);

  const sorted = MOOD_ORDER.map((id) => data.find((d) => d.mood === id)!).filter(Boolean);

  return (
    <div ref={ref} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {sorted.map(({ mood, pct }) => {
        const meta = getMoodMeta(mood);
        return (
          <div key={mood} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                fontSize: 12,
                color: "var(--text-on-surface-muted)",
                width: 60,
                flexShrink: 0,
              }}
            >
              {meta.label}
            </span>
            <div
              style={{
                flex: 1,
                background: "var(--surface-violet-medium)",
                borderRadius: 4,
                height: 6,
                overflow: "hidden",
              }}
            >
              <div
                className="bar-fill"
                style={{
                  height: "100%",
                  borderRadius: 4,
                  background: meta.color,
                  width: animated ? `${pct}%` : "0%",
                }}
              />
            </div>
            <span
              style={{
                fontSize: 11,
                fontVariantNumeric: "tabular-nums",
                color: "var(--text-on-surface-muted)",
                width: 32,
                textAlign: "right",
              }}
            >
              {pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
};
