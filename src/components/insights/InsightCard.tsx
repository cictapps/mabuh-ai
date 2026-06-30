import React from "react";
import { InsightCard as InsightCardType, InsightTone } from "../../types";

interface InsightCardProps {
  insight: InsightCardType;
  offset?: boolean;
}

const TONE_COLOR: Record<InsightTone, string> = {
  calm: "var(--text-on-surface-strong)",
  success: "var(--text-success-strong)",
  warm: "var(--text-warn-strong)",
  danger: "var(--text-danger-strong)",
};

const TONE_TINT: Record<InsightTone, string> = {
  calm: "var(--surface-violet-low)",
  success: "var(--stat-success-bg)",
  warm: "var(--stat-warm-bg)",
  danger: "var(--stat-warm-bg)",
};

export const InsightCard: React.FC<InsightCardProps> = ({ insight, offset = false }) => {
  const accent = TONE_COLOR[insight.tone];
  const tint = TONE_TINT[insight.tone];
  return (
    <div
      style={{
        borderRadius: 16,
        padding: "18px 20px",
        background: tint,
        border: "1px solid var(--border-violet-soft)",
        marginLeft: offset ? 16 : 0,
        marginRight: offset ? 0 : 16,
        marginBottom: 10,
      }}
    >
      <span
        aria-hidden
        className="block h-[2px] w-10 rounded-full"
        style={{ background: accent }}
      />
      <p
        className="mt-3 font-serif"
        style={{
          fontSize: 16,
          fontWeight: 500,
          color: accent,
          marginBottom: 6,
          lineHeight: 1.3,
        }}
      >
        {insight.title}
      </p>
      <p
        style={{
          fontSize: 13,
          color: "var(--text-on-surface)",
          lineHeight: 1.65,
        }}
      >
        {insight.body}
      </p>
    </div>
  );
};
