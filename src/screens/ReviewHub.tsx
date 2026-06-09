import React, { useState } from "react";
import { ReviewTabId, MoodEntry, MoodType } from "../types";
import { HistoryScreen } from "./HistoryScreen";
import { AnalyticsScreen } from "./AnalyticsScreen";
import { InsightsScreen } from "./InsightsScreen";
import { JournalScreen } from "./JournalScreen";
import { History, TrendingUp, Lightbulb, PenTool } from "lucide-react";

interface DistItem {
  mood: MoodType;
  count: number;
  pct: number;
}

interface TrendPoint {
  date: string;
  score: number;
  mood: MoodType;
}

interface ReviewHubProps {
  history: MoodEntry[];
  trendData: TrendPoint[];
  distribution: DistItem[];
  dominantMood: MoodType | null;
  socialStats: {
    totalInteractions: number;
    topPerson: string | null;
    topFeeling: string | null;
  };
  analyticsStats: {
    longestStreak: number;
    currentStreak: number;
    lifetimeDays: number;
    stabilityScore: number;
    bestEntry: MoodEntry | null;
    worstEntry: MoodEntry | null;
    activityCount: number;
    activityHighlights: Array<{ section: string; label: string | null; count: number }>;
  };
  refreshToken?: number | null;
  journalEntries: Array<{
    id: string;
    date: string;
    timestamp: number;
    content: string;
    source: "checkin" | "manual";
    mood?: MoodType;
    tags?: string[];
  }>;
  onAddJournalEntry: (content: string) => void;
  loading?: boolean;
  error?: string | null;
}

const tabs: Array<{ id: ReviewTabId; label: string; icon: string }> = [
  { id: "history", label: "Days", icon: "history" },
  { id: "analytics", label: "Patterns", icon: "analytics" },
  { id: "insights", label: "Reflections", icon: "insights" },
  { id: "journal", label: "Writing", icon: "journal" },
];

const renderTabIcon = (iconName: string, isActive: boolean) => {
  const size = 16;
  const className = isActive ? "text-[#f5f1ff]" : "text-[rgba(188,194,255,0.34)]";

  switch (iconName) {
    case "history":
      return <History size={size} className={className} />;
    case "analytics":
      return <TrendingUp size={size} className={className} />;
    case "insights":
      return <Lightbulb size={size} className={className} />;
    case "journal":
      return <PenTool size={size} className={className} />;
    default:
      return null;
  }
};

export const ReviewHub: React.FC<ReviewHubProps> = ({
  history,
  trendData,
  distribution,
  dominantMood,
  socialStats,
  analyticsStats,
  refreshToken,
  journalEntries,
  onAddJournalEntry,
  loading,
  error,
}) => {
  const [activeTab, setActiveTab] = useState<ReviewTabId>("history");

  return (
    <div
      className="screen-enter"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        padding: "calc(env(safe-area-inset-top, 0px) + 24px) 0 12px",
      }}
    >
      <div style={{ padding: "0 22px 14px" }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "1.3px",
            textTransform: "uppercase",
            color: "rgba(188,194,255,0.3)",
            marginBottom: 10,
          }}
        >
          A quiet look back
        </p>
        <h2
          className="font-serif"
          style={{ fontSize: 26, fontWeight: 400, color: "#e8eaf0", marginBottom: 4 }}
        >
          Your story so far
        </h2>
        <p style={{ fontSize: 13, color: "rgba(188,194,255,0.36)" }}>
          Your history, gentle patterns, and words — all in one safe place
        </p>
      </div>

      <div style={{ padding: "0 22px 18px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 8,
            padding: 6,
            borderRadius: 18,
            background: "rgba(188,194,255,0.04)",
            border: "1px solid rgba(188,194,255,0.08)",
          }}
        >
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  minHeight: 62,
                  padding: "8px 6px",
                  borderRadius: 14,
                  border: "none",
                  background: isActive
                    ? "linear-gradient(180deg, rgba(188,194,255,0.16), rgba(188,194,255,0.06))"
                    : "transparent",
                  cursor: "pointer",
                  boxShadow: isActive ? "0 14px 32px -24px rgba(188,194,255,0.7)" : "none",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {renderTabIcon(tab.icon, isActive)}
                </span>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: isActive ? 700 : 600,
                    letterSpacing: "0.15px",
                    color: isActive ? "#f5f1ff" : "rgba(188,194,255,0.32)",
                  }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ paddingBottom: 12 }}>
        {error && (
          <div
            style={{
              margin: "0 22px 14px",
              padding: "12px 14px",
              borderRadius: 14,
              background: "rgba(255,123,123,0.08)",
              border: "1px solid rgba(255,123,123,0.18)",
              color: "rgba(255,123,123,0.95)",
              fontSize: 12,
              lineHeight: 1.55,
            }}
            role="alert"
          >
            {error}
          </div>
        )}

        <div style={{ display: activeTab === "history" ? "block" : "none" }}>
          <HistoryScreen history={history} loading={loading} />
        </div>

        <div style={{ display: activeTab === "analytics" ? "block" : "none" }}>
          <AnalyticsScreen
            history={history}
            trendData={trendData}
            distribution={distribution}
            dominantMood={dominantMood}
            socialStats={socialStats}
            analyticsStats={analyticsStats}
            loading={loading}
          />
        </div>

        <div style={{ display: activeTab === "insights" ? "block" : "none" }}>
          <InsightsScreen
            refreshToken={refreshToken}
            history={history}
            loading={loading}
          />
        </div>

        <div style={{ display: activeTab === "journal" ? "block" : "none" }}>
          <JournalScreen
            entries={journalEntries}
            onAddEntry={onAddJournalEntry}
          />
        </div>
      </div>
    </div>
  );
};
