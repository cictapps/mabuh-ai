import type { ReminderPreferences } from "@/hooks/useMoodStore";

export type ReminderPermission = "default" | "granted" | "denied" | "unsupported";

export interface ReminderStatus {
  permission: ReminderPermission;
  scheduled: boolean;
  nextFireAt: Date | null;
  reason?: string;
}

interface ActiveTimer {
  fireAt: number;
  timeoutId: number;
}

let active: ActiveTimer | null = null;

function isBrowserNotificationsSupported(): boolean {
  return typeof window !== "undefined" && typeof window.Notification !== "undefined";
}

export function getReminderPermission(): ReminderPermission {
  if (!isBrowserNotificationsSupported()) return "unsupported";
  return window.Notification.permission as ReminderPermission;
}

export async function requestReminderPermission(): Promise<ReminderPermission> {
  if (!isBrowserNotificationsSupported()) return "unsupported";
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

function clearActive() {
  if (active) {
    window.clearTimeout(active.timeoutId);
    active = null;
  }
}

function showNotification() {
  if (!isBrowserNotificationsSupported()) return;
  if (window.Notification.permission !== "granted") return;
  try {
    const n = new window.Notification("MabuhAi", {
      body: "Gentle check-in time. How is your day going?",
      tag: "mabuhai-daily-reminder",
      silent: false,
    });
    n.onclick = () => {
      try {
        window.focus();
      } catch {
        // ignore
      }
    };
  } catch {
    // Some browsers throw if the page is in the background tab; ignore.
  }
}

/**
 * Schedule (or cancel) the daily reminder. When the user toggles reminders
 * off, the active timer is cleared. When the firing time elapses, a
 * browser notification is shown and the timer is re-armed for the next
 * day so the reminder keeps working in a long-lived tab.
 */
export function scheduleReminder(
  prefs: ReminderPreferences,
  onFire?: () => void,
): ReminderStatus {
  if (!prefs.enabled) {
    clearActive();
    return {
      permission: getReminderPermission(),
      scheduled: false,
      nextFireAt: null,
    };
  }

  if (!isBrowserNotificationsSupported()) {
    clearActive();
    return {
      permission: "unsupported",
      scheduled: false,
      nextFireAt: null,
      reason: "Browser notifications are not supported in this environment.",
    };
  }

  if (window.Notification.permission === "denied") {
    clearActive();
    return {
      permission: "denied",
      scheduled: false,
      nextFireAt: null,
      reason: "Notifications are blocked. Update site permissions to re-enable.",
    };
  }

  const fireAt = nextFireDate(prefs);
  const delay = fireAt.getTime() - Date.now();
  clearActive();
  const timeoutId = window.setTimeout(
    () => {
      if (window.Notification.permission === "granted") {
        showNotification();
      }
      onFire?.();
      // Re-arm for the next day so the reminder keeps firing.
      if (prefs.enabled) {
        scheduleReminder(prefs, onFire);
      }
    },
    Math.max(delay, 1_000),
  );
  active = { fireAt: fireAt.getTime(), timeoutId };

  return {
    permission: "granted",
    scheduled: true,
    nextFireAt: fireAt,
  };
}

export function cancelReminder(): void {
  clearActive();
}
