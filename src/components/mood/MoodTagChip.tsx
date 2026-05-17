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
      style={{
        padding: isCompact ? "5px 12px" : "7px 15px",
        borderRadius: 999,
        fontSize: isCompact ? 12 : 13,
        fontWeight: 500,
        fontFamily: "Plus Jakarta Sans, sans-serif",
        border: "none",
        outline: "none",
        background: selected
          ? `${accentColor}22`
          : "rgba(188,194,255,0.06)",
        color: selected ? accentColor : "rgba(188,194,255,0.45)",
        boxShadow: selected ? `0 0 0 1px ${accentColor}55` : "none",
      }}
    >
      {label}
    </button>
  );
};
