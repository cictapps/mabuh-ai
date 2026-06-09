import React, { useMemo } from "react";
import { MoodEntry } from "../types";
import { MoodHistoryCalendar } from "../components/history/MoodHistoryCalendar";
import { getMoodMeta } from "../data";

interface HistoryScreenProps {
  history: MoodEntry[];
  loading?: boolean;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ history, loading }) => {
  const latestThree = useMemo(
    () => [...history].sort((a, b) => b.timestamp - a.timestamp).slice(0, 3),
    [history]
  );

  const isEmpty = !loading && history.length === 0;

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

      <MoodHistoryCalendar history={history} showDetail={false} />

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

      {/* History list: shows latest 3 entries only. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {latestThree.map((entry) => {
          const meta = getMoodMeta(entry.mood);
          const socialCount = entry.socialInteractions?.length ?? 0;
          return (
            <div
              key={entry.id}
              style={{
                background: "rgba(188,194,255,0.04)",
                borderRadius: 16,
                padding: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: meta.color,
                    boxShadow: `0 0 8px ${meta.color}55`,
                  }}
                />
                <span className="font-serif" style={{ fontSize: 16, color: "#e8eaf0" }}>
                  {meta.label}
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 11,
                    color: "rgba(188,194,255,0.35)",
                  }}
                >
                  {new Date(entry.timestamp).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              {entry.tags.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
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
              {entry.journal && (
                <p
                  style={{
                    fontSize: 12,
                    color: "rgba(188,194,255,0.42)",
                    lineHeight: 1.6,
                    marginTop: 10,
                  }}
                >
                  "{entry.journal}"
                </p>
              )}
              {socialCount > 0 && (
                <p
                  style={{
                    fontSize: 12,
                    color: "rgba(188,194,255,0.35)",
                    marginTop: 8,
                  }}
                >
                  {socialCount === 1 ? "A gentle connection" : "Kind connections"}: {socialCount}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
