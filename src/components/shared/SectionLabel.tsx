import React from "react";

interface SectionLabelProps {
  children: React.ReactNode;
}

export const SectionLabel: React.FC<SectionLabelProps> = ({ children }) => (
  <p
    style={{
      fontSize: 11,
      fontWeight: 500,
      letterSpacing: "1.1px",
      textTransform: "uppercase",
      color: "rgba(188,194,255,0.3)",
      marginBottom: 12,
    }}
  >
    {children}
  </p>
);
