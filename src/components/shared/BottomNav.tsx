import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ScreenId, NavItem } from "../../types";
import {
  Heart,
  BarChart3,
  Compass,
  MessageCircle,
  Settings as SettingsIcon,
} from "lucide-react";

interface BottomNavProps {
  items: NavItem[];
  active: ScreenId;
  onSelect: (id: ScreenId) => void;
}

const renderIcon = (iconName: string) => {
  const size = 22;
  const strokeWidth = 2;
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
      return <SettingsIcon size={size} strokeWidth={strokeWidth} />;
    default:
      return null;
  }
};

export const BottomNav: React.FC<BottomNavProps> = ({ items, active, onSelect }) => {
  const shouldReduceMotion = useReducedMotion();
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.id === active),
  );
  const viewBoxWidth = 430;
  const height = 86;
  const cornerRadius = 32;
  const dipDepth = 56;
  const dipControl = 58;
  const dipWidth = 86;
  const itemCount = Math.max(1, items.length);
  const dipCenter = (viewBoxWidth / itemCount) * (activeIndex + 0.5);
  const dipStart = Math.max(cornerRadius, dipCenter - dipWidth);
  const dipEnd = Math.min(viewBoxWidth - cornerRadius, dipCenter + dipWidth);
  const path = [
    `M ${cornerRadius} 0`,
    `H ${dipStart}`,
    `C ${dipStart + 22} 0 ${dipCenter - dipControl} ${dipDepth} ${dipCenter} ${dipDepth}`,
    `C ${dipCenter + dipControl} ${dipDepth} ${dipEnd - 22} 0 ${dipEnd} 0`,
    `H ${viewBoxWidth - cornerRadius}`,
    `Q ${viewBoxWidth} 0 ${viewBoxWidth} ${cornerRadius}`,
    `V ${height}`,
    `H 0`,
    `V ${cornerRadius}`,
    `Q 0 0 ${cornerRadius} 0`,
    "Z",
  ].join(" ");

  return (
    <footer className="bottom-nav-shell">
      <nav
        className="bottom-nav"
        aria-label="Primary"
        style={
          {
            "--active-index": activeIndex,
            "--item-count": items.length,
          } as React.CSSProperties
        }
      >
        <svg
          className="bottom-nav__surface"
          viewBox={`0 0 ${viewBoxWidth} ${height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <motion.path
            animate={{ d: path }}
            initial={false}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : {
                    type: "spring",
                    stiffness: 280,
                    damping: 30,
                    mass: 0.8,
                  }
            }
          />
        </svg>
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
                <span className="bottom-nav__dot" aria-hidden="true" />
                <span className="bottom-nav__icon">
                  {renderIcon(item.icon)}
                </span>
                <span
                  className="bottom-nav__label"
                  aria-hidden={isActive ? "true" : undefined}
                >
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
