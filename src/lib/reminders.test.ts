import { describe, it, expect } from "vitest";
import type { ReminderPreferences } from "@/hooks/useMoodStore";
import { nextFireDate, randomFireDatesForDay, reminderMessageForDate } from "./reminders";

function at(year: number, month: number, day: number, hour = 9, minute = 0): Date {
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

function prefs(next: Partial<ReminderPreferences> = {}): ReminderPreferences {
  return {
    enabled: true,
    hour: 9,
    minute: 0,
    mode: "fixed",
    dailyCount: 2,
    ...next,
  };
}

describe("nextFireDate", () => {
  it("returns today's time when it is still in the future", () => {
    const now = at(2025, 1, 10, 8, 0);
    const fire = nextFireDate(prefs(), now);
    expect(fire.getHours()).toBe(9);
    expect(fire.getMinutes()).toBe(0);
    expect(fire.getDate()).toBe(10);
  });

  it("rolls to tomorrow when today's time has already passed", () => {
    const now = at(2025, 1, 10, 10, 30);
    const fire = nextFireDate(prefs(), now);
    expect(fire.getDate()).toBe(11);
    expect(fire.getHours()).toBe(9);
    expect(fire.getMinutes()).toBe(0);
  });

  it("respects minute precision", () => {
    const now = at(2025, 1, 10, 8, 0);
    const fire = nextFireDate(prefs({ hour: 8, minute: 30 }), now);
    expect(fire.getHours()).toBe(8);
    expect(fire.getMinutes()).toBe(30);
    expect(fire.getDate()).toBe(10);
  });

  it("rolls to tomorrow at the exact match moment (== now)", () => {
    const now = at(2025, 1, 10, 9, 0);
    const fire = nextFireDate(prefs(), now);
    expect(fire.getDate()).toBe(11);
  });

  it("returns the next random check-in still ahead today", () => {
    const randomPrefs = prefs({ mode: "random", dailyCount: 3 });
    const now = at(2025, 1, 10, 7, 30);
    const slots = randomFireDatesForDay(randomPrefs, now);
    const fire = nextFireDate(randomPrefs, now);

    expect(slots).toHaveLength(3);
    expect(fire).toEqual(slots[0]);
    expect(fire.getHours()).toBeGreaterThanOrEqual(8);
    expect(fire.getHours()).toBeLessThan(22);
  });

  it("rolls random check-ins forward after today's slots pass", () => {
    const randomPrefs = prefs({ mode: "random", dailyCount: 2 });
    const now = at(2025, 1, 10, 23, 0);
    const fire = nextFireDate(randomPrefs, now);

    expect(fire.getDate()).toBe(11);
    expect(fire.getHours()).toBeGreaterThanOrEqual(8);
    expect(fire.getHours()).toBeLessThan(22);
  });
});

describe("reminderMessageForDate", () => {
  it("returns a stable message for the same calendar day", () => {
    const morning = at(2025, 1, 10, 8, 0);
    const evening = at(2025, 1, 10, 20, 0);

    expect(reminderMessageForDate(morning)).toEqual(reminderMessageForDate(evening));
  });

  it("rotates messages across consecutive days", () => {
    const today = reminderMessageForDate(at(2025, 1, 10));
    const tomorrow = reminderMessageForDate(at(2025, 1, 11));

    expect(tomorrow).not.toEqual(today);
  });

  it("does not use the legacy 'A note for you' title", () => {
    for (let day = 0; day < 30; day += 1) {
      const date = at(2025, 1, 10 + day);
      expect(reminderMessageForDate(date).title).not.toBe("A note for you");
    }
  });

  it("always returns a non-empty, warm body and a meaningful title", () => {
    for (let day = 0; day < 60; day += 1) {
      const date = at(2025, 1, 10 + day);
      const msg = reminderMessageForDate(date);
      expect(msg.title.length).toBeGreaterThan(3);
      expect(msg.body.length).toBeGreaterThan(90);
      // The pool is warm/student-centered, not clinical.
      expect(msg.body).not.toMatch(/\b(appointment|medication|dosage)\b/i);
    }
  });

  it("includes encouragement about kindness to others and healthy boundaries", () => {
    const messages = Array.from({ length: 60 }, (_, day) =>
      reminderMessageForDate(at(2025, 1, 10 + day)),
    );

    expect(
      messages.some((message) =>
        /kindness|kind to others|patient word|listening/i.test(
          `${message.title} ${message.body}`,
        ),
      ),
    ).toBe(true);
    expect(
      messages.some((message) =>
        /boundaries|limits|include you/i.test(`${message.title} ${message.body}`),
      ),
    ).toBe(true);
  });
});
