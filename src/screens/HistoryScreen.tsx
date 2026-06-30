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
          Looking back, gently
        </p>
        <h2
          className="mt-1.5 font-serif tracking-[-0.03em] text-foreground"
          style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.15 }}
        >
          Your days, in color
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--text-on-surface-muted)]">
          Tap any day to revisit how you felt
        </p>
      </div>

      <div className="relative">
        <MoodHistoryCalendar
          history={history}
          showDetail
          onUpdateEntry={onUpdateEntry}
          onDeleteEntry={onDeleteEntry}
        />
      </div>

      {loading ? (
        <p
          className="text-center text-xs text-[color:var(--text-on-surface-muted)]"
          style={{ padding: "16px 0" }}
        >
          Gathering your days…
        </p>
      ) : isEmpty ? (
        <p
          className="text-center text-[13px] leading-relaxed text-[color:var(--text-on-surface-muted)]"
          style={{ padding: "16px 0", lineHeight: 1.7 }}
        >
          Your story is just beginning. Whenever you're ready,
          <br />
          the <strong style={{ color: "var(--text-on-surface-strong)" }}>
            Check in
          </strong>{" "}
          tab is waiting with a soft seat for you.
        </p>
      ) : null}
    </div>
  );
};
