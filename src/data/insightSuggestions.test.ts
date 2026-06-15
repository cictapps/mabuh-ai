import { describe, expect, it } from "vitest";
import { getTrendSuggestions } from "./insightSuggestions";
import type { MoodEntry } from "../types";

const entries: MoodEntry[] = [
  {
    id: "1",
    date: "2026-06-10",
    mood: "okay",
    tags: [],
    journal: "",
    timestamp: 1,
  },
  {
    id: "2",
    date: "2026-06-11",
    mood: "calm",
    tags: [],
    journal: "",
    timestamp: 2,
  },
  {
    id: "3",
    date: "2026-06-12",
    mood: "happy",
    tags: [],
    journal: "",
    timestamp: 3,
  },
];

describe("getTrendSuggestions", () => {
  it("returns a shuffled pool without duplicate entries", () => {
    const suggestions = getTrendSuggestions(entries, () => 0.25);
    expect(suggestions.length).toBeGreaterThan(3);
    expect(new Set(suggestions.map((suggestion) => suggestion.id)).size).toBe(
      suggestions.length,
    );
  });

  it("can produce a different order for a new page visit", () => {
    const first = getTrendSuggestions(entries, () => 0);
    const second = getTrendSuggestions(entries, () => 0.99);
    expect(first.map((suggestion) => suggestion.id)).not.toEqual(
      second.map((suggestion) => suggestion.id),
    );
  });
});
