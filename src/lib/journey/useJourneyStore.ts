import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  JourneyActivityType,
  JourneyCheckpoint,
  JourneyEmergencyContact,
  JourneyPhase,
  JourneyPlane,
  JourneyTheme,
  MoodType,
} from "../../types";
import {
  nextStreak,
  todayKey,
  XP_REWARDS,
  canAward,
  awardAction,
  emptyLedger,
  newRewardsAtLevel,
  type ActivityLedgerState,
} from "./xp";

type JourneyStateShape = {
  phase: JourneyPhase;
  checkpoints: JourneyCheckpoint[];
  totalXp: number;
  streak: number;
  lastFlightDate: string | null;
  pauseUsedThisFlight: boolean;
  theme: JourneyTheme;
  plane: JourneyPlane;
  emergencyContacts: JourneyEmergencyContact[];
  preflightMood: MoodType | null;
  checkpointMood: MoodType | null;
  finalMood: MoodType | null;
  preflightChecks: { water: boolean; breath: boolean };
  checkpointChecks: { water: boolean; breath: boolean };
  finalChecks: { water: boolean; breath: boolean };
  deepBreaths: number;
  flightsCompleted: number;
  hasSeenIntro: boolean;

  unlockedRewards: string[];
  selectedTitle: string | null;
  currentRhythm: number;
  bestRhythm: number;
  pauseCount: number;
  journalEntryCount: number;
  dailyLedger: ActivityLedgerState;
  lastRewardNotification: string[];

  setPhase: (phase: JourneyPhase) => void;
  dismissIntro: () => void;
  addCheckpoint: (checkpoint: JourneyCheckpoint) => void;
  removeCheckpoint: (id: string) => void;
  setTheme: (theme: JourneyTheme) => void;
  setPlane: (plane: JourneyPlane) => void;
  setPreflightMood: (mood: MoodType | null) => void;
  setCheckpointMood: (mood: MoodType | null) => void;
  setFinalMood: (mood: MoodType | null) => void;
  togglePreflightCheck: (key: "water" | "breath") => void;
  toggleCheckpointCheck: (key: "water" | "breath") => void;
  toggleFinalCheck: (key: "water" | "breath") => void;
  addEmergencyContact: () => void;
  updateEmergencyContact: (id: string, contact: JourneyEmergencyContact) => void;
  removeEmergencyContact: (id: string) => void;
  addDeepBreath: () => void;
  resetDeepBreaths: () => void;
  enterPause: () => void;
  completePreflight: () => void;
  completeCheckpoint: () => void;
  completeFinal: () => void;
  prepareNextFlight: () => void;
  resetAll: () => void;

  awardXp: (action: JourneyActivityType, sourceId?: string) => { awarded: boolean; xpGained: number; newRewards: string[] };
  setSelectedTitle: (title: string | null) => void;
  clearRewardNotification: () => void;
  incrementJournalCount: () => void;
};

const defaultContacts: JourneyEmergencyContact[] = [
  {
    id: "default-contact",
    name: "Trusted person",
    phone: "",
  },
];

const defaultChecks = { water: false, breath: false };

export const useJourneyStore = create<JourneyStateShape>()(
  persist(
    (set, get) => {
      function ensureLedger(): ActivityLedgerState {
        const state = get();
        const today = todayKey();
        if (state.dailyLedger?.date === today) return state.dailyLedger;
        return emptyLedger(today);
      }

      return {
        phase: "preflight",
        checkpoints: [
          { id: "seed-morning", label: "Morning pause", time: "09:00 AM" },
          { id: "seed-midday", label: "Midday check-in", time: "12:30 PM" },
          { id: "seed-evening", label: "Evening reflection", time: "08:00 PM" },
        ],
        totalXp: 0,
        streak: 0,
        lastFlightDate: null,
        pauseUsedThisFlight: false,
        theme: "dusk",
        plane: "trainer",
        emergencyContacts: defaultContacts,
        preflightMood: null as MoodType | null,
        checkpointMood: null as MoodType | null,
        finalMood: null as MoodType | null,
        preflightChecks: { ...defaultChecks },
        checkpointChecks: { ...defaultChecks },
        finalChecks: { ...defaultChecks },
        deepBreaths: 0,
        flightsCompleted: 0,
        hasSeenIntro: false,

        unlockedRewards: ["dusk-trainer"],
        selectedTitle: null,
        currentRhythm: 0,
        bestRhythm: 0,
        pauseCount: 0,
        journalEntryCount: 0,
        dailyLedger: emptyLedger(todayKey()),
        lastRewardNotification: [],

        setPhase: (phase) => set({ phase }),
        dismissIntro: () => set({ hasSeenIntro: true }),

        addCheckpoint: (checkpoint) =>
          set((state) => ({ checkpoints: [checkpoint, ...state.checkpoints] })),

        removeCheckpoint: (id) =>
          set((state) => ({
            checkpoints: state.checkpoints.filter((c) => c.id !== id),
          })),

        setTheme: (theme) => set({ theme }),
        setPlane: (plane) => set({ plane }),

        setPreflightMood: (mood) => set({ preflightMood: mood }),
        setCheckpointMood: (mood) => set({ checkpointMood: mood }),
        setFinalMood: (mood) => set({ finalMood: mood }),

        togglePreflightCheck: (key) =>
          set((state) => ({
            preflightChecks: {
              ...state.preflightChecks,
              [key]: !state.preflightChecks[key],
            },
          })),
        toggleCheckpointCheck: (key) =>
          set((state) => ({
            checkpointChecks: {
              ...state.checkpointChecks,
              [key]: !state.checkpointChecks[key],
            },
          })),
        toggleFinalCheck: (key) =>
          set((state) => ({
            finalChecks: { ...state.finalChecks, [key]: !state.finalChecks[key] },
          })),

        addEmergencyContact: () =>
          set((state) => ({
            emergencyContacts: [
              ...state.emergencyContacts,
              { id: `contact-${Date.now()}`, name: "", phone: "" },
            ],
          })),

        updateEmergencyContact: (id, contact) =>
          set((state) => ({
            emergencyContacts: state.emergencyContacts.map((c) =>
              c.id === id ? contact : c,
            ),
          })),

        removeEmergencyContact: (id) =>
          set((state) => ({
            emergencyContacts: state.emergencyContacts.filter((c) => c.id !== id),
          })),

        addDeepBreath: () => set((state) => ({ deepBreaths: state.deepBreaths + 1 })),
        resetDeepBreaths: () => set({ deepBreaths: 0 }),

        enterPause: () =>
          set((state) => ({
            phase: "pause",
            pauseUsedThisFlight: true,
            pauseCount: state.pauseCount + 1,
          })),

        completePreflight: () =>
          set((state) => {
            const ledger = ensureLedger();
            if (!canAward(ledger, "preflight", "preflight")) return { phase: "airborne" };
            const xp = XP_REWARDS.preflight;
            const newTotal = state.totalXp + xp;
            const oldLevel = Math.floor(state.totalXp / 50) + 1;
            const newLevel = Math.floor(newTotal / 50) + 1;
            const already = new Set(state.unlockedRewards);
            const fresh = newRewardsAtLevel(oldLevel, newLevel, already);
            return {
              phase: "airborne",
              totalXp: newTotal,
              dailyLedger: awardAction(ledger, "preflight", "preflight", new Date().toISOString()),
              unlockedRewards: [...state.unlockedRewards, ...fresh.map((r) => r.id)],
              lastRewardNotification: fresh.map((r) => r.id),
            };
          }),

        completeCheckpoint: () =>
          set((state) => {
            const ledger = ensureLedger();
            const sourceId = `checkpoint-${Date.now()}`;
            if (!canAward(ledger, "checkpoint", sourceId)) return { phase: "airborne" };
            const xp = XP_REWARDS.checkpoint;
            const newTotal = state.totalXp + xp;
            const oldLevel = Math.floor(state.totalXp / 50) + 1;
            const newLevel = Math.floor(newTotal / 50) + 1;
            const already = new Set(state.unlockedRewards);
            const fresh = newRewardsAtLevel(oldLevel, newLevel, already);
            return {
              phase: "airborne",
              totalXp: newTotal,
              dailyLedger: awardAction(ledger, "checkpoint", sourceId, new Date().toISOString()),
              unlockedRewards: [...state.unlockedRewards, ...fresh.map((r) => r.id)],
              lastRewardNotification: fresh.map((r) => r.id),
            };
          }),

        completeFinal: () => {
          const now = new Date();
          const today = todayKey(now);
          set((state) => {
            const result = nextStreak({
              lastFlightDate: state.lastFlightDate,
              currentStreak: state.streak,
              today: now,
            });
            const ledger = ensureLedger();
            if (!canAward(ledger, "final", "final")) {
              return {
                phase: "rest" as JourneyPhase,
                streak: result.streak,
                lastFlightDate: today,
                flightsCompleted: state.flightsCompleted + 1,
                pauseUsedThisFlight: false,
                currentRhythm: result.streak,
                bestRhythm: Math.max(state.bestRhythm, result.streak),
              };
            }
            const xp = XP_REWARDS.final;
            const newTotal = state.totalXp + xp;
            const oldLevel = Math.floor(state.totalXp / 50) + 1;
            const newLevel = Math.floor(newTotal / 50) + 1;
            const already = new Set(state.unlockedRewards);
            const fresh = newRewardsAtLevel(oldLevel, newLevel, already);
            return {
              phase: "rest" as JourneyPhase,
              totalXp: newTotal,
              streak: result.streak,
              lastFlightDate: today,
              flightsCompleted: state.flightsCompleted + 1,
              pauseUsedThisFlight: false,
              dailyLedger: awardAction(ledger, "final", "final", now.toISOString()),
              unlockedRewards: [...state.unlockedRewards, ...fresh.map((r) => r.id)],
              lastRewardNotification: fresh.map((r) => r.id),
              currentRhythm: result.streak,
              bestRhythm: Math.max(state.bestRhythm, result.streak),
            };
          });
        },

        prepareNextFlight: () =>
          set({
            phase: "preflight",
            preflightMood: null,
            checkpointMood: null,
            finalMood: null,
            preflightChecks: { ...defaultChecks },
            checkpointChecks: { ...defaultChecks },
            finalChecks: { ...defaultChecks },
            deepBreaths: 0,
            pauseUsedThisFlight: false,
          }),

        resetAll: () =>
          set({
            phase: "preflight",
            totalXp: 0,
            streak: 0,
            lastFlightDate: null,
            pauseUsedThisFlight: false,
            flightsCompleted: 0,
            preflightMood: null as MoodType | null,
            checkpointMood: null as MoodType | null,
            finalMood: null as MoodType | null,
            preflightChecks: { ...defaultChecks },
            checkpointChecks: { ...defaultChecks },
            finalChecks: { ...defaultChecks },
            deepBreaths: 0,
            unlockedRewards: ["dusk-trainer"],
            selectedTitle: null,
            currentRhythm: 0,
            bestRhythm: 0,
            pauseCount: 0,
            journalEntryCount: 0,
            dailyLedger: emptyLedger(todayKey()),
            lastRewardNotification: [],
          }),

        awardXp: (action, sourceId) => {
          const state = get();
          const ledger = ensureLedger();
          const srcId = sourceId ?? `${action}-${Date.now()}`;
          if (!canAward(ledger, action, srcId)) {
            return { awarded: false, xpGained: 0, newRewards: [] };
          }
          const xp = XP_REWARDS[action];
          const newTotal = state.totalXp + xp;
          const oldLevel = Math.floor(state.totalXp / 50) + 1;
          const newLevel = Math.floor(newTotal / 50) + 1;
          const already = new Set(state.unlockedRewards);
          const fresh = newRewardsAtLevel(oldLevel, newLevel, already);
          set({
            totalXp: newTotal,
            dailyLedger: awardAction(ledger, action, srcId, new Date().toISOString()),
            unlockedRewards: [...state.unlockedRewards, ...fresh.map((r) => r.id)],
            lastRewardNotification: fresh.map((r) => r.id),
          });
          return { awarded: true, xpGained: xp, newRewards: fresh.map((r) => r.id) };
        },

        setSelectedTitle: (title) => set({ selectedTitle: title }),

        clearRewardNotification: () => set({ lastRewardNotification: [] }),

        incrementJournalCount: () =>
          set((state) => ({ journalEntryCount: state.journalEntryCount + 1 })),
      };
    },
    {
      name: "mabuhai-journey-state",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        phase: state.phase,
        checkpoints: state.checkpoints,
        totalXp: state.totalXp,
        streak: state.streak,
        lastFlightDate: state.lastFlightDate,
        theme: state.theme,
        plane: state.plane,
        emergencyContacts: state.emergencyContacts,
        flightsCompleted: state.flightsCompleted,
        hasSeenIntro: state.hasSeenIntro,
        unlockedRewards: state.unlockedRewards,
        selectedTitle: state.selectedTitle,
        currentRhythm: state.currentRhythm,
        bestRhythm: state.bestRhythm,
        pauseCount: state.pauseCount,
        journalEntryCount: state.journalEntryCount,
      }),
    },
  ),
);
