import React, { useState } from "react";
import { ReviewTabId, MoodEntry, MoodType } from "../types";
import { HistoryScreen } from "./HistoryScreen";
import { AnalyticsScreen } from "./AnalyticsScreen";
import { InsightsScreen } from "./InsightsScreen";
import { JournalScreen } from "./JournalScreen";
import { History, TrendingUp, Lightbulb, PenTool } from "lucide-react";
import { TopBarSettingsButton } from "../components/shared/TopBarSettingsButton";

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
  onOpenSettings: () => void;
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
    ? "text-[#171a27]"
    : "text-[rgba(188,194,255,0.34)]";

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
  onOpenSettings,
  loading,
  error,
}) => {
  const [activeTab, setActiveTab] = useState<ReviewTabId>("history");

  return (
    <div
      className="screen-enter relative flex w-full flex-col gap-4 px-4 pb-12 pt-5"
      style={{
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 20px)",
        minHeight: "100%",
      }}
    >
      <TopBarSettingsButton onClick={onOpenSettings} />

      {/* Decorative background blobs (matches journey aesthetic) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,185,84,0.10),transparent_60%)] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 top-40 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(188,194,255,0.10),transparent_60%)] blur-3xl"
      />

      {/* Header card */}
      <div
        className="relative overflow-hidden rounded-[1.75rem] border border-[rgba(188,194,255,0.10)] bg-card p-5 shadow-[0_28px_80px_-40px_rgba(8,10,18,0.85)] backdrop-blur-xl"
        style={{
          paddingRight: 72,
          clipPath: `path('M 28 0 H calc(100% - 72px) A 52 52 0 0 1 calc(100% - 0px) 48 V calc(100% - 28px) A 28 28 0 0 1 calc(100% - 56px) calc(100% - 0px) H 28 A 28 28 0 0 1 0 calc(100% - 56px) V 28 A 28 28 0 0 1 28 0 Z')`,
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,185,84,0.16),transparent_60%)] blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-12 h-44 w-44 rounded-full bg-[radial-gradient(circle_at_center,rgba(188,194,255,0.16),transparent_60%)] blur-2xl"
        />
        <div className="relative">
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#d8d4eb",
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
              color: "#eef1f6",
              marginBottom: 4,
              letterSpacing: "-0.03em",
            }}
          >
            Your story so far
          </h2>
          <p style={{ fontSize: 13, color: "rgba(216,212,235,0.7)", lineHeight: 1.55 }}>
            Your history, gentle patterns, and words — all in one safe place
          </p>
        </div>
      </div>

      {/* Tab switcher (journey pill style — icon-only when inactive) */}
      <div
        className="flex items-stretch gap-1 rounded-2xl border border-[rgba(188,194,255,0.10)] bg-[rgba(188,194,255,0.03)] p-1"
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
              onClick={() => setActiveTab(tab.id)}
              aria-label={tab.label}
              className={`relative flex min-w-0 items-center justify-center rounded-xl py-2.5 transition-all duration-300 ease-out active:scale-[0.97] ${
                isActive ? "flex-[2.6] gap-1.5 px-2.5" : "flex-1 gap-0 px-1"
              }`}
              style={{
                background: isActive
                  ? "linear-gradient(to right, var(--primary), var(--secondary), var(--primary))"
                  : "transparent",
                color: isActive ? "var(--primary-foreground)" : "rgba(216,212,235,0.6)",
                boxShadow: isActive
                  ? "0 14px 32px -18px rgba(188,194,255,0.85)"
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
              padding: "12px 14px",
              borderRadius: 16,
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
