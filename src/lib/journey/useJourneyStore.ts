import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  JourneyCheckpoint,
  JourneyEmergencyContact,
  JourneyPhase,
  JourneyPlane,
  JourneyTheme,
  MoodType,
} from "../../types";
import { isSameLocalDay, todayKey, XP_REWARDS } from "./xp";

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
    (set) => ({
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
          preflightChecks: { ...state.preflightChecks, [key]: !state.preflightChecks[key] },
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
        set({ phase: "pause", pauseUsedThisFlight: true }),

      completePreflight: () =>
        set((state) => ({
          phase: "airborne",
          totalXp: state.totalXp + XP_REWARDS.preflight,
        })),

      completeCheckpoint: () =>
        set((state) => ({
          phase: "airborne",
          totalXp: state.totalXp + XP_REWARDS.checkpoint,
        })),

      completeFinal: () => {
        const today = todayKey();
        set((state) => {
          const sameDay = isSameLocalDay(new Date(), new Date());
          const nextStreak = sameDay
            ? state.streak
            : state.streak + 1;
          return {
            phase: "rest" as JourneyPhase,
            totalXp: state.totalXp + XP_REWARDS.final,
            streak: nextStreak,
            lastFlightDate: today,
            flightsCompleted: state.flightsCompleted + 1,
            pauseUsedThisFlight: false,
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
        }),
    }),
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
      }),
    },
  ),
);
