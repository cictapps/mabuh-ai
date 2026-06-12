import { describe, it, expect } from "vitest";
import {
  nextStreak,
  isSameLocalDay,
  isYesterday,
  todayKey,
  levelFromXp,
  xpIntoLevel,
  levelProgressPercent,
  XP_REWARDS,
  DAILY_CAPS,
  canAward,
  awardAction,
  emptyLedger,
  newRewardsAtLevel,
  reachedMilestones,
  REWARDS,
} from "./xp";

function at(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

describe("isSameLocalDay", () => {
  it("returns true for two times on the same calendar day", () => {
    expect(isSameLocalDay(at(2025, 1, 5), at(2025, 1, 5))).toBe(true);
  });

  it("returns false for different days", () => {
    expect(isSameLocalDay(at(2025, 1, 5), at(2025, 1, 6))).toBe(false);
  });
});

describe("isYesterday", () => {
  it("returns true when prev is exactly one day before today", () => {
    expect(isYesterday(at(2025, 1, 5), at(2025, 1, 6))).toBe(true);
  });

  it("returns false when prev is two days before today", () => {
    expect(isYesterday(at(2025, 1, 4), at(2025, 1, 6))).toBe(false);
  });

  it("returns false when prev is today", () => {
    expect(isYesterday(at(2025, 1, 5), at(2025, 1, 5))).toBe(false);
  });
});

describe("todayKey", () => {
  it("formats as yyyy-mm-dd", () => {
    expect(todayKey(at(2025, 1, 5))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("nextStreak", () => {
  const today = at(2025, 1, 10);

  it("starts a streak at 1 when lastFlightDate is null", () => {
    const r = nextStreak({ lastFlightDate: null, currentStreak: 0, today });
    expect(r.streak).toBe(1);
    expect(r.incremented).toBe(true);
    expect(r.reset).toBe(true);
  });

  it("keeps the streak when lastFlightDate is today", () => {
    const r = nextStreak({ lastFlightDate: "2025-01-10", currentStreak: 4, today });
    expect(r.streak).toBe(4);
    expect(r.incremented).toBe(false);
    expect(r.reset).toBe(false);
  });

  it("increments the streak when lastFlightDate was yesterday", () => {
    const r = nextStreak({ lastFlightDate: "2025-01-09", currentStreak: 4, today });
    expect(r.streak).toBe(5);
    expect(r.incremented).toBe(true);
    expect(r.reset).toBe(false);
  });

  it("resets the streak to 1 when the gap is more than one day", () => {
    const r = nextStreak({ lastFlightDate: "2024-12-30", currentStreak: 12, today });
    expect(r.streak).toBe(1);
    expect(r.incremented).toBe(true);
    expect(r.reset).toBe(true);
  });

  it("does not extend the streak when lastFlightDate is in the future", () => {
    const r = nextStreak({ lastFlightDate: "2099-12-31", currentStreak: 7, today });
    expect(r.streak).toBe(7);
    expect(r.incremented).toBe(false);
  });

  it("resets when lastFlightDate is invalid", () => {
    const r = nextStreak({ lastFlightDate: "not-a-date", currentStreak: 3, today });
    expect(r.streak).toBe(1);
    expect(r.reset).toBe(true);
  });
});

describe("levelFromXp / xpIntoLevel / levelProgressPercent", () => {
  it("starts at level 1 with 0 XP", () => {
    expect(levelFromXp(0)).toBe(1);
    expect(xpIntoLevel(0)).toBe(0);
  });

  it("level 1 at 0-49 XP", () => {
    expect(levelFromXp(49)).toBe(1);
    expect(xpIntoLevel(49)).toBe(49);
  });

  it("levels up at 50 XP", () => {
    expect(levelFromXp(50)).toBe(2);
    expect(xpIntoLevel(50)).toBe(0);
  });

  it("reports correct percent", () => {
    expect(levelProgressPercent(25)).toBe(50);
    expect(levelProgressPercent(50)).toBe(0);
    expect(levelProgressPercent(75)).toBe(50);
  });
});

describe("XP_REWARDS and DAILY_CAPS", () => {
  it("all actions have a reward defined", () => {
    const actions = [
      "preflight",
      "checkpoint",
      "final",
      "garden_start",
      "garden_care",
      "garden_finish",
      "mood_checkin",
      "journal_entry",
    ] as const;
    for (const a of actions) {
      expect(XP_REWARDS[a]).toBeGreaterThan(0);
      expect(DAILY_CAPS[a]).toBeGreaterThan(0);
    }
  });

  it("checkpoint has cap of 3, others have cap of 1-2", () => {
    expect(DAILY_CAPS.checkpoint).toBe(3);
    expect(DAILY_CAPS.preflight).toBe(1);
    expect(DAILY_CAPS.final).toBe(1);
    expect(DAILY_CAPS.journal_entry).toBe(1);
    expect(DAILY_CAPS.mood_checkin).toBe(2);
  });
});

describe("activity ledger", () => {
  it("empty ledger allows first award", () => {
    const ledger = emptyLedger("2025-01-10");
    expect(canAward(ledger, "preflight", "src-1")).toBe(true);
  });

  it("blocks duplicate sourceId", () => {
    const ledger = awardAction(
      emptyLedger("2025-01-10"),
      "preflight",
      "src-1",
      "2025-01-10T12:00:00Z",
    );
    expect(canAward(ledger, "preflight", "src-1")).toBe(false);
  });

  it("blocks when daily cap is reached", () => {
    let ledger = emptyLedger("2025-01-10");
    // mood_checkin cap is 2
    ledger = awardAction(ledger, "mood_checkin", "src-1", "2025-01-10T12:00:00Z");
    ledger = awardAction(ledger, "mood_checkin", "src-2", "2025-01-10T14:00:00Z");
    expect(canAward(ledger, "mood_checkin", "src-3")).toBe(false);
  });

  it("does not mutate the original ledger when blocked", () => {
    const ledger = emptyLedger("2025-01-10");
    const filled = awardAction(ledger, "preflight", "src-1", "2025-01-10T12:00:00Z");
    const same = awardAction(filled, "preflight", "src-1", "2025-01-10T12:01:00Z");
    expect(same).toBe(filled);
    expect(same.counts.preflight).toBe(1);
  });

  it("different actions are independent", () => {
    let ledger = emptyLedger("2025-01-10");
    ledger = awardAction(ledger, "preflight", "src-p", "2025-01-10T12:00:00Z");
    expect(canAward(ledger, "journal_entry", "src-j")).toBe(true);
    const result = awardAction(ledger, "journal_entry", "src-j", "2025-01-10T13:00:00Z");
    expect(result.counts.preflight).toBe(1);
    expect(result.counts.journal_entry).toBe(1);
  });

  it("shares daily caps between Flight and Garden equivalents", () => {
    let ledger = emptyLedger("2025-01-10");
    ledger = awardAction(ledger, "preflight", "journey-start", "2025-01-10T08:00:00Z");
    expect(canAward(ledger, "garden_start", "garden-start")).toBe(false);

    ledger = awardAction(ledger, "checkpoint", "care-1", "2025-01-10T10:00:00Z");
    ledger = awardAction(ledger, "garden_care", "care-2", "2025-01-10T12:00:00Z");
    ledger = awardAction(ledger, "checkpoint", "care-3", "2025-01-10T14:00:00Z");
    expect(canAward(ledger, "garden_care", "care-4")).toBe(false);
  });
});

describe("newRewardsAtLevel", () => {
  it("awards nothing when level does not change", () => {
    const r = newRewardsAtLevel(1, 1, new Set());
    expect(r).toEqual([]);
  });

  it("unlocks level 2 reward when crossing from level 1 to 2", () => {
    const r = newRewardsAtLevel(1, 2, new Set(["dusk-trainer"]));
    expect(r.map((x) => x.id)).toEqual(["dawn-sky"]);
  });

  it("unlocks multiple level rewards when skipping levels", () => {
    const r = newRewardsAtLevel(0, 3, new Set());
    const ids = r.map((x) => x.id);
    expect(ids).toContain("dusk-trainer");
    expect(ids).toContain("dawn-sky");
    expect(ids).toContain("cruiser");
  });

  it("does not re-award already unlocked rewards", () => {
    const already = new Set(["dusk-trainer", "dawn-sky"]);
    const r = newRewardsAtLevel(1, 3, already);
    expect(r.map((x) => x.id)).toEqual(["cruiser", "plant-fern"]);
  });
});

describe("REWARDS", () => {
  it("has rewards across levels 1-10", () => {
    expect(REWARDS.length).toBeGreaterThanOrEqual(10);
    for (let i = 1; i <= 10; i++) {
      expect(REWARDS.some((r) => r.level === i)).toBe(true);
    }
  });
});

describe("reachedMilestones", () => {
  it("returns first-flight milestone at 1 flight", () => {
    const ms = reachedMilestones(1, 0, 0, 0, 0);
    expect(ms.some((m) => m.id === "first-flight")).toBe(true);
    expect(ms.some((m) => m.id === "three-flights")).toBe(false);
  });

  it("returns flight milestones up to 10 flights", () => {
    const ms = reachedMilestones(10, 0, 0, 0, 0);
    expect(ms.some((m) => m.id === "first-flight")).toBe(true);
    expect(ms.some((m) => m.id === "ten-flights")).toBe(true);
    expect(ms.some((m) => m.id === "twentyfive-flights")).toBe(false);
  });

  it("returns first-journal milestone", () => {
    const ms = reachedMilestones(0, 0, 1, 0, 0);
    expect(ms.some((m) => m.id === "first-journal")).toBe(true);
  });

  it("returns first-pause milestone", () => {
    const ms = reachedMilestones(0, 0, 0, 1, 0);
    expect(ms.some((m) => m.id === "first-pause")).toBe(true);
  });

  it("returns weekly-rhythm milestone", () => {
    const ms = reachedMilestones(0, 0, 0, 0, 7);
    expect(ms.some((m) => m.id === "weekly-rhythm")).toBe(true);
  });

  it("returns Garden milestones without requiring a flight", () => {
    const ms = reachedMilestones(0, 7, 0, 0, 0);
    expect(ms.some((m) => m.id === "first-plant-day")).toBe(true);
    expect(ms.some((m) => m.id === "first-bloom")).toBe(true);
  });
});
