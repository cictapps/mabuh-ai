import React from "react";

interface SectionLabelProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  filled?: boolean;
  hint?: string;
}

export const SectionLabel: React.FC<SectionLabelProps> = ({
  children,
  icon,
  filled,
  hint,
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      minHeight: 22,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
      {icon && (
        <span
          style={{
            display: "grid",
            placeItems: "center",
            width: 22,
            height: 22,
            borderRadius: 7,
            background: filled
              ? "var(--surface-violet-high)"
              : "var(--surface-violet-medium)",
            color: filled
              ? "var(--text-on-surface-strong)"
              : "var(--text-on-surface-strong)",
            transition: "background 0.2s ease, color 0.2s ease",
            flexShrink: 0,
          }}
          aria-hidden
        >
          {icon}
        </span>
      )}
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "1.1px",
          textTransform: "uppercase",
          color: filled
            ? "var(--text-on-surface-strong)"
            : "var(--text-on-surface-strong)",
          transition: "color 0.2s ease",
          margin: 0,
          lineHeight: 1.2,
        }}
      >
        {children}
      </p>
    </div>
    {hint && (
      <span
        style={{
          fontSize: 11,
          color: "var(--text-on-surface-strong)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {hint}
      </span>
    )}
  </div>
);
