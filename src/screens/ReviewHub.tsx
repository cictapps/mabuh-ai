import React, { useState } from "react";
import type { ReviewTabId, MoodEntry, MoodType } from "../types";
import { HistoryScreen } from "./HistoryScreen";
import { AnalyticsScreen } from "./AnalyticsScreen";
import { InsightsScreen } from "./InsightsScreen";
import { JournalScreen } from "./JournalScreen";
import { History, TrendingUp, Lightbulb, PenTool } from "lucide-react";
import type { MoodEntryInput } from "../lib/db/moodRepository";
import { SegmentedTabs, type SegmentedTabsItem } from "@/components/shared/SegmentedTabs";

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

const tabs: SegmentedTabsItem<ReviewTabId>[] = [
  { key: "history", label: "Days", icon: () => <History size={16} /> },
  { key: "analytics", label: "Patterns", icon: () => <TrendingUp size={16} /> },
  { key: "insights", label: "Reflections", icon: () => <Lightbulb size={16} /> },
  { key: "journal", label: "Writing", icon: () => <PenTool size={16} /> },
];

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
      className="screen-enter relative flex w-full flex-col gap-5 px-4 pb-12 pt-5"
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

      {/* Tab switcher */}
      <SegmentedTabs
        items={tabs}
        activeKey={activeTab}
        onChange={handleTabChange}
        ariaLabel="Review views"
      />

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
