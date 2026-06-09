import React, { useMemo, useState } from "react";
import { Button } from "../components/ui/button";
import { JournalInput } from "../components/mood/JournalInput";
import { SectionLabel } from "../components/shared/SectionLabel";
import { JournalEntry, MoodType } from "../types";
import { getMoodMeta } from "../data";

interface JournalScreenProps {
  entries: JournalEntry[];
  onAddEntry: (content: string) => void;
}

export const JournalScreen: React.FC<JournalScreenProps> = ({ entries, onAddEntry }) => {
  const [draft, setDraft] = useState("");

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => b.timestamp - a.timestamp),
    [entries]
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

  return (
    <div
      className="screen-enter"
      style={{ padding: "30px 22px 52px", display: "flex", flexDirection: "column", gap: 24 }}
    >
      <div>
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
          Words just for you
        </p>
        <h2
          className="font-serif"
          style={{ fontSize: 26, fontWeight: 400, color: "#e8eaf0", marginBottom: 4 }}
        >
          A page for your words
        </h2>
        <p style={{ fontSize: 13, color: "rgba(188,194,255,0.36)" }}>
          Your check-ins and your quiet little notes, held together
        </p>
      </div>

      <div className="journal-hero">
        <div>
          <p
            style={{
              fontSize: 12,
              letterSpacing: "1.1px",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.6)",
              marginBottom: 8,
            }}
          >
            Your gentle rhythm
          </p>
          <div
            className="font-serif"
            style={{ fontSize: 22, color: "#f8f4ff", marginBottom: 6 }}
          >
            {stats.weekCount === 0
              ? "A quiet week so far"
              : stats.weekCount === 1
                ? "1 little moment this week"
                : `${stats.weekCount} little moments this week`}
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
            Your last words {stats.latest ? new Date(stats.latest).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }) : "will live here soon"}
          </p>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          <div style={statPillStyle}>
            <span style={statValueStyle}>{stats.checkins}</span>
            <span style={statLabelStyle}>check-in moments</span>
          </div>
          <div style={statPillStyle}>
            <span style={statValueStyle}>{stats.manual}</span>
            <span style={statLabelStyle}>heart notes</span>
          </div>
        </div>
      </div>

      <div className="journal-compose">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <SectionLabel>Write a little something</SectionLabel>
          <span style={{ fontSize: 11, color: "rgba(188,194,255,0.45)" }}>
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
          <p style={{ fontSize: 12, color: "rgba(188,194,255,0.4)" }}>
            Check-ins already find their way here on their own.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {sortedEntries.length === 0 && (
          <div
            style={{
              padding: "14px 16px",
              borderRadius: 14,
              background: "rgba(188,194,255,0.04)",
              color: "rgba(188,194,255,0.35)",
              fontSize: 13,
            }}
          >
            Your page is still blank — and that's okay. Your next check-in will rest here gently.
          </div>
        )}
        {sortedEntries.length > 0 && (
          <div className="journal-timeline">
            {sortedEntries.map((entry) => (
              <div key={entry.id} className="journal-row">
                <div className="journal-dot" />
                <JournalCard entry={entry} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const JournalCard: React.FC<{ entry: JournalEntry }> = ({ entry }) => {
  const isCheckIn = entry.source === "checkin";
  const meta = entry.mood ? getMoodMeta(entry.mood as MoodType) : null;

  return (
    <div className="journal-card">
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
        <span style={{ fontSize: 12, color: "rgba(188,194,255,0.5)" }}>
          {new Date(entry.timestamp).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 10,
            letterSpacing: "0.6px",
            textTransform: "uppercase",
            color: isCheckIn ? "rgba(255,185,84,0.7)" : "rgba(188,194,255,0.45)",
          }}
        >
          {isCheckIn ? "From a check-in" : "Heart note"}
        </span>
      </div>

      {meta && (
        <div style={{ fontSize: 14, color: "#e8eaf0" }}>
          {meta.label}
        </div>
      )}

      {entry.tags && entry.tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {entry.tags.map((tag) => (
            <span
              key={tag}
              style={{
                padding: "3px 10px",
                borderRadius: 999,
                fontSize: 11,
                background: "rgba(188,194,255,0.07)",
                color: "rgba(188,194,255,0.45)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {entry.content && (
        <p style={{ fontSize: 13, color: "rgba(188,194,255,0.5)", lineHeight: 1.6 }}>
          {entry.content}
        </p>
      )}

      {!entry.content && (
        <p style={{ fontSize: 13, color: "rgba(188,194,255,0.35)", lineHeight: 1.6 }}>
          A quiet check-in with no words — that's perfectly okay too.
        </p>
      )}
    </div>
  );
};

const statPillStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 14,
  background: "rgba(255,255,255,0.12)",
  color: "#f8f4ff",
  display: "flex",
  flexDirection: "column",
  gap: 2,
  textAlign: "center",
};

const statValueStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
};

const statLabelStyle: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.7)",
};
