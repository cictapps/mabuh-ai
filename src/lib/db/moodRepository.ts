import { supabase } from "../supabase";
import {
  ActivitySelections,
  JournalEntry,
  MoodEntry,
  MoodType,
  SocialInteraction,
} from "../../types";

interface MoodRow {
  id: string;
  user_id: string;
  mood: string;
  tags: string[];
  journal: string;
  school_load: number | null;
  activity_minutes: number | null;
  day_note: string | null;
  social_interactions: SocialInteraction[] | null;
  activities: ActivitySelections | null;
  entry_date: string;
  logged_at: string;
}

interface JournalRow {
  id: string;
  user_id: string;
  title: string | null;
  body: string;
  source: string;
  mood_entry_id: string | null;
  mask_off: boolean;
  entry_date: string;
  created_at: string;
}

const MOOD_TYPES: ReadonlySet<string> = new Set([
  "stressed",
  "worried",
  "okay",
  "calm",
  "happy",
]);

function toMoodType(value: string): MoodType {
  return MOOD_TYPES.has(value) ? (value as MoodType) : "okay";
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

function rowToMoodEntry(row: MoodRow): MoodEntry {
  const loggedAt = new Date(row.logged_at).getTime();
  return {
    id: row.id,
    date: row.entry_date,
    mood: toMoodType(row.mood),
    tags: row.tags ?? [],
    journal: row.journal ?? "",
    schoolLoad: row.school_load ?? undefined,
    activityMinutes: row.activity_minutes ?? undefined,
    dayNote: row.day_note ?? undefined,
    socialInteractions: row.social_interactions ?? [],
    activities: row.activities ?? emptyActivities(),
    timestamp: Number.isFinite(loggedAt) ? loggedAt : Date.now(),
  };
}

function rowToJournalEntry(row: JournalRow): JournalEntry {
  const createdAt = new Date(row.created_at).getTime();
  return {
    id: row.id,
    date: row.entry_date,
    timestamp: Number.isFinite(createdAt) ? createdAt : Date.now(),
    content: row.body,
    source: row.source === "checkin" ? "checkin" : "manual",
  };
}

export interface MoodEntryInput {
  mood: MoodType;
  tags: string[];
  journal: string;
  schoolLoad?: number;
  activityMinutes?: number;
  dayNote?: string;
  socialInteractions?: SocialInteraction[];
  activities?: ActivitySelections;
}

function toDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function listMoodEntries(): Promise<MoodEntry[]> {
  const { data, error } = await supabase
    .from("mood_entries")
    .select(
      "id, user_id, mood, tags, journal, school_load, activity_minutes, day_note, social_interactions, activities, entry_date, logged_at",
    )
    .order("entry_date", { ascending: true })
    .order("logged_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => rowToMoodEntry(row as MoodRow));
}

export async function listJournalEntries(): Promise<JournalEntry[]> {
  const { data, error } = await supabase
    .from("journal_entries")
    .select(
      "id, user_id, title, body, source, mood_entry_id, mask_off, entry_date, created_at",
    )
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => rowToJournalEntry(row as JournalRow));
}

export async function insertMoodEntry(
  input: MoodEntryInput,
  now: Date = new Date(),
): Promise<MoodEntry> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const entryDate = toDateString(now);

  const payload = {
    user_id: user.id,
    mood: input.mood,
    tags: input.tags ?? [],
    journal: input.journal ?? "",
    school_load: input.schoolLoad ?? null,
    activity_minutes: input.activityMinutes ?? null,
    day_note: input.dayNote ?? null,
    social_interactions: input.socialInteractions ?? [],
    activities: input.activities ?? emptyActivities(),
    entry_date: entryDate,
    logged_at: now.toISOString(),
  };

  const { data, error } = await supabase
    .from("mood_entries")
    .insert(payload)
    .select(
      "id, user_id, mood, tags, journal, school_load, activity_minutes, day_note, social_interactions, activities, entry_date, logged_at",
    )
    .single();

  if (error) throw error;
  return rowToMoodEntry(data as MoodRow);
}

export async function deleteMoodEntry(id: string): Promise<void> {
  const { error } = await supabase
    .from("mood_entries")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function insertJournalEntry(
  body: string,
  now: Date = new Date(),
): Promise<JournalEntry> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const trimmed = body.trim();
  if (!trimmed) throw new Error("Journal body is empty.");

  const entryDate = toDateString(now);
  const { data, error } = await supabase
    .from("journal_entries")
    .insert({
      user_id: user.id,
      title: null,
      body: trimmed,
      source: "manual",
      mask_off: false,
      entry_date: entryDate,
    })
    .select(
      "id, user_id, title, body, source, mood_entry_id, mask_off, entry_date, created_at",
    )
    .single();

  if (error) throw error;
  return rowToJournalEntry(data as JournalRow);
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const { error } = await supabase
    .from("journal_entries")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
