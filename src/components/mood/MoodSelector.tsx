import React from "react";
import { MoodType } from "../../types";
import { getMoodMeta } from "../../data";

interface MoodSelectorProps {
  selectedMood: MoodType | null;
}

export const MoodSelector: React.FC<MoodSelectorProps> = ({ selectedMood }) => {
  const meta = selectedMood ? getMoodMeta(selectedMood) : null;

  return (
    <div
      style={{
        textAlign: "center",
        minHeight: 64,
        padding: "4px 0",
        transition: "all 0.3s ease",
      }}
    >
      {meta ? (
        <>
          <p
            className="font-serif"
            style={{
              fontSize: 30,
              fontWeight: 400,
              color: meta.color,
              lineHeight: 1.2,
              transition: "color 0.3s ease",
            }}
          >
            {meta.label}
          </p>
          <p
            style={{
              fontSize: 13,
              color: "var(--surface-violet-icon-hover)",
              marginTop: 4,
              lineHeight: 1.5,
              maxWidth: 260,
              margin: "6px auto 0",
            }}
          >
            {meta.definition}
          </p>
        </>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            padding: "4px 0",
          }}
        >
          <p
            className="font-serif"
            style={{
              fontSize: 22,
              fontWeight: 400,
              color: "var(--text-on-surface-strong)",
              lineHeight: 1.3,
            }}
          >
            Tap a color to begin
          </p>
          <p
            style={{
              fontSize: 12,
              color: "var(--surface-violet-icon-hover)",
              lineHeight: 1.5,
              maxWidth: 280,
            }}
          >
            No wrong answer. Just notice what's true right now.
          </p>
        </div>
      )}
    </div>
  );
};
