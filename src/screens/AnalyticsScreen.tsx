import React from "react";
import {
  CalendarDays,
  Cloud,
  Flame,
  Heart,
  MapPin,
  Smile,
  Sparkles,
  Sunrise,
  Users,
} from "lucide-react";
import type { MoodEntry, MoodType } from "../types";
import { getMoodMeta } from "../data";
import { MoodTrendChart } from "../components/analytics/MoodTrendChart";
import { MoodDistribution } from "../components/analytics/MoodDistribution";
import { StatBadge } from "../components/journey/StatBadge";

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

type StatTone = "warm" | "calm" | "success" | "rose";

const TONE_ICON_BG: Record<StatTone, string> = {
  warm: "bg-[var(--stat-warm-icon-bg)]",
  calm: "bg-[var(--stat-calm-icon-bg)]",
  success: "bg-[var(--stat-success-icon-bg)]",
  rose: "bg-[var(--stat-warm-icon-bg)]",
};

const TONE_ICON: Record<StatTone, string> = {
  warm: "text-[color:var(--stat-warm-icon)]",
  calm: "text-[color:var(--stat-calm-icon)]",
  success: "text-[color:var(--stat-success-icon)]",
  rose: "text-[color:var(--text-warn)]",
};

function Section({
  kicker,
  title,
  subtitle,
  children,
}: {
  kicker?: string;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const hasHeader = Boolean(kicker || title || subtitle);
  return (
    <section className="relative" data-stagger>
      <div className="relative">
        {hasHeader ? (
          <header className="mb-4">
            {kicker ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--text-kicker)]">
                {kicker}
              </p>
            ) : null}
            {title ? (
              <h3
                className="mt-1 font-serif tracking-[-0.03em] text-foreground"
                style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.15 }}
              >
                {title}
              </h3>
            ) : null}
            {subtitle ? (
              <p className="mt-1 text-[13px] leading-relaxed text-[color:var(--text-on-surface-muted)]">
                {subtitle}
              </p>
            ) : null}
          </header>
        ) : null}
        {children}
      </div>
    </section>
  );
}

function SubStat({
  icon,
  label,
  value,
  tone = "calm",
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tone?: StatTone;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span
        className={`grid size-7 shrink-0 place-items-center rounded-lg ${TONE_ICON_BG[tone]} ${TONE_ICON[tone]}`}
        aria-hidden
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-semibold uppercase leading-tight tracking-[0.22em] text-[color:var(--text-kicker)]">
          {label}
        </span>
        <span className="mt-1 block text-[13px] font-medium text-foreground">
          {value}
        </span>
      </span>
    </div>
  );
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

  const weeklyInsight = domMeta
    ? `This week, your heart has been resting mostly in ${domMeta.label.toLowerCase()} — ${domMeta.definition.toLowerCase().replace(".", "")}. Whatever you've been feeling, it's been valid.`
    : "Share a few more check-ins and a gentle weekly note will appear here.";

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div
      className="screen-enter relative flex w-full flex-col gap-4 pb-12 pt-5"
      style={{
        paddingTop: "var(--app-screen-top)",
        minHeight: "100%",
      }}
    >
      {/* Decorative blobs (amber top-right, lilac mid-left) — match every other screen. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,185,84,0.10),transparent_60%)] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 top-40 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(188,194,255,0.10),transparent_60%)] blur-3xl"
      />

      <div className="relative">
        {/* Loading / empty state */}
        {loading ? (
          <p
            className="px-1 py-4 text-center text-xs text-[color:var(--text-on-surface-muted)]"
            role="status"
          >
            Gathering your patterns…
          </p>
        ) : isEmpty ? (
          <p
            className="px-1 py-4 text-center text-[13px] leading-relaxed text-[color:var(--text-on-surface-muted)]"
            role="status"
          >
            Your patterns will begin to appear here once you share your first few
            check-ins.
          </p>
        ) : null}

        {/* Header */}
        <header className="relative px-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--text-kicker)]">
            A gentle look inward
          </p>
          <h2
            className="mt-1.5 font-serif tracking-[-0.03em] text-foreground"
            style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.15 }}
          >
            Your patterns, in soft light
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--text-on-surface-muted)]">
            A gentle look across the past 30 days
          </p>
        </header>
      </div>

      {/* Rhythms */}
      <Section kicker="Your rhythms">
        <div className="grid grid-cols-3 gap-2">
          <StatBadge
            tone="warm"
            layout="stacked"
            icon={<Flame className="size-4" fill="currentColor" />}
            value={analyticsStats.longestStreak}
            label="Longest stretch"
          />
          <StatBadge
            tone="calm"
            layout="stacked"
            icon={<Sparkles className="size-4" />}
            value={analyticsStats.currentStreak}
            label="Days in a row"
          />
          <StatBadge
            tone="success"
            layout="stacked"
            icon={<CalendarDays className="size-4" />}
            value={analyticsStats.lifetimeDays}
            label="Days with us"
          />
        </div>
      </Section>

      {/* Recent days */}
      {latestEntries.length > 0 ? (
        <Section kicker="A few recent days">
          <ul className="grid grid-cols-2 gap-2">
            {latestEntries.map((entry) => {
              const meta = getMoodMeta(entry.mood);
              return (
                <li key={entry.id} className="flex flex-col gap-1.5 rounded-2xl p-3">
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{
                        background: meta.color,
                        boxShadow: `0 0 8px ${meta.color}66`,
                      }}
                      aria-hidden
                    />
                    <span className="truncate text-[13px] font-semibold text-foreground">
                      {meta.label}
                    </span>
                  </span>
                  <span className="text-[11px] text-[color:var(--text-on-surface-muted)]">
                    {formatDate(entry.timestamp)}
                  </span>
                  <span className="text-[11px] text-[color:var(--text-on-surface-soft)]">
                    {entry.tags.length} {entry.tags.length === 1 ? "word" : "words"} ·{" "}
                    {entry.socialInteractions?.length ?? 0} connection
                    {entry.socialInteractions?.length === 1 ? "" : "s"}
                  </span>
                </li>
              );
            })}
          </ul>
        </Section>
      ) : null}

      {/* Trend */}
      <Section kicker="The last 14 days, gently traced">
        <MoodTrendChart data={trendData} />
      </Section>

      {/* Distribution */}
      <Section kicker="How your colors have been showing up">
        <MoodDistribution data={distribution} />
      </Section>

      {/* A steady heart */}
      <Section kicker="A steady heart">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[13px] leading-relaxed text-[color:var(--text-on-surface-muted)]">
            How settled your days have felt, gently scored.
          </p>
          <span className="font-serif text-[26px] font-medium leading-none tracking-tight text-foreground">
            {analyticsStats.stabilityScore}
            <span className="text-[14px] text-[color:var(--text-on-surface-muted)]">
              /100
            </span>
          </span>
        </div>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--surface-violet-medium)]"
          role="progressbar"
          aria-valuenow={analyticsStats.stabilityScore}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${analyticsStats.stabilityScore}%`,
              background: "linear-gradient(90deg, var(--tertiary), var(--primary))",
            }}
          />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4">
          <SubStat
            icon={<Sunrise className="size-3.5" />}
            label="Your brightest day"
            tone="warm"
            value={
              analyticsStats.bestEntry
                ? `${getMoodMeta(analyticsStats.bestEntry.mood).label} · ${formatDate(analyticsStats.bestEntry.timestamp)}`
                : "—"
            }
          />
          <SubStat
            icon={<Cloud className="size-3.5" />}
            label="Your heaviest day"
            tone="rose"
            value={
              analyticsStats.worstEntry
                ? `${getMoodMeta(analyticsStats.worstEntry.mood).label} · ${formatDate(analyticsStats.worstEntry.timestamp)}`
                : "—"
            }
          />
          <SubStat
            icon={<Heart className="size-3.5" />}
            label="Little moments noticed"
            tone="success"
            value={analyticsStats.activityCount}
          />
        </div>
      </Section>

      {/* Moments that mattered */}
      {analyticsStats.activityHighlights.length > 0 ? (
        <Section kicker="Moments that mattered">
          <ul className="grid grid-cols-2 gap-2">
            {analyticsStats.activityHighlights.map((item) => (
              <li key={item.section} className="flex flex-col gap-1 rounded-2xl p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--text-kicker)]">
                  {item.section}
                </p>
                <p className="mt-1 truncate text-[13px] font-medium text-foreground">
                  {item.label ?? "—"}
                </p>
                <p className="text-[11px] text-[color:var(--text-on-surface-soft)]">
                  {item.count === 1 ? "captured once" : `captured ${item.count} times`}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* Weekly insight quote */}
      <p
        className="px-1 font-serif italic text-[color:var(--text-warn-quote)]"
        style={{ fontSize: 15, lineHeight: 1.7 }}
      >
        “{weeklyInsight}”
      </p>

      {/* Connections */}
      <Section kicker="Your kind connections (last 7 days)">
        <div className="grid grid-cols-3 gap-2">
          <StatBadge
            tone="calm"
            layout="stacked"
            icon={<Users className="size-4" />}
            value={socialStats.totalInteractions}
            label="Moments shared"
          />
          <StatBadge
            tone="warm"
            layout="stacked"
            icon={<MapPin className="size-4" />}
            value={socialStats.topPerson ?? "—"}
            label="Warmest presence"
          />
          <StatBadge
            tone="success"
            layout="stacked"
            icon={<Smile className="size-4" />}
            value={socialStats.topFeeling ?? "—"}
            label="Feeling that lingered"
          />
        </div>
      </Section>
    </div>
  );
};
