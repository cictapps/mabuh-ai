import React from "react";
import { ScreenId, NavItem } from "../../types";
import { Heart, BarChart3, Compass, MessageCircle, Settings } from "lucide-react";

interface BottomNavProps {
  items: NavItem[];
  active: ScreenId;
  onSelect: (id: ScreenId) => void;
}

const renderIcon = (iconName: string, isActive: boolean) => {
  const size = 23;
  const strokeWidth = isActive ? 2.2 : 1.9;
  switch (iconName) {
    case "checkin":
      return <Heart size={size} strokeWidth={strokeWidth} />;
    case "review":
      return <BarChart3 size={size} strokeWidth={strokeWidth} />;
    case "journey":
      return <Compass size={size} strokeWidth={strokeWidth} />;
    case "support":
      return <MessageCircle size={size} strokeWidth={strokeWidth} />;
    case "settings":
      return <Settings size={size} strokeWidth={strokeWidth} />;
    default:
      return null;
  }
};

export const BottomNav: React.FC<BottomNavProps> = ({ items, active, onSelect }) => {
  return (
    <footer className="bottom-nav-shell">
      <nav className="bottom-nav" aria-label="Primary">
        <div className="bottom-nav__surface" aria-hidden="true" />

        <div className="bottom-nav__items">
          {items.map((item) => {
            const isActive = item.id === active;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                className={`bottom-nav__item${isActive ? " bottom-nav__item--active" : ""}`}
              >
                <span className="bottom-nav__icon">
                  {renderIcon(item.icon, isActive)}
                </span>
                <span className="bottom-nav__label" aria-hidden={!isActive}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </footer>
  );
};
