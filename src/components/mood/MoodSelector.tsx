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
              color: "rgba(188,194,255,0.45)",
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
        <p
          className="font-serif"
          style={{
            fontSize: 22,
            fontWeight: 400,
            color: "rgba(220,224,255,0.7)",
            lineHeight: 1.3,
          }}
        >
          Touch the arc to select
        </p>
      )}
    </div>
  );
};
