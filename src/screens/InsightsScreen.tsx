import React, { useMemo } from "react";
import { INSIGHTS } from "../data";
import { InsightCard } from "../components/insights/InsightCard";
import { SuggestionCard } from "../components/suggestions/SuggestionCard";
import { SectionLabel } from "../components/shared/SectionLabel";
import { getTrendSuggestions } from "../data/insightSuggestions";
import { InsightCard as InsightCardType, MoodEntry } from "../types";

interface InsightsScreenProps {
  refreshToken?: number | null;
  history: MoodEntry[];
}

export const InsightsScreen: React.FC<InsightsScreenProps> = ({ refreshToken, history }) => {
  const insights = (INSIGHTS as InsightCardType[]).slice(0, 3);
  const suggestions = useMemo(
    () => getTrendSuggestions(history).slice(0, 3),
    [history, refreshToken]
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
          <InsightCard key={insight.id} insight={insight} offset={false} />
        ))}
      </div>

      {/* Suggestions based on recent mood trend. */}
      <div>
        <SectionLabel>Suggestions for you</SectionLabel>
        {suggestions.map((suggestion) => (
          <SuggestionCard key={suggestion.id} suggestion={suggestion} />
        ))}
      </div>
    </div>
  );
};
