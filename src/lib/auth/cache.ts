import type { Session } from "@supabase/supabase-js";
import { isTauri } from "@tauri-apps/api/core";
import { LazyStore } from "@tauri-apps/plugin-store";
import type { Profile } from "./store";

const CACHE_KEY = "last-authenticated-snapshot";
const WEB_KEY = "mabuh-auth-snapshot-v1";
const store = isTauri() ? new LazyStore("mabuh-auth-cache.dat") : null;

export interface CachedAuthSnapshot {
  session: Session;
  profile: Profile | null;
}

export async function saveAuthSnapshot(
  snapshot: CachedAuthSnapshot | null,
): Promise<void> {
  if (store) {
    if (snapshot) await store.set(CACHE_KEY, snapshot);
    else await store.delete(CACHE_KEY);
    await store.save();
    return;
  }
  if (snapshot) window.localStorage.setItem(WEB_KEY, JSON.stringify(snapshot));
  else window.localStorage.removeItem(WEB_KEY);
}

export async function loadAuthSnapshot(): Promise<CachedAuthSnapshot | null> {
  try {
    if (store) return (await store.get<CachedAuthSnapshot>(CACHE_KEY)) ?? null;
    const raw = window.localStorage.getItem(WEB_KEY);
    return raw ? (JSON.parse(raw) as CachedAuthSnapshot) : null;
  } catch {
    return null;
  }
}
