import { useEffect, useState } from "react";

const STORAGE_KEY = "mabuhai-daily-affirmation";
const PRIMARY_URL = "https://www.affirmations.dev/";
const FALLBACK_URL = `https://api.allorigins.win/raw?url=${encodeURIComponent(PRIMARY_URL)}`;
const FALLBACK_QUOTES = [
  "You are doing better than you think you are.",
  "Small steps still move you forward.",
  "Your feelings are valid, and they will pass.",
  "Rest is part of the work.",
  "You are allowed to take things one breath at a time.",
];

type CachedAffirmation = { date: string; text: string };

function readCache(): CachedAffirmation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CachedAffirmation>;
    if (typeof parsed.date === "string" && typeof parsed.text === "string") {
      return { date: parsed.date, text: parsed.text };
    }
    return null;
  } catch {
    return null;
  }
}

function writeCache(value: CachedAffirmation): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Ignore quota/private-mode errors.
  }
}

async function fetchAffirmation(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = (await response.json()) as {
      affirmation?: string;
      quote?: string;
      content?: string;
    };
    return data.affirmation || data.quote || data.content || null;
  } catch {
    return null;
  }
}

function pickFallback(): string {
  const index = Math.floor(Math.random() * FALLBACK_QUOTES.length);
  return FALLBACK_QUOTES[index];
}

export function useDailyAffirmation(enabled: boolean = true) {
  const [text, setText] = useState<string>(pickFallback());
  const [loading, setLoading] = useState<boolean>(enabled);
  const [date, setDate] = useState<string>("");

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let mounted = true;
    const today = new Date().toISOString().slice(0, 10);
    setDate(today);

    const cached = readCache();
    if (cached && cached.date === today) {
      setText(cached.text);
      setLoading(false);
      return;
    }

    (async () => {
      const primary = await fetchAffirmation(PRIMARY_URL);
      const chosen = primary ?? (await fetchAffirmation(FALLBACK_URL)) ?? pickFallback();
      if (!mounted) return;
      setText(chosen);
      setLoading(false);
      writeCache({ date: today, text: chosen });
    })();

    return () => {
      mounted = false;
    };
  }, [enabled]);

  return { text, loading, date };
}
