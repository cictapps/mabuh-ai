import React from "react";

interface ChartCardProps {
  label: string;
  children: React.ReactNode;
}

export const ChartCard: React.FC<ChartCardProps> = ({ label, children }) => (
  <div
    style={{
      background: "var(--surface-violet-low)",
      borderRadius: 16,
      padding: "18px 18px 14px",
      marginBottom: 22,
    }}
  >
    <p
      style={{
        fontSize: 11,
        letterSpacing: "0.9px",
        textTransform: "uppercase",
        color: "var(--surface-violet-icon-hover)",
        marginBottom: 14,
      }}
    >
      {label}
    </p>
    {children}
  </div>
);
