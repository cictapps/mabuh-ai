import { isTauri } from "@tauri-apps/api/core";

export type WellnessEntity = "mood" | "journal";
export type MutationOperation = "upsert" | "delete";

export interface LocalWellnessRecord<T = unknown> {
  id: string;
  userId: string;
  entity: WellnessEntity;
  payload: T;
  updatedAt: string;
}

export interface PendingMutation<T = unknown> {
  sequence: number;
  userId: string;
  entity: WellnessEntity;
  entityId: string;
  operation: MutationOperation;
  payload: T | null;
  createdAt: string;
}

interface WebState {
  records: LocalWellnessRecord[];
  mutations: PendingMutation[];
  nextSequence: number;
  lastSyncedAt: Record<string, string>;
}

const WEB_STORAGE_KEY = "mabuh-offline-wellness-v1";
const EMPTY_WEB_STATE: WebState = {
  records: [],
  mutations: [],
  nextSequence: 1,
  lastSyncedAt: {},
};

type SqlDatabase = {
  execute(query: string, bindValues?: unknown[]): Promise<unknown>;
  select<T>(query: string, bindValues?: unknown[]): Promise<T>;
};

let databasePromise: Promise<SqlDatabase> | null = null;

function readWebState(): WebState {
  try {
    const raw = window.localStorage.getItem(WEB_STORAGE_KEY);
    if (!raw) return structuredClone(EMPTY_WEB_STATE);
    const parsed = JSON.parse(raw) as Partial<WebState>;
    return {
      records: Array.isArray(parsed.records) ? parsed.records : [],
      mutations: Array.isArray(parsed.mutations) ? parsed.mutations : [],
      nextSequence: typeof parsed.nextSequence === "number" ? parsed.nextSequence : 1,
      lastSyncedAt: parsed.lastSyncedAt ?? {},
    };
  } catch {
    return structuredClone(EMPTY_WEB_STATE);
  }
}

function writeWebState(state: WebState): void {
  window.localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(state));
}

async function getDatabase(): Promise<SqlDatabase | null> {
  if (!isTauri()) return null;
  if (!databasePromise) {
    databasePromise = import("@tauri-apps/plugin-sql").then(
      async ({ default: Database }) => {
        const db = (await Database.load("sqlite:mabuh-offline.db")) as SqlDatabase;
        await db.execute(`
        create table if not exists wellness_records (
          user_id text not null,
          entity_type text not null,
          entity_id text not null,
          payload text not null,
          updated_at text not null,
          primary key (user_id, entity_type, entity_id)
        )
      `);
        await db.execute(`
        create table if not exists wellness_mutations (
          sequence integer primary key autoincrement,
          user_id text not null,
          entity_type text not null,
          entity_id text not null,
          operation text not null,
          payload text,
          created_at text not null
        )
      `);
        await db.execute(`
        create table if not exists wellness_sync_meta (
          user_id text primary key,
          last_synced_at text
        )
      `);
        return db;
      },
    );
  }
  return databasePromise;
}

export async function listLocalRecords<T>(
  userId: string,
  entity: WellnessEntity,
): Promise<Array<LocalWellnessRecord<T>>> {
  const db = await getDatabase();
  if (!db) {
    return readWebState().records.filter(
      (record) => record.userId === userId && record.entity === entity,
    ) as Array<LocalWellnessRecord<T>>;
  }
  const rows = await db.select<
    Array<{
      user_id: string;
      entity_type: WellnessEntity;
      entity_id: string;
      payload: string;
      updated_at: string;
    }>
  >(
    `select user_id, entity_type, entity_id, payload, updated_at
       from wellness_records
      where user_id = $1 and entity_type = $2`,
    [userId, entity],
  );
  return rows.map((row) => ({
    id: row.entity_id,
    userId: row.user_id,
    entity: row.entity_type,
    payload: JSON.parse(row.payload) as T,
    updatedAt: row.updated_at,
  }));
}

export async function putLocalRecord<T>(
  record: LocalWellnessRecord<T>,
  queueMutation = true,
): Promise<void> {
  const db = await getDatabase();
  const createdAt = new Date().toISOString();
  if (!db) {
    const state = readWebState();
    state.records = state.records.filter(
      (item) =>
        !(
          item.userId === record.userId &&
          item.entity === record.entity &&
          item.id === record.id
        ),
    );
    state.records.push(record);
    if (queueMutation) {
      state.mutations.push({
        sequence: state.nextSequence++,
        userId: record.userId,
        entity: record.entity,
        entityId: record.id,
        operation: "upsert",
        payload: record.payload,
        createdAt,
      });
    }
    writeWebState(state);
    return;
  }
  await db.execute(
    `insert into wellness_records
       (user_id, entity_type, entity_id, payload, updated_at)
     values ($1, $2, $3, $4, $5)
     on conflict(user_id, entity_type, entity_id) do update set
       payload = excluded.payload,
       updated_at = excluded.updated_at`,
    [
      record.userId,
      record.entity,
      record.id,
      JSON.stringify(record.payload),
      record.updatedAt,
    ],
  );
  if (queueMutation) {
    await db.execute(
      `insert into wellness_mutations
        (user_id, entity_type, entity_id, operation, payload, created_at)
       values ($1, $2, $3, 'upsert', $4, $5)`,
      [
        record.userId,
        record.entity,
        record.id,
        JSON.stringify(record.payload),
        createdAt,
      ],
    );
  }
}

export async function removeLocalRecord(
  userId: string,
  entity: WellnessEntity,
  entityId: string,
  queueMutation = true,
): Promise<void> {
  const db = await getDatabase();
  if (!db) {
    const state = readWebState();
    state.records = state.records.filter(
      (item) =>
        !(item.userId === userId && item.entity === entity && item.id === entityId),
    );
    if (queueMutation) {
      state.mutations.push({
        sequence: state.nextSequence++,
        userId,
        entity,
        entityId,
        operation: "delete",
        payload: null,
        createdAt: new Date().toISOString(),
      });
    }
    writeWebState(state);
    return;
  }
  await db.execute(
    `delete from wellness_records
      where user_id = $1 and entity_type = $2 and entity_id = $3`,
    [userId, entity, entityId],
  );
  if (queueMutation) {
    await db.execute(
      `insert into wellness_mutations
        (user_id, entity_type, entity_id, operation, payload, created_at)
       values ($1, $2, $3, 'delete', null, $4)`,
      [userId, entity, entityId, new Date().toISOString()],
    );
  }
}

export async function listPendingMutations(userId: string): Promise<PendingMutation[]> {
  const db = await getDatabase();
  if (!db) {
    return readWebState()
      .mutations.filter((item) => item.userId === userId)
      .sort((a, b) => a.sequence - b.sequence);
  }
  const rows = await db.select<
    Array<{
      sequence: number;
      user_id: string;
      entity_type: WellnessEntity;
      entity_id: string;
      operation: MutationOperation;
      payload: string | null;
      created_at: string;
    }>
  >(
    `select sequence, user_id, entity_type, entity_id, operation, payload, created_at
       from wellness_mutations
      where user_id = $1
      order by sequence asc`,
    [userId],
  );
  return rows.map((row) => ({
    sequence: row.sequence,
    userId: row.user_id,
    entity: row.entity_type,
    entityId: row.entity_id,
    operation: row.operation,
    payload: row.payload ? JSON.parse(row.payload) : null,
    createdAt: row.created_at,
  }));
}

export async function removePendingMutation(sequence: number): Promise<void> {
  const db = await getDatabase();
  if (!db) {
    const state = readWebState();
    state.mutations = state.mutations.filter((item) => item.sequence !== sequence);
    writeWebState(state);
    return;
  }
  await db.execute("delete from wellness_mutations where sequence = $1", [sequence]);
}

export async function replaceLocalSnapshot<T>(
  userId: string,
  entity: WellnessEntity,
  records: Array<LocalWellnessRecord<T>>,
): Promise<void> {
  const pending = await listPendingMutations(userId);
  const pendingIds = new Set(
    pending.filter((item) => item.entity === entity).map((item) => item.entityId),
  );
  const current = await listLocalRecords<T>(userId, entity);
  for (const record of current) {
    if (!pendingIds.has(record.id)) {
      await removeLocalRecord(userId, entity, record.id, false);
    }
  }
  for (const record of records) {
    if (!pendingIds.has(record.id)) {
      await putLocalRecord(record, false);
    }
  }
}

export async function clearLocalWellnessData(userId: string): Promise<void> {
  const db = await getDatabase();
  if (!db) {
    const state = readWebState();
    state.records = state.records.filter((item) => item.userId !== userId);
    state.mutations = state.mutations.filter((item) => item.userId !== userId);
    delete state.lastSyncedAt[userId];
    writeWebState(state);
    return;
  }
  await db.execute("delete from wellness_records where user_id = $1", [userId]);
  await db.execute("delete from wellness_mutations where user_id = $1", [userId]);
  await db.execute("delete from wellness_sync_meta where user_id = $1", [userId]);
}

export async function setLastSyncedAt(userId: string, value: string): Promise<void> {
  const db = await getDatabase();
  if (!db) {
    const state = readWebState();
    state.lastSyncedAt[userId] = value;
    writeWebState(state);
    return;
  }
  await db.execute(
    `insert into wellness_sync_meta (user_id, last_synced_at)
     values ($1, $2)
     on conflict(user_id) do update set last_synced_at = excluded.last_synced_at`,
    [userId, value],
  );
}

export async function getLastSyncedAt(userId: string): Promise<string | null> {
  const db = await getDatabase();
  if (!db) return readWebState().lastSyncedAt[userId] ?? null;
  const rows = await db.select<Array<{ last_synced_at: string | null }>>(
    "select last_synced_at from wellness_sync_meta where user_id = $1",
    [userId],
  );
  return rows[0]?.last_synced_at ?? null;
}
