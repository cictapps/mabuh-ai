import React from "react";

interface JournalInputProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  placeholder?: string;
  rows?: number;
}

export const JournalInput: React.FC<JournalInputProps> = ({
  value,
  onChange,
  label = "Optional note",
  placeholder = "What's on your mind today…",
  rows = 3,
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <label
        style={{
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "1.1px",
          textTransform: "uppercase",
          color: "rgba(188,194,255,0.3)",
        }}
      >
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={{
          width: "100%",
          background: "rgba(188,194,255,0.04)",
          border: "none",
          outline: "none",
          borderRadius: 14,
          padding: "14px 16px",
          color: "#e8eaf0",
          fontFamily: "Plus Jakarta Sans, sans-serif",
          fontSize: 14,
          lineHeight: 1.65,
          resize: "none",
          caretColor: "#bcc2ff",
        }}
        onFocus={(e) => {
          e.currentTarget.style.background = "rgba(188,194,255,0.07)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.background = "rgba(188,194,255,0.04)";
        }}
      />
    </div>
  );
};
