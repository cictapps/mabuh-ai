import React, { useMemo } from "react";
import { SuggestionCard } from "../components/suggestions/SuggestionCard";
import { SectionLabel } from "../components/shared/SectionLabel";
import { getTrendSuggestions } from "../data/insightSuggestions";
import { deriveInsights } from "../lib/insights";
import type { InsightTone, MoodEntry } from "../types";

interface InsightsScreenProps {
  refreshToken?: number | null;
  visitToken?: number;
  history: MoodEntry[];
  loading?: boolean;
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

function createVisitRandom(seed: number) {
  let state = seed || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export const InsightsScreen: React.FC<InsightsScreenProps> = ({
  refreshToken,
  visitToken,
  history,
  loading,
}) => {
  const insights = useMemo(() => deriveInsights(history).slice(0, 3), [history]);

  const suggestions = useMemo(
    () =>
      getTrendSuggestions(
        history,
        createVisitRandom((visitToken ?? 0) + (refreshToken ?? 0)),
      ).slice(0, 3),
    [history, refreshToken, visitToken],
  );

  return (
    <div
      className="screen-enter relative flex w-full flex-col gap-4 pb-12 pt-5"
      style={{
        paddingTop: "var(--app-screen-top)",
        minHeight: "100%",
      }}
    >
      {/* Decorative blobs (amber top-right, lilac mid-left) — match every other screen. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,185,84,0.10),transparent_60%)] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 top-40 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(188,194,255,0.10),transparent_60%)] blur-3xl"
      />

      <div className="relative px-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--text-kicker)]">
          Little things we've noticed
        </p>
        <h2
          className="mt-1.5 font-serif tracking-[-0.03em] text-foreground"
          style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.15 }}
        >
          Gentle reflections
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--text-on-surface)]">
          Soft little things we noticed from your recent days
        </p>
      </div>

      <div className="relative flex flex-col gap-3">
        {insights.map((insight) => (
          <InsightRow key={insight.id} insight={insight} />
        ))}
      </div>

      {/* Suggestions based on recent mood trend. */}
      <div className="relative flex flex-col gap-3">
        <SectionLabel>Little ideas to hold onto</SectionLabel>
        {loading && history.length === 0 ? (
          <p className="text-[12px] text-[color:var(--text-on-surface)]">
            Gathering your trends…
          </p>
        ) : suggestions.length === 0 ? (
          <p className="text-[12px] text-[color:var(--text-on-surface)]">
            Share a few more check-ins and a soft idea will appear here.
          </p>
        ) : (
          suggestions.map((suggestion) => (
            <SuggestionCard key={suggestion.id} suggestion={suggestion} />
          ))
        )}
      </div>
    </div>
  );
};

function InsightRow({
  insight,
}: {
  insight: { id: string; title: string; body: string; tone: InsightTone };
}) {
  const tint = TONE_TINT[insight.tone];
  const accent = TONE_COLOR[insight.tone];
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-[var(--border-violet-soft)] p-4"
      style={{ background: tint }}
      data-stagger
    >
      <span
        aria-hidden
        className="block h-[2px] w-12 rounded-full"
        style={{ background: accent }}
      />
      <p
        className="mt-3 font-serif"
        style={{
          fontSize: 18,
          fontWeight: 500,
          color: accent,
          lineHeight: 1.3,
          letterSpacing: "-0.02em",
        }}
      >
        {insight.title}
      </p>
      <p
        className="mt-2 text-[13px] leading-relaxed text-[color:var(--text-on-surface)]"
        style={{ lineHeight: 1.7 }}
      >
        {insight.body}
      </p>
    </div>
  );
}
