import { isTauri } from "@tauri-apps/api/core";
import { LazyStore } from "@tauri-apps/plugin-store";

const SESSION_FILE = "mabuh-supabase-session.dat";

let tauriStore: LazyStore | null = null;
function getTauriStore(): LazyStore | null {
  if (!isTauri()) return null;
  if (!tauriStore) {
    tauriStore = new LazyStore(SESSION_FILE);
  }
  return tauriStore;
}

const inMemory = new Map<string, string>();

interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

const localStorageAdapter: StorageAdapter = {
  getItem: async (key) => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  },
  setItem: async (key, value) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  },
  removeItem: async (key) => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  },
};

function makeTauriAdapter(): StorageAdapter {
  const store = getTauriStore();
  if (!store) return localStorageAdapter;
  return {
    getItem: async (key) => {
      const value = await store.get<string>(key);
      if (typeof value === "string") return value;
      return inMemory.get(key) ?? null;
    },
    setItem: async (key, value) => {
      inMemory.set(key, value);
      try {
        await store.set(key, value);
        await store.save();
      } catch (err) {
        console.warn("[supabaseStorage] tauri setItem failed; kept in-memory", err);
      }
    },
    removeItem: async (key) => {
      inMemory.delete(key);
      try {
        await store.delete(key);
        await store.save();
      } catch (err) {
        console.warn(
          "[supabaseStorage] tauri removeItem failed; cleared in-memory",
          err,
        );
      }
    },
  };
}

export const supabaseStorage: StorageAdapter = isTauri()
  ? makeTauriAdapter()
  : localStorageAdapter;
