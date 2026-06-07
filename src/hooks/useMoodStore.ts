import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivitySectionId,
  ActivitySelections,
  JournalEntry,
  MoodEntry,
  MoodType,
  SocialInteraction,
} from "../types";
import {
  insertJournalEntry,
  listJournalEntries,
  listMoodEntries,
  upsertMoodEntry,
} from "../lib/db/moodRepository";
import { useAuth } from "../lib/auth";

export interface ReminderPreferences {
  enabled: boolean;
  hour: number;
  minute: number;
}

const REMINDER_KEY = "mabuh_reminder_prefs";

const DEFAULT_REMINDER: ReminderPreferences = {
  enabled: false,
  hour: 20,
  minute: 0,
};

function loadReminder(): ReminderPreferences {
  try {
    const raw = localStorage.getItem(REMINDER_KEY);
    if (!raw) return DEFAULT_REMINDER;
    const parsed = JSON.parse(raw) as Partial<ReminderPreferences>;
    return {
      enabled: Boolean(parsed.enabled),
      hour: typeof parsed.hour === "number" ? parsed.hour : DEFAULT_REMINDER.hour,
      minute: typeof parsed.minute === "number" ? parsed.minute : DEFAULT_REMINDER.minute,
    };
  } catch {
    return DEFAULT_REMINDER;
  }
}

function saveReminder(prefs: ReminderPreferences) {
  try {
    localStorage.setItem(REMINDER_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore.
  }
}

function emptyActivities(): ActivitySelections {
  return {
    work: [],
    health: [],
    sleep: [],
    food: [],
    hobbies: [],
    weather: [],
    sports: [],
  };
}

function buildInteractionId() {
  return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export function useMoodStore() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [history, setHistory] = useState<MoodEntry[]>([]);
  const [manualJournalEntries, setManualJournalEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [journal, setJournal] = useState("");
  const [schoolLoad, setSchoolLoad] = useState(3);
  const [activityMinutes, setActivityMinutes] = useState(0);
  const [dayNote, setDayNote] = useState("");
  const [socialInteractions, setSocialInteractions] = useState<SocialInteraction[]>([]);
  const [activitiesBySection, setActivitiesBySection] = useState<ActivitySelections>(
    emptyActivities,
  );

  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [reminder, setReminderState] = useState<ReminderPreferences>(loadReminder);

  // Load (or reload) when the signed-in user changes.
  useEffect(() => {
    let active = true;

    if (!userId) {
      setHistory([]);
      setManualJournalEntries([]);
      setError(null);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const [moods, journals] = await Promise.all([
          listMoodEntries(),
          listJournalEntries(),
        ]);
        if (!active) return;
        setHistory(moods);
        setManualJournalEntries(journals);
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "Could not load your entries.",
        );
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [userId]);

  const selectMood = useCallback((mood: MoodType) => {
    setSelectedMood(mood);
    setSelectedTags([]);
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  const saveEntry = useCallback(async (): Promise<boolean> => {
    if (!selectedMood) return false;
    if (!userId) {
      setError("You need to be signed in to save a check-in.");
      return false;
    }
    setError(null);
    try {
      const saved = await upsertMoodEntry({
        mood: selectedMood,
        tags: selectedTags,
        journal,
        schoolLoad,
        activityMinutes,
        dayNote,
        socialInteractions,
        activities: activitiesBySection,
      });
      setHistory((prev) => {
        const filtered = prev.filter((e) => e.id !== saved.id && e.date !== saved.date);
        return [...filtered, saved].sort((a, b) => a.timestamp - b.timestamp);
      });
      setSelectedMood(null);
      setSelectedTags([]);
      setJournal("");
      setSchoolLoad(3);
      setActivityMinutes(0);
      setDayNote("");
      setSocialInteractions([]);
      setActivitiesBySection(emptyActivities());
      setLastSavedAt(Date.now());
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save your check-in.",
      );
      return false;
    }
  }, [
    selectedMood,
    selectedTags,
    journal,
    schoolLoad,
    activityMinutes,
    dayNote,
    socialInteractions,
    activitiesBySection,
    userId,
  ]);

  const addSocialInteraction = useCallback(() => {
    setSocialInteractions((prev) => {
      if (prev.length >= 6) return prev;
      return [
        ...prev,
        {
          id: buildInteractionId(),
          name: "",
          relationship: "friend",
          interactionType: "in_person",
          durationMinutes: undefined,
          feelings: [],
          notes: "",
        },
      ];
    });
  }, []);

  const updateSocialInteraction = useCallback(
    (id: string, update: Partial<SocialInteraction>) => {
      setSocialInteractions((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...update } : item)),
      );
    },
    [],
  );

  const removeSocialInteraction = useCallback((id: string) => {
    setSocialInteractions((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const toggleActivity = useCallback((section: ActivitySectionId, label: string) => {
    setActivitiesBySection((prev) => {
      const current = prev[section] ?? [];
      const next = current.includes(label)
        ? current.filter((item) => item !== label)
        : [...current, label];
      return { ...prev, [section]: next };
    });
  }, []);

  const addCustomActivity = useCallback((section: ActivitySectionId, label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    setActivitiesBySection((prev) => {
      const current = prev[section] ?? [];
      if (current.includes(trimmed)) return prev;
      return { ...prev, [section]: [...current, trimmed] };
    });
  }, []);

  const addManualJournalEntry = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;
      if (!userId) {
        setError("You need to be signed in to save a journal entry.");
        return;
      }
      setError(null);
      try {
        const saved = await insertJournalEntry(trimmed);
        setManualJournalEntries((prev) => [...prev, saved]);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not save your journal entry.",
        );
      }
    },
    [userId],
  );

  const setReminder = useCallback((next: Partial<ReminderPreferences>) => {
    setReminderState((prev) => {
      const merged = { ...prev, ...next };
      saveReminder(merged);
      return merged;
    });
  }, []);

  const exportData = useCallback(() => {
    const payload = {
      exportedAt: new Date().toISOString(),
      schemaVersion: 2,
      history,
      journalEntries: manualJournalEntries,
      reminder,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mabuh-export-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [history, manualJournalEntries, reminder]);

  const clearAllLocalData = useCallback(() => {
    try {
      localStorage.removeItem(REMINDER_KEY);
    } catch {
      // Ignore.
    }
    setHistory([]);
    setManualJournalEntries([]);
    setReminderState(DEFAULT_REMINDER);
  }, []);

  const moodScoreMap: Record<MoodType, number> = useMemo(
    () => ({
      stressed: 1,
      worried: 2,
      okay: 3,
      calm: 4,
      happy: 5,
    }),
    [],
  );

  const dominantMood = useMemo((): MoodType | null => {
    const recent = history.slice(-7);
    if (!recent.length) return null;
    const counts: Record<string, number> = {};
    recent.forEach((e) => {
      counts[e.mood] = (counts[e.mood] ?? 0) + 1;
    });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return (top?.[0] as MoodType | undefined) ?? null;
  }, [history]);

  const trendData = useMemo(() => {
    return history.slice(-14).map((e) => ({
      date: e.date,
      score: moodScoreMap[e.mood],
      mood: e.mood,
    }));
  }, [history, moodScoreMap]);

  const distribution = useMemo(() => {
    const counts: Record<MoodType, number> = {
      stressed: 0,
      worried: 0,
      okay: 0,
      calm: 0,
      happy: 0,
    };
    history.forEach((e) => {
      counts[e.mood]++;
    });
    const total = history.length || 1;
    return (Object.keys(counts) as MoodType[]).map((mood) => ({
      mood,
      count: counts[mood],
      pct: Math.round((counts[mood] / total) * 100),
    }));
  }, [history]);

  const journalEntries = useMemo(() => {
    const checkinEntries: JournalEntry[] = history
      .filter((entry) => Boolean(entry.journal?.trim() || entry.dayNote?.trim()))
      .map((entry) => ({
        id: `checkin-${entry.id}`,
        date: entry.date,
        timestamp: entry.timestamp,
        content: entry.journal?.trim() || entry.dayNote?.trim() || "",
        source: "checkin",
        mood: entry.mood,
        tags: entry.tags,
      }));
    return [...manualJournalEntries, ...checkinEntries].sort(
      (a, b) => b.timestamp - a.timestamp,
    );
  }, [history, manualJournalEntries]);

  const socialStats = useMemo(() => {
    const recent = history.slice(-7);
    const interactions = recent.flatMap((entry) => entry.socialInteractions ?? []);
    const totalInteractions = interactions.length;
    const personCounts: Record<string, number> = {};
    const feelingCounts: Record<string, number> = {};
    interactions.forEach((interaction) => {
      if (interaction.name) {
        personCounts[interaction.name] = (personCounts[interaction.name] ?? 0) + 1;
      }
      interaction.feelings.forEach((feeling) => {
        feelingCounts[feeling] = (feelingCounts[feeling] ?? 0) + 1;
      });
    });
    const topPerson = Object.entries(personCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const topFeeling = Object.entries(feelingCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    return { totalInteractions, topPerson, topFeeling };
  }, [history]);

  const analyticsStats = useMemo(() => {
    const uniqueDates = Array.from(new Set(history.map((entry) => entry.date))).sort();
    const dayMs = 24 * 60 * 60 * 1000;
    let longestStreak = 0;
    let currentStreak = 0;

    for (let i = 0; i < uniqueDates.length; i++) {
      const current = new Date(uniqueDates[i] + "T12:00:00").getTime();
      const prev = i > 0 ? new Date(uniqueDates[i - 1] + "T12:00:00").getTime() : null;
      if (prev !== null && current - prev === dayMs) {
        currentStreak = currentStreak + 1;
      } else {
        currentStreak = 1;
      }
      longestStreak = Math.max(longestStreak, currentStreak);
    }

    const dateSet = new Set(uniqueDates);
    let activeStreak = 0;
    let cursor = new Date();
    let cursorDate = cursor.toISOString().split("T")[0];
    while (dateSet.has(cursorDate)) {
      activeStreak += 1;
      cursor = new Date(cursor.getTime() - dayMs);
      cursorDate = cursor.toISOString().split("T")[0];
    }

    const recent = history.slice(-30);
    const scoredRecent = recent.map((entry) => ({
      entry,
      score: moodScoreMap[entry.mood],
    }));

    const bestEntry = scoredRecent.reduce(
      (best, current) => (current.score > best.score ? current : best),
      scoredRecent[0] ?? null,
    )?.entry;
    const worstEntry = scoredRecent.reduce(
      (worst, current) => (current.score < worst.score ? current : worst),
      scoredRecent[0] ?? null,
    )?.entry;

    const stabilityWindow = history.slice(-14).map((entry) => moodScoreMap[entry.mood]);
    const mean = stabilityWindow.length
      ? stabilityWindow.reduce((sum, val) => sum + val, 0) / stabilityWindow.length
      : 0;
    const variance = stabilityWindow.length
      ? stabilityWindow.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
        stabilityWindow.length
      : 0;
    const stdDev = Math.sqrt(variance);
    const stabilityScore = Math.max(
      0,
      Math.min(100, Math.round(100 - (stdDev / 2) * 100)),
    );

    const activityCounts: Record<ActivitySectionId, Record<string, number>> = {
      work: {},
      health: {},
      sleep: {},
      food: {},
      hobbies: {},
      weather: {},
      sports: {},
    };

    let totalActivitySelections = 0;
    history.forEach((entry) => {
      const activities = entry.activities ?? emptyActivities();
      (Object.keys(activities) as ActivitySectionId[]).forEach((section) => {
        const items = activities[section] ?? [];
        totalActivitySelections += items.length;
        items.forEach((item) => {
          activityCounts[section][item] = (activityCounts[section][item] ?? 0) + 1;
        });
      });
    });

    const activityHighlights = (Object.keys(activityCounts) as ActivitySectionId[]).map(
      (section) => {
        const entries = Object.entries(activityCounts[section]);
        const top = entries.sort((a, b) => b[1] - a[1])[0];
        return {
          section,
          label: top ? top[0] : null,
          count: top ? top[1] : 0,
        };
      },
    );

    return {
      longestStreak: uniqueDates.length ? longestStreak : 0,
      currentStreak: uniqueDates.length ? activeStreak : 0,
      lifetimeDays: uniqueDates.length,
      stabilityScore: stabilityWindow.length ? stabilityScore : 0,
      bestEntry: bestEntry ?? null,
      worstEntry: worstEntry ?? null,
      activityCount: totalActivitySelections,
      activityHighlights,
    };
  }, [history, moodScoreMap]);

  return {
    history,
    selectedMood,
    selectedTags,
    journal,
    schoolLoad,
    activityMinutes,
    dayNote,
    socialInteractions,
    activitiesBySection,
    lastSavedAt,
    reminder,
    loading,
    error,
    selectMood,
    toggleTag,
    setJournal,
    setSchoolLoad,
    setActivityMinutes,
    setDayNote,
    addSocialInteraction,
    updateSocialInteraction,
    removeSocialInteraction,
    toggleActivity,
    addCustomActivity,
    addManualJournalEntry,
    saveEntry,
    setReminder,
    exportData,
    clearAllLocalData,
    dominantMood,
    trendData,
    distribution,
    journalEntries,
    socialStats,
    analyticsStats,
  };
}
