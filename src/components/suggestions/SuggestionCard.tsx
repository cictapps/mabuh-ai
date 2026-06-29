import React from "react";
import { Suggestion } from "../../types";

interface SuggestionCardProps {
  suggestion: Suggestion;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({ suggestion }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        padding: "8px 2px",
        cursor: "pointer",
        transition: "background 0.2s ease",
        minHeight: 44,
      }}
    >
      <div>
        <p
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "var(--text-on-surface)",
            marginBottom: 3,
          }}
        >
          {suggestion.title}
        </p>
        <p
          style={{
            fontSize: 12,
            color: "var(--text-on-surface-strong)",
            lineHeight: 1.55,
          }}
        >
          {suggestion.description}
        </p>
      </div>
    </div>
  );
};
