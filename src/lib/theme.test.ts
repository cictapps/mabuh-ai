// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyTheme,
  readThemePreference,
  resolveSystemTheme,
  resolveTheme,
  syncTheme,
  THEME_DARK_CLASS,
  THEME_STORAGE_KEY,
  writeThemePreference,
} from "./theme";

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function createMemoryStorage(): StorageLike {
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
}

function setMatchMedia(prefersDark: boolean | null) {
  if (prefersDark === null) {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: undefined,
    });
    return;
  }
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: query.includes("dark") ? prefersDark : !prefersDark,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

describe("resolveTheme", () => {
  it("returns 'light' when preference is 'light'", () => {
    expect(resolveTheme("light")).toBe("light");
  });

  it("returns 'dark' when preference is 'dark'", () => {
    expect(resolveTheme("dark")).toBe("dark");
  });
});

describe("resolveSystemTheme", () => {
  afterEach(() => {
    setMatchMedia(null);
  });

  it("returns 'dark' when prefers-color-scheme is dark", () => {
    setMatchMedia(true);
    expect(resolveSystemTheme()).toBe("dark");
  });

  it("returns 'light' when prefers-color-scheme is not dark", () => {
    setMatchMedia(false);
    expect(resolveSystemTheme()).toBe("light");
  });

  it("returns 'dark' when matchMedia is unavailable", () => {
    setMatchMedia(null);
    expect(resolveSystemTheme()).toBe("dark");
  });
});

describe("resolveTheme with system", () => {
  afterEach(() => {
    setMatchMedia(null);
  });

  it("follows system when preference is 'system'", () => {
    setMatchMedia(false);
    expect(resolveTheme("system")).toBe("light");
    setMatchMedia(true);
    expect(resolveTheme("system")).toBe("dark");
  });
});

describe("readThemePreference", () => {
  it("returns 'system' when nothing is stored", () => {
    const storage = createMemoryStorage();
    expect(readThemePreference(storage)).toBe("system");
  });

  it("returns the stored preference", () => {
    const storage = createMemoryStorage();
    storage.setItem(THEME_STORAGE_KEY, "dark");
    expect(readThemePreference(storage)).toBe("dark");
  });

  it("returns 'system' when the stored value is unknown", () => {
    const storage = createMemoryStorage();
    storage.setItem(THEME_STORAGE_KEY, "garbage");
    expect(readThemePreference(storage)).toBe("system");
  });

  it("falls back to 'system' when storage throws", () => {
    const throwing: StorageLike = {
      getItem: () => {
        throw new Error("storage offline");
      },
      setItem: () => {},
      removeItem: () => {},
    };
    expect(readThemePreference(throwing)).toBe("system");
  });
});

describe("writeThemePreference", () => {
  it("persists the preference in storage", () => {
    const storage = createMemoryStorage();
    writeThemePreference("light", storage);
    expect(storage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("swallows storage errors silently", () => {
    const throwing: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota exceeded");
      },
      removeItem: () => {},
    };
    expect(() => writeThemePreference("dark", throwing)).not.toThrow();
  });
});

describe("applyTheme", () => {
  beforeEach(() => {
    document.documentElement.classList.remove(THEME_DARK_CLASS);
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", "#121416");
  });

  afterEach(() => {
    document.documentElement.style.colorScheme = "";
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    meta?.parentElement?.removeChild(meta);
  });

  it("adds the dark class and sets theme-color for 'dark'", () => {
    applyTheme("dark");
    expect(document.documentElement.classList.contains(THEME_DARK_CLASS)).toBe(true);
    const meta = document.querySelector('meta[name="theme-color"]');
    expect(meta?.getAttribute("content")).toBe("#121416");
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  it("removes the dark class and switches theme-color for 'light'", () => {
    document.documentElement.classList.add(THEME_DARK_CLASS);
    applyTheme("light");
    expect(document.documentElement.classList.contains(THEME_DARK_CLASS)).toBe(false);
    const meta = document.querySelector('meta[name="theme-color"]');
    expect(meta?.getAttribute("content")).toBe("#f5efe6");
    expect(document.documentElement.style.colorScheme).toBe("light");
  });
});

describe("syncTheme", () => {
  beforeEach(() => {
    setMatchMedia(false);
    document.documentElement.classList.remove(THEME_DARK_CLASS);
  });

  afterEach(() => {
    setMatchMedia(null);
  });

  it("returns the resolved theme and applies it", () => {
    const resolved = syncTheme("light");
    expect(resolved).toBe("light");
    expect(document.documentElement.classList.contains(THEME_DARK_CLASS)).toBe(false);
  });

  it("resolves 'system' to the current system preference", () => {
    setMatchMedia(true);
    expect(syncTheme("system")).toBe("dark");
    expect(document.documentElement.classList.contains(THEME_DARK_CLASS)).toBe(true);
  });
});
