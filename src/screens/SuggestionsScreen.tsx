import React from "react";
import { MoodType } from "../types";
import { SUGGESTIONS, getMoodMeta } from "../data";
import { SuggestionCard } from "../components/suggestions/SuggestionCard";

interface SuggestionsScreenProps {
  dominantMood: MoodType | null;
  refreshToken?: number | null;
}

export const SuggestionsScreen: React.FC<SuggestionsScreenProps> = ({
  dominantMood,
  refreshToken,
}) => {
  void refreshToken;
  const mood = dominantMood ?? "okay";
  const meta = getMoodMeta(mood);
  const suggestions = SUGGESTIONS[mood] ?? [];

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
            color: "var(--surface-violet-icon-hover)",
            marginBottom: 10,
          }}
        >
          Tailored for you
        </p>
        <h2
          className="font-serif"
          style={{
            fontSize: 26,
            fontWeight: 400,
            color: "var(--text-on-surface)",
            marginBottom: 4,
          }}
        >
          Gentle guidance
        </h2>
        <p style={{ fontSize: 13, color: "var(--surface-violet-icon-hover)" }}>
          Based on your recent emotional pattern
        </p>
      </div>

      {/* Dominant mood banner */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 16px",
          borderRadius: 14,
          background: `${meta.color}0f`,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: meta.color,
            flexShrink: 0,
          }}
        />
        <div>
          <p
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--text-on-surface)",
              marginBottom: 2,
            }}
          >
            Based on your recent mood:{" "}
            <span style={{ color: meta.color }}>{meta.label}</span>
          </p>
          <p style={{ fontSize: 12, color: "var(--surface-violet-icon-hover)" }}>
            {meta.definition}
          </p>
        </div>
      </div>

      {/* Suggestions */}
      <div>
        {suggestions.length === 0 ? (
          <p style={{ fontSize: 12, color: "var(--surface-violet-icon-hover)" }}>
            Log a few check-ins to see suggestions tailored to your mood.
          </p>
        ) : (
          suggestions.map((s) => <SuggestionCard key={s.id} suggestion={s} />)
        )}
      </div>
    </div>
  );
};
