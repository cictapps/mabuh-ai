import React from "react";
import { MoodEntry, MoodType } from "../types";
import { getMoodMeta } from "../data";
import { MoodTrendChart } from "../components/analytics/MoodTrendChart";
import { MoodDistribution } from "../components/analytics/MoodDistribution";
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
  loading?: boolean;
}

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({
  history,
  trendData,
  distribution,
  dominantMood,
  socialStats,
  analyticsStats,
  loading,
}) => {
  const domMeta = dominantMood ? getMoodMeta(dominantMood) : null;
  const latestEntries = [...history]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 4);

  const isEmpty = !loading && history.length === 0;

  // Weekly insight text
  const weeklyInsight = domMeta
    ? `This week, your heart has been resting mostly in ${domMeta.label.toLowerCase()} — ${domMeta.definition.toLowerCase().replace(".", "")}. Whatever you've been feeling, it's been valid.`
    : "Share a few more check-ins and a gentle weekly note will appear here.";

  return (
    <div
      className="screen-enter"
      style={{
        padding: "30px 22px 52px",
        display: "flex",
        flexDirection: "column",
        gap: 32,
      }}
    >
      {loading ? (
        <p
          style={{
            margin: 0,
            padding: "16px 0",
            color: "var(--text-on-surface-strong)",
            fontSize: 12,
            textAlign: "center",
          }}
        >
          Gathering your patterns…
        </p>
      ) : isEmpty ? (
        <p
          style={{
            margin: 0,
            padding: "16px 0",
            color: "var(--surface-violet-icon-hover)",
            fontSize: 13,
            lineHeight: 1.7,
            textAlign: "center",
          }}
        >
          Your patterns will begin to appear here once you share your first few check-ins.
        </p>
      ) : null}

      <div>
        <p
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "1.3px",
            textTransform: "uppercase",
            color: "var(--text-on-surface-strong)",
            marginBottom: 10,
          }}
        >
          A gentle look inward
        </p>
        <h2
          className="font-serif"
          style={{
            fontSize: 26,
            fontWeight: 400,
            color: "var(--text-on-surface)",
            marginBottom: 4,
          }}
        >
          Your patterns, in soft light
        </h2>
        <p style={{ fontSize: 13, color: "var(--surface-violet-icon-hover)" }}>
          A gentle look across the past 30 days
        </p>

        <div
          style={{
            marginTop: 20,
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
          }}
        >
          {[
            { label: "Longest stretch", value: analyticsStats.longestStreak },
            { label: "Days in a row", value: analyticsStats.currentStreak },
            { label: "Days with us", value: analyticsStats.lifetimeDays },
          ].map((item) => (
            <div key={item.label} style={{ textAlign: "center" }}>
              <div
                style={{ fontSize: 18, color: "var(--text-on-surface)", fontWeight: 600 }}
              >
                {item.value}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--surface-violet-icon-hover)",
                  letterSpacing: "0.6px",
                  textTransform: "uppercase",
                  marginTop: 4,
                }}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "1.1px",
            textTransform: "uppercase",
            color: "var(--surface-violet-icon-hover)",
            marginBottom: 14,
          }}
        >
          A few recent days
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
          {latestEntries.map((entry) => {
            const meta = getMoodMeta(entry.mood);
            return (
              <div
                key={entry.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
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
                  <span style={{ fontSize: 12, color: "var(--text-on-surface)" }}>
                    {meta.label}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: "var(--surface-violet-icon-hover)" }}>
                  {new Date(entry.timestamp).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span style={{ fontSize: 11, color: "var(--text-on-surface-strong)" }}>
                  {entry.tags.length} {entry.tags.length === 1 ? "word" : "words"} ·{" "}
                  {entry.socialInteractions?.length ?? 0} connection
                  {entry.socialInteractions?.length === 1 ? "" : "s"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trend */}
      <div>
        <p
          style={{
            fontSize: 11,
            letterSpacing: "0.9px",
            textTransform: "uppercase",
            color: "var(--surface-violet-icon-hover)",
            marginBottom: 16,
          }}
        >
          The last 14 days, gently traced
        </p>
        <MoodTrendChart data={trendData} />
      </div>

      {/* Distribution */}
      <div>
        <p
          style={{
            fontSize: 11,
            letterSpacing: "0.9px",
            textTransform: "uppercase",
            color: "var(--surface-violet-icon-hover)",
            marginBottom: 16,
          }}
        >
          How your colors have been showing up
        </p>
        <MoodDistribution data={distribution} />
      </div>

      <Divider />

      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "1.1px",
              textTransform: "uppercase",
              color: "var(--surface-violet-icon-hover)",
              margin: 0,
            }}
          >
            A steady heart
          </p>
          <span
            style={{ fontSize: 14, color: "var(--text-on-surface)", fontWeight: 600 }}
          >
            {analyticsStats.stabilityScore}/100
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div
            style={{
              flex: 1,
              height: 8,
              borderRadius: 999,
              background: "var(--surface-violet-medium)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${analyticsStats.stabilityScore}%`,
                background:
                  "linear-gradient(90deg, rgba(255,185,84,0.8), var(--surface-violet-icon-hover))",
              }}
            />
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 18,
            marginTop: 22,
          }}
        >
          <div>
            <p style={{ fontSize: 12, color: "var(--surface-violet-icon-hover)" }}>
              Your brightest day
            </p>
            <p style={{ fontSize: 13, color: "var(--text-on-surface)", marginTop: 4 }}>
              {analyticsStats.bestEntry
                ? `${getMoodMeta(analyticsStats.bestEntry.mood).label} · ${new Date(
                    analyticsStats.bestEntry.timestamp,
                  ).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                : "--"}
            </p>
          </div>
          <div>
            <p style={{ fontSize: 12, color: "var(--surface-violet-icon-hover)" }}>
              Your heaviest day
            </p>
            <p style={{ fontSize: 13, color: "var(--text-on-surface)", marginTop: 4 }}>
              {analyticsStats.worstEntry
                ? `${getMoodMeta(analyticsStats.worstEntry.mood).label} · ${new Date(
                    analyticsStats.worstEntry.timestamp,
                  ).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                : "--"}
            </p>
          </div>
          <div>
            <p style={{ fontSize: 12, color: "var(--surface-violet-icon-hover)" }}>
              Little moments noticed
            </p>
            <p style={{ fontSize: 13, color: "var(--text-on-surface)", marginTop: 4 }}>
              {analyticsStats.activityCount}
            </p>
          </div>
        </div>
      </div>

      <div>
        <p
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "1.1px",
            textTransform: "uppercase",
            color: "var(--surface-violet-icon-hover)",
            marginBottom: 16,
          }}
        >
          Moments that mattered
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
          {analyticsStats.activityHighlights.map((item) => (
            <div key={item.section}>
              <p
                style={{
                  fontSize: 11,
                  color: "var(--surface-violet-icon-hover)",
                  textTransform: "uppercase",
                  margin: 0,
                }}
              >
                {item.section}
              </p>
              <p style={{ fontSize: 13, color: "var(--text-on-surface)", marginTop: 6 }}>
                {item.label ?? "--"}
              </p>
              <p
                style={{
                  fontSize: 11,
                  color: "var(--text-on-surface-strong)",
                  marginTop: 4,
                }}
              >
                {item.count === 1 ? "captured once" : `captured ${item.count} times`}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly insight quote */}
      <p
        className="font-serif"
        style={{
          fontSize: 15,
          lineHeight: 1.7,
          color: "var(--text-warn-quote)",
          fontStyle: "italic",
          margin: 0,
        }}
      >
        "{weeklyInsight}"
      </p>

      <div>
        <p
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "1.1px",
            textTransform: "uppercase",
            color: "var(--surface-violet-icon-hover)",
            marginBottom: 16,
          }}
        >
          Your kind connections (last 7 days)
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <div>
            <p style={{ fontSize: 13, color: "var(--text-on-surface)", marginBottom: 4 }}>
              {socialStats.totalInteractions}
            </p>
            <p style={{ fontSize: 11, color: "var(--text-on-surface-strong)" }}>
              moments shared
            </p>
          </div>
          <div>
            <p style={{ fontSize: 13, color: "var(--text-on-surface)", marginBottom: 4 }}>
              {socialStats.topPerson ?? "--"}
            </p>
            <p style={{ fontSize: 11, color: "var(--text-on-surface-strong)" }}>
              warmest presence
            </p>
          </div>
          <div>
            <p style={{ fontSize: 13, color: "var(--text-on-surface)", marginBottom: 4 }}>
              {socialStats.topFeeling ?? "--"}
            </p>
            <p style={{ fontSize: 11, color: "var(--text-on-surface-strong)" }}>
              feeling that lingered
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
