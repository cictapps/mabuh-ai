import { useAiConsentStore, type AiContextToggles } from "./aiConsent";

export interface MoodEntry {
  date: string;
  mood: string;
  tags: string[];
  schoolLoad: number | null | undefined;
  activityMinutes: number | null | undefined;
  activities: unknown;
  socialInteractions: unknown[] | null | undefined;
  dayNote: string | null | undefined;
}

export interface JournalEntry {
  date: string;
  content: string;
  source: string;
  mood: string | null | undefined;
}

export interface ChatContextInput {
  displayName: string | null;
  moods: MoodEntry[];
  journals: JournalEntry[];
  socialStats: unknown;
  analytics: {
    currentStreak: number | null;
    lifetimeDays: number | null;
    stabilityScore: number | null;
  } | null;
  journey: {
    phase: string;
    streak: number;
    totalXp: number;
    flightsCompleted: number;
    lastFlightDate: string | null;
    preflightMood: string | null;
    checkpointMood: string | null;
    finalMood: string | null;
  };
}

export interface BuiltChatContext {
  audience: "student";
  sharedSources: string[];
  payload: Record<string, unknown>;
}

const MOOD_LIMIT = 7;
const JOURNAL_LIMIT = 5;
const MOOD_FIELD_MAX = 240;
const DAY_NOTE_MAX = 320;
const JOURNAL_BODY_MAX = 600;

function clip(value: string | null | undefined, max: number): string | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function redactMood(entry: MoodEntry): Record<string, unknown> {
  return {
    date: entry.date,
    mood: entry.mood,
    tags: Array.isArray(entry.tags) ? entry.tags.slice(0, 12) : [],
    schoolLoad: entry.schoolLoad ?? null,
    activityMinutes: entry.activityMinutes ?? null,
    activities: entry.activities ?? null,
    dayNote: clip(entry.dayNote ?? "", DAY_NOTE_MAX),
  };
}

function redactJournal(entry: JournalEntry): Record<string, unknown> {
  return {
    date: entry.date,
    source: entry.source,
    mood: entry.mood,
    content: clip(entry.content ?? "", JOURNAL_BODY_MAX),
  };
}

export function buildChatContext(
  input: ChatContextInput,
  toggles: AiContextToggles,
): BuiltChatContext {
  const payload: Record<string, unknown> = {};
  const shared: string[] = [];

  if (toggles.displayName && input.displayName) {
    const safe = clip(input.displayName, 60);
    if (safe) {
      payload.user = { displayName: safe };
      shared.push("displayName");
    }
  }

  if (toggles.recentMoods && Array.isArray(input.moods) && input.moods.length > 0) {
    const recent = input.moods.slice(-MOOD_LIMIT).map(redactMood);
    payload.mood = { recent };
    shared.push("recentMoods");
  }

  if (
    toggles.recentJournals &&
    Array.isArray(input.journals) &&
    input.journals.length > 0
  ) {
    const recent = input.journals.slice(0, JOURNAL_LIMIT).map(redactJournal);
    payload.journal = { recent };
    shared.push("recentJournals");
  }

  if (toggles.socialStats && input.socialStats) {
    payload.social = input.socialStats;
    shared.push("socialStats");
  }

  if (toggles.journeyStats && input.journey) {
    payload.journey = {
      phase: input.journey.phase,
      streak: input.journey.streak,
      totalXp: input.journey.totalXp,
      flightsCompleted: input.journey.flightsCompleted,
      lastFlightDate: input.journey.lastFlightDate,
    };
    shared.push("journeyStats");
  }

  if (toggles.analyticsStats && input.analytics) {
    payload.analytics = {
      currentStreak: input.analytics.currentStreak,
      lifetimeDays: input.analytics.lifetimeDays,
      stabilityScore: input.analytics.stabilityScore,
    };
    shared.push("analyticsStats");
  }

  return {
    audience: "student",
    sharedSources: shared,
    payload,
  };
}

export function summarizeContextSize(built: BuiltChatContext): {
  fields: number;
  sources: number;
} {
  const fieldCount = Object.keys(built.payload).length;
  return {
    fields: fieldCount,
    sources: built.sharedSources.length,
  };
}

export function useAiToggles(): AiContextToggles {
  return useAiConsentStore((s) => s.toggles);
}

export const _internal = { MOOD_LIMIT, JOURNAL_LIMIT, MOOD_FIELD_MAX, JOURNAL_BODY_MAX };
