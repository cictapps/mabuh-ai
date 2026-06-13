import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUpdate = vi.fn();
const mockInsert = vi.fn();
const mockDelete = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

let insertCallCount = 0;

vi.mock("../supabase", () => ({
  supabase: {
    from: () => ({
      update: (...args: unknown[]) => {
        mockUpdate(...args);
        return {
          eq: (...e: unknown[]) => {
            mockEq(...e);
            return {
              select: (...s: unknown[]) => {
                mockSelect(...s);
                return {
                  single: () => {
                    const row = {
                      id: "entry-1",
                      user_id: "user-1",
                      mood: "calm",
                      tags: ["rested"],
                      journal: "soft evening",
                      school_load: 2,
                      activity_minutes: 15,
                      day_note: "nice day",
                      social_interactions: [],
                      activities: {
                        work: [],
                        health: [],
                        sleep: [],
                        food: [],
                        hobbies: [],
                        weather: [],
                        sports: [],
                      },
                      entry_date: "2026-06-13",
                      logged_at: "2026-06-13T20:00:00.000Z",
                    };
                    mockSingle();
                    return Promise.resolve({ data: row, error: null });
                  },
                };
              },
            };
          },
        };
      },
      insert: (...args: unknown[]) => {
        mockInsert(...args);
        insertCallCount += 1;
        const id = `entry-${insertCallCount}`;
        return {
          select: () => ({
            single: () =>
              Promise.resolve({
                data: {
                  id,
                  user_id: "user-1",
                  mood: "okay",
                  tags: [],
                  journal: "",
                  school_load: null,
                  activity_minutes: null,
                  day_note: null,
                  social_interactions: [],
                  activities: {
                    work: [],
                    health: [],
                    sleep: [],
                    food: [],
                    hobbies: [],
                    weather: [],
                    sports: [],
                  },
                  entry_date: "2026-06-13",
                  logged_at: "2026-06-13T20:05:00.000Z",
                },
                error: null,
              }),
          }),
        };
      },
      delete: () => {
        mockDelete();
        return {
          eq: (...e: unknown[]) => {
            mockEq(...e);
            return Promise.resolve({ error: null });
          },
        };
      },
    }),
    auth: {
      getUser: () =>
        Promise.resolve({ data: { user: { id: "user-1" } } }),
    },
  },
}));

import { insertMoodEntry, updateMoodEntry, deleteMoodEntry } from "./moodRepository";

describe("moodRepository", () => {
  beforeEach(() => {
    mockUpdate.mockClear();
    mockInsert.mockClear();
    mockDelete.mockClear();
    mockSelect.mockClear();
    mockEq.mockClear();
    mockSingle.mockClear();
    insertCallCount = 0;
  });

  it("allows multiple entries on the same day with different timestamps", async () => {
    const first = await insertMoodEntry(
      { mood: "okay", tags: [], journal: "" },
      new Date("2026-06-13T08:00:00"),
    );
    const second = await insertMoodEntry(
      { mood: "calm", tags: ["rested"], journal: "morning" },
      new Date("2026-06-13T20:00:00"),
    );
    expect(first.id).not.toBe(second.id);
    expect(first.date).toBe(second.date);
    expect(mockInsert).toHaveBeenCalledTimes(2);
  });

  it("updateMoodEntry sends a partial update scoped by id", async () => {
    const updated = await updateMoodEntry("entry-1", {
      mood: "calm",
      tags: ["rested"],
      journal: "soft evening",
      schoolLoad: 2,
      activityMinutes: 15,
      dayNote: "nice day",
    });
    expect(updated.id).toBe("entry-1");
    expect(updated.mood).toBe("calm");
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    const [payload] = mockUpdate.mock.calls[0];
    expect(payload.mood).toBe("calm");
    expect(payload.tags).toEqual(["rested"]);
    expect(mockEq).toHaveBeenCalledWith("id", "entry-1");
  });

  it("deleteMoodEntry removes by id", async () => {
    await deleteMoodEntry("entry-1");
    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockEq).toHaveBeenCalledWith("id", "entry-1");
  });
});
