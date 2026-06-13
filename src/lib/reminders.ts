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
const NATIVE_NOTIFICATION_IDS = Array.from(
  { length: NATIVE_NOTIFICATION_DAYS },
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
  const candidate = new Date(now);
  candidate.setSeconds(0, 0);
  candidate.setMinutes(prefs.minute);
  candidate.setHours(prefs.hour);
  if (candidate.getTime() <= now.getTime()) {
    candidate.setDate(candidate.getDate() + 1);
  }
  return candidate;
}

export function reminderMessageForDate(date: Date): ReminderMessage {
  const dayNumber = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  );
  return REMINDER_MESSAGES[Math.abs(dayNumber) % REMINDER_MESSAGES.length];
}

function clearActiveTimer() {
  if (!active) return;
  window.clearTimeout(active.timeoutId);
  active = null;
}

function showBrowserNotification(fireDate: Date) {
  if (!isBrowserNotificationsSupported()) return;
  if (window.Notification.permission !== "granted") return;

  const message = reminderMessageForDate(fireDate);
  try {
    const notification = new window.Notification(message.title, {
      body: message.body,
      tag: "mabuhai-daily-reminder",
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
      showBrowserNotification(fireAt);
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
    for (let index = 0; index < NATIVE_NOTIFICATION_DAYS; index += 1) {
      if (generation !== schedulingGeneration) {
        return {
          permission: "granted",
          scheduled: false,
          nextFireAt: null,
          delivery: "native",
        };
      }

      const fireAt = new Date(firstFireAt);
      fireAt.setDate(fireAt.getDate() + index);
      const message = reminderMessageForDate(fireAt);
      sendNotification({
        id: NATIVE_NOTIFICATION_IDS[index],
        title: message.title,
        body: message.body,
        schedule: Schedule.at(fireAt, false, true),
        autoCancel: true,
        iconColor: "#bcc2ff",
        extra: { source: "mabuhai-wellness-reminder" },
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
