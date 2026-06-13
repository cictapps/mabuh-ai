import { describe, it, expect } from "vitest";
import { nextFireDate, reminderMessageForDate } from "./reminders";

function at(year: number, month: number, day: number, hour = 9, minute = 0): Date {
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

describe("nextFireDate", () => {
  it("returns today's time when it is still in the future", () => {
    const now = at(2025, 1, 10, 8, 0);
    const fire = nextFireDate({ enabled: true, hour: 9, minute: 0 }, now);
    expect(fire.getHours()).toBe(9);
    expect(fire.getMinutes()).toBe(0);
    expect(fire.getDate()).toBe(10);
  });

  it("rolls to tomorrow when today's time has already passed", () => {
    const now = at(2025, 1, 10, 10, 30);
    const fire = nextFireDate({ enabled: true, hour: 9, minute: 0 }, now);
    expect(fire.getDate()).toBe(11);
    expect(fire.getHours()).toBe(9);
    expect(fire.getMinutes()).toBe(0);
  });

  it("respects minute precision", () => {
    const now = at(2025, 1, 10, 8, 0);
    const fire = nextFireDate({ enabled: true, hour: 8, minute: 30 }, now);
    expect(fire.getHours()).toBe(8);
    expect(fire.getMinutes()).toBe(30);
    expect(fire.getDate()).toBe(10);
  });

  it("rolls to tomorrow at the exact match moment (== now)", () => {
    const now = at(2025, 1, 10, 9, 0);
    const fire = nextFireDate({ enabled: true, hour: 9, minute: 0 }, now);
    expect(fire.getDate()).toBe(11);
  });
});

describe("reminderMessageForDate", () => {
  it("returns a stable message for the same calendar day", () => {
    const morning = at(2025, 1, 10, 8, 0);
    const evening = at(2025, 1, 10, 20, 0);

    expect(reminderMessageForDate(morning)).toEqual(
      reminderMessageForDate(evening),
    );
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
    for (let day = 0; day < 20; day += 1) {
      const date = at(2025, 1, 10 + day);
      const msg = reminderMessageForDate(date);
      expect(msg.title.length).toBeGreaterThan(3);
      expect(msg.body.length).toBeGreaterThan(15);
      // The pool is warm/student-centered, not clinical.
      expect(msg.body).not.toMatch(/\b(appointment|medication|dosage)\b/i);
    }
  });
});
