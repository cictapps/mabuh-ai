import { describe, it, expect } from "vitest";
import {
  buildChatContext,
  summarizeContextSize,
  type ChatContextInput,
} from "./aiContext";

const baseInput: ChatContextInput = {
  displayName: "Maria Santos",
  moods: [
    {
      date: "2025-01-10",
      mood: "stressed",
      tags: ["school", "exams"],
      schoolLoad: 4,
      activityMinutes: 30,
      activities: { work: ["essay"] },
      socialInteractions: [{ who: "friend" }],
      dayNote: "Finals week pressure. " + "x".repeat(500),
    },
  ],
  journals: [
    {
      date: "2025-01-10",
      content: "Felt overwhelmed by group project. ".repeat(50),
      source: "manual",
      mood: "stressed",
    },
  ],
  socialStats: { avg: 2 },
  analytics: { currentStreak: 4, lifetimeDays: 12, stabilityScore: 0.7 },
  journey: {
    phase: "airborne",
    streak: 3,
    totalXp: 25,
    flightsCompleted: 2,
    lastFlightDate: "2025-01-09",
    preflightMood: "okay",
    checkpointMood: null,
    finalMood: null,
  },
};

describe("buildChatContext", () => {
  it("returns an empty payload when all toggles are off", () => {
    const built = buildChatContext(baseInput, {
      displayName: false,
      recentMoods: false,
      recentJournals: false,
      socialStats: false,
      journeyStats: false,
      analyticsStats: false,
    });
    expect(built.payload).toEqual({});
    expect(built.sharedSources).toEqual([]);
    expect(built.audience).toBe("student");
  });

  it("includes the display name only when toggled on", () => {
    const off = buildChatContext(baseInput, {
      displayName: false,
      recentMoods: false,
      recentJournals: false,
      socialStats: false,
      journeyStats: false,
      analyticsStats: false,
    });
    expect(off.payload).not.toHaveProperty("user");

    const on = buildChatContext(baseInput, {
      displayName: true,
      recentMoods: false,
      recentJournals: false,
      socialStats: false,
      journeyStats: false,
      analyticsStats: false,
    });
    expect(on.payload).toMatchObject({
      user: { displayName: "Maria Santos" },
    });
    expect(on.sharedSources).toEqual(["displayName"]);
  });

  it("truncates long display names", () => {
    const long = { ...baseInput, displayName: "X".repeat(200) };
    const built = buildChatContext(long, {
      displayName: true,
      recentMoods: false,
      recentJournals: false,
      socialStats: false,
      journeyStats: false,
      analyticsStats: false,
    });
    const user = built.payload.user as { displayName: string };
    expect(user.displayName.length).toBeLessThanOrEqual(60);
  });

  it("redacts mood entries to safe fields and clips day_note", () => {
    const built = buildChatContext(baseInput, {
      displayName: false,
      recentMoods: true,
      recentJournals: false,
      socialStats: false,
      journeyStats: false,
      analyticsStats: false,
    });
    const mood = (built.payload.mood as { recent: Array<Record<string, unknown>> })
      .recent[0];
    expect(mood.date).toBe("2025-01-10");
    expect(mood.mood).toBe("stressed");
    expect(mood.schoolLoad).toBe(4);
    expect(mood.activityMinutes).toBe(30);
    expect(mood.activities).toEqual({ work: ["essay"] });
    // dayNote is clipped with an ellipsis
    const note = mood.dayNote as string;
    expect(note.length).toBeLessThanOrEqual(DAY_NOTE_MAX_INTERNAL + 1);
  });

  it("truncates journal bodies to the safety cap", () => {
    const built = buildChatContext(baseInput, {
      displayName: false,
      recentMoods: false,
      recentJournals: true,
      socialStats: false,
      journeyStats: false,
      analyticsStats: false,
    });
    const journals = (built.payload.journal as { recent: Array<Record<string, unknown>> })
      .recent;
    expect(journals.length).toBe(1);
    const content = journals[0].content as string;
    expect(content.length).toBeLessThanOrEqual(JOURNAL_BODY_MAX_INTERNAL + 1);
  });

  it("always sets audience=student on the result", () => {
    const built = buildChatContext(baseInput, {
      displayName: false,
      recentMoods: false,
      recentJournals: false,
      socialStats: false,
      journeyStats: false,
      analyticsStats: false,
    });
    expect(built.audience).toBe("student");
  });

  it("reports the number of shared sources correctly", () => {
    const built = buildChatContext(baseInput, {
      displayName: true,
      recentMoods: true,
      recentJournals: false,
      socialStats: true,
      journeyStats: false,
      analyticsStats: false,
    });
    expect(built.sharedSources.sort()).toEqual(
      ["displayName", "recentMoods", "socialStats"].sort(),
    );
    expect(summarizeContextSize(built)).toEqual({ fields: 3, sources: 3 });
  });

  it("ignores journeyStats and analyticsStats when toggled off", () => {
    const built = buildChatContext(baseInput, {
      displayName: false,
      recentMoods: false,
      recentJournals: false,
      socialStats: false,
      journeyStats: false,
      analyticsStats: false,
    });
    expect(built.payload).not.toHaveProperty("journey");
    expect(built.payload).not.toHaveProperty("analytics");
  });
});

// Internal caps mirrored from aiContext.ts. They are not exported.
const DAY_NOTE_MAX_INTERNAL = 320;
const JOURNAL_BODY_MAX_INTERNAL = 600;
