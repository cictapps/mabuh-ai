import { describe, it, expect } from "vitest";
import {
  loadProviders,
  loadHotlines,
  summarizeDirectory,
  isVerifiedProvider,
  HOTLINES,
  PROVIDERS,
} from "./providers";

describe("provider registry", () => {
  it("loads a non-empty list of providers and hotlines", () => {
    const providers = loadProviders();
    const hotlines = loadHotlines();
    expect(providers.length).toBeGreaterThan(0);
    expect(hotlines.length).toBeGreaterThan(0);
  });

  it("every provider has a unique id", () => {
    const ids = new Set<string>();
    for (const p of PROVIDERS) {
      expect(ids.has(p.id)).toBe(false);
      ids.add(p.id);
    }
  });

  it("every provider has a region set", () => {
    for (const p of PROVIDERS) {
      expect(p.region.length).toBeGreaterThan(0);
    }
    for (const h of HOTLINES) {
      expect(h.region.length).toBeGreaterThan(0);
    }
  });

  it("summarizes counts and regions correctly", () => {
    const summary = summarizeDirectory();
    expect(summary.totalProviders).toBe(PROVIDERS.length);
    expect(summary.totalHotlines).toBe(HOTLINES.length);
    expect(summary.byCategory.hotline).toBe(HOTLINES.length);
    expect(summary.regions.length).toBeGreaterThan(0);
    // Every existing entry is currently unverified.
    expect(summary.unverifiedCount).toBe(PROVIDERS.length + HOTLINES.length);
  });

  it("treats all current entries as unverified", () => {
    for (const p of PROVIDERS) {
      expect(p.verification.lastVerifiedAt).toBeNull();
      expect(p.verification.sourceUrl).toBe("internal-tbd");
    }
  });

  it("isVerifiedProvider returns false for unverified entries", () => {
    for (const p of PROVIDERS) {
      expect(isVerifiedProvider(p)).toBe(false);
    }
  });

  it("isVerifiedProvider honours a recent sourceUrl and timestamp", () => {
    const verified = {
      ...PROVIDERS[0],
      verification: {
        sourceUrl: "https://example.gov/directory",
        lastVerifiedAt: new Date().toISOString(),
        verifiedBy: "maintainer@example.com",
        addedAt: "2024-01-01T00:00:00Z",
      },
    };
    expect(isVerifiedProvider(verified)).toBe(true);
  });

  it("isVerifiedProvider rejects entries verified more than 6 months ago", () => {
    const old = new Date();
    old.setMonth(old.getMonth() - 8);
    const verified = {
      ...PROVIDERS[0],
      verification: {
        sourceUrl: "https://example.gov/directory",
        lastVerifiedAt: old.toISOString(),
        verifiedBy: "maintainer@example.com",
        addedAt: "2024-01-01T00:00:00Z",
      },
    };
    expect(isVerifiedProvider(verified)).toBe(false);
  });

  it("hotlines declare their service hours as unconfirmed by default", () => {
    for (const h of HOTLINES) {
      expect(h.hours?.isConfirmed).toBe(false);
    }
  });
});
