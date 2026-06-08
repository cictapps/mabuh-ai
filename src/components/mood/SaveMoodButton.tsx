import React, { useEffect, useRef, useState } from "react";

type Phase = "idle" | "saving" | "saved" | "error";

const SAFETY_TIMEOUT_MS = 15000;
const SAVED_RESET_MS = 2200;

interface SaveMoodButtonProps {
  disabled: boolean;
  onSave: () => Promise<boolean>;
  label?: string;
  savingLabel?: string;
  savedLabel?: string;
  errorLabel?: string;
}

export const SaveMoodButton: React.FC<SaveMoodButtonProps> = ({
  disabled,
  onSave,
  label = "Save mood",
  savingLabel = "Saving…",
  savedLabel = "Saved",
  errorLabel = "Try again",
}) => {
  const [phase, setPhase] = useState<Phase>("idle");
  const safetyTimer = useRef<number | null>(null);
  const savedTimer = useRef<number | null>(null);

  const clearSafety = () => {
    if (safetyTimer.current !== null) {
      window.clearTimeout(safetyTimer.current);
      safetyTimer.current = null;
    }
  };
  const clearSaved = () => {
    if (savedTimer.current !== null) {
      window.clearTimeout(savedTimer.current);
      savedTimer.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearSafety();
      clearSaved();
    };
  }, []);

  // If the parent flips `disabled` to true while we're in "saving",
  // they have abandoned the operation — snap back to idle so we
  // don't keep a phantom spinner running.
  useEffect(() => {
    if (disabled && phase === "saving") {
      clearSafety();
      setPhase("idle");
    }
  }, [disabled, phase]);

  const handleClick = async () => {
    if (phase === "saving") return;
    clearSaved();
    clearSafety();
    setPhase("saving");

    safetyTimer.current = window.setTimeout(() => {
      safetyTimer.current = null;
      setPhase("error");
    }, SAFETY_TIMEOUT_MS);

    try {
      const ok = await onSave();
      clearSafety();
      if (ok) {
        setPhase("saved");
        clearSaved();
        savedTimer.current = window.setTimeout(() => {
          savedTimer.current = null;
          setPhase("idle");
        }, SAVED_RESET_MS);
      } else {
        setPhase("idle");
      }
    } catch {
      clearSafety();
      setPhase("error");
    }
  };

  const isSaved = phase === "saved";
  const isSaving = phase === "saving";
  const isError = phase === "error";
  const isInactive = disabled && !isSaved && !isError;
  const isDisabled = isInactive || isSaving;

  const visibleLabel = isError
    ? errorLabel
    : isSaved
      ? savedLabel
      : isSaving
        ? savingLabel
        : label;

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      aria-busy={isSaving}
      aria-live="polite"
      style={{
        width: "100%",
        minHeight: 54,
        borderRadius: 18,
        border: "none",
        outline: "none",
        background: isSaved
          ? "linear-gradient(135deg, var(--success) 0%, color-mix(in srgb, var(--success) 75%, white) 100%)"
          : isError
            ? "linear-gradient(135deg, var(--destructive) 0%, color-mix(in srgb, var(--destructive) 75%, white) 100%)"
            : isSaving
              ? "color-mix(in srgb, var(--primary) 32%, transparent)"
              : isInactive
                ? "color-mix(in srgb, var(--primary) 10%, transparent)"
                : "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)",
        color: isSaved
          ? "var(--success-foreground)"
          : isError
            ? "var(--destructive-foreground)"
            : isSaving || isInactive
              ? "var(--muted-foreground)"
              : "var(--primary-foreground)",
        fontSize: 15,
        fontWeight: 600,
        fontFamily: "Plus Jakarta Sans, sans-serif",
        cursor: isDisabled ? "not-allowed" : "pointer",
        letterSpacing: "0.1px",
        transition: "background 0.35s ease, color 0.35s ease, transform 0.2s ease",
        boxShadow: isSaved
          ? "0 18px 40px -22px var(--success-soft)"
          : isError
            ? "0 18px 40px -22px color-mix(in srgb, var(--destructive) 35%, transparent)"
            : isInactive
              ? "none"
              : "0 18px 44px -22px color-mix(in srgb, var(--primary) 55%, transparent)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
      }}
    >
      {isSaving && (
        <span
          aria-hidden
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            border: "2px solid currentColor",
            borderTopColor: "transparent",
            animation: "save-spin 0.8s linear infinite",
          }}
        />
      )}
      {visibleLabel}
    </button>
  );
};

export default SaveMoodButton;
