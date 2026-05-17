import React from "react";
import { InsightCard as InsightCardType } from "../../types";

interface InsightCardProps {
  insight: InsightCardType;
  offset?: boolean;
}

export const InsightCard: React.FC<InsightCardProps> = ({ insight, offset = false }) => {
  return (
    <div
      style={{
        borderRadius: 16,
        padding: "18px 20px",
        background: `${insight.color}0d`,
        marginLeft: offset ? 16 : 0,
        marginRight: offset ? 0 : 16,
        marginBottom: 10,
      }}
    >
      <p
        className="font-serif"
        style={{
          fontSize: 16,
          fontWeight: 400,
          color: insight.color,
          marginBottom: 6,
          lineHeight: 1.3,
        }}
      >
        {insight.title}
      </p>
      <p
        style={{
          fontSize: 13,
          color: "rgba(188,194,255,0.45)",
          lineHeight: 1.65,
        }}
      >
        {insight.body}
      </p>
    </div>
  );
};
