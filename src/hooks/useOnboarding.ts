import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "mabuh-onboarding-complete";

function readPersisted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function writePersisted(value: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (value) {
      window.localStorage.setItem(STORAGE_KEY, "true");
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // localStorage may be unavailable (private mode, quota); fail silently.
  }
}

export interface UseOnboardingResult {
  hasCompleted: boolean;
  isLoading: boolean;
  complete: () => void;
  reset: () => void;
}

export function useOnboarding(): UseOnboardingResult {
  const [hasCompleted, setHasCompleted] = useState<boolean>(() => readPersisted());

  useEffect(() => {
    setHasCompleted(readPersisted());
  }, []);

  const complete = useCallback(() => {
    writePersisted(true);
    setHasCompleted(true);
  }, []);

  const reset = useCallback(() => {
    writePersisted(false);
    setHasCompleted(false);
  }, []);

  return { hasCompleted, isLoading: false, complete, reset };
}
