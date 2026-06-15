import type { JourneyActivityType, JourneyReward, JourneyMilestone } from "../../types";

export const XP_PER_LEVEL = 50;

export const XP_REWARDS: Record<JourneyActivityType, number> = {
  preflight: 3,
  checkpoint: 1,
  final: 5,
  garden_start: 3,
  garden_care: 1,
  garden_finish: 5,
  mood_checkin: 2,
  journal_entry: 3,
} as const;

export const DAILY_CAPS: Record<JourneyActivityType, number> = {
  preflight: 1,
  checkpoint: 3,
  final: 1,
  garden_start: 1,
  garden_care: 3,
  garden_finish: 1,
  mood_checkin: 2,
  journal_entry: 1,
};

export type XpReason = JourneyActivityType;

export function levelFromXp(totalXp: number): number {
  return Math.floor(totalXp / XP_PER_LEVEL) + 1;
}

export function xpIntoLevel(totalXp: number): number {
  return totalXp % XP_PER_LEVEL;
}

export function levelProgressPercent(totalXp: number): number {
  return Math.round((xpIntoLevel(totalXp) / XP_PER_LEVEL) * 100);
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isYesterday(prev: Date, today: Date): boolean {
  const y = new Date(today);
  y.setDate(today.getDate() - 1);
  return isSameLocalDay(prev, y);
}

export function todayKey(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Pure streak transition. Returns the new streak value and whether the
 * counter was actually incremented.
 *
 *   - lastFlightDate is null                       → start at 1
 *   - lastFlightDate is today                      → keep current streak
 *   - lastFlightDate was yesterday                 → streak + 1
 *   - lastFlightDate was earlier than yesterday    → reset to 1
 *   - lastFlightDate is in the future              → keep current streak
 *     (defensive: clock skew should not extend a streak)
 */
export function nextStreak(args: {
  lastFlightDate: string | null;
  currentStreak: number;
  today: Date;
}): { streak: number; incremented: boolean; reset: boolean } {
  const { lastFlightDate, currentStreak, today } = args;
  if (!lastFlightDate) {
    return { streak: Math.max(1, currentStreak), incremented: true, reset: true };
  }
  const last = new Date(`${lastFlightDate}T00:00:00`);
  if (Number.isNaN(last.getTime())) {
    return { streak: 1, incremented: true, reset: true };
  }
  if (isSameLocalDay(last, today)) {
    return { streak: Math.max(1, currentStreak), incremented: false, reset: false };
  }
  if (last.getTime() > today.getTime()) {
    return { streak: Math.max(1, currentStreak), incremented: false, reset: false };
  }
  if (isYesterday(last, today)) {
    return { streak: currentStreak + 1, incremented: true, reset: false };
  }
  return { streak: 1, incremented: true, reset: true };
}

// ── Activity ledger ────────────────────────────────────────────────────

export interface ActivityLedgerState {
  date: string;
  counts: Partial<Record<JourneyActivityType, number>>;
  events: Array<{ action: JourneyActivityType; sourceId: string; occurredAt: string }>;
}

export function emptyLedger(date: string): ActivityLedgerState {
  return { date, counts: {}, events: [] };
}

export function canAward(
  ledger: ActivityLedgerState,
  action: JourneyActivityType,
  sourceId: string,
): boolean {
  const cap = DAILY_CAPS[action];
  const group = awardGroup(action);
  const used = ledger.events.filter((event) => awardGroup(event.action) === group).length;
  if (used >= cap) return false;
  if (
    ledger.events.some(
      (event) => awardGroup(event.action) === group && event.sourceId === sourceId,
    )
  ) {
    return false;
  }
  return true;
}

function awardGroup(action: JourneyActivityType): string {
  if (action === "preflight" || action === "garden_start") return "journey_start";
  if (action === "checkpoint" || action === "garden_care") return "journey_care";
  if (action === "final" || action === "garden_finish") return "journey_finish";
  return action;
}

export function awardAction(
  ledger: ActivityLedgerState,
  action: JourneyActivityType,
  sourceId: string,
  occurredAt: string,
): ActivityLedgerState {
  if (!canAward(ledger, action, sourceId)) return ledger;
  return {
    ...ledger,
    counts: { ...ledger.counts, [action]: (ledger.counts[action] ?? 0) + 1 },
    events: [...ledger.events, { action, sourceId, occurredAt }],
  };
}

// ── Rewards ────────────────────────────────────────────────────────────

export const REWARDS: JourneyReward[] = [
  {
    id: "dusk-trainer",
    level: 1,
    label: "Dusk sky & Trainer",
    description: "Evening calm palette with the Trainer companion",
    category: "theme",
    preview: "Dusk",
  },
  {
    id: "plant-sunflower",
    level: 1,
    label: "Sunflower seed",
    description: "A bright first plant for your Garden",
    category: "plant",
    preview: "Sunflower",
  },
  {
    id: "dawn-sky",
    level: 2,
    label: "Dawn sky",
    description: "Morning amber palette",
    category: "theme",
    preview: "Dawn",
  },
  {
    id: "cruiser",
    level: 3,
    label: "Cruiser companion",
    description: "Upgrade your companion to the Cruiser",
    category: "plane",
    preview: "Cruiser",
  },
  {
    id: "plant-fern",
    level: 3,
    label: "Fern seedling",
    description: "A calm, leafy Garden companion",
    category: "plant",
    preview: "Fern",
  },
  {
    id: "meadow-sky",
    level: 4,
    label: "Meadow sky",
    description: "Midday green palette",
    category: "theme",
    preview: "Meadow",
  },
  {
    id: "steady-ground",
    level: 5,
    label: "Steady Ground",
    description: "Affirmation pack: steady ground",
    category: "affirmation",
    preview: "Affirmation pack",
  },
  {
    id: "plant-lavender",
    level: 5,
    label: "Lavender seed",
    description: "A soft violet bloom for your Garden",
    category: "plant",
    preview: "Lavender",
  },
  {
    id: "glider",
    level: 6,
    label: "Glider companion",
    description: "Upgrade your companion to the Glider",
    category: "plane",
    preview: "Glider",
  },
  {
    id: "amber-accent",
    level: 7,
    label: "Warm amber accent",
    description: "Warm amber card accent colour",
    category: "accent",
    preview: "Amber accent",
  },
  {
    id: "plant-monstera",
    level: 7,
    label: "Monstera cutting",
    description: "A broad-leaf plant for your Garden",
    category: "plant",
    preview: "Monstera",
  },
  {
    id: "late-night-kindness",
    level: 8,
    label: "Late-Night Kindness",
    description: "Affirmation pack: late-night kindness",
    category: "affirmation",
    preview: "Affirmation pack",
  },
  {
    id: "constellation-bg",
    level: 9,
    label: "Constellation background",
    description: "Soft constellation background pattern",
    category: "background",
    preview: "Constellations",
  },
  {
    id: "plant-cherry-blossom",
    level: 9,
    label: "Cherry blossom",
    description: "A flowering tree for experienced gardeners",
    category: "plant",
    preview: "Cherry blossom",
  },
  {
    id: "custom-title",
    level: 10,
    label: "Custom title",
    description: "Choose your own Journey title",
    category: "title",
    preview: "Custom title",
  },
];

export function rewardsForLevel(level: number): JourneyReward[] {
  return REWARDS.filter((r) => r.level === level);
}

const LEVEL_TIERS: { min: number; label: string }[] = [
  { min: 1, label: "Curious newcomer" },
  { min: 2, label: "Gentle flyer" },
  { min: 3, label: "Steady companion" },
  { min: 4, label: "Patient gardener" },
  { min: 5, label: "Calm practitioner" },
  { min: 7, label: "Soft horizon" },
  { min: 9, label: "Quiet explorer" },
  { min: 12, label: "Sanctuary pilot" },
];

export function tierForLevel(level: number): string {
  let tier = LEVEL_TIERS[0].label;
  for (const entry of LEVEL_TIERS) {
    if (level >= entry.min) tier = entry.label;
  }
  return tier;
}

export interface NextMilestone {
  label: string;
  body: string;
  progress: number;
  hint: string;
}

export function nextMilestone(
  flightsCompleted: number,
  gardenDaysCompleted: number,
  journalCount: number,
  pauseCount: number,
  bestRhythm: number,
): NextMilestone | null {
  const counts: Record<JourneyMilestone["type"], number> = {
    flight: flightsCompleted,
    plant: gardenDaysCompleted,
    journal: journalCount,
    pause: pauseCount,
    rhythm: bestRhythm,
  };
  for (const m of MILESTONES) {
    const current = counts[m.type];
    if (current < m.threshold) {
      const remaining = m.threshold - current;
      const verb =
        m.type === "flight"
          ? "flight"
          : m.type === "plant"
            ? "garden day"
            : m.type === "journal"
              ? "journal entry"
              : m.type === "pause"
                ? "pause"
                : "day streak";
      return {
        label: m.label,
        body: m.body,
        progress: current / m.threshold,
        hint: `${remaining} more ${verb}${remaining === 1 ? "" : "s"}`,
      };
    }
  }
  return null;
}

export function newRewardsAtLevel(
  oldLevel: number,
  newLevel: number,
  alreadyUnlocked: Set<string>,
): JourneyReward[] {
  const unlocked: JourneyReward[] = [];
  for (let l = oldLevel + 1; l <= newLevel; l++) {
    for (const reward of REWARDS) {
      if (reward.level === l && !alreadyUnlocked.has(reward.id)) {
        unlocked.push(reward);
      }
    }
  }
  return unlocked;
}

// ── Milestones ─────────────────────────────────────────────────────────

export const MILESTONES: JourneyMilestone[] = [
  {
    id: "first-flight",
    type: "flight",
    threshold: 1,
    label: "First flight",
    body: "Welcome aboard.",
  },
  {
    id: "three-flights",
    type: "flight",
    threshold: 3,
    label: "Steady skies",
    body: "Three flights complete.",
  },
  {
    id: "five-flights",
    type: "flight",
    threshold: 5,
    label: "City hops",
    body: "You're finding your rhythm.",
  },
  {
    id: "ten-flights",
    type: "flight",
    threshold: 10,
    label: "Wide horizons",
    body: "Ten days of gentle practice.",
  },
  {
    id: "twentyfive-flights",
    type: "flight",
    threshold: 25,
    label: "Sanctuary pilot",
    body: "This is becoming yours.",
  },
  {
    id: "first-plant-day",
    type: "plant",
    threshold: 1,
    label: "First sprout",
    body: "You gave your Garden its first day of care.",
  },
  {
    id: "first-bloom",
    type: "plant",
    threshold: 7,
    label: "First bloom",
    body: "Seven gentle days helped a plant bloom.",
  },
  {
    id: "first-journal",
    type: "journal",
    threshold: 1,
    label: "First words",
    body: "You wrote your first journal entry.",
  },
  {
    id: "first-pause",
    type: "pause",
    threshold: 1,
    label: "Rest is part of it",
    body: "You paused — that takes awareness.",
  },
  {
    id: "weekly-rhythm",
    type: "rhythm",
    threshold: 7,
    label: "Weekly rhythm",
    body: "A full week of gentle practice.",
  },
];

export function reachedMilestones(
  flightsCompleted: number,
  gardenDaysCompleted: number,
  journalCount: number,
  pauseCount: number,
  bestRhythm: number,
): JourneyMilestone[] {
  return MILESTONES.filter((m) => {
    switch (m.type) {
      case "flight":
        return flightsCompleted >= m.threshold;
      case "plant":
        return gardenDaysCompleted >= m.threshold;
      case "journal":
        return journalCount >= m.threshold;
      case "pause":
        return pauseCount >= m.threshold;
      case "rhythm":
        return bestRhythm >= m.threshold;
    }
  });
}
