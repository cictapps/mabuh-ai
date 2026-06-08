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
        background: "rgba(188,194,255,0.04)",
        borderRadius: 16,
        padding: "16px 18px",
        marginBottom: 10,
        cursor: "pointer",
        transition: "background 0.2s ease",
        minHeight: 44,
      }}
      onTouchStart={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "rgba(188,194,255,0.09)";
      }}
      onTouchEnd={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "rgba(188,194,255,0.04)";
      }}
    >
      <div>
        <p
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "#e8eaf0",
            marginBottom: 3,
          }}
        >
          {suggestion.title}
        </p>
        <p
          style={{
            fontSize: 12,
            color: "rgba(220,224,255,0.72)",
            lineHeight: 1.55,
          }}
        >
          {suggestion.description}
        </p>
      </div>
    </div>
  );
};
