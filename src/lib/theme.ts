export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "mabuh-theme-preference";
export const THEME_DARK_CLASS = "dark";

const LIGHT_THEME_COLOR = "#f5efe6";
const DARK_THEME_COLOR = "#121416";

const PREFERENCE_VALUES: ReadonlyArray<ThemePreference> = ["system", "light", "dark"];

function isPreference(value: unknown): value is ThemePreference {
  return (
    typeof value === "string" && (PREFERENCE_VALUES as readonly string[]).includes(value)
  );
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const memoryStorage: StorageLike = (() => {
  const store = new Map<string, string>();
  return {
    getItem: (key) => (store.has(key) ? store.get(key)! : null),
    setItem: (key, value) => {
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    },
  };
})();

function pickStorage(): StorageLike {
  if (typeof window === "undefined") return memoryStorage;
  try {
    const probeKey = "__mabuh_theme_probe__";
    window.localStorage.setItem(probeKey, "1");
    window.localStorage.removeItem(probeKey);
    return window.localStorage;
  } catch {
    return memoryStorage;
  }
}

export function readThemePreference(
  storage: StorageLike = pickStorage(),
): ThemePreference {
  try {
    const raw = storage.getItem(THEME_STORAGE_KEY);
    if (isPreference(raw)) return raw;
    return "system";
  } catch {
    return "system";
  }
}

export function writeThemePreference(
  preference: ThemePreference,
  storage: StorageLike = pickStorage(),
): void {
  try {
    storage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Storage unavailable — keep the in-memory state the caller already holds.
  }
}

export function resolveSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "dark";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === "light") return "light";
  if (preference === "dark") return "dark";
  return resolveSystemTheme();
}

function themeColorFor(resolved: ResolvedTheme): string {
  return resolved === "dark" ? DARK_THEME_COLOR : LIGHT_THEME_COLOR;
}

function getThemeColorMeta(): HTMLMetaElement | null {
  if (typeof document === "undefined") return null;
  return document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
}

function applyThemeColor(resolved: ResolvedTheme): void {
  const meta = getThemeColorMeta();
  if (!meta) return;
  meta.setAttribute("content", themeColorFor(resolved));
}

export function applyTheme(resolved: ResolvedTheme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (resolved === "dark") {
    root.classList.add(THEME_DARK_CLASS);
  } else {
    root.classList.remove(THEME_DARK_CLASS);
  }
  root.style.colorScheme = resolved;
  applyThemeColor(resolved);
}

export function syncTheme(preference: ThemePreference): ResolvedTheme {
  const resolved = resolveTheme(preference);
  applyTheme(resolved);
  return resolved;
}

export const THEME_STORAGE = {
  key: THEME_STORAGE_KEY,
  darkClass: THEME_DARK_CLASS,
};
