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
import { MoodEntry, MoodType } from "../types";
import { getMoodMeta } from "../data";
import { MoodTrendChart } from "../components/analytics/MoodTrendChart";
import { MoodDistribution } from "../components/analytics/MoodDistribution";

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

type StatTone = "warm" | "calm" | "success" | "rose" | "fuchsia";

const TONE_CLASSES: Record<StatTone, { bg: string; text: string }> = {
  warm: { bg: "bg-[rgba(255,185,84,0.14)]", text: "text-tertiary" },
  calm: { bg: "bg-[var(--surface-violet-icon)]", text: "text-primary" },
  success: {
    bg: "bg-[rgba(109,186,132,0.16)]",
    text: "text-[color:var(--icon-success)]",
  },
  rose: {
    bg: "bg-[rgba(255,123,123,0.14)]",
    text: "text-[color:var(--icon-rose)]",
  },
  fuchsia: {
    bg: "bg-[var(--surface-fuchsia-low)]",
    text: "text-[color:var(--secondary)]",
  },
};

type Accent = "amber" | "lilac" | "sage" | "fuchsia";

const ACCENT_GLOWS: Record<Accent, string> = {
  amber: "bg-[radial-gradient(circle_at_center,rgba(255,185,84,0.16),transparent_60%)]",
  lilac: "bg-[radial-gradient(circle_at_center,rgba(188,194,255,0.16),transparent_60%)]",
  sage: "bg-[radial-gradient(circle_at_center,rgba(109,186,132,0.16),transparent_60%)]",
  fuchsia:
    "bg-[radial-gradient(circle_at_center,rgba(212,187,255,0.16),transparent_60%)]",
};

function Section({
  kicker,
  title,
  subtitle,
  accent = "amber",
  children,
}: {
  kicker?: string;
  title?: string;
  subtitle?: string;
  accent?: Accent;
  children: React.ReactNode;
}) {
  const hasHeader = Boolean(kicker || title || subtitle);
  return (
    <section
      className="relative overflow-hidden rounded-[1.75rem] border border-[color:var(--border-violet-soft)] bg-card p-5 shadow-[0_28px_80px_-40px_rgba(8,10,18,0.85)] backdrop-blur-xl"
      data-stagger
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full ${ACCENT_GLOWS[accent]} blur-2xl`}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-12 h-44 w-44 rounded-full bg-[radial-gradient(circle_at_center,rgba(188,194,255,0.16),transparent_60%)] blur-2xl"
      />
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
                className="mt-1 font-serif tracking-[-0.02em] text-foreground"
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

function StatTile({
  icon,
  label,
  value,
  tone = "warm",
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tone?: StatTone;
}) {
  const t = TONE_CLASSES[tone];
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[color:var(--border-violet-faint)] bg-[var(--surface-violet-low)] p-3.5">
      <span
        className={`grid size-9 shrink-0 place-items-center rounded-xl ${t.bg} ${t.text}`}
        aria-hidden
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-serif text-[26px] font-medium leading-none tracking-tight text-foreground">
          {value}
        </span>
        <span className="mt-1.5 block text-[10px] font-semibold uppercase leading-tight tracking-[0.18em] text-[color:var(--text-kicker)]">
          {label}
        </span>
      </span>
    </div>
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
  const t = TONE_CLASSES[tone];
  return (
    <div className="flex items-start gap-2.5">
      <span
        className={`grid size-7 shrink-0 place-items-center rounded-lg ${t.bg} ${t.text}`}
        aria-hidden
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-semibold uppercase leading-tight tracking-[0.18em] text-[color:var(--text-kicker)]">
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
    <div className="screen-enter flex flex-col gap-6 pb-12" style={{ paddingTop: 4 }}>
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
          Your patterns will begin to appear here once you share your first few check-ins.
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

      {/* Rhythms — three big tiles */}
      <Section kicker="Your rhythms" accent="amber">
        <div className="grid grid-cols-3 gap-2">
          <StatTile
            icon={<Flame className="size-4" />}
            label="Longest stretch"
            value={analyticsStats.longestStreak}
            tone="warm"
          />
          <StatTile
            icon={<Sparkles className="size-4" />}
            label="Days in a row"
            value={analyticsStats.currentStreak}
            tone="warm"
          />
          <StatTile
            icon={<CalendarDays className="size-4" />}
            label="Days with us"
            value={analyticsStats.lifetimeDays}
            tone="calm"
          />
        </div>
      </Section>

      {/* Recent days */}
      {latestEntries.length > 0 ? (
        <Section kicker="A few recent days" accent="lilac">
          <ul className="grid grid-cols-2 gap-2">
            {latestEntries.map((entry) => {
              const meta = getMoodMeta(entry.mood);
              return (
                <li
                  key={entry.id}
                  className="flex flex-col gap-1.5 rounded-2xl border border-[color:var(--border-violet-faint)] bg-[var(--surface-violet-low)] p-3"
                >
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
                  <span className="text-[11px] text-[color:var(--text-on-surface-faint)]">
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
      <Section kicker="The last 14 days, gently traced" accent="fuchsia">
        <MoodTrendChart data={trendData} />
      </Section>

      {/* Distribution */}
      <Section kicker="How your colors have been showing up" accent="lilac">
        <MoodDistribution data={distribution} />
      </Section>

      {/* A steady heart */}
      <Section kicker="A steady heart" accent="sage">
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
        <Section kicker="Moments that mattered" accent="fuchsia">
          <ul className="grid grid-cols-2 gap-2">
            {analyticsStats.activityHighlights.map((item) => (
              <li
                key={item.section}
                className="flex flex-col gap-1 rounded-2xl border border-[color:var(--border-violet-faint)] bg-[var(--surface-violet-low)] p-3"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-kicker)]">
                  {item.section}
                </p>
                <p className="mt-1 truncate text-[13px] font-medium text-foreground">
                  {item.label ?? "—"}
                </p>
                <p className="text-[11px] text-[color:var(--text-on-surface-faint)]">
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
      <Section kicker="Your kind connections (last 7 days)" accent="lilac">
        <div className="grid grid-cols-3 gap-2">
          <StatTile
            icon={<Users className="size-4" />}
            label="Moments shared"
            value={socialStats.totalInteractions}
            tone="calm"
          />
          <StatTile
            icon={<MapPin className="size-4" />}
            label="Warmest presence"
            value={socialStats.topPerson ?? "—"}
            tone="fuchsia"
          />
          <StatTile
            icon={<Smile className="size-4" />}
            label="Feeling that lingered"
            value={socialStats.topFeeling ?? "—"}
            tone="success"
          />
        </div>
      </Section>
    </div>
  );
};
