import React, { useState, useMemo } from "react";
import { MoodEntry } from "../../types";
import { getMoodMeta } from "../../data";

interface MoodHistoryCalendarProps {
  history: MoodEntry[];
  showDetail?: boolean;
}

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function isoToday(): string {
  return new Date().toISOString().split("T")[0];
}

function startOfWeekSunday(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function addMonths(date: Date, delta: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + delta);
  return next;
}

interface DayDetailProps {
  entry: MoodEntry | undefined;
  date: string;
}

const DayDetail: React.FC<DayDetailProps> = ({ entry, date }) => {
  if (!entry) {
    return (
      <div
        className="detail-enter"
        style={{
          textAlign: "center",
          padding: "20px 0",
          color: "rgba(188,194,255,0.26)",
          fontSize: 13,
        }}
      >
        No entry recorded for this day
      </div>
    );
  }

  const meta = getMoodMeta(entry.mood);
  const socialItems = entry.socialInteractions ?? [];

  return (
    <div
      className="detail-enter"
      style={{
        background: "rgba(188,194,255,0.04)",
        borderRadius: 16,
        padding: 18,
        marginTop: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: meta.color,
            flexShrink: 0,
          }}
        />
        <span
          className="font-serif"
          style={{ fontSize: 17, color: "#e8eaf0" }}
        >
          {meta.label}
        </span>
        <span style={{ fontSize: 11, color: "rgba(188,194,255,0.32)", marginLeft: "auto" }}>
          {formatDate(date)}
        </span>
      </div>

      {entry.tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
          {entry.tags.map((t) => (
            <span
              key={t}
              style={{
                padding: "3px 10px",
                borderRadius: 999,
                fontSize: 11,
                background: "rgba(188,194,255,0.07)",
                color: "rgba(188,194,255,0.45)",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {entry.journal && (
        <p
          style={{
            fontSize: 13,
            color: "rgba(188,194,255,0.42)",
            lineHeight: 1.6,
            fontStyle: "italic",
          }}
        >
          "{entry.journal}"
        </p>
      )}

      {socialItems.length > 0 && (
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "1.1px",
              textTransform: "uppercase",
              color: "rgba(188,194,255,0.35)",
            }}
          >
            Social interactions
          </p>
          {socialItems.map((interaction) => (
            <div
              key={interaction.id}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                background: "rgba(188,194,255,0.06)",
                color: "rgba(188,194,255,0.5)",
                fontSize: 12,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <span style={{ color: "#e8eaf0", fontWeight: 600 }}>
                  {interaction.name || "Unnamed"}
                </span>
                <span>
                  {interaction.relationship.replace("_", " ")} · {interaction.interactionType.replace("_", " ")}
                </span>
              </div>
              {interaction.durationMinutes !== undefined && (
                <div style={{ marginTop: 4 }}>Duration: {interaction.durationMinutes} min</div>
              )}
              {interaction.feelings.length > 0 && (
                <div style={{ marginTop: 4 }}>
                  Feeling: {interaction.feelings.join(", ")}
                </div>
              )}
              {interaction.notes && (
                <div style={{ marginTop: 4, color: "rgba(220,224,255,0.7)" }}>
                  {interaction.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Weekly View ──────────────────────────────────────────────────────────────

const WeekView: React.FC<{ history: MoodEntry[]; showDetail: boolean }> = ({ history, showDetail }) => {
  const today = isoToday();
  const entryMap = useMemo(() => {
    const m: Record<string, MoodEntry> = {};
    history.forEach((e) => { m[e.date] = e; });
    return m;
  }, [history]);

  const weekDates = useMemo(() => {
    const start = startOfWeekSunday(new Date());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d.toISOString().split("T")[0];
    });
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(
    weekDates.find((d) => entryMap[d]) ?? today
  );

  return (
    <div>
      {/* Week label: edit copy here. */}
      <p
        style={{
          fontSize: 10,
          letterSpacing: "0.8px",
          textTransform: "uppercase",
          color: "rgba(188,194,255,0.35)",
          marginBottom: 10,
        }}
      >
        This week
      </p>

      {/* Week strip: edit spacing/sizing here. */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
        {weekDates.map((date) => {
          const entry = entryMap[date];
          const isToday = date === today;
          const isSelected = date === selectedDate;
          const d = new Date(date + "T12:00:00");
          const dotColor = entry ? getMoodMeta(entry.mood).color : "rgba(188,194,255,0.18)";

          return (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                padding: 0,
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.4px",
                    color: "rgba(220,224,255,0.7)",
                  }}
                >
                  {DAYS_SHORT[d.getDay()]}
                </span>
                <span
                  style={{
                    fontSize: 14,
                    color: isSelected ? "#e8eaf0" : "rgba(188,194,255,0.6)",
                    fontWeight: isSelected ? 600 : 500,
                  }}
                >
                  {d.getDate()}
                </span>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: dotColor,
                    boxShadow: entry ? `0 0 0 3px ${dotColor}22` : "none",
                    border: isToday ? "1px solid rgba(188,194,255,0.4)" : "none",
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {showDetail && <DayDetail entry={entryMap[selectedDate]} date={selectedDate} />}
    </div>
  );
};

// ─── Monthly View ─────────────────────────────────────────────────────────────

const MonthView: React.FC<{ history: MoodEntry[]; showDetail: boolean }> = ({ history, showDetail }) => {
  const today = new Date();
  const entryMap = useMemo(() => {
    const m: Record<string, MoodEntry> = {};
    history.forEach((e) => { m[e.date] = e; });
    return m;
  }, [history]);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);

  const base = addMonths(today, monthOffset);
  const year  = base.getFullYear();
  const month = base.getMonth();
  const firstDay   = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayIso = isoToday();

  function toIso(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return (
    <div>
      {/* Month header + nav: edit typography here. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <button
          onClick={() => setMonthOffset((v) => v - 1)}
          aria-label="Previous month"
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            border: "none",
            background: "rgba(188,194,255,0.06)",
            color: "rgba(188,194,255,0.6)",
            cursor: "pointer",
          }}
        >
          ‹
        </button>
        <p className="font-serif" style={{ fontSize: 16, color: "#e8eaf0" }}>
          {base.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </p>
        <button
          onClick={() => setMonthOffset((v) => v + 1)}
          aria-label="Next month"
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            border: "none",
            background: "rgba(188,194,255,0.06)",
            color: "rgba(188,194,255,0.6)",
            cursor: "pointer",
          }}
        >
          ›
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
        {DAYS_SHORT.map((d, i) => (
          <div
            key={i}
            style={{
              textAlign: "center",
              fontSize: 10,
              color: "rgba(188,194,255,0.35)",
              padding: "4px 0",
              textTransform: "uppercase",
              letterSpacing: "0.4px",
            }}
          >
            {d}
          </div>
        ))}

        {/* blank cells */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`blank-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const iso = toIso(day);
          const entry = entryMap[iso];
          const isToday = iso === todayIso;
          const isSelected = iso === selectedDate;
          const dotColor = entry ? getMoodMeta(entry.mood).color : "rgba(188,194,255,0.2)";

          return (
            <button
              key={day}
              onClick={() => setSelectedDate(iso === selectedDate ? null : iso)}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                padding: 0,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  minHeight: 40,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  color: isSelected ? "#e8eaf0" : "rgba(188,194,255,0.5)",
                  fontSize: 12,
                  fontWeight: isSelected ? 600 : 500,
                }}
              >
                <span>{day}</span>
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: dotColor,
                    boxShadow: entry ? `0 0 0 3px ${dotColor}22` : "none",
                    outline: isToday ? "1px solid rgba(188,194,255,0.4)" : "none",
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {showDetail && selectedDate && (
        <DayDetail entry={entryMap[selectedDate]} date={selectedDate} />
      )}
    </div>
  );
};

// ─── Main Calendar ────────────────────────────────────────────────────────────

export const MoodHistoryCalendar: React.FC<MoodHistoryCalendarProps> = ({
  history,
  showDetail = true,
}) => {
  const [view, setView] = useState<"week" | "month">("week");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Toggle: edit pill colors here. */}
      <div
        style={{
          display: "flex",
          background: "rgba(255,255,255,0.03)",
          borderRadius: 999,
          padding: 3,
          gap: 4,
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)",
        }}
      >
        {(["week", "month"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              flex: 1,
              padding: "8px 10px",
              borderRadius: 999,
              border: "none",
              outline: "none",
              fontSize: 12,
              fontWeight: 500,
              fontFamily: "Plus Jakarta Sans, sans-serif",
              cursor: "pointer",
              background: view === v ? "rgba(255,255,255,0.08)" : "transparent",
              color: view === v ? "#e8eaf0" : "rgba(188,194,255,0.45)",
              transition: "all 0.2s ease",
            }}
          >
            {v === "week" ? "Weekly" : "Monthly"}
          </button>
        ))}
      </div>

      {view === "week" ? (
        <WeekView history={history} showDetail={showDetail} />
      ) : (
        <MonthView history={history} showDetail={showDetail} />
      )}
    </div>
  );
};
