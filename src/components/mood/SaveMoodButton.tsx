import React, { useState } from "react";

interface SaveMoodButtonProps {
  disabled: boolean;
  onSave: () => Promise<boolean>;
  label?: string;
  savedLabel?: string;
}

export const SaveMoodButton: React.FC<SaveMoodButtonProps> = ({
  disabled,
  onSave,
  label = "Save mood",
  savedLabel = "✓  Mood saved",
}) => {
  const [saved, setSaved] = useState(false);

  const handleClick = async () => {
    const ok = await onSave();
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled && !saved}
      className={saved ? "save-pulse" : ""}
      style={{
        width: "100%",
        minHeight: 52,
        borderRadius: 16,
        border: "none",
        outline: "none",
        background: saved
          ? "rgba(109,186,132,0.85)"
          : disabled
          ? "rgba(188,194,255,0.1)"
          : "#bcc2ff",
        color: saved ? "#121416" : disabled ? "rgba(188,194,255,0.3)" : "#121416",
        fontSize: 15,
        fontWeight: 500,
        fontFamily: "Plus Jakarta Sans, sans-serif",
        cursor: disabled && !saved ? "not-allowed" : "pointer",
        letterSpacing: "0.2px",
        transition: "background 0.3s ease, color 0.3s ease",
      }}
    >
      {saved ? savedLabel : label}
    </button>
  );
};
