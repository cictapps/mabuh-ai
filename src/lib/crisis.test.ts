import { describe, it, expect } from "vitest";
import { detectCrisis, CRISIS_RESOURCES, resourceForKey } from "./crisis";

describe("detectCrisis", () => {
  it("returns null for normal messages", () => {
    expect(detectCrisis("I had a tough day at school.")).toBeNull();
  });

  it("flags imminent ideation language", () => {
    const r = detectCrisis("I want to kill myself tonight");
    expect(r?.level).toBe("imminent");
    expect(r?.resourceKey).toBe("ph-immediate");
    expect(r?.matched.length).toBeGreaterThan(0);
  });

  it("flags concern language (suicidal, self-harm)", () => {
    const r = detectCrisis("I've been feeling suicidal lately");
    expect(r?.level).toBe("concern");
    expect(r?.resourceKey).toBe("ph-hopeline");
  });

  it("flags self-harm patterns as concern", () => {
    expect(detectCrisis("I keep cutting myself")).toMatchObject({
      level: "concern",
    });
  });

  it("does not flag empty or test messages", () => {
    expect(detectCrisis("")).toBeNull();
    expect(detectCrisis("   ")).toBeNull();
    expect(detectCrisis("test")).toBeNull();
    expect(detectCrisis("ping")).toBeNull();
    expect(detectCrisis("[dev ping]")).toBeNull();
  });

  it("ignores non-string input safely", () => {
    // @ts-expect-error testing runtime guard
    expect(detectCrisis(undefined)).toBeNull();
    // @ts-expect-error testing runtime guard
    expect(detectCrisis(null)).toBeNull();
  });

  it("does not flag the word 'kill' inside other contexts", () => {
    expect(detectCrisis("I need to kill this bug in my code")).toBeNull();
  });
});

describe("CRISIS_RESOURCES", () => {
  it("has a Philippine immediate resource", () => {
    const r = resourceForKey("ph-immediate");
    expect(r.title.length).toBeGreaterThan(0);
    expect(r.lines.length).toBeGreaterThan(0);
  });

  it("has a Philippine hopeline resource", () => {
    const r = resourceForKey("ph-hopeline");
    expect(r.lines.length).toBeGreaterThan(0);
  });

  it("exposes the three expected keys", () => {
    expect(Object.keys(CRISIS_RESOURCES).sort()).toEqual(
      ["int-immediate", "ph-hopeline", "ph-immediate"].sort(),
    );
  });
});
