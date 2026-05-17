import React from "react";
import { MoodEntry, MoodType } from "../types";
import { getMoodMeta } from "../data";
import { MoodTrendChart } from "../components/analytics/MoodTrendChart";
import { MoodDistribution } from "../components/analytics/MoodDistribution";
import { ChartCard } from "../components/shared/ChartCard";
import { Divider } from "../components/shared/Divider";

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

interface AnalyticsScreenProps {
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
}

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({
  history,
  trendData,
  distribution,
  dominantMood,
  socialStats,
  analyticsStats,
}) => {
  const domMeta = dominantMood ? getMoodMeta(dominantMood) : null;
  const latestEntries = [...history].sort((a, b) => b.timestamp - a.timestamp).slice(0, 4);

  // Weekly insight text
  const weeklyInsight = domMeta
    ? `Your emotional tone this week leans mostly ${domMeta.label.toLowerCase()} — ${domMeta.definition.toLowerCase().replace(".", "")}.`
    : "Log more check-ins to see your weekly insight.";

  return (
    <div
      className="screen-enter"
      style={{ padding: "30px 22px 52px", display: "flex", flexDirection: "column" }}
    >
      <div style={{ marginBottom: 28 }}>
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
          Emotional landscape
        </p>
        <h2
          className="font-serif"
          style={{ fontSize: 26, fontWeight: 400, color: "#e8eaf0", marginBottom: 4 }}
        >
          Mood analytics
        </h2>
        <p style={{ fontSize: 13, color: "rgba(188,194,255,0.36)" }}>
          Patterns across the past 30 days
        </p>

        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
          }}
        >
          {[
            { label: "Longest streak", value: analyticsStats.longestStreak },
            { label: "Current streak", value: analyticsStats.currentStreak },
            { label: "Lifetime days", value: analyticsStats.lifetimeDays },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: "10px 12px",
                borderRadius: 14,
                background: "rgba(188,194,255,0.06)",
                border: "1px solid rgba(188,194,255,0.08)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 16, color: "#e8eaf0", fontWeight: 600 }}>
                {item.value}
              </div>
              <div style={{ fontSize: 10, color: "rgba(188,194,255,0.45)", letterSpacing: "0.6px", textTransform: "uppercase" }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "1.1px",
            textTransform: "uppercase",
            color: "rgba(188,194,255,0.35)",
            marginBottom: 10,
          }}
        >
          Latest entries
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
          {latestEntries.map((entry) => {
            const meta = getMoodMeta(entry.mood);
            return (
              <div
                key={entry.id}
                style={{
                  padding: "12px 14px",
                  borderRadius: 14,
                  background: "rgba(188,194,255,0.05)",
                  border: "1px solid rgba(188,194,255,0.08)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: meta.color,
                      boxShadow: `0 0 6px ${meta.color}66`,
                    }}
                  />
                  <span style={{ fontSize: 12, color: "#e8eaf0" }}>{meta.label}</span>
                </div>
                <span style={{ fontSize: 11, color: "rgba(188,194,255,0.45)" }}>
                  {new Date(entry.timestamp).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span style={{ fontSize: 11, color: "rgba(188,194,255,0.4)" }}>
                  {entry.tags.length} tags · {entry.socialInteractions?.length ?? 0} social
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trend */}
      <ChartCard label="14-day mood trend">
        <MoodTrendChart data={trendData} />
      </ChartCard>

      {/* Distribution */}
      <ChartCard label="Emotional distribution">
        <MoodDistribution data={distribution} />
      </ChartCard>

      <Divider />

      <div
        style={{
          marginBottom: 22,
          padding: "16px 18px",
          borderRadius: 16,
          background: "rgba(188,194,255,0.05)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "1.1px",
              textTransform: "uppercase",
              color: "rgba(188,194,255,0.35)",
            }}
          >
            Mood stability
          </p>
          <span style={{ fontSize: 14, color: "#e8eaf0", fontWeight: 600 }}>
            {analyticsStats.stabilityScore}/100
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div
            style={{
              flex: 1,
              height: 8,
              borderRadius: 999,
              background: "rgba(188,194,255,0.1)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${analyticsStats.stabilityScore}%`,
                background: "linear-gradient(90deg, rgba(255,185,84,0.8), rgba(188,194,255,0.8))",
              }}
            />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <p style={{ fontSize: 12, color: "rgba(188,194,255,0.45)" }}>Best day</p>
            <p style={{ fontSize: 13, color: "#e8eaf0" }}>
              {analyticsStats.bestEntry
                ? `${getMoodMeta(analyticsStats.bestEntry.mood).label} · ${new Date(
                    analyticsStats.bestEntry.timestamp
                  ).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                : "--"}
            </p>
          </div>
          <div>
            <p style={{ fontSize: 12, color: "rgba(188,194,255,0.45)" }}>Worst day</p>
            <p style={{ fontSize: 13, color: "#e8eaf0" }}>
              {analyticsStats.worstEntry
                ? `${getMoodMeta(analyticsStats.worstEntry.mood).label} · ${new Date(
                    analyticsStats.worstEntry.timestamp
                  ).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                : "--"}
            </p>
          </div>
          <div>
            <p style={{ fontSize: 12, color: "rgba(188,194,255,0.45)" }}>Activity count</p>
            <p style={{ fontSize: 13, color: "#e8eaf0" }}>{analyticsStats.activityCount}</p>
          </div>
        </div>
      </div>

      <div
        style={{
          marginBottom: 22,
          padding: "16px 18px",
          borderRadius: 16,
          background: "rgba(188,194,255,0.05)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "1.1px",
            textTransform: "uppercase",
            color: "rgba(188,194,255,0.35)",
          }}
        >
          Activity highlights
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
          {analyticsStats.activityHighlights.map((item) => (
            <div
              key={item.section}
              style={{
                padding: "10px 12px",
                borderRadius: 14,
                background: "rgba(188,194,255,0.06)",
                border: "1px solid rgba(188,194,255,0.08)",
              }}
            >
              <p style={{ fontSize: 11, color: "rgba(188,194,255,0.45)", textTransform: "uppercase" }}>
                {item.section}
              </p>
              <p style={{ fontSize: 13, color: "#e8eaf0", marginTop: 4 }}>
                {item.label ?? "--"}
              </p>
              <p style={{ fontSize: 11, color: "rgba(188,194,255,0.4)" }}>
                {item.count} logged
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly insight quote */}
      <div
        style={{
          padding: "18px 20px",
          borderLeft: "2px solid rgba(255,185,84,0.35)",
          background: "rgba(255,185,84,0.04)",
        }}
      >
        <p
          className="font-serif"
          style={{
            fontSize: 15,
            lineHeight: 1.65,
            color: "rgba(255,185,84,0.78)",
            fontStyle: "italic",
          }}
        >
          "{weeklyInsight}"
        </p>
      </div>

      <div
        style={{
          marginTop: 20,
          padding: "16px 18px",
          borderRadius: 16,
          background: "rgba(188,194,255,0.05)",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "1.1px",
            textTransform: "uppercase",
            color: "rgba(188,194,255,0.35)",
          }}
        >
          Social pulse (last 7 days)
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <p style={{ fontSize: 13, color: "#e8eaf0", marginBottom: 4 }}>
              {socialStats.totalInteractions}
            </p>
            <p style={{ fontSize: 11, color: "rgba(188,194,255,0.4)" }}>
              interactions logged
            </p>
          </div>
          <div>
            <p style={{ fontSize: 13, color: "#e8eaf0", marginBottom: 4 }}>
              {socialStats.topPerson ?? "--"}
            </p>
            <p style={{ fontSize: 11, color: "rgba(188,194,255,0.4)" }}>
              most seen person
            </p>
          </div>
          <div>
            <p style={{ fontSize: 13, color: "#e8eaf0", marginBottom: 4 }}>
              {socialStats.topFeeling ?? "--"}
            </p>
            <p style={{ fontSize: 11, color: "rgba(188,194,255,0.4)" }}>
              common feeling
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
