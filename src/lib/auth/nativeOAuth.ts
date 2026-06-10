import { isTauri } from "@tauri-apps/api/core";
import { getCurrent, onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { openUrl } from "@tauri-apps/plugin-opener";
import { supabase } from "@/lib/supabase";

const NATIVE_AUTH_SCHEME = "mabuhai:";
const NATIVE_AUTH_CALLBACK = "mabuhai://auth/callback";

let deepLinkListenerPromise: Promise<void> | null = null;

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

function parseAuthParams(url: URL) {
  const params = new URLSearchParams(url.search);
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));

  for (const [key, value] of hashParams) {
    if (!params.has(key)) params.set(key, value);
  }

  return params;
}

async function completeNativeAuth(urlValue: string) {
  const url = new URL(urlValue);

  if (
    url.protocol !== NATIVE_AUTH_SCHEME ||
    url.hostname !== "auth" ||
    url.pathname !== "/callback"
  ) {
    return;
  }

  const params = parseAuthParams(url);
  const authError = params.get("error_description") ?? params.get("error");
  if (authError) throw new Error(authError);

  const code = params.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
  } else {
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (!accessToken || !refreshToken) {
      throw new Error("Google sign-in returned without a usable session.");
    }

    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) throw error;
  }

  const nextPath = getSafeNextPath(params.get("next"));
  window.history.replaceState({}, "", nextPath);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

async function handleNativeAuthUrls(urls: string[] | null) {
  if (!urls) return;

  for (const url of urls) {
    try {
      await completeNativeAuth(url);
    } catch (error) {
      console.error("native OAuth callback failed", error);
      window.dispatchEvent(
        new CustomEvent("mabuhai:auth-error", {
          detail:
            error instanceof Error ? error.message : "Could not finish Google sign-in.",
        }),
      );
    }
  }
}

export function getNativeGoogleRedirectUrl(nextPath: string) {
  const next = encodeURIComponent(getSafeNextPath(nextPath));
  return `${NATIVE_AUTH_CALLBACK}?next=${next}`;
}

export async function openNativeOAuthUrl(url: string) {
  await openUrl(url);
}

export function isNativeApp() {
  return isTauri();
}

export async function initializeNativeAuthDeepLinks() {
  if (!isNativeApp()) return;
  if (deepLinkListenerPromise) return deepLinkListenerPromise;

  deepLinkListenerPromise = (async () => {
    await onOpenUrl((urls) => {
      void handleNativeAuthUrls(urls);
    });

    await handleNativeAuthUrls(await getCurrent());
  })().catch((error) => {
    deepLinkListenerPromise = null;
    throw error;
  });

  return deepLinkListenerPromise;
}
