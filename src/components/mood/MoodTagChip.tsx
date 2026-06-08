import React from "react";

interface MoodTagChipProps {
  label: string;
  selected: boolean;
  accentColor: string;
  onToggle: () => void;
  size?: "normal" | "compact";
}

export const MoodTagChip: React.FC<MoodTagChipProps> = ({
  label,
  selected,
  accentColor,
  onToggle,
  size = "normal",
}) => {
  const isCompact = size === "compact";

  return (
    <button
      onClick={onToggle}
      className="tag-chip"
      aria-pressed={selected}
      style={{
        padding: isCompact ? "6px 13px" : "9px 17px",
        borderRadius: 999,
        fontSize: isCompact ? 12 : 13.5,
        fontWeight: 500,
        fontFamily: "Plus Jakarta Sans, sans-serif",
        border: "none",
        outline: "none",
        background: selected
          ? `${accentColor}26`
          : "rgba(188,194,255,0.05)",
        color: selected ? accentColor : "rgba(220,224,255,0.75)",
        boxShadow: selected
          ? `inset 0 0 0 1px ${accentColor}66, 0 6px 18px -10px ${accentColor}55`
          : "inset 0 0 0 1px rgba(188,194,255,0.04)",
        minHeight: isCompact ? 30 : 38,
        cursor: "pointer",
        transition:
          "background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease",
      }}
    >
      {label}
    </button>
  );
};
