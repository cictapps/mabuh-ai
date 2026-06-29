import React from "react";

interface JournalInputProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
}

const MAX_RECOMMENDED = 600;

export const JournalInput: React.FC<JournalInputProps> = ({
  value,
  onChange,
  label,
  placeholder = "Write freely… this is your safe space.",
  rows = 3,
  maxLength = 2000,
}) => {
  const trimmedLength = value.trim().length;
  const showCount = trimmedLength > 60;
  const isOverRecommended = trimmedLength > MAX_RECOMMENDED;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {label && (
        <label
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "1.1px",
            textTransform: "uppercase",
            color: "var(--text-on-surface-soft)",
          }}
        >
          {label}
        </label>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        placeholder={placeholder}
        rows={rows}
        style={{
          width: "100%",
          background: "var(--surface-violet-low)",
          border: "none",
          outline: "none",
          borderRadius: 16,
          padding: "16px 18px",
          color: "var(--text-on-surface)",
          fontFamily: "Plus Jakarta Sans, sans-serif",
          fontSize: 15,
          lineHeight: 1.65,
          resize: "none",
          caretColor: "var(--primary)",
          minHeight: 96,
          boxShadow: "inset 0 0 0 1px var(--border-violet-soft)",
          transition: "background 0.2s ease, box-shadow 0.2s ease",
        }}
        onFocus={(e) => {
          e.currentTarget.style.background = "var(--surface-violet-medium)";
          e.currentTarget.style.boxShadow = "inset 0 0 0 1px rgba(255,185,84,0.22)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.background = "var(--surface-violet-low)";
          e.currentTarget.style.boxShadow = "inset 0 0 0 1px var(--border-violet-soft)";
        }}
      />
      {showCount && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            fontSize: 11,
            fontVariantNumeric: "tabular-nums",
            color: isOverRecommended ? "var(--text-warn)" : "var(--text-on-surface-soft)",
            transition: "color 0.2s ease",
          }}
          aria-live="polite"
        >
          {trimmedLength}
          {isOverRecommended ? ` · long-form` : ""}
        </div>
      )}
    </div>
  );
};
