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
    title: "A gentle check-in",
    body: "How are you feeling right now? A small honest check-in is enough.",
  },
  {
    title: "A note for you",
    body: "You do not have to finish everything today. One steady step still counts.",
  },
  {
    title: "Pause for a moment",
    body: "Unclench your jaw, lower your shoulders, and take one slow breath.",
  },
  {
    title: "How is your day going?",
    body: "Take a quiet minute to notice what has felt heavy and what has helped.",
  },
  {
    title: "A little encouragement",
    body: "Your worth is not measured by grades, deadlines, or how productive today felt.",
  },
  {
    title: "Make room for yourself",
    body: "Water, food, rest, or a message to someone you trust can be a good next step.",
  },
  {
    title: "Checking in with you",
    body: "Whatever today has been like, you can meet yourself with patience.",
  },
  {
    title: "A warm reminder",
    body: "Rest is part of moving forward, especially when school feels demanding.",
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
