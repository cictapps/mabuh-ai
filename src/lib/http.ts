/**
 * Tiny HTTP abstraction.
 *
 * - In the Tauri WebView we use `@tauri-apps/plugin-http`, which routes
 *   requests through the Rust runtime and bypasses WebView CORS.
 * - In a plain browser (dev, web preview, tests) we fall back to
 *   `window.fetch`.
 *
 * The wrapper exposes a `fetch`-compatible signature so call sites and
 * unit tests can inject a stub. It never logs request/response bodies
 * (which would risk leaking access tokens).
 */
export type HttpFetch = (
  input: string,
  init: {
    method: string;
    headers: Record<string, string>;
    body?: string;
  },
) => Promise<{
  status: number;
  statusText: string;
  headers: Record<string, string>;
  text: () => Promise<string>;
}>;

const TAURI_FETCH_FLAG = "__TAURI_INTERNALS__";

async function loadTauriFetch(): Promise<HttpFetch | null> {
  if (typeof window === "undefined") return null;
  // Tauri 2 exposes this flag on the window once the runtime is loaded.
  if (!(TAURI_FETCH_FLAG in window)) return null;
  try {
    const mod = await import("@tauri-apps/plugin-http");
    const tauriFetch = (mod as unknown as { fetch?: HttpFetch }).fetch;
    if (typeof tauriFetch !== "function") return null;
    return tauriFetch;
  } catch {
    return null;
  }
}

let cached: HttpFetch | null | undefined;

export async function getHttpFetch(): Promise<HttpFetch> {
  if (cached !== undefined) {
    return cached ?? browserFetch;
  }
  const tauri = await loadTauriFetch();
  cached = tauri ?? browserFetch;
  return cached;
}

/** Test seam — lets unit tests stub the HTTP layer. */
export function setHttpFetchForTests(impl: HttpFetch | null): void {
  cached = impl === null ? undefined : impl;
}

function browserFetch(
  input: string,
  init: {
    method: string;
    headers: Record<string, string>;
    body?: string;
  },
) {
  return (async () => {
    const res = await window.fetch(input, init);
    const headers: Record<string, string> = {};
    res.headers.forEach((value, key) => {
      headers[key] = value;
    });
    return {
      status: res.status,
      statusText: res.statusText,
      headers,
      text: () => res.text(),
    };
  })();
}
