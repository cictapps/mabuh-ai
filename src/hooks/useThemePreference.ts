import { useCallback, useEffect, useState } from "react";
import {
  applyTheme,
  readThemePreference,
  resolveTheme,
  writeThemePreference,
  type ResolvedTheme,
  type ThemePreference,
} from "@/lib/theme";

export interface UseThemePreferenceResult {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (next: ThemePreference) => void;
}

function readInitialPreference(): ThemePreference {
  return readThemePreference();
}

function readInitialResolved(preference: ThemePreference): ResolvedTheme {
  return resolveTheme(preference);
}

function getSystemMediaQuery(): MediaQueryList | null {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return null;
  }
  return window.matchMedia("(prefers-color-scheme: dark)");
}

export function useThemePreference(): UseThemePreferenceResult {
  const [preference, setPreferenceState] = useState<ThemePreference>(() =>
    readInitialPreference(),
  );
  const [resolved, setResolved] = useState<ResolvedTheme>(() =>
    readInitialResolved(readInitialPreference()),
  );

  useEffect(() => {
    setResolved(resolveTheme(preference));
  }, [preference]);

  useEffect(() => {
    if (preference !== "system") return;
    const mql = getSystemMediaQuery();
    if (!mql) return;
    const handleChange = () => setResolved(resolveTheme("system"));
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", handleChange);
      return () => mql.removeEventListener("change", handleChange);
    }
    const legacy = mql as unknown as {
      addListener?: (cb: () => void) => void;
      removeListener?: (cb: () => void) => void;
    };
    legacy.addListener?.(handleChange);
    return () => legacy.removeListener?.(handleChange);
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    writeThemePreference(next);
    applyTheme(resolveTheme(next));
    setPreferenceState(next);
    setResolved(resolveTheme(next));
  }, []);

  return { preference, resolved, setPreference };
}
