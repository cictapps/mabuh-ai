import React, { useMemo } from "react";
import { SuggestionCard } from "../components/suggestions/SuggestionCard";
import { SectionLabel } from "../components/shared/SectionLabel";
import { getTrendSuggestions } from "../data/insightSuggestions";
import { deriveInsights } from "../lib/insights";
import type { MoodEntry } from "../types";

interface InsightsScreenProps {
  refreshToken?: number | null;
  visitToken?: number;
  history: MoodEntry[];
  loading?: boolean;
}

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
      className="screen-enter"
      style={{
        padding: "30px 22px 52px",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <div>
        <p
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "1.3px",
            textTransform: "uppercase",
            color: "rgba(188,194,255,0.3)",
            marginBottom: 10,
          }}
        >
          Little things we've noticed
        </p>
        <h2
          className="font-serif"
          style={{ fontSize: 26, fontWeight: 400, color: "#e8eaf0", marginBottom: 4 }}
        >
          Gentle reflections
        </h2>
        <p style={{ fontSize: 13, color: "rgba(188,194,255,0.36)" }}>
          Soft little things we noticed from your recent days
        </p>
      </div>

      <div>
        {insights.map((insight) => (
          <InsightRow key={insight.id} insight={insight} />
        ))}
      </div>

      {/* Suggestions based on recent mood trend. */}
      <div>
        <SectionLabel>Little ideas to hold onto</SectionLabel>
        {loading && history.length === 0 ? (
          <p style={{ fontSize: 12, color: "rgba(188,194,255,0.4)" }}>
            Gathering your trends…
          </p>
        ) : suggestions.length === 0 ? (
          <p style={{ fontSize: 12, color: "rgba(188,194,255,0.4)" }}>
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
  insight: { id: string; title: string; body: string; color: string };
}) {
  return (
    <div
      style={{
        borderRadius: 16,
        padding: "18px 20px",
        background: `${insight.color}0d`,
        marginBottom: 10,
      }}
    >
      <p
        className="font-serif"
        style={{
          fontSize: 16,
          fontWeight: 400,
          color: insight.color,
          marginBottom: 6,
          lineHeight: 1.3,
        }}
      >
        {insight.title}
      </p>
      <p
        style={{
          fontSize: 13,
          color: "rgba(188,194,255,0.45)",
          lineHeight: 1.65,
        }}
      >
        {insight.body}
      </p>
    </div>
  );
}
