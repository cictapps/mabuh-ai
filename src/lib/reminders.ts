import { isTauri } from "@tauri-apps/api/core";
import type { ReminderPreferences } from "@/hooks/useMoodStore";

export type ReminderPermission = "default" | "granted" | "denied" | "unsupported";

export interface ReminderStatus {
  permission: ReminderPermission;
  scheduled: boolean;
  nextFireAt: Date | null;
  reason?: string;
  delivery: "native" | "browser" | "unsupported";
}

export interface ReminderMessage {
  title: string;
  body: string;
}

interface ActiveTimer {
  timeoutId: number;
}

const NOTIFICATION_ICON = "/app-logo-light.svg";
const NATIVE_NOTIFICATION_ID_START = 840_100;
const NATIVE_NOTIFICATION_DAYS = 14;
const RANDOM_WINDOW_START_MINUTES = 8 * 60;
const RANDOM_WINDOW_END_MINUTES = 22 * 60;
const RANDOM_DAILY_MAX = 4;
const NATIVE_NOTIFICATION_IDS = Array.from(
  { length: NATIVE_NOTIFICATION_DAYS * RANDOM_DAILY_MAX },
  (_, index) => NATIVE_NOTIFICATION_ID_START + index,
);

const REMINDER_MESSAGES: readonly ReminderMessage[] = [
  {
    title: "How is your heart right now?",
    body: "Pause for a second. You don't have to name it perfectly — just notice how today is sitting with you.",
  },
  {
    title: "Checking in on you",
    body: "Hi. Before you go back to the next thing, how are you, really? A small honest answer is enough.",
  },
  {
    title: "A quiet check-in",
    body: "Take a breath in. And out. Now — what does your body need right now? A glass of water, a stretch, a pause?",
  },
  {
    title: "How has today been, gently?",
    body: "If you have a minute, notice one thing that felt okay today, and one thing that felt heavy. Both are allowed.",
  },
  {
    title: "A soft hello",
    body: "Hey. Just a small reminder that you're doing more than you think. What's one kind thing you can do for yourself tonight?",
  },
  {
    title: "Pause and breathe",
    body: "Unclench your jaw, drop your shoulders, and let your eyes rest for a moment. You can come back after.",
  },
  {
    title: "You don't have to finish today",
    body: "Whatever is still on your list can wait. One steady step is enough. You've already carried a lot.",
  },
  {
    title: "How are you sleeping?",
    body: "Honestly — are you resting enough? If not, that's not a failure. It's a signal. What would help tonight?",
  },
  {
    title: "A small kind question",
    body: "When did you last eat something warm, drink some water, or step outside for fresh air? No pressure — just noticing.",
  },
  {
    title: "I'm here if you need me",
    body: "Mabuh-ai is a quiet seat whenever you want it. No agenda, no streak — just a check-in when you're ready.",
  },
  {
    title: "One thing at a time",
    body: "Pick the smallest next step. Not the perfect one. The kind one. You can do small beautifully.",
  },
  {
    title: "Your worth is not your output",
    body: "You are more than grades, deadlines, and how productive today felt. That's worth saying out loud.",
  },
  {
    title: "A little encouragement",
    body: "Whatever today has asked of you, you have already handled a lot of it. Be as gentle with yourself as you would a friend.",
  },
  {
    title: "Make room for yourself",
    body: "Water, food, rest, or a message to someone you trust — any of those counts as a real next step.",
  },
  {
    title: "You are allowed to slow down",
    body: "Especially when school feels loud. Rest is part of moving forward, not a break from it.",
  },
  {
    title: "Hello, it's me again",
    body: "Just a small nudge. How is your mood right now — tired, okay, hopeful, somewhere in between?",
  },
  {
    title: "Notice one good thing",
    body: "Before the day ends, try to find one small thing that wasn't terrible. A sip of coffee, a song, a quiet corner.",
  },
  {
    title: "Be kind to tired you",
    body: "If you're running on empty, the next right thing might be rest, not productivity. Tomorrow you will thank you.",
  },
  {
    title: "What's weighing on you?",
    body: "If something has been sitting on your chest, even naming it to yourself can make it a little lighter.",
  },
  {
    title: "A gentle nudge",
    body: "No pressure, no score — just a soft tap on the shoulder from Mabuh-ai. How are you, really?",
  },
  {
    title: "Choose kindness when you can",
    body: "A patient word, a sincere thank-you, or making room for someone can soften a difficult day — theirs and yours.",
  },
  {
    title: "Kindness can be quiet",
    body: "You don't need a grand gesture. Listening without rushing, checking in, or simply being gentle can mean a lot.",
  },
  {
    title: "Be the safe moment",
    body: "If someone seems overwhelmed today, a calm hello or a little patience may be the kindness they needed.",
  },
  {
    title: "Pass a little warmth along",
    body: "Share one honest compliment or thank someone for something small. Kindness often travels farther than we see.",
  },
  {
    title: "Lead with understanding",
    body: "Everyone may be carrying something unseen. When it feels safe, choose curiosity before judgment.",
  },
  {
    title: "You can care without carrying it all",
    body: "Being kind to others does not mean ignoring your limits. Support and healthy boundaries can exist together.",
  },
  {
    title: "Check in with someone",
    body: "A simple “How are you holding up?” can open a door. You do not need perfect advice — listening is already care.",
  },
  {
    title: "Let kindness include you",
    body: "Offer others patience today, and save some for yourself too. Your needs are not less important.",
  },
  {
    title: "Your presence matters",
    body: "You do not have to solve everything to be helpful. Sometimes staying, listening, and caring is enough.",
  },
  {
    title: "Encourage someone gently",
    body: "Tell a classmate, friend, or family member one thing you appreciate about their effort — not only their result.",
  },
  {
    title: "Make space, not pressure",
    body: "When someone is struggling, kindness can sound like: “Take your time. I'm here when you're ready.”",
  },
  {
    title: "A softer response",
    body: "Before reacting, take one breath. A small pause can help you respond with the kind of care you value.",
  },
  {
    title: "You are still growing",
    body: "A difficult day does not erase your progress. Learning how to care for yourself takes practice, not perfection.",
  },
  {
    title: "There is strength in reaching out",
    body: "You deserve support before things become unbearable. A trusted person may be more ready to listen than you think.",
  },
  {
    title: "Your feelings can take up space",
    body: "You do not need to minimize what hurts just because someone else may have it harder. Your experience still matters.",
  },
  {
    title: "Begin again, gently",
    body: "If today did not go as planned, you are allowed to reset without punishing yourself. The next small choice still counts.",
  },
  {
    title: "Speak to yourself with care",
    body: "Try replacing “I should be better” with “I'm having a hard time, and I'm still trying.” Notice how that feels.",
  },
  {
    title: "You belong here",
    body: "Your voice, your effort, and your presence have value — even on days when confidence feels far away.",
  },
  {
    title: "Protect a little hope",
    body: "You do not need to feel positive all the time. Just leave room for the possibility that tomorrow may feel different.",
  },
  {
    title: "Rest can be an act of courage",
    body: "Stopping before you are completely drained is not giving up. It is choosing to care for the person carrying the load.",
  },
];

let active: ActiveTimer | null = null;
let schedulingGeneration = 0;
let nativeOperationQueue: Promise<void> = Promise.resolve();

function isBrowserNotificationsSupported(): boolean {
  return typeof window !== "undefined" && typeof window.Notification !== "undefined";
}

function usesNativeNotifications(): boolean {
  return typeof window !== "undefined" && isTauri();
}

export function getReminderPermission(): ReminderPermission {
  if (!isBrowserNotificationsSupported()) return "unsupported";
  return window.Notification.permission as ReminderPermission;
}

export async function requestReminderPermission(): Promise<ReminderPermission> {
  if (!isBrowserNotificationsSupported()) return "unsupported";

  if (usesNativeNotifications()) {
    try {
      const { isPermissionGranted, requestPermission } =
        await import("@tauri-apps/plugin-notification");
      if (await isPermissionGranted()) return "granted";
      const result = await requestPermission();
      return result as ReminderPermission;
    } catch {
      return "denied";
    }
  }

  if (window.Notification.permission === "granted") return "granted";
  if (window.Notification.permission === "denied") return "denied";
  try {
    const result = await window.Notification.requestPermission();
    return result as ReminderPermission;
  } catch {
    return "denied";
  }
}

/**
 * Compute the next firing Date based on the user's preferred time.
 * Returns the next future occurrence of (hour:minute) local time.
 */
export function nextFireDate(prefs: ReminderPreferences, now: Date = new Date()): Date {
  if (prefs.mode === "random") {
    return nextRandomFireDate(prefs, now);
  }

  const candidate = new Date(now);
  candidate.setSeconds(0, 0);
  candidate.setMinutes(prefs.minute);
  candidate.setHours(prefs.hour);
  if (candidate.getTime() <= now.getTime()) {
    candidate.setDate(candidate.getDate() + 1);
  }
  return candidate;
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function hashSeed(parts: (string | number)[]): number {
  let h = 0x811c9dc5;
  for (const part of parts) {
    const s = String(part);
    for (let i = 0; i < s.length; i += 1) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
  }
  return h >>> 0;
}

function seededRandom(seed: number): () => number {
  let t = seed >>> 0;
  return function next() {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function clampDailyCount(count: number): number {
  return Math.max(1, Math.min(RANDOM_DAILY_MAX, Math.round(count)));
}

export function randomFireDatesForDay(prefs: ReminderPreferences, day: Date): Date[] {
  if (prefs.mode !== "random") {
    const fixed = new Date(day);
    fixed.setSeconds(0, 0);
    fixed.setHours(prefs.hour, prefs.minute, 0, 0);
    return [fixed];
  }

  const count = clampDailyCount(prefs.dailyCount);
  const windowMinutes = RANDOM_WINDOW_END_MINUTES - RANDOM_WINDOW_START_MINUTES;
  const segmentSize = Math.floor(windowMinutes / count);

  return Array.from({ length: count }, (_, index) => {
    const seed = hashSeed([dateKey(day), "mabuh-random-reminder", index]);
    const rnd = seededRandom(seed);
    const segmentStart = RANDOM_WINDOW_START_MINUTES + segmentSize * index;
    const segmentEnd =
      index === count - 1
        ? RANDOM_WINDOW_END_MINUTES
        : RANDOM_WINDOW_START_MINUTES + segmentSize * (index + 1);
    const rawMinute =
      segmentStart + Math.floor(rnd() * Math.max(1, segmentEnd - segmentStart));
    const roundedMinute = Math.min(
      RANDOM_WINDOW_END_MINUTES - 5,
      Math.max(RANDOM_WINDOW_START_MINUTES, Math.round(rawMinute / 5) * 5),
    );
    const fireAt = new Date(day);
    fireAt.setSeconds(0, 0);
    fireAt.setHours(Math.floor(roundedMinute / 60), roundedMinute % 60, 0, 0);
    return fireAt;
  }).sort((a, b) => a.getTime() - b.getTime());
}

function nextRandomFireDate(prefs: ReminderPreferences, now: Date = new Date()): Date {
  for (let offset = 0; offset < 8; offset += 1) {
    const day = new Date(now);
    day.setDate(day.getDate() + offset);
    const next = randomFireDatesForDay(prefs, day).find(
      (fireAt) => fireAt.getTime() > now.getTime(),
    );
    if (next) return next;
  }
  const fallback = new Date(now);
  fallback.setDate(fallback.getDate() + 1);
  return randomFireDatesForDay(prefs, fallback)[0];
}

function reminderSlotForDate(prefs: ReminderPreferences, date: Date): number {
  if (prefs.mode !== "random") return 0;
  const slots = randomFireDatesForDay(prefs, date);
  return Math.max(
    0,
    slots.findIndex((slot) => slot.getTime() === date.getTime()),
  );
}

export function reminderMessageForDate(date: Date, slotIndex = 0): ReminderMessage {
  const dayNumber = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  );
  const base =
    REMINDER_MESSAGES[Math.abs(dayNumber + slotIndex * 11) % REMINDER_MESSAGES.length];
  return {
    title: base.title,
    body: `${base.body} If you have a minute, tap in to choose a mood, write one honest sentence, or simply notice what you need next.`,
  };
}

function clearActiveTimer() {
  if (!active) return;
  window.clearTimeout(active.timeoutId);
  active = null;
}

function showBrowserNotification(fireDate: Date, prefs: ReminderPreferences) {
  if (!isBrowserNotificationsSupported()) return;
  if (window.Notification.permission !== "granted") return;

  const message = reminderMessageForDate(fireDate, reminderSlotForDate(prefs, fireDate));
  try {
    const notification = new window.Notification(message.title, {
      body: message.body,
      tag: `mabuhai-daily-reminder-${fireDate.getTime()}`,
      icon: NOTIFICATION_ICON,
      badge: NOTIFICATION_ICON,
      silent: false,
    });
    notification.onclick = () => {
      try {
        window.focus();
      } catch {
        // The host may not allow programmatic focus.
      }
    };
  } catch {
    // Some browsers reject notifications from inactive tabs.
  }
}

function scheduleBrowserReminder(
  prefs: ReminderPreferences,
  onFire?: () => void,
): ReminderStatus {
  const fireAt = nextFireDate(prefs);
  const delay = fireAt.getTime() - Date.now();
  clearActiveTimer();

  const timeoutId = window.setTimeout(
    () => {
      showBrowserNotification(fireAt, prefs);
      onFire?.();
      if (prefs.enabled) {
        scheduleBrowserReminder(prefs, onFire);
      }
    },
    Math.max(delay, 1_000),
  );
  active = { timeoutId };

  return {
    permission: "granted",
    scheduled: true,
    nextFireAt: fireAt,
    delivery: "browser",
  };
}

function runNativeOperation<T>(operation: () => Promise<T>): Promise<T> {
  const result = nativeOperationQueue.then(operation, operation);
  nativeOperationQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

async function cancelNativeRemindersNow(): Promise<void> {
  try {
    const { cancel } = await import("@tauri-apps/plugin-notification");
    await cancel(NATIVE_NOTIFICATION_IDS);
  } catch {
    // There may be no pending notifications yet.
  }
}

async function scheduleNativeReminders(
  prefs: ReminderPreferences,
  generation: number,
): Promise<ReminderStatus> {
  return runNativeOperation(async () => {
    const { Schedule, sendNotification } =
      await import("@tauri-apps/plugin-notification");
    await cancelNativeRemindersNow();

    const firstFireAt = nextFireDate(prefs);
    for (let dayIndex = 0; dayIndex < NATIVE_NOTIFICATION_DAYS; dayIndex += 1) {
      if (generation !== schedulingGeneration) {
        return {
          permission: "granted",
          scheduled: false,
          nextFireAt: null,
          delivery: "native",
        };
      }

      const day = new Date(firstFireAt);
      day.setDate(day.getDate() + dayIndex);
      randomFireDatesForDay(prefs, day).forEach((fireAt, slotIndex) => {
        if (fireAt.getTime() < firstFireAt.getTime()) return;
        const message = reminderMessageForDate(fireAt, slotIndex);
        sendNotification({
          id: NATIVE_NOTIFICATION_IDS[dayIndex * RANDOM_DAILY_MAX + slotIndex],
          title: message.title,
          body: message.body,
          schedule: Schedule.at(fireAt, false, true),
          autoCancel: true,
          iconColor: "#bcc2ff",
          extra: { source: "mabuhai-wellness-reminder" },
        });
      });
    }

    return {
      permission: "granted",
      scheduled: true,
      nextFireAt: firstFireAt,
      delivery: "native",
    };
  });
}

/**
 * Schedule or refresh the local daily reminder. Native builds queue two
 * weeks with the operating system so reminders can arrive while the app is
 * closed. Web builds use an in-memory timer while the page remains open.
 */
export async function scheduleReminder(
  prefs: ReminderPreferences,
  onFire?: () => void,
): Promise<ReminderStatus> {
  const generation = ++schedulingGeneration;

  if (!prefs.enabled) {
    await cancelReminder();
    return {
      permission: getReminderPermission(),
      scheduled: false,
      nextFireAt: null,
      delivery: usesNativeNotifications() ? "native" : "browser",
    };
  }

  if (!isBrowserNotificationsSupported()) {
    clearActiveTimer();
    return {
      permission: "unsupported",
      scheduled: false,
      nextFireAt: null,
      reason: "Notifications are not supported in this environment.",
      delivery: "unsupported",
    };
  }

  const permission = await requestReminderPermission();
  if (permission !== "granted") {
    clearActiveTimer();
    if (usesNativeNotifications()) {
      await runNativeOperation(cancelNativeRemindersNow);
    }
    return {
      permission,
      scheduled: false,
      nextFireAt: null,
      reason:
        permission === "denied"
          ? "Notifications are blocked in system settings."
          : "Notification permission is required.",
      delivery: usesNativeNotifications() ? "native" : "browser",
    };
  }

  if (usesNativeNotifications()) {
    clearActiveTimer();
    return scheduleNativeReminders(prefs, generation);
  }

  return scheduleBrowserReminder(prefs, onFire);
}

export async function cancelReminder(): Promise<void> {
  schedulingGeneration += 1;
  clearActiveTimer();
  if (usesNativeNotifications()) {
    await runNativeOperation(cancelNativeRemindersNow);
  }
}
