import React, { useMemo, useState } from "react";
import { Button } from "../components/ui/button";
import { JournalInput } from "../components/mood/JournalInput";
import { ReflectWithAIPanel } from "../components/journal/ReflectWithAIPanel";
import { SectionLabel } from "../components/shared/SectionLabel";
import { JournalEntry, MoodEntry, MoodType } from "../types";
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
      className="screen-enter"
      style={{
        padding: "30px 22px 52px",
        display: "flex",
        flexDirection: "column",
        gap: 32,
      }}
    >
      <div>
        <p
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "1.3px",
            textTransform: "uppercase",
            color: "var(--surface-violet-icon-hover)",
            marginBottom: 10,
          }}
        >
          Words just for you
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
          A page for your words
        </h2>
        <p style={{ fontSize: 13, color: "var(--surface-violet-icon-hover)" }}>
          Your check-ins and your quiet little notes, held together
        </p>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 18,
          padding: "4px 0",
        }}
      >
        <div>
          <p
            style={{
              fontSize: 11,
              letterSpacing: "1.1px",
              textTransform: "uppercase",
              color: "var(--surface-violet-icon-hover)",
              marginBottom: 10,
            }}
          >
            Your gentle rhythm
          </p>
          <div
            className="font-serif"
            style={{ fontSize: 22, color: "var(--text-on-surface)", marginBottom: 8 }}
          >
            {stats.weekCount === 0
              ? "A quiet week so far"
              : stats.weekCount === 1
                ? "1 little moment this week"
                : `${stats.weekCount} little moments this week`}
          </div>
          <p style={{ fontSize: 12, color: "var(--surface-violet-icon-hover)" }}>
            Your last words{" "}
            {stats.latest ? formatDateTime(stats.latest) : "will live here soon"}
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 18,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: "var(--text-on-surface)",
              }}
            >
              {stats.checkins}
            </div>
            <div
              style={{
                fontSize: 10,
                letterSpacing: "0.6px",
                textTransform: "uppercase",
                color: "var(--surface-violet-icon-hover)",
                marginTop: 4,
              }}
            >
              check-in moments
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: "var(--text-on-surface)",
              }}
            >
              {stats.manual}
            </div>
            <div
              style={{
                fontSize: 10,
                letterSpacing: "0.6px",
                textTransform: "uppercase",
                color: "var(--surface-violet-icon-hover)",
                marginTop: 4,
              }}
            >
              heart notes
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <SectionLabel>Write a little something</SectionLabel>
          <span style={{ fontSize: 11, color: "var(--surface-violet-icon-hover)" }}>
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
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
          <p style={{ fontSize: 12, color: "var(--surface-violet-icon-hover)" }}>
            Check-ins already find their way here on their own.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 10.5,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--surface-violet-icon-hover)",
            }}
          >
            <span
              aria-hidden
              style={{ flex: 1, height: 1, background: "var(--surface-violet-medium)" }}
            />
            <span>Or sit with what you wrote</span>
            <span
              aria-hidden
              style={{ flex: 1, height: 1, background: "var(--surface-violet-medium)" }}
            />
          </div>
          <ReflectWithAIPanel text={draft} buildContext={buildReflectionContext} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {sortedEntries.length === 0 && (
          <p
            style={{
              margin: 0,
              padding: "16px 0",
              color: "var(--surface-violet-icon-hover)",
              fontSize: 13,
              lineHeight: 1.7,
            }}
          >
            Your page is still blank — and that's okay. Your next check-in will rest here
            gently.
          </p>
        )}
        {sortedEntries.length > 0 && (
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

const JournalCard: React.FC<{
  entry: JournalEntry;
  recentMoods: MoodEntry[];
  sortedEntries: JournalEntry[];
}> = ({ entry, recentMoods, sortedEntries }) => {
  const isCheckIn = entry.source === "checkin";
  const meta = entry.mood ? getMoodMeta(entry.mood as MoodType) : null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: "4px 0",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {meta && (
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: meta.color,
              boxShadow: `0 0 8px ${meta.color}55`,
            }}
          />
        )}
        <span style={{ fontSize: 12, color: "var(--surface-violet-icon-hover)" }}>
          {formatDateTime(entry.timestamp)}
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 10,
            letterSpacing: "0.6px",
            textTransform: "uppercase",
            color: isCheckIn
              ? "rgba(255,185,84,0.7)"
              : "var(--surface-violet-icon-hover)",
          }}
        >
          {isCheckIn ? "From a check-in" : "Heart note"}
        </span>
      </div>

      {meta && (
        <div style={{ fontSize: 14, color: "var(--text-on-surface)" }}>{meta.label}</div>
      )}

      {entry.tags && entry.tags.length > 0 && (
        <p
          style={{
            fontSize: 11,
            color: "var(--surface-violet-icon-hover)",
            margin: 0,
          }}
        >
          {entry.tags.join(" · ")}
        </p>
      )}

      {entry.content && (
        <p
          style={{
            fontSize: 13,
            color: "var(--surface-violet-icon-hover)",
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {entry.content}
        </p>
      )}

      {!entry.content && (
        <p
          style={{
            fontSize: 13,
            color: "var(--surface-violet-icon-hover)",
            lineHeight: 1.6,
            margin: 0,
          }}
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
