import { supabase } from "../supabase";
import { isNetworkOnline } from "../connectivity";
import {
  getLastSyncedAt,
  listLocalRecords,
  listPendingMutations,
  putLocalRecord,
  removeLocalRecord,
  removePendingMutation,
  replaceLocalSnapshot,
  setLastSyncedAt,
  type LocalWellnessRecord,
  type PendingMutation,
} from "./localWellnessDb";
import type {
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
  updated_at?: string;
}

interface JournalRow {
  id: string;
  user_id: string;
  body: string;
  source: string;
  entry_date: string;
  created_at: string;
  updated_at?: string;
}

export interface SyncStatus {
  pendingCount: number;
  lastSyncedAt: string | null;
  syncing: boolean;
  error: string | null;
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

const MOOD_TYPES: ReadonlySet<string> = new Set([
  "stressed",
  "worried",
  "okay",
  "calm",
  "happy",
  "sad",
  "tired",
]);

const SYNC_TIMEOUT_MS = 20_000;
const syncPromises = new Map<string, Promise<SyncStatus>>();

function errorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return "Could not sync data.";
}

async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs = SYNC_TIMEOUT_MS,
): Promise<T> {
  let timeoutId: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(
      () => reject(new Error("Sync timed out. We’ll try again later.")),
      timeoutMs,
    );
  });
  try {
    return await Promise.race([operation, timeout]);
  } finally {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
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

function toDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toMoodType(value: string): MoodType {
  return MOOD_TYPES.has(value) ? (value as MoodType) : "okay";
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

function moodToRemote(userId: string, entry: MoodEntry) {
  return {
    id: entry.id,
    user_id: userId,
    mood: entry.mood,
    tags: entry.tags ?? [],
    journal: entry.journal ?? "",
    school_load: entry.schoolLoad ?? null,
    activity_minutes: entry.activityMinutes ?? null,
    day_note: entry.dayNote ?? null,
    social_interactions: entry.socialInteractions ?? [],
    activities: entry.activities ?? emptyActivities(),
    entry_date: entry.date,
    logged_at: new Date(entry.timestamp).toISOString(),
  };
}

function journalToRemote(userId: string, entry: JournalEntry) {
  return {
    id: entry.id,
    user_id: userId,
    title: null,
    body: entry.content,
    source: entry.source,
    mood_entry_id: null,
    mask_off: false,
    entry_date: entry.date,
    created_at: new Date(entry.timestamp).toISOString(),
  };
}

async function resolveUserId(explicit?: string): Promise<string> {
  if (explicit) return explicit;
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) throw new Error("Not authenticated.");
  return userId;
}

export async function listMoodEntries(userId?: string): Promise<MoodEntry[]> {
  const id = await resolveUserId(userId);
  const records = await listLocalRecords<MoodEntry>(id, "mood");
  return records
    .map((record) => record.payload)
    .sort((a, b) => a.date.localeCompare(b.date) || a.timestamp - b.timestamp);
}

export async function listJournalEntries(userId?: string): Promise<JournalEntry[]> {
  const id = await resolveUserId(userId);
  const records = await listLocalRecords<JournalEntry>(id, "journal");
  return records
    .map((record) => record.payload)
    .sort((a, b) => a.timestamp - b.timestamp);
}

export async function insertMoodEntry(
  input: MoodEntryInput,
  now: Date = new Date(),
  userId?: string,
): Promise<MoodEntry> {
  const id = await resolveUserId(userId);
  const entry: MoodEntry = {
    id: crypto.randomUUID(),
    date: toDateString(now),
    mood: input.mood,
    tags: input.tags ?? [],
    journal: input.journal ?? "",
    schoolLoad: input.schoolLoad,
    activityMinutes: input.activityMinutes,
    dayNote: input.dayNote,
    socialInteractions: input.socialInteractions ?? [],
    activities: input.activities ?? emptyActivities(),
    timestamp: now.getTime(),
  };
  await putLocalRecord({
    id: entry.id,
    userId: id,
    entity: "mood",
    payload: entry,
    updatedAt: now.toISOString(),
  });
  return entry;
}

export async function updateMoodEntry(
  entryId: string,
  input: MoodEntryInput,
  userId?: string,
): Promise<MoodEntry> {
  const id = await resolveUserId(userId);
  const existing = (await listMoodEntries(id)).find((entry) => entry.id === entryId);
  if (!existing) throw new Error("Check-in not found.");
  const updated: MoodEntry = {
    ...existing,
    mood: input.mood,
    tags: input.tags ?? [],
    journal: input.journal ?? "",
    schoolLoad: input.schoolLoad,
    activityMinutes: input.activityMinutes,
    dayNote: input.dayNote,
    socialInteractions: input.socialInteractions ?? [],
    activities: input.activities ?? emptyActivities(),
  };
  await putLocalRecord({
    id: updated.id,
    userId: id,
    entity: "mood",
    payload: updated,
    updatedAt: new Date().toISOString(),
  });
  return updated;
}

export async function deleteMoodEntry(entryId: string, userId?: string): Promise<void> {
  const id = await resolveUserId(userId);
  await removeLocalRecord(id, "mood", entryId);
}

export async function insertJournalEntry(
  body: string,
  now: Date = new Date(),
  userId?: string,
): Promise<JournalEntry> {
  const id = await resolveUserId(userId);
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Journal body is empty.");
  const entry: JournalEntry = {
    id: crypto.randomUUID(),
    date: toDateString(now),
    timestamp: now.getTime(),
    content: trimmed,
    source: "manual",
  };
  await putLocalRecord({
    id: entry.id,
    userId: id,
    entity: "journal",
    payload: entry,
    updatedAt: now.toISOString(),
  });
  return entry;
}

export async function deleteJournalEntry(
  entryId: string,
  userId?: string,
): Promise<void> {
  const id = await resolveUserId(userId);
  await removeLocalRecord(id, "journal", entryId);
}

async function pushMutation(mutation: PendingMutation): Promise<void> {
  const table = mutation.entity === "mood" ? "mood_entries" : "journal_entries";
  if (mutation.operation === "delete") {
    const { error } = await supabase.from(table).delete().eq("id", mutation.entityId);
    if (error) throw error;
    return;
  }
  const payload =
    mutation.entity === "mood"
      ? moodToRemote(mutation.userId, mutation.payload as MoodEntry)
      : journalToRemote(mutation.userId, mutation.payload as JournalEntry);
  const { error } = await supabase.from(table).upsert(payload, { onConflict: "id" });
  if (error) throw error;
  const { error: tombstoneError } = await supabase
    .from("wellness_tombstones")
    .delete()
    .eq("entity_type", mutation.entity)
    .eq("entity_id", mutation.entityId);
  if (tombstoneError) throw tombstoneError;
}

async function fetchRemoteSnapshot(userId: string): Promise<void> {
  const [moodsResult, journalsResult, tombstonesResult] = await Promise.all([
    supabase
      .from("mood_entries")
      .select(
        "id, user_id, mood, tags, journal, school_load, activity_minutes, day_note, social_interactions, activities, entry_date, logged_at, updated_at",
      )
      .order("logged_at", { ascending: true }),
    supabase
      .from("journal_entries")
      .select("id, user_id, body, source, entry_date, created_at, updated_at")
      .order("created_at", { ascending: true }),
    supabase.from("wellness_tombstones").select("entity_type, entity_id, deleted_at"),
  ]);
  if (moodsResult.error) throw moodsResult.error;
  if (journalsResult.error) throw journalsResult.error;
  if (tombstonesResult.error) throw tombstonesResult.error;

  const moods: Array<LocalWellnessRecord<MoodEntry>> = (moodsResult.data ?? []).map(
    (value) => {
      const row = value as MoodRow;
      return {
        id: row.id,
        userId,
        entity: "mood",
        payload: rowToMoodEntry(row),
        updatedAt: row.updated_at ?? row.logged_at,
      };
    },
  );
  const journals: Array<LocalWellnessRecord<JournalEntry>> = (
    journalsResult.data ?? []
  ).map((value) => {
    const row = value as JournalRow;
    return {
      id: row.id,
      userId,
      entity: "journal",
      payload: rowToJournalEntry(row),
      updatedAt: row.updated_at ?? row.created_at,
    };
  });

  await replaceLocalSnapshot(userId, "mood", moods);
  await replaceLocalSnapshot(userId, "journal", journals);
  for (const value of tombstonesResult.data ?? []) {
    const tombstone = value as {
      entity_type: "mood" | "journal";
      entity_id: string;
    };
    await removeLocalRecord(userId, tombstone.entity_type, tombstone.entity_id, false);
  }
}

export async function getSyncStatus(userId: string): Promise<SyncStatus> {
  try {
    const [pending, lastSyncedAt] = await Promise.all([
      listPendingMutations(userId),
      getLastSyncedAt(userId),
    ]);
    return {
      pendingCount: pending.length,
      lastSyncedAt,
      syncing: syncPromises.has(userId),
      error: null,
    };
  } catch (error) {
    return {
      pendingCount: 0,
      lastSyncedAt: null,
      syncing: false,
      error: errorMessage(error),
    };
  }
}

export async function syncWellnessData(userId: string): Promise<SyncStatus> {
  const activeSync = syncPromises.get(userId);
  if (activeSync) return activeSync;
  if (!isNetworkOnline()) {
    const status = await getSyncStatus(userId);
    return {
      ...status,
      syncing: false,
      error: "Offline",
    };
  }

  const operation = (async () => {
    try {
      const syncedAt = await withTimeout(
        (async () => {
          const pending = await listPendingMutations(userId);
          for (const mutation of pending) {
            await pushMutation(mutation);
            await removePendingMutation(mutation.sequence);
          }
          await fetchRemoteSnapshot(userId);
          const completedAt = new Date().toISOString();
          await setLastSyncedAt(userId, completedAt);
          return completedAt;
        })(),
      );
      return {
        pendingCount: 0,
        lastSyncedAt: syncedAt,
        syncing: false,
        error: null,
      };
    } catch (error) {
      const status = await getSyncStatus(userId);
      return {
        ...status,
        syncing: false,
        error: errorMessage(error),
      };
    } finally {
      syncPromises.delete(userId);
    }
  })();

  syncPromises.set(userId, operation);
  return operation;
}
