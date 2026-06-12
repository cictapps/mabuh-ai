import { describe, it, expect } from "vitest";
import { nextFireDate } from "./reminders";

describe("nextFireDate", () => {
  function at(year: number, month: number, day: number, hour = 9, minute = 0): Date {
    return new Date(year, month - 1, day, hour, minute, 0, 0);
  }

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
