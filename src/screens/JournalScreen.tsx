import React, { useMemo, useState } from "react";
import { BookHeart, Heart } from "lucide-react";
import { Button } from "../components/ui/button";
import { JournalInput } from "../components/mood/JournalInput";
import { ReflectWithAIPanel } from "../components/journal/ReflectWithAIPanel";
import { SectionLabel } from "../components/shared/SectionLabel";
import type { JournalEntry, MoodEntry, MoodType } from "../types";
import { getMoodMeta } from "../data";
import type { ReflectContext } from "../services/reflect";

function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface JournalScreenProps {
  entries: JournalEntry[];
  recentMoods: MoodEntry[];
  onAddEntry: (content: string) => void;
}

export const JournalScreen: React.FC<JournalScreenProps> = ({
  entries,
  recentMoods,
  onAddEntry,
}) => {
  const [draft, setDraft] = useState("");

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => b.timestamp - a.timestamp),
    [entries],
  );

  const stats = useMemo(() => {
    const now = Date.now();
    const weekStart = now - 7 * 24 * 60 * 60 * 1000;
    const checkins = entries.filter((entry) => entry.source === "checkin").length;
    const manual = entries.filter((entry) => entry.source === "manual").length;
    const weekCount = entries.filter((entry) => entry.timestamp >= weekStart).length;
    const latest = sortedEntries[0]?.timestamp ?? null;
    return { checkins, manual, weekCount, latest };
  }, [entries, sortedEntries]);

  const canSave = draft.trim().length > 0;

  // Build a context payload for the AI reflection so it can reference
  // recent mood + journal state. Trimmed and bounded to keep the
  // request small.
  const buildReflectionContext = (): ReflectContext => {
    const recentMoodSlice = [...recentMoods]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 3)
      .map((m) => {
        const meta = getMoodMeta(m.mood);
        return {
          date: m.date,
          mood: m.mood,
          moodLabel: meta?.label ?? m.mood,
          journal: m.journal ? m.journal.slice(0, 240) : undefined,
        };
      });
    const recentJournalSlice = sortedEntries.slice(0, 2).map((e) => ({
      date: e.date,
      content: e.content.slice(0, 240),
      mood: e.mood,
    }));
    return {
      draftText: draft.trim() || undefined,
      mood: null,
      recentMoods: recentMoodSlice,
      recentJournal: recentJournalSlice,
    };
  };

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

      <div className="relative px-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--text-kicker)]">
          Words just for you
        </p>
        <h2
          className="mt-1.5 font-serif tracking-[-0.03em] text-foreground"
          style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.15 }}
        >
          A page for your words
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--text-on-surface-muted)]">
          Your check-ins and your quiet little notes, held together
        </p>
      </div>

      <RhythmCard
        weekCount={stats.weekCount}
        latest={stats.latest}
        checkins={stats.checkins}
        manual={stats.manual}
      />

      <section className="relative" data-stagger>
        <div className="relative flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <SectionLabel>Write a little something</SectionLabel>
            <span className="text-[11px] text-[color:var(--text-on-surface-muted)]">
              A heart note
            </span>
          </div>
          <JournalInput
            value={draft}
            onChange={setDraft}
            label="Just for you"
            placeholder="A thought, a small win, a moment that mattered…"
            rows={3}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="default"
              onClick={() => {
                if (!canSave) return;
                onAddEntry(draft.trim());
                setDraft("");
              }}
              disabled={!canSave}
            >
              Keep this note
            </Button>
            <p className="text-[12px] text-[color:var(--text-on-surface-muted)]">
              Check-ins already find their way here on their own.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div
              className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--text-kicker)]"
              aria-hidden
            >
              <span
                aria-hidden
                className="h-px flex-1 bg-[color:var(--surface-violet-medium)]"
              />
              <span>Or sit with what you wrote</span>
              <span
                aria-hidden
                className="h-px flex-1 bg-[color:var(--surface-violet-medium)]"
              />
            </div>
            <ReflectWithAIPanel text={draft} buildContext={buildReflectionContext} />
          </div>
        </div>
      </section>

      <div className="relative flex flex-col gap-3">
        {sortedEntries.length === 0 ? (
          <p
            className="px-1 py-2 text-[13px] leading-relaxed text-[color:var(--text-on-surface-muted)]"
            style={{ lineHeight: 1.7 }}
          >
            Your page is still blank — and that's okay. Your next check-in will rest here
            gently.
          </p>
        ) : (
          <div className="journal-timeline">
            {sortedEntries.map((entry) => (
              <div key={entry.id} className="journal-row">
                <div className="journal-dot" />
                <JournalCard
                  entry={entry}
                  recentMoods={recentMoods}
                  sortedEntries={sortedEntries}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

function RhythmCard({
  weekCount,
  latest,
  checkins,
  manual,
}: {
  weekCount: number;
  latest: number | null;
  checkins: number;
  manual: number;
}) {
  return (
    <section className="relative" data-stagger>
      <div className="relative flex flex-col gap-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--text-kicker)]">
          Your gentle rhythm
        </p>
        <h3
          className="font-serif tracking-[-0.03em] text-foreground"
          style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.2 }}
        >
          {weekCount === 0
            ? "A quiet week so far"
            : weekCount === 1
              ? "1 little moment this week"
              : `${weekCount} little moments this week`}
        </h3>
        <p className="text-[12px] text-[color:var(--text-on-surface-muted)]">
          Your last words {latest ? formatDateTime(latest) : "will live here soon"}
        </p>

        <div className="grid grid-cols-2 gap-2">
          <RhythmStat
            tone="warm"
            icon={<BookHeart className="size-4" />}
            value={checkins}
            label="Check-in moments"
          />
          <RhythmStat
            tone="fuchsia"
            icon={<Heart className="size-4" />}
            value={manual}
            label="Heart notes"
          />
        </div>
      </div>
    </section>
  );
}

function RhythmStat({
  icon,
  value,
  label,
  tone,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  tone: "warm" | "fuchsia";
}) {
  const iconBg =
    tone === "warm" ? "bg-[var(--stat-warm-icon-bg)]" : "bg-[var(--surface-fuchsia-low)]";
  const iconColor =
    tone === "warm"
      ? "text-[color:var(--stat-warm-icon)]"
      : "text-[color:var(--surface-fuchsia-text)]";
  const valueColor =
    tone === "warm"
      ? "text-[color:var(--stat-warm-value)]"
      : "text-[color:var(--surface-fuchsia-text)]";
  const accent = tone === "warm" ? "var(--stat-warm-accent)" : "var(--stat-warm-accent)";

  return (
    <div className="relative isolate flex min-h-[88px] flex-col justify-between gap-2 overflow-hidden rounded-2xl p-3.5">
      <span
        aria-hidden
        className="block h-[2px] w-10 rounded-full"
        style={{ background: `linear-gradient(to right, transparent, ${accent})` }}
      />
      <span
        className={`grid size-8 shrink-0 place-items-center rounded-xl ${iconBg} ${iconColor}`}
        aria-hidden
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span
          className={`block font-serif text-[22px] font-medium leading-none tracking-[-0.02em] ${valueColor}`}
        >
          {value}
        </span>
        <span className="mt-2 block text-[10px] font-semibold uppercase leading-tight tracking-[0.22em] text-[color:var(--text-kicker)]">
          {label}
        </span>
      </span>
    </div>
  );
}

const JournalCard: React.FC<{
  entry: JournalEntry;
  recentMoods: MoodEntry[];
  sortedEntries: JournalEntry[];
}> = ({ entry, recentMoods, sortedEntries }) => {
  const isCheckIn = entry.source === "checkin";
  const meta = entry.mood ? getMoodMeta(entry.mood as MoodType) : null;

  return (
    <div className="flex flex-col gap-2.5 py-1">
      <div className="flex items-center gap-2.5">
        {meta && (
          <span
            className="size-2 shrink-0 rounded-full"
            style={{
              background: meta.color,
              boxShadow: `0 0 8px ${meta.color}55`,
            }}
          />
        )}
        <span className="text-[12px] text-[color:var(--text-on-surface-muted)]">
          {formatDateTime(entry.timestamp)}
        </span>
        <span
          className="ml-auto text-[10px] font-semibold uppercase tracking-[0.18em]"
          style={{
            color: isCheckIn ? "var(--text-warn)" : "var(--text-on-surface-muted)",
          }}
        >
          {isCheckIn ? "From a check-in" : "Heart note"}
        </span>
      </div>

      {meta && (
        <div
          className="font-serif text-[14px] font-medium text-foreground"
          style={{ letterSpacing: "-0.01em" }}
        >
          {meta.label}
        </div>
      )}

      {entry.tags && entry.tags.length > 0 && (
        <p className="m-0 text-[11px] text-[color:var(--text-on-surface-muted)]">
          {entry.tags.join(" · ")}
        </p>
      )}

      {entry.content ? (
        <p
          className="m-0 text-[13px] leading-relaxed text-[color:var(--text-on-surface-muted)]"
          style={{ lineHeight: 1.65 }}
        >
          {entry.content}
        </p>
      ) : (
        <p
          className="m-0 text-[13px] italic text-[color:var(--text-on-surface-soft)]"
          style={{ lineHeight: 1.65 }}
        >
          A quiet check-in with no words — that's perfectly okay too.
        </p>
      )}

      <ReflectWithAIPanel
        text={entry.content}
        buttonLabel="Reflect on this again"
        compact
        buildContext={() => ({
          existingEntryId: entry.id,
          mood: meta ? { type: meta.id, label: meta.label } : null,
          recentMoods: recentMoods
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 3)
            .map((m) => ({
              date: m.date,
              mood: m.mood,
              moodLabel: getMoodMeta(m.mood)?.label ?? m.mood,
              journal: m.journal ? m.journal.slice(0, 240) : undefined,
            })),
          recentJournal: sortedEntries.slice(0, 2).map((e) => ({
            date: e.date,
            content: e.content.slice(0, 240),
            mood: e.mood,
          })),
        })}
      />
    </div>
  );
};
