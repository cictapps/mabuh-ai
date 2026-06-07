import { useState, useCallback, useMemo, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  MoodType,
  MoodEntry,
  SocialInteraction,
  JournalEntry,
  ActivitySelections,
  ActivitySectionId,
} from "../types";
import { SEED_HISTORY } from "../data";

interface BackendMoodEntry {
  id: string;
  mood: string;
  tags: string[];
  journal: string;
  school_load?: number | null;
  activity_minutes?: number | null;
  day_note?: string | null;
  social_interactions?: SocialInteraction[] | null;
  activities?: ActivitySelections | null;
  timestamp_ms: number;
}

const LOCAL_HISTORY_KEY = "mabuh_mood_history";
const LOCAL_JOURNAL_KEY = "mabuh_journal_entries";
const REMINDER_KEY = "mabuh_reminder_prefs";

export interface ReminderPreferences {
  enabled: boolean;
  hour: number;
  minute: number;
}

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
    // Ignore local storage failures.
  }
}

function loadLocalHistory(): MoodEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MoodEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalHistory(entries: MoodEntry[]) {
  try {
    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // Ignore local storage failures.
  }
}

function loadLocalJournalEntries(): JournalEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_JOURNAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as JournalEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalJournalEntries(entries: JournalEntry[]) {
  try {
    localStorage.setItem(LOCAL_JOURNAL_KEY, JSON.stringify(entries));
  } catch {
    // Ignore local storage failures.
  }
}

function mergeHistory(primary: MoodEntry[], secondary: MoodEntry[]): MoodEntry[] {
  const byId = new Map<string, MoodEntry>();
  const byDate = new Map<string, MoodEntry>();
  [...secondary, ...primary].forEach((entry) => {
    byId.set(entry.id, entry);
    const existing = byDate.get(entry.date);
    if (!existing || entry.timestamp >= existing.timestamp) {
      byDate.set(entry.date, entry);
    }
  });
  const merged = Array.from(new Map([...byId, ...byDate]).values());
  return merged.sort((a, b) => a.timestamp - b.timestamp);
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

const toMoodEntry = (entry: BackendMoodEntry): MoodEntry => ({
  id: entry.id,
  date: new Date(entry.timestamp_ms).toISOString().split("T")[0],
  mood: entry.mood as MoodType,
  tags: entry.tags,
  journal: entry.journal,
  schoolLoad: entry.school_load ?? undefined,
  activityMinutes: entry.activity_minutes ?? undefined,
  dayNote: entry.day_note ?? undefined,
  socialInteractions: entry.social_interactions ?? [],
  activities: entry.activities ?? emptyActivities(),
  timestamp: entry.timestamp_ms,
});

function buildInteractionId() {
  return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export function useMoodStore() {
  const [history, setHistory] = useState<MoodEntry[]>(SEED_HISTORY);
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [journal, setJournal] = useState("");
  const [schoolLoad, setSchoolLoad] = useState(3);
  const [activityMinutes, setActivityMinutes] = useState(0);
  const [dayNote, setDayNote] = useState("");
  const [socialInteractions, setSocialInteractions] = useState<SocialInteraction[]>([]);
  const [activitiesBySection, setActivitiesBySection] = useState<ActivitySelections>(
    emptyActivities()
  );
  const [manualJournalEntries, setManualJournalEntries] = useState<JournalEntry[]>(
    loadLocalJournalEntries()
  );
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [reminder, setReminderState] = useState<ReminderPreferences>(loadReminder);

  useEffect(() => {
    let active = true;
    const loadHistory = async () => {
      try {
        const result = await invoke<BackendMoodEntry[]>("list_mood_entries");
        if (!active) return;
        const mapped = result.map(toMoodEntry);
        const local = loadLocalHistory();
        const merged = mergeHistory(mapped, local.length ? local : SEED_HISTORY);
        setHistory(merged);
        saveLocalHistory(merged);
      } catch {
        const local = loadLocalHistory();
        if (local.length) {
          setHistory(local);
          return;
        }
        // Keep seeded data if backend is unavailable.
      }
    };
    loadHistory();
    return () => {
      active = false;
    };
  }, []);

  const selectMood = useCallback((mood: MoodType) => {
    setSelectedMood(mood);
    setSelectedTags([]);
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const saveEntry = useCallback(async () => {
    if (!selectedMood) return false;
    try {
      const saved = await invoke<BackendMoodEntry>("save_mood_entry", {
        input: {
          mood: selectedMood,
          tags: selectedTags,
          journal,
          school_load: schoolLoad,
          activity_minutes: activityMinutes,
          day_note: dayNote,
          social_interactions: socialInteractions,
          activities: activitiesBySection,
        },
      });
      const entry = toMoodEntry(saved);
      try {
        const list = await invoke<BackendMoodEntry[]>("list_mood_entries");
        const mapped = list.map(toMoodEntry);
        const local = loadLocalHistory();
        const merged = mergeHistory(mapped, local.length ? local : [entry]);
        setHistory(merged);
        saveLocalHistory(merged);
      } catch {
        setHistory((prev) => {
          const filtered = prev.filter((e) => e.date !== entry.date);
          const next = [...filtered, entry].sort((a, b) => a.timestamp - b.timestamp);
          saveLocalHistory(next);
          return next;
        });
      }
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
    } catch {
      const timestamp = Date.now();
      const entry: MoodEntry = {
        id: `${timestamp}-local`,
        date: new Date(timestamp).toISOString().split("T")[0],
        mood: selectedMood,
        tags: selectedTags,
        journal,
        schoolLoad,
        activityMinutes,
        dayNote,
        socialInteractions,
        activities: activitiesBySection,
        timestamp,
      };
      setHistory((prev) => {
        const filtered = prev.filter((e) => e.date !== entry.date);
        const next = [...filtered, entry].sort((a, b) => a.timestamp - b.timestamp);
        saveLocalHistory(next);
        return next;
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
        prev.map((item) => (item.id === id ? { ...item, ...update } : item))
      );
    },
    []
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

  const addManualJournalEntry = useCallback((content: string) => {
    const timestamp = Date.now();
    const entry: JournalEntry = {
      id: `manual-${timestamp}`,
      date: new Date(timestamp).toISOString().split("T")[0],
      timestamp,
      content,
      source: "manual",
    };
    setManualJournalEntries((prev) => {
      const next = [entry, ...prev];
      saveLocalJournalEntries(next);
      return next;
    });
  }, []);

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
      schemaVersion: 1,
      history: history.filter((e) => !e.id.endsWith("-local")),
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
      localStorage.removeItem(LOCAL_HISTORY_KEY);
      localStorage.removeItem(LOCAL_JOURNAL_KEY);
      localStorage.removeItem(REMINDER_KEY);
    } catch {
      // Ignore.
    }
    setHistory([]);
    setManualJournalEntries([]);
    setReminderState(DEFAULT_REMINDER);
  }, []);

  const dominantMood = useMemo((): MoodType | null => {
    const recent = history.slice(-7);
    if (!recent.length) return null;
    const counts: Record<string, number> = {};
    recent.forEach((e) => { counts[e.mood] = (counts[e.mood] ?? 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as MoodType;
  }, [history]);

  const moodScoreMap: Record<MoodType, number> = {
    stressed: 1,
    worried: 2,
    okay: 3,
    calm: 4,
    happy: 5,
  };

  const trendData = useMemo(() => {
    return history.slice(-14).map((e) => ({
      date: e.date,
      score: moodScoreMap[e.mood],
      mood: e.mood,
    }));
  }, [history]);

  const distribution = useMemo(() => {
    const counts: Record<MoodType, number> = { stressed: 0, worried: 0, okay: 0, calm: 0, happy: 0 };
    history.forEach((e) => { counts[e.mood]++; });
    const total = history.length || 1;
    return Object.entries(counts).map(([mood, count]) => ({
      mood: mood as MoodType,
      count,
      pct: Math.round((count / total) * 100),
    }));
  }, [history]);

  const journalEntries = useMemo(() => {
    const checkinEntries: JournalEntry[] = history.map((entry) => ({
      id: `checkin-${entry.id}`,
      date: entry.date,
      timestamp: entry.timestamp,
      content: entry.journal || entry.dayNote || "",
      source: "checkin",
      mood: entry.mood,
      tags: entry.tags,
    }));
    return [...manualJournalEntries, ...checkinEntries];
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
      scoredRecent[0]
    )?.entry;
    const worstEntry = scoredRecent.reduce(
      (worst, current) => (current.score < worst.score ? current : worst),
      scoredRecent[0]
    )?.entry;

    const stabilityWindow = history.slice(-14).map((entry) => moodScoreMap[entry.mood]);
    const mean = stabilityWindow.length
      ? stabilityWindow.reduce((sum, val) => sum + val, 0) / stabilityWindow.length
      : 0;
    const variance = stabilityWindow.length
      ? stabilityWindow.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / stabilityWindow.length
      : 0;
    const stdDev = Math.sqrt(variance);
    const stabilityScore = Math.max(0, Math.min(100, Math.round(100 - (stdDev / 2) * 100)));

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
      }
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
  }, [history]);

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
