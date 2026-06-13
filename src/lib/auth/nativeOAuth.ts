import { isTauri } from "@tauri-apps/api/core";
import { signIn as nativeGoogleSignIn } from "@choochmeque/tauri-plugin-google-auth-api";
import { supabase } from "@/lib/supabase";

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

export function getNativeGoogleErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return "Google sign-in could not be started.";
}

export function explainNativeGoogleError(error: unknown): string {
  const message = getNativeGoogleErrorMessage(error);
  const normalized = message.toLowerCase();

  if (normalized.includes("cancel") || normalized.includes("closed by the user")) {
    return "Google sign-in was cancelled.";
  }

  if (
    normalized.includes("configuration") ||
    normalized.includes("developer console") ||
    normalized.includes("28444")
  ) {
    return (
      "Google Sign-In is not configured for this app build. Add an Android OAuth " +
      "client for package com.user.mabuhai with this build's SHA-1 fingerprint."
    );
  }

  if (normalized.includes("no google account") || normalized.includes("no credential")) {
    return "No Google account is available on this device. Add an account and try again.";
  }

  return message;
}

export function isNativeApp() {
  return isTauri();
}

export function isMobileApp(): boolean {
  if (!isTauri()) return false;
  if (typeof navigator === "undefined") return false;
  return /android|iphone|ipad|ipod/i.test(navigator.userAgent);
}

export async function signInWithGoogleNative(nextPath: string) {
  const isIos =
    typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);
  const clientId = isIos
    ? (import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID as string | undefined)
    : (import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID as string | undefined);

  if (!clientId) {
    throw new Error(
      isIos
        ? "Google sign-in is not configured: set VITE_GOOGLE_IOS_CLIENT_ID."
        : "Google sign-in is not configured: set VITE_GOOGLE_WEB_CLIENT_ID.",
    );
  }

  let tokens;
  try {
    tokens = await nativeGoogleSignIn({
      clientId,
      scopes: ["openid", "email", "profile"],
      flowType: "native",
    });
  } catch (error) {
    throw new Error(explainNativeGoogleError(error));
  }

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
