import React, { useState } from "react";
import type { ReviewTabId, MoodEntry, MoodType } from "../types";
import { HistoryScreen } from "./HistoryScreen";
import { AnalyticsScreen } from "./AnalyticsScreen";
import { InsightsScreen } from "./InsightsScreen";
import { JournalScreen } from "./JournalScreen";
import { History, TrendingUp, Lightbulb, PenTool } from "lucide-react";
import type { MoodEntryInput } from "../lib/db/moodRepository";

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
  visitToken?: number;
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
  onUpdateEntry: (id: string, input: MoodEntryInput) => Promise<boolean>;
  onDeleteEntry: (id: string) => Promise<boolean>;
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
  const className = isActive
    ? "text-[color:var(--text-on-surface-strong)]"
    : "text-[var(--surface-violet-icon-hover)]";

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
  visitToken = 0,
  history,
  trendData,
  distribution,
  dominantMood,
  socialStats,
  analyticsStats,
  refreshToken,
  journalEntries,
  onAddJournalEntry,
  onUpdateEntry,
  onDeleteEntry,
  loading,
  error,
}) => {
  const [activeTab, setActiveTab] = useState<ReviewTabId>("history");
  const [insightsVisitToken, setInsightsVisitToken] = useState(0);

  const handleTabChange = (tabId: ReviewTabId) => {
    setActiveTab(tabId);
    if (tabId === "insights") {
      setInsightsVisitToken((token) => token + 1);
    }
  };

  return (
    <div
      className="screen-enter relative flex w-full flex-col gap-4 px-4 pb-12 pt-5"
      style={{
        paddingTop: "var(--app-screen-top)",
        minHeight: "100%",
      }}
    >
      {/* Header */}
      <div className="relative" style={{ paddingRight: 0 }}>
        <div className="relative">
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--text-kicker)",
              marginBottom: 10,
            }}
          >
            A quiet look back
          </p>
          <h2
            className="font-serif"
            style={{
              fontSize: 30,
              fontWeight: 500,
              lineHeight: 1.15,
              color: "var(--text-on-surface)",
              marginBottom: 4,
              letterSpacing: "-0.03em",
            }}
          >
            Your story so far
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "var(--text-on-surface-strong)",
              lineHeight: 1.55,
            }}
          >
            Your history, gentle patterns, and words — all in one safe place
          </p>
        </div>
      </div>

      {/* Tab switcher (journey pill style — icon-only when inactive) */}
      <div
        className="flex items-stretch gap-1 rounded-2xl border border-[var(--border-violet-soft)] bg-[var(--surface-violet-low)] p-1"
        role="tablist"
        aria-label="Review views"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => handleTabChange(tab.id)}
              aria-label={tab.label}
              className={`relative flex min-w-0 items-center justify-center rounded-xl py-2.5 transition-all duration-300 ease-out active:scale-[0.97] ${
                isActive ? "flex-[2.6] gap-1.5 px-2.5" : "flex-1 gap-0 px-1"
              }`}
              style={{
                background: isActive
                  ? "linear-gradient(to right, var(--primary), var(--secondary), var(--primary))"
                  : "transparent",
                color: isActive
                  ? "var(--primary-foreground)"
                  : "var(--text-on-surface-strong)",
                boxShadow: isActive
                  ? "0 14px 32px -18px var(--surface-violet-icon-hover)"
                  : "none",
              }}
            >
              {renderTabIcon(tab.icon, isActive)}
              <span
                aria-hidden={!isActive}
                className={`overflow-hidden whitespace-nowrap text-[11px] font-semibold transition-all duration-300 ease-out ${
                  isActive ? "max-w-[160px] opacity-100" : "max-w-0 opacity-0"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="relative">
        {error && (
          <div
            style={{
              margin: "0 0 14px",
              padding: "10px 0",
              color: "var(--text-danger)",
              fontSize: 12,
              lineHeight: 1.55,
            }}
            role="alert"
          >
            {error}
          </div>
        )}

        <div style={{ display: activeTab === "history" ? "block" : "none" }}>
          <HistoryScreen
            history={history}
            loading={loading}
            onUpdateEntry={onUpdateEntry}
            onDeleteEntry={onDeleteEntry}
          />
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
            visitToken={visitToken + insightsVisitToken}
            history={history}
            loading={loading}
          />
        </div>

        <div style={{ display: activeTab === "journal" ? "block" : "none" }}>
          <JournalScreen
            entries={journalEntries}
            recentMoods={history}
            onAddEntry={onAddJournalEntry}
          />
        </div>
      </div>
    </div>
  );
};
