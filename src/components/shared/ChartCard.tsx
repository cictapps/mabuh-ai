import React from "react";

interface ChartCardProps {
  label: string;
  children: React.ReactNode;
}

export const ChartCard: React.FC<ChartCardProps> = ({ label, children }) => (
  <div
    style={{
      background: "rgba(188,194,255,0.03)",
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
        color: "rgba(188,194,255,0.28)",
        marginBottom: 14,
      }}
    >
      {label}
    </p>
    {children}
  </div>
);
