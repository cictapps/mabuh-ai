import React from "react";
import type { MoodEntry } from "../types";
import { MoodHistoryCalendar } from "../components/history/MoodHistoryCalendar";
import type { MoodEntryInput } from "../lib/db/moodRepository";

interface HistoryScreenProps {
  history: MoodEntry[];
  loading?: boolean;
  onUpdateEntry: (id: string, input: MoodEntryInput) => Promise<boolean>;
  onDeleteEntry: (id: string) => Promise<boolean>;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  history,
  loading,
  onUpdateEntry,
  onDeleteEntry,
}) => {
  const isEmpty = !loading && history.length === 0;

  return (
    <div
      className="screen-enter"
      style={{
        padding: "30px 22px 52px",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <div>
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
          Looking back, gently
        </p>
        <h2
          className="font-serif"
          style={{
            fontSize: 26,
            fontWeight: 500,
            color: "var(--text-on-surface)",
            marginBottom: 4,
            letterSpacing: "-0.03em",
          }}
        >
          Your days, in color
        </h2>
        <p
          style={{
            fontSize: 13,
            color: "var(--text-on-surface-muted)",
            lineHeight: 1.55,
          }}
        >
          Tap any day to revisit how you felt
        </p>
      </div>

      <MoodHistoryCalendar
        history={history}
        showDetail
        onUpdateEntry={onUpdateEntry}
        onDeleteEntry={onDeleteEntry}
      />

      {loading ? (
        <div
          style={{
            padding: "14px 16px",
            borderRadius: 14,
            background: "var(--surface-violet-low)",
            color: "var(--text-on-surface-muted)",
            fontSize: 12,
            textAlign: "center",
          }}
        >
          Gathering your days…
        </div>
      ) : isEmpty ? (
        <div
          style={{
            padding: "20px 18px",
            borderRadius: 16,
            background: "var(--surface-violet-low)",
            border: "1px dashed var(--border-violet-medium)",
            color: "var(--text-on-surface-muted)",
            fontSize: 13,
            lineHeight: 1.6,
            textAlign: "center",
          }}
        >
          Your story is just beginning. Whenever you're ready,
          <br />
          the <strong style={{ color: "var(--text-on-surface-strong)" }}>
            Check in
          </strong>{" "}
          tab is waiting with a soft seat for you.
        </div>
      ) : null}
    </div>
  );
};
