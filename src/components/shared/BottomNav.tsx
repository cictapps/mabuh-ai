import React from "react";
import { ScreenId, NavItem } from "../../types";
import { Heart, BarChart3, MessageCircle, Settings as SettingsIcon } from "lucide-react";

interface BottomNavProps {
  items: NavItem[];
  active: ScreenId;
  onSelect: (id: ScreenId) => void;
}

const renderIcon = (iconName: string, isActive: boolean) => {
  const size = 20;
  const className = isActive ? "text-[#f5f1ff]" : "text-[rgba(188,194,255,0.34)]";

  switch (iconName) {
    case "checkin":
      return <Heart size={size} className={className} />;
    case "review":
      return <BarChart3 size={size} className={className} />;
    case "support":
      return <MessageCircle size={size} className={className} />;
    case "settings":
      return <SettingsIcon size={size} className={className} />;
    default:
      return null;
  }
};

export const BottomNav: React.FC<BottomNavProps> = ({ items, active, onSelect }) => {
  return (
      <nav
      style={{
        display: "flex",
        gap: 8,
        background: "rgba(16,18,24,0.96)",
        borderTop: "1px solid rgba(188,194,255,0.06)",
        padding: "10px 12px calc(env(safe-area-inset-bottom, 0px) + 10px)",
        flexShrink: 0,
        backdropFilter: "blur(18px)",
      }}
    >
      {items.map((item) => {
        const isActive = item.id === active;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            aria-pressed={isActive}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              padding: "10px 8px 11px",
              minHeight: 62,
              border: isActive ? "1px solid rgba(188,194,255,0.22)" : "1px solid rgba(188,194,255,0.06)",
              borderRadius: 18,
              outline: "none",
              background: isActive
                ? "linear-gradient(180deg, rgba(188,194,255,0.12), rgba(188,194,255,0.05))"
                : "rgba(255,255,255,0.015)",
              cursor: "pointer",
              transition: "transform 0.2s ease, background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
              boxShadow: isActive ? "0 16px 34px -24px rgba(188,194,255,0.55)" : "none",
              transform: isActive ? "translateY(-1px)" : "translateY(0)",
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "transform 0.2s ease",
                transform: isActive ? "scale(1.08)" : "scale(1)",
              }}
            >
              {renderIcon(item.icon, isActive)}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: isActive ? 700 : 600,
                letterSpacing: "0.2px",
                color: isActive ? "#f5f1ff" : "rgba(188,194,255,0.3)",
                transition: "color 0.2s ease",
                fontFamily: "Plus Jakarta Sans, sans-serif",
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
