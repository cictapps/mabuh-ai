import React, { useState } from "react";

interface SaveMoodButtonProps {
  disabled: boolean;
  onSave: () => Promise<boolean>;
  label?: string;
  savingLabel?: string;
  savedLabel?: string;
}

export const SaveMoodButton: React.FC<SaveMoodButtonProps> = ({
  disabled,
  onSave,
  label = "Save mood",
  savingLabel = "Saving…",
  savedLabel = "Saved",
}) => {
  const [phase, setPhase] = useState<"idle" | "saving" | "saved">("idle");

  const handleClick = async () => {
    setPhase("saving");
    try {
      const ok = await onSave();
      if (ok) {
        setPhase("saved");
        setTimeout(() => setPhase("idle"), 2200);
      } else {
        setPhase("idle");
      }
    } catch {
      setPhase("idle");
    }
  };

  const isSaved = phase === "saved";
  const isSaving = phase === "saving";
  const inactive = disabled && !isSaved;

  return (
    <button
      onClick={handleClick}
      disabled={inactive}
      aria-busy={isSaving}
      style={{
        width: "100%",
        minHeight: 54,
        borderRadius: 18,
        border: "none",
        outline: "none",
        background: isSaved
          ? "linear-gradient(135deg, rgba(109,186,132,0.95), rgba(132,200,150,0.85))"
          : isSaving
            ? "rgba(188,194,255,0.35)"
            : inactive
              ? "rgba(188,194,255,0.08)"
              : "linear-gradient(135deg, #bcc2ff 0%, #d4bbff 100%)",
        color: isSaved || isSaving || inactive
          ? isSaved ? "#0f121a" : "rgba(15,18,26,0.65)"
          : "#171a27",
        fontSize: 15,
        fontWeight: 600,
        fontFamily: "Plus Jakarta Sans, sans-serif",
        cursor: inactive ? "not-allowed" : "pointer",
        letterSpacing: "0.1px",
        transition: "background 0.35s ease, color 0.35s ease, transform 0.2s ease",
        boxShadow: isSaved
          ? "0 18px 40px -22px rgba(109,186,132,0.55)"
          : inactive
            ? "none"
            : "0 18px 44px -22px rgba(188,194,255,0.6)",
      }}
    >
      {isSaved ? savedLabel : isSaving ? savingLabel : label}
    </button>
  );
};
