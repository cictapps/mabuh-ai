import { isTauri } from "@tauri-apps/api/core";
import { getCurrent, onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { signIn as nativeGoogleSignIn } from "@choochmeque/tauri-plugin-google-auth-api";
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

export function isNativeApp() {
  return isTauri();
}

export function isAndroidApp(): boolean {
  if (!isTauri()) return false;
  if (typeof navigator === "undefined") return false;
  return /android/i.test(navigator.userAgent);
}

export async function signInWithGoogleNative(nextPath: string) {
  const webClientId = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID as
    | string
    | undefined;

  if (!webClientId) {
    throw new Error(
      "Google sign-in is not configured: set VITE_GOOGLE_WEB_CLIENT_ID in .env.",
    );
  }

  const tokens = await nativeGoogleSignIn({
    clientId: webClientId,
    scopes: ["openid", "email", "profile"],
    flowType: "native",
  });

  const idToken = tokens.idToken;
  if (!idToken) {
    throw new Error(
      "Google Sign-In did not return an ID token. Make sure your OAuth client is configured for the native flow.",
    );
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: idToken,
    access_token: tokens.accessToken,
  });
  if (error) throw error;

  const safeNext = getSafeNextPath(nextPath);
  if (safeNext !== window.location.pathname) {
    window.history.replaceState({}, "", safeNext);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  return data;
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
