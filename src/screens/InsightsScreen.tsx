import React, { useMemo } from "react";
import { SuggestionCard } from "../components/suggestions/SuggestionCard";
import { SectionLabel } from "../components/shared/SectionLabel";
import { getTrendSuggestions } from "../data/insightSuggestions";
import { deriveInsights } from "../lib/insights";
import { MoodEntry } from "../types";

interface InsightsScreenProps {
  refreshToken?: number | null;
  history: MoodEntry[];
  loading?: boolean;
}

export const InsightsScreen: React.FC<InsightsScreenProps> = ({
  refreshToken,
  history,
  loading,
}) => {
  const insights = useMemo(
    () => deriveInsights(history).slice(0, 3),
    [history, refreshToken],
  );

  const suggestions = useMemo(
    () => getTrendSuggestions(history).slice(0, 3),
    [history, refreshToken],
  );

  return (
    <div
      className="screen-enter"
      style={{ padding: "30px 22px 52px", display: "flex", flexDirection: "column", gap: 24 }}
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
          Discovered patterns
        </p>
        <h2
          className="font-serif"
          style={{ fontSize: 26, fontWeight: 400, color: "#e8eaf0", marginBottom: 4 }}
        >
          What your moods<br />reveal
        </h2>
        <p style={{ fontSize: 13, color: "rgba(188,194,255,0.36)" }}>
          Insights from your recent check-ins
        </p>
      </div>

      <div>
        {insights.map((insight) => (
          <InsightRow key={insight.id} insight={insight} />
        ))}
      </div>

      {/* Suggestions based on recent mood trend. */}
      <div>
        <SectionLabel>Suggestions for you</SectionLabel>
        {loading && history.length === 0 ? (
          <p style={{ fontSize: 12, color: "rgba(188,194,255,0.4)" }}>
            Loading your trends…
          </p>
        ) : suggestions.length === 0 ? (
          <p style={{ fontSize: 12, color: "rgba(188,194,255,0.4)" }}>
            Log a few more check-ins to see suggestions.
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

function InsightRow({ insight }: { insight: { id: string; title: string; body: string; color: string } }) {
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
