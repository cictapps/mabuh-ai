import React from "react";
import { ScreenId, NavItem } from "../../types";

interface BottomNavProps {
  items: NavItem[];
  active: ScreenId;
  onSelect: (id: ScreenId) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ items, active, onSelect }) => {
  return (
    <nav
      style={{
        display: "flex",
        background: "#161820",
        borderTop: "1px solid rgba(188,194,255,0.06)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        flexShrink: 0,
      }}
    >
      {items.map((item) => {
        const isActive = item.id === active;
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              padding: "10px 4px 12px",
              minHeight: 56,
              border: "none",
              outline: "none",
              background: "transparent",
              cursor: "pointer",
              transition: "opacity 0.2s ease",
            }}
          >
            {/* Icon glyph */}
            <span
              style={{
                fontSize: 16,
                lineHeight: 1,
                color: isActive ? "#bcc2ff" : "rgba(188,194,255,0.25)",
                transition: "color 0.2s ease, transform 0.2s ease",
                transform: isActive ? "scale(1.15)" : "scale(1)",
                display: "block",
              }}
            >
              {item.icon}
            </span>
            {/* Label */}
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.3px",
                color: isActive ? "#bcc2ff" : "rgba(188,194,255,0.25)",
                transition: "color 0.2s ease",
                fontFamily: "Plus Jakarta Sans, sans-serif",
              }}
            >
              {item.label}
            </span>
            {/* Active indicator dot */}
            <div
              style={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: "#bcc2ff",
                opacity: isActive ? 1 : 0,
                transition: "opacity 0.2s ease",
                marginTop: 1,
              }}
            />
          </button>
        );
      })}
    </nav>
  );
};
