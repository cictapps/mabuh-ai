import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, BookOpen, Save } from "lucide-react";
import type { MoodEntry, MoodType } from "../../types";
import { MOODS, getMoodMeta } from "../../data";
import { MoodTagGroup } from "../mood/MoodTagGroup";
import { JournalInput } from "../mood/JournalInput";
import type { MoodEntryInput } from "../../lib/db/moodRepository";

interface EditMoodEntryDialogProps {
  open: boolean;
  entry: MoodEntry | null;
  onClose: () => void;
  onSave: (id: string, input: MoodEntryInput) => Promise<boolean>;
}

export const EditMoodEntryDialog: React.FC<EditMoodEntryDialogProps> = ({
  open,
  entry,
  onClose,
  onSave,
}) => {
  const [mood, setMood] = useState<MoodType | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [journal, setJournal] = useState("");
  const [dayNote, setDayNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && entry) {
      setMood(entry.mood);
      setTags(entry.tags ?? []);
      setJournal(entry.journal ?? "");
      setDayNote(entry.dayNote ?? "");
      setError(null);
      setSaving(false);
    }
  }, [open, entry]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, saving, onClose]);

  if (!open || !entry || !mood) return null;

  const meta = getMoodMeta(mood);

  const handleSelectMood = (next: MoodType) => {
    setMood(next);
    const nextMeta = getMoodMeta(next);
    setTags((prev) => prev.filter((t) => nextMeta.tags.includes(t)));
  };

  const handleToggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const ok = await onSave(entry.id, {
        mood,
        tags,
        journal,
        dayNote: dayNote.trim() ? dayNote : undefined,
        schoolLoad: entry.schoolLoad,
        activityMinutes: entry.activityMinutes,
        socialInteractions: entry.socialInteractions ?? [],
        activities: entry.activities,
      });
      if (ok) {
        onClose();
      } else {
        setError("Could not save your changes. Please try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="edit-mood-overlay"
        className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
        onClick={() => !saving && onClose()}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <motion.div
          key="edit-mood-panel"
          className="relative flex w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-neutral-900 text-neutral-100 shadow-2xl sm:rounded-2xl"
          style={{
            maxHeight: "92dvh",
            border: "0.5px solid rgba(255,255,255,0.08)",
          }}
          onClick={(e) => e.stopPropagation()}
          initial={{ y: "100%", opacity: 0.6 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 32, mass: 0.9 }}
        >
        <div
          className="shrink-0 px-6 pt-5 pb-4"
          style={{ borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}
        >
          <div
            aria-hidden
            className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/15 sm:hidden"
          />
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-lg"
                style={{
                  background: `${meta.color}22`,
                  color: meta.color,
                }}
              >
                <PencilIcon />
              </span>
              <div>
                <h2 className="text-base font-medium text-neutral-100">
                  Edit check-in
                </h2>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {formatEntryTimestamp(entry.timestamp)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => !saving && onClose()}
              aria-label="Close"
              className="rounded-md p-1 text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-100"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <form
          id="edit-mood-entry-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-5"
        >
          <div className="flex flex-col gap-5">
            <section>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                How is it now?
              </p>
              <div className="flex flex-wrap gap-2">
                {MOODS.map((m) => {
                  const isActive = m.id === mood;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSelectMood(m.id)}
                      className="rounded-full px-3.5 py-2 text-xs font-medium transition-all"
                      style={{
                        background: isActive ? `${m.color}33` : "rgba(255,255,255,0.04)",
                        color: isActive ? m.color : "rgba(216,212,235,0.7)",
                        border: `1px solid ${isActive ? `${m.color}55` : "rgba(255,255,255,0.06)"}`,
                      }}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                <Heart size={11} /> A few words for it
              </p>
              <MoodTagGroup
                tags={meta.tags}
                selectedTags={tags}
                accentColor={meta.color}
                onToggle={handleToggleTag}
              />
            </section>

            <section>
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                <BookOpen size={11} /> A line about it
              </p>
              <JournalInput
                value={journal}
                onChange={setJournal}
                placeholder="What do you want to remember about this moment?"
                rows={3}
              />
            </section>

            <section>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                A little note for the day
              </p>
              <input
                type="text"
                value={dayNote}
                onChange={(e) => setDayNote(e.target.value)}
                placeholder="A short note…"
                maxLength={120}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-neutral-100 outline-none transition-colors placeholder:text-neutral-500 focus:border-white/20"
              />
            </section>

            {error ? (
              <p
                role="alert"
                className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200"
              >
                {error}
              </p>
            ) : null}
          </div>
        </form>

        <div
          className="shrink-0 px-6 py-4"
          style={{ borderTop: "0.5px solid rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => !saving && onClose()}
              disabled={saving}
              className="rounded-lg px-4 py-2 text-xs text-neutral-300 transition-colors hover:bg-white/5 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-mood-entry-form"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-xs font-medium text-neutral-900 transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Save size={13} /> {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
};

function formatEntryTimestamp(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function PencilIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
