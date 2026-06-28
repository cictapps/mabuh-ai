import React, { useState, useMemo, useCallback } from "react";
import {
  animate,
  motion,
  type PanInfo,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import { Pencil, Trash2, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import type { MoodEntry } from "../../types";
import { getMoodMeta } from "../../data";
import { MoodGradientBar } from "./MoodGradientBar";
import { EditMoodEntryDialog } from "./EditMoodEntryDialog";
import type { MoodEntryInput } from "../../lib/db/moodRepository";

interface MoodHistoryCalendarProps {
  history: MoodEntry[];
  showDetail?: boolean;
  onUpdateEntry: (id: string, input: MoodEntryInput) => Promise<boolean>;
  onDeleteEntry: (id: string) => Promise<boolean>;
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
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function addMonths(date: Date, delta: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + delta);
  return next;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateTime(iso: string, ts: number): string {
  return `${formatDate(iso)} · ${formatTime(ts)}`;
}

interface DayDetailProps {
  entries: MoodEntry[];
  date: string;
  onEdit: (entry: MoodEntry) => void;
  onAskDelete: (entry: MoodEntry) => void;
}

const DayDetail: React.FC<DayDetailProps> = ({ entries, date, onEdit, onAskDelete }) => {
  if (entries.length === 0) {
    return (
      <div
        className="detail-enter"
        style={{
          textAlign: "center",
          padding: "20px 0",
          color: "var(--text-on-surface-muted)",
          fontSize: 13,
          lineHeight: 1.55,
        }}
      >
        Nothing was shared for this day — and that's okay
      </div>
    );
  }

  return (
    <div
      className="detail-enter"
      style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "var(--text-kicker)",
          margin: 0,
        }}
      >
        {entries.length === 1 ? "1 check-in" : `${entries.length} check-ins`} ·{" "}
        {formatDate(date)}
        {entries.length > 0
          ? ` · first at ${formatTime(entries[0]!.timestamp)}${
              entries.length > 1
                ? ` · last at ${formatTime(entries[entries.length - 1]!.timestamp)}`
                : ""
            }`
          : ""}
      </p>
      {entries.map((entry) => (
        <EntryCard
          key={entry.id}
          entry={entry}
          onEdit={onEdit}
          onAskDelete={onAskDelete}
        />
      ))}
    </div>
  );
};

const EntryCard: React.FC<{
  entry: MoodEntry;
  onEdit: (entry: MoodEntry) => void;
  onAskDelete: (entry: MoodEntry) => void;
}> = ({ entry, onEdit, onAskDelete }) => {
  const meta = getMoodMeta(entry.mood);
  const socialItems = entry.socialInteractions ?? [];
  const hasDetails =
    entry.tags.length > 0 ||
    Boolean(entry.journal) ||
    Boolean(entry.dayNote?.trim()) ||
    socialItems.length > 0;

  return (
    <SwipeableEntry entry={entry} onEdit={onEdit} onAskDelete={onAskDelete}>
      <div
        style={{
          position: "relative",
          display: "flex",
          minHeight: 52,
          flexDirection: "column",
          justifyContent: "center",
          background: "rgb(27 30 39)",
          borderRadius: 16,
          padding: "16px 16px 16px 34px",
        }}
      >
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: 9,
            top: "50%",
            display: "inline-flex",
            alignItems: "center",
            color: "var(--text-on-surface-softest)",
            transform: "translateY(-50%)",
          }}
        >
          <ChevronLeft size={10} strokeWidth={1.8} />
          <ChevronRight size={10} strokeWidth={1.8} style={{ marginLeft: -4 }} />
        </span>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: hasDetails ? 8 : 0,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: meta.color,
              flexShrink: 0,
              boxShadow: `0 0 0 3px ${meta.color}22`,
            }}
          />
          <span
            className="font-serif"
            style={{ fontSize: 16, color: "var(--text-on-surface)" }}
          >
            {meta.label}
          </span>
          <span
            style={{
              fontSize: 11,
              color: "var(--surface-violet-icon-hover)",
              marginLeft: "auto",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatDateTime(entry.date, entry.timestamp)}
          </span>
        </div>

        {entry.tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
            {entry.tags.map((t) => (
              <span
                key={t}
                style={{
                  padding: "3px 10px",
                  borderRadius: 999,
                  fontSize: 11,
                  background: "var(--surface-violet-medium)",
                  color: "var(--surface-violet-icon-hover)",
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
              color: "var(--surface-violet-icon-hover)",
              lineHeight: 1.6,
              fontStyle: "italic",
              margin: 0,
            }}
          >
            "{entry.journal}"
          </p>
        )}

        {entry.dayNote && entry.dayNote.trim().length > 0 && (
          <p
            style={{
              marginTop: 8,
              fontSize: 12,
              color: "var(--surface-violet-icon-hover)",
              lineHeight: 1.5,
            }}
          >
            <span style={{ color: "var(--surface-violet-icon-hover)", fontWeight: 600 }}>
              Day note:
            </span>{" "}
            {entry.dayNote}
          </p>
        )}

        {socialItems.length > 0 && (
          <div
            style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}
          >
            {socialItems.map((interaction) => (
              <div
                key={interaction.id}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: "var(--surface-violet-medium)",
                  color: "var(--surface-violet-icon-hover)",
                  fontSize: 12,
                }}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between", gap: 10 }}
                >
                  <span style={{ color: "var(--text-on-surface)", fontWeight: 600 }}>
                    {interaction.name || "Unnamed"}
                  </span>
                  <span>
                    {interaction.relationship.replace("_", " ")} ·{" "}
                    {interaction.interactionType.replace("_", " ")}
                  </span>
                </div>
                {interaction.durationMinutes !== undefined && (
                  <div style={{ marginTop: 4 }}>
                    Duration: {interaction.durationMinutes} min
                  </div>
                )}
                {interaction.feelings.length > 0 && (
                  <div style={{ marginTop: 4 }}>
                    Feeling: {interaction.feelings.join(", ")}
                  </div>
                )}
                {interaction.notes && (
                  <div style={{ marginTop: 4, color: "var(--text-on-surface-strong)" }}>
                    {interaction.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </SwipeableEntry>
  );
};

const REVEAL_THRESHOLD = 56;
const ACTION_BUTTON_WIDTH = 104;
const COMMIT_THRESHOLD = 156;
const MAX_DRAG = 184;

const SwipeableEntry: React.FC<{
  entry: MoodEntry;
  onEdit: (entry: MoodEntry) => void;
  onAskDelete: (entry: MoodEntry) => void;
  children: React.ReactNode;
}> = ({ entry, onEdit, onAskDelete, children }) => {
  const x = useMotionValue(0);
  const prefersReducedMotion = useReducedMotion();
  const [revealed, setRevealed] = useState<"edit" | "delete" | null>(null);

  const snapTo = useCallback(
    (target: number) => {
      if (prefersReducedMotion) {
        x.set(target);
        return;
      }
      animate(x, target, {
        type: "spring",
        stiffness: 520,
        damping: 42,
        mass: 0.75,
      });
    },
    [prefersReducedMotion, x],
  );

  const close = useCallback(() => {
    setRevealed(null);
    snapTo(0);
  }, [snapTo]);

  const handleEdit = useCallback(() => {
    close();
    onEdit(entry);
  }, [close, onEdit, entry]);

  const handleDelete = useCallback(() => {
    close();
    onAskDelete(entry);
  }, [close, onAskDelete, entry]);

  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const current = x.get();
      const isQuickCommit =
        Math.abs(info.velocity.x) > 900 && Math.abs(current) > REVEAL_THRESHOLD;

      if (current >= COMMIT_THRESHOLD || (isQuickCommit && info.velocity.x > 0)) {
        handleEdit();
      } else if (current <= -COMMIT_THRESHOLD || (isQuickCommit && info.velocity.x < 0)) {
        handleDelete();
      } else if (current >= REVEAL_THRESHOLD) {
        snapTo(ACTION_BUTTON_WIDTH);
        setRevealed("edit");
      } else if (current <= -REVEAL_THRESHOLD) {
        snapTo(-ACTION_BUTTON_WIDTH);
        setRevealed("delete");
      } else {
        close();
      }
    },
    [close, handleDelete, handleEdit, snapTo, x],
  );

  return (
    <div
      data-horizontal-swipe
      style={{
        position: "relative",
        borderRadius: 16,
        overflow: "hidden",
        touchAction: "pan-y",
        userSelect: revealed ? "none" : "auto",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 1,
          borderRadius: 15,
          overflow: "hidden",
          background:
            "linear-gradient(90deg, #aeb7ff 0%, #cbb2ff 42%, #ff8f8f 58%, #ff7373 100%)",
        }}
      >
        <motion.button
          type="button"
          onClick={handleEdit}
          tabIndex={revealed === "edit" ? 0 : -1}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: 8,
            paddingLeft: 22,
            background: "transparent",
            color: "#171925",
            border: "none",
            cursor: "pointer",
            pointerEvents: revealed === "edit" ? "auto" : "none",
          }}
          aria-label={`Edit check-in from ${formatTime(entry.timestamp)}`}
        >
          <span
            aria-hidden
            style={{
              display: "grid",
              width: 38,
              height: 38,
              placeItems: "center",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.24)",
            }}
          >
            <Pencil size={18} strokeWidth={2.2} />
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.01em" }}>
            Edit
          </span>
        </motion.button>
        <motion.button
          type="button"
          onClick={handleDelete}
          tabIndex={revealed === "delete" ? 0 : -1}
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            flexDirection: "row-reverse",
            gap: 8,
            paddingRight: 22,
            background: "transparent",
            color: "#260b0b",
            border: "none",
            cursor: "pointer",
            pointerEvents: revealed === "delete" ? "auto" : "none",
          }}
          aria-label={`Delete check-in from ${formatTime(entry.timestamp)}`}
        >
          <span
            aria-hidden
            style={{
              display: "grid",
              width: 38,
              height: 38,
              placeItems: "center",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.24)",
            }}
          >
            <Trash2 size={18} strokeWidth={2.2} />
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.01em" }}>
            Delete
          </span>
        </motion.button>
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -MAX_DRAG, right: MAX_DRAG }}
        dragElastic={0.08}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        onTap={revealed ? close : undefined}
        style={{
          x,
          position: "relative",
          zIndex: 1,
          touchAction: "pan-y",
        }}
        aria-label="Swipe right to edit or left to delete this check-in"
      >
        {children}
      </motion.div>
    </div>
  );
};

// ─── Weekly View ──────────────────────────────────────────────────────────────

const WeekView: React.FC<{
  history: MoodEntry[];
  showDetail: boolean;
  onEdit: (entry: MoodEntry) => void;
  onAskDelete: (entry: MoodEntry) => void;
}> = ({ history, showDetail, onEdit, onAskDelete }) => {
  const today = isoToday();
  const entryMap = useMemo<Record<string, MoodEntry[]>>(() => {
    const m: Record<string, MoodEntry[]> = {};
    history.forEach((e) => {
      if (!m[e.date]) m[e.date] = [];
      m[e.date].push(e);
    });
    Object.values(m).forEach((arr) => arr.sort((a, b) => a.timestamp - b.timestamp));
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

  const weekEntries = useMemo(
    () => weekDates.flatMap((d) => entryMap[d] ?? []),
    [weekDates, entryMap],
  );

  const [selectedDate, setSelectedDate] = useState<string>(
    weekDates.find((d) => entryMap[d]?.length) ?? today,
  );

  return (
    <div>
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "var(--text-kicker)",
          margin: "0 0 8px",
        }}
      >
        This week, gently
      </p>

      <MoodGradientBar entries={weekEntries} period="week" />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 6,
          marginTop: 12,
        }}
      >
        {weekDates.map((date) => {
          const entries = entryMap[date] ?? [];
          const isToday = date === today;
          const isSelected = date === selectedDate;
          const d = new Date(date + "T12:00:00");
          const hasEntries = entries.length > 0;
          const dominantColor = hasEntries
            ? getMoodMeta(
                entries
                  .slice()
                  .sort(
                    (a, b) =>
                      entries.filter((e) => e.mood === a.mood).length -
                      entries.filter((e) => e.mood === b.mood).length,
                  )[0].mood,
              ).color
            : "var(--surface-violet-icon)";

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
              aria-label={`${d.toLocaleDateString("en-US", { weekday: "long" })}${hasEntries ? `, ${entries.length} check-in${entries.length > 1 ? "s" : ""}` : ", no check-ins"}`}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.4px",
                    color: "var(--text-on-surface-strong)",
                  }}
                >
                  {DAYS_SHORT[d.getDay()]}
                </span>
                <span
                  style={{
                    fontSize: 14,
                    color: isSelected
                      ? "var(--text-on-surface)"
                      : "var(--text-on-surface-muted)",
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
                    background: dominantColor,
                    boxShadow: hasEntries ? `0 0 0 3px ${dominantColor}22` : "none",
                    border: isToday
                      ? "1px solid var(--surface-violet-icon-hover)"
                      : "none",
                    position: "relative",
                  }}
                >
                  {entries.length > 1 ? (
                    <span
                      style={{
                        position: "absolute",
                        top: -3,
                        right: -7,
                        background: "var(--ring-node-bg-soft)",
                        color: "var(--text-on-surface)",
                        fontSize: 9,
                        fontWeight: 600,
                        padding: "0 4px",
                        borderRadius: 999,
                        lineHeight: "12px",
                        minWidth: 12,
                        textAlign: "center",
                      }}
                    >
                      {entries.length}
                    </span>
                  ) : null}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {showDetail && (
        <DayDetail
          entries={entryMap[selectedDate] ?? []}
          date={selectedDate}
          onEdit={onEdit}
          onAskDelete={onAskDelete}
        />
      )}
    </div>
  );
};

// ─── Monthly View ─────────────────────────────────────────────────────────────

const MonthView: React.FC<{
  history: MoodEntry[];
  showDetail: boolean;
  onEdit: (entry: MoodEntry) => void;
  onAskDelete: (entry: MoodEntry) => void;
}> = ({ history, showDetail, onEdit, onAskDelete }) => {
  const today = new Date();
  const entryMap = useMemo<Record<string, MoodEntry[]>>(() => {
    const m: Record<string, MoodEntry[]> = {};
    history.forEach((e) => {
      if (!m[e.date]) m[e.date] = [];
      m[e.date].push(e);
    });
    Object.values(m).forEach((arr) => arr.sort((a, b) => a.timestamp - b.timestamp));
    return m;
  }, [history]);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);

  const base = addMonths(today, monthOffset);
  const year = base.getFullYear();
  const month = base.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayIso = isoToday();

  const monthEntries = useMemo(() => {
    const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    return history
      .filter((e) => e.date.startsWith(monthPrefix))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [history, year, month]);

  function toIso(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return (
    <div>
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
            background: "var(--surface-violet-medium)",
            color: "var(--text-on-surface-muted)",
            cursor: "pointer",
          }}
        >
          ‹
        </button>
        <p
          className="font-serif"
          style={{ fontSize: 16, color: "var(--text-on-surface)", margin: 0 }}
        >
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
            background: "var(--surface-violet-medium)",
            color: "var(--text-on-surface-muted)",
            cursor: "pointer",
          }}
        >
          ›
        </button>
      </div>

      <MoodGradientBar entries={monthEntries} period="month" />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 8,
          marginTop: 14,
        }}
      >
        {DAYS_SHORT.map((d, i) => (
          <div
            key={i}
            style={{
              textAlign: "center",
              fontSize: 10,
              color: "var(--text-on-surface-muted)",
              padding: "4px 0",
              textTransform: "uppercase",
              letterSpacing: "0.4px",
              fontWeight: 600,
            }}
          >
            {d}
          </div>
        ))}

        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`blank-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const iso = toIso(day);
          const entries = entryMap[iso] ?? [];
          const isToday = iso === todayIso;
          const isSelected = iso === selectedDate;
          const hasEntries = entries.length > 0;
          const dominantColor = hasEntries
            ? getMoodMeta(
                entries
                  .slice()
                  .sort(
                    (a, b) =>
                      entries.filter((e) => e.mood === a.mood).length -
                      entries.filter((e) => e.mood === b.mood).length,
                  )[0].mood,
              ).color
            : "var(--surface-violet-icon-hover)";

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
                  color: isSelected
                    ? "var(--text-on-surface)"
                    : "var(--text-on-surface-muted)",
                  fontSize: 12,
                  fontWeight: isSelected ? 600 : 500,
                  position: "relative",
                }}
              >
                <span>{day}</span>
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: dominantColor,
                    boxShadow: hasEntries ? `0 0 0 3px ${dominantColor}22` : "none",
                    outline: isToday
                      ? "1px solid var(--surface-violet-icon-hover)"
                      : "none",
                    position: "relative",
                  }}
                >
                  {entries.length > 1 ? (
                    <span
                      style={{
                        position: "absolute",
                        top: -3,
                        right: -7,
                        background: "var(--ring-node-bg-soft)",
                        color: "var(--text-on-surface)",
                        fontSize: 9,
                        fontWeight: 600,
                        padding: "0 4px",
                        borderRadius: 999,
                        lineHeight: "12px",
                        minWidth: 12,
                        textAlign: "center",
                      }}
                    >
                      {entries.length}
                    </span>
                  ) : null}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {showDetail && selectedDate && (
        <DayDetail
          entries={entryMap[selectedDate] ?? []}
          date={selectedDate}
          onEdit={onEdit}
          onAskDelete={onAskDelete}
        />
      )}
    </div>
  );
};

// ─── Main Calendar ────────────────────────────────────────────────────────────

export const MoodHistoryCalendar: React.FC<MoodHistoryCalendarProps> = ({
  history,
  showDetail = true,
  onUpdateEntry,
  onDeleteEntry,
}) => {
  const [view, setView] = useState<"week" | "month">("week");
  const [editing, setEditing] = useState<MoodEntry | null>(null);
  const [pendingDelete, setPendingDelete] = useState<MoodEntry | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleAskDelete = useCallback((entry: MoodEntry) => {
    setPendingDelete(entry);
    setDeleteError(null);
  }, []);

  const handleCancelDelete = useCallback(() => {
    if (deleting) return;
    setPendingDelete(null);
    setDeleteError(null);
  }, [deleting]);

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const ok = await onDeleteEntry(pendingDelete.id);
      if (ok) {
        setPendingDelete(null);
      } else {
        setDeleteError("Could not delete that check-in. Please try again.");
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setDeleting(false);
    }
  }, [pendingDelete, deleting, onDeleteEntry]);

  const handleCloseEdit = useCallback(() => {
    setEditing(null);
  }, []);

  const handleSaveEdit = useCallback(
    async (id: string, input: MoodEntryInput) => {
      const ok = await onUpdateEntry(id, input);
      if (ok) setEditing(null);
      return ok;
    },
    [onUpdateEntry],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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
              fontWeight: 600,
              fontFamily: "Plus Jakarta Sans, sans-serif",
              cursor: "pointer",
              background: view === v ? "rgba(120,110,200,0.12)" : "transparent",
              color:
                view === v
                  ? "var(--text-on-surface-strong)"
                  : "var(--text-on-surface-muted)",
              transition: "all 0.2s ease",
            }}
          >
            {v === "week" ? "Weekly" : "Monthly"}
          </button>
        ))}
      </div>

      {view === "week" ? (
        <WeekView
          history={history}
          showDetail={showDetail}
          onEdit={setEditing}
          onAskDelete={handleAskDelete}
        />
      ) : (
        <MonthView
          history={history}
          showDetail={showDetail}
          onEdit={setEditing}
          onAskDelete={handleAskDelete}
        />
      )}

      <EditMoodEntryDialog
        open={editing !== null}
        entry={editing}
        onClose={handleCloseEdit}
        onSave={handleSaveEdit}
      />

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) handleCancelDelete();
        }}
      >
        <AlertDialogContent style={{ margin: 16 }}>
          <AlertDialogHeader>
            <span
              aria-hidden
              className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full"
              style={{
                background: "rgba(255,123,123,0.10)",
                color: "rgba(255,170,170,0.95)",
              }}
            >
              <AlertTriangle size={18} />
            </span>
            <AlertDialogTitle>Delete this check-in?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `This will permanently remove the ${formatTime(pendingDelete.timestamp)} check-in from ${formatDate(pendingDelete.date)}. This can't be undone.`
                : ""}
            </AlertDialogDescription>
            {deleteError ? (
              <p
                role="alert"
                className="mt-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200"
              >
                {deleteError}
              </p>
            ) : null}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleConfirmDelete();
              }}
              disabled={deleting}
              className="bg-rose-500 text-white hover:bg-rose-500/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
