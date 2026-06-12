import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const AI_CONTEXT_KEYS = [
  "displayName",
  "recentMoods",
  "recentJournals",
  "socialStats",
  "journeyStats",
  "analyticsStats",
] as const;

export type AiContextKey = (typeof AI_CONTEXT_KEYS)[number];

export type AiContextToggles = Record<AiContextKey, boolean>;

export const DEFAULT_AI_TOGGLES: AiContextToggles = {
  displayName: false,
  recentMoods: false,
  recentJournals: false,
  socialStats: false,
  journeyStats: false,
  analyticsStats: false,
};

export const CONTEXT_LABELS: Record<AiContextKey, { title: string; blurb: string }> = {
  displayName: {
    title: "Your display name",
    blurb: "Lets the companion greet you by name.",
  },
  recentMoods: {
    title: "Recent mood check-ins",
    blurb: "Last 7 entries: mood, tags, school load, activities, and day notes.",
  },
  recentJournals: {
    title: "Recent journal entries",
    blurb: "Up to 5 of your most recent journal entries (truncated).",
  },
  socialStats: {
    title: "Social interaction stats",
    blurb: "Counts and averages of your social interactions.",
  },
  journeyStats: {
    title: "Journey stats",
    blurb: "Current phase, streak, total XP, and last flight date.",
  },
  analyticsStats: {
    title: "Analytics stats",
    blurb: "Lifetime days, current streak, and stability score.",
  },
};

const CONSENT_ACK_KEY = "ai-context-consent-acknowledged";

type AiConsentState = {
  toggles: AiContextToggles;
  consentAcknowledged: boolean;
  setToggle: (key: AiContextKey, value: boolean) => void;
  setToggles: (next: Partial<AiContextToggles>) => void;
  acknowledgeConsent: () => void;
  resetConsent: () => void;
};

export const useAiConsentStore = create<AiConsentState>()(
  persist(
    (set) => ({
      toggles: { ...DEFAULT_AI_TOGGLES },
      consentAcknowledged: false,
      setToggle: (key, value) =>
        set((state) => ({
          toggles: { ...state.toggles, [key]: value },
        })),
      setToggles: (next) => set((state) => ({ toggles: { ...state.toggles, ...next } })),
      acknowledgeConsent: () => {
        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem(CONSENT_ACK_KEY, new Date().toISOString());
          } catch {
            // localStorage may be unavailable; consent lives in zustand state.
          }
        }
        set({ consentAcknowledged: true });
      },
      resetConsent: () =>
        set({ toggles: { ...DEFAULT_AI_TOGGLES }, consentAcknowledged: false }),
    }),
    {
      name: "mabuhai-ai-consent",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);

export function hasAnyConsentEnabled(toggles: AiContextToggles): boolean {
  return AI_CONTEXT_KEYS.some((k) => toggles[k]);
}
