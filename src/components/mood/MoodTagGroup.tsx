import React from "react";
import { MoodTagChip } from "./MoodTagChip";

interface MoodTagGroupProps {
  tags: string[];
  selectedTags: string[];
  accentColor: string;
  onToggle: (tag: string) => void;
  size?: "normal" | "compact";
}

export const MoodTagGroup: React.FC<MoodTagGroupProps> = ({
  tags,
  selectedTags,
  accentColor,
  onToggle,
  size = "normal",
}) => {
  if (!tags.length) return null;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        minHeight: 76,
      }}
    >
      {tags.map((tag) => (
        <MoodTagChip
          key={tag}
          label={tag}
          selected={selectedTags.includes(tag)}
          accentColor={accentColor}
          onToggle={() => onToggle(tag)}
          size={size}
        />
      ))}
    </div>
  );
};
