// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({
  isTauri: () => false,
}));

vi.mock("../supabase", () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getSession: vi.fn(),
    },
  },
}));

import {
  deleteMoodEntry,
  insertJournalEntry,
  insertMoodEntry,
  listJournalEntries,
  listMoodEntries,
  getSyncStatus,
  syncWellnessData,
  updateMoodEntry,
} from "./moodRepository";
import { listPendingMutations } from "./localWellnessDb";
import { supabase } from "../supabase";

describe("offline-first mood repository", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(supabase.from).mockReset();
    vi.useRealTimers();
  });

  it("saves multiple same-day entries locally with stable client IDs", async () => {
    const first = await insertMoodEntry(
      { mood: "okay", tags: [], journal: "" },
      new Date("2026-06-13T08:00:00"),
      "user-1",
    );
    const second = await insertMoodEntry(
      { mood: "calm", tags: ["rested"], journal: "morning" },
      new Date("2026-06-13T20:00:00"),
      "user-1",
    );

    expect(first.id).not.toBe(second.id);
    expect(first.date).toBe(second.date);
    expect(await listMoodEntries("user-1")).toEqual([first, second]);
    expect(await listPendingMutations("user-1")).toHaveLength(2);
  });

  it("updates the local record and queues an upsert", async () => {
    const entry = await insertMoodEntry(
      { mood: "okay", tags: [], journal: "" },
      new Date("2026-06-13T08:00:00"),
      "user-1",
    );
    const updated = await updateMoodEntry(
      entry.id,
      {
        mood: "calm",
        tags: ["rested"],
        journal: "soft evening",
        schoolLoad: 2,
      },
      "user-1",
    );

    expect(updated.mood).toBe("calm");
    expect((await listMoodEntries("user-1"))[0]?.journal).toBe("soft evening");
    expect(await listPendingMutations("user-1")).toHaveLength(2);
  });

  it("deletes locally and retains a durable delete mutation", async () => {
    const entry = await insertMoodEntry(
      { mood: "worried", tags: [], journal: "" },
      new Date("2026-06-13T08:00:00"),
      "user-1",
    );
    await deleteMoodEntry(entry.id, "user-1");

    expect(await listMoodEntries("user-1")).toEqual([]);
    const pending = await listPendingMutations("user-1");
    expect(pending[pending.length - 1]).toMatchObject({
      entityId: entry.id,
      operation: "delete",
    });
  });

  it("keeps records isolated by signed-in user", async () => {
    await insertJournalEntry("private note", new Date("2026-06-13"), "user-1");
    await insertJournalEntry("other note", new Date("2026-06-13"), "user-2");

    expect((await listJournalEntries("user-1")).map((entry) => entry.content)).toEqual([
      "private note",
    ]);
    expect((await listJournalEntries("user-2")).map((entry) => entry.content)).toEqual([
      "other note",
    ]);
  });

  it("times out a stalled sync, clears syncing, and allows retry", async () => {
    vi.useFakeTimers();
    const never = new Promise<never>(() => {});
    vi.mocked(supabase.from).mockImplementation(
      () =>
        ({
          select: () => ({
            order: () => never,
            then: never.then.bind(never),
          }),
        }) as never,
    );

    const stalledSync = syncWellnessData("user-1");
    await vi.advanceTimersByTimeAsync(20_000);
    const timedOut = await stalledSync;

    expect(timedOut.syncing).toBe(false);
    expect(timedOut.error).toMatch(/timed out/i);
    expect((await getSyncStatus("user-1")).syncing).toBe(false);

    vi.mocked(supabase.from).mockImplementation(
      () =>
        ({
          select: () => {
            const result = Promise.resolve({ data: [], error: null });
            return {
              order: () => result,
              then: result.then.bind(result),
            };
          },
        }) as never,
    );

    const retried = await syncWellnessData("user-1");
    expect(retried).toMatchObject({
      pendingCount: 0,
      syncing: false,
      error: null,
    });
  });
});
