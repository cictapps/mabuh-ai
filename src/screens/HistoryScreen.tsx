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
            fontWeight: 500,
            letterSpacing: "1.3px",
            textTransform: "uppercase",
            color: "rgba(188,194,255,0.3)",
            marginBottom: 10,
          }}
        >
          Looking back, gently
        </p>
        <h2
          className="font-serif"
          style={{ fontSize: 26, fontWeight: 400, color: "#e8eaf0", marginBottom: 4 }}
        >
          Your days, in color
        </h2>
        <p style={{ fontSize: 13, color: "rgba(188,194,255,0.36)" }}>
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
            background: "rgba(188,194,255,0.04)",
            color: "rgba(188,194,255,0.4)",
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
            background: "rgba(188,194,255,0.04)",
            border: "1px dashed rgba(188,194,255,0.16)",
            color: "rgba(188,194,255,0.55)",
            fontSize: 13,
            lineHeight: 1.6,
            textAlign: "center",
          }}
        >
          Your story is just beginning. Whenever you're ready,
          <br />
          the <strong style={{ color: "rgba(216,220,230,0.85)" }}>Check in</strong> tab is
          waiting with a soft seat for you.
        </div>
      ) : null}
    </div>
  );
};
