export const XP_PER_LEVEL = 50;

export const XP_REWARDS = {
  preflight: 3,
  checkpoint: 0.5,
  final: 5,
  pause: 0,
} as const;

export type XpReason = keyof typeof XP_REWARDS;

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

export function todayKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}
