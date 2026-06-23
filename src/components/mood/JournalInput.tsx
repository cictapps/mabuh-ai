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
            color: "rgba(216,220,230,0.65)",
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
          background: "rgba(188,194,255,0.04)",
          border: "none",
          outline: "none",
          borderRadius: 16,
          padding: "16px 18px",
          color: "#eef1f6",
          fontFamily: "Plus Jakarta Sans, sans-serif",
          fontSize: 15,
          lineHeight: 1.65,
          resize: "none",
          caretColor: "#bcc2ff",
          minHeight: 96,
          boxShadow: "inset 0 0 0 1px rgba(188,194,255,0.05)",
          transition: "background 0.2s ease, box-shadow 0.2s ease",
        }}
        onFocus={(e) => {
          e.currentTarget.style.background = "rgba(188,194,255,0.07)";
          e.currentTarget.style.boxShadow = "inset 0 0 0 1px rgba(255,185,84,0.22)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.background = "rgba(188,194,255,0.04)";
          e.currentTarget.style.boxShadow = "inset 0 0 0 1px rgba(188,194,255,0.05)";
        }}
      />
      {showCount && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            fontSize: 11,
            fontVariantNumeric: "tabular-nums",
            color: isOverRecommended ? "rgba(255,185,84,0.95)" : "rgba(216,220,230,0.6)",
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
