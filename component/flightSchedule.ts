export type FlightCheckpoint = {
  id: string;
  label: string;
  time: string;
};

export type FlightStatus = {
  currentCheckpoint: FlightCheckpoint | null;
  nextCheckpoint: FlightCheckpoint | null;
  msUntilNext: number | null;
  progressPercent: number;
};

const timePattern = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;

export function normalizeCheckpointTime(value: string) {
  const match = value.trim().match(timePattern);

  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3].toUpperCase();

  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${period}`;
}

export function parseCheckpointTime(value: string, baseDate = new Date()) {
  const normalized = normalizeCheckpointTime(value);

  if (!normalized) return null;

  const match = normalized.match(timePattern);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3].toUpperCase();

  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  return new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    hour,
    minute,
  );
}

export function sortCheckpoints(checkpoints: FlightCheckpoint[], baseDate = new Date()) {
  return [...checkpoints].sort((a, b) => {
    const first = parseCheckpointTime(a.time, baseDate)?.getTime() ?? 0;
    const second = parseCheckpointTime(b.time, baseDate)?.getTime() ?? 0;
    return first - second;
  });
}

export function getFlightStatus(checkpoints: FlightCheckpoint[], now = new Date()): FlightStatus {
  const sorted = sortCheckpoints(checkpoints, now);
  let currentCheckpoint: FlightCheckpoint | null = null;
  let nextCheckpoint: FlightCheckpoint | null = null;

  for (const checkpoint of sorted) {
    const checkpointDate = parseCheckpointTime(checkpoint.time, now);

    if (!checkpointDate) continue;

    if (checkpointDate.getTime() <= now.getTime()) {
      currentCheckpoint = checkpoint;
    } else {
      nextCheckpoint = checkpoint;
      break;
    }
  }

  const nextDate = nextCheckpoint ? parseCheckpointTime(nextCheckpoint.time, now) : null;
  const currentDate = currentCheckpoint ? parseCheckpointTime(currentCheckpoint.time, now) : null;
  const msUntilNext = nextDate ? Math.max(0, nextDate.getTime() - now.getTime()) : null;

  let progressPercent = nextCheckpoint ? 0 : 100;

  if (currentDate && nextDate) {
    const legDuration = nextDate.getTime() - currentDate.getTime();
    const elapsed = now.getTime() - currentDate.getTime();
    progressPercent = legDuration > 0 ? Math.min(100, Math.max(0, Math.round((elapsed / legDuration) * 100))) : 100;
  }

  return {
    currentCheckpoint,
    nextCheckpoint,
    msUntilNext,
    progressPercent,
  };
}

export function formatDuration(ms: number | null) {
  if (ms === null) return "--";

  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
  }

  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}
