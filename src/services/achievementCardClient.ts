import { supabase } from "@/lib/supabase";
import { getHttpFetch, type HttpFetch } from "@/lib/http";
import { XP_PER_LEVEL } from "@/lib/journey/xp";

/**
 * Cloud-rendered achievement card client.
 *
 * Contract:
 *   POST {API_BASE_URL}/achievements/card
 *   Authorization: Bearer <supabase access_token>
 *   Content-Type: application/json
 *   { level, totalXp, streak, journeysCompleted, milestoneLabel?, tierLabel?,
 *     nextMilestone?: { label, hint } | null, xpPerLevel, maxLevel }
 *   → 200 { imageBase64: string, mimeType: "image/png",
 *           width: 1080, height: 1080 }
 *   → 4xx { error: { code, message, requestId } }
 *
 * Behaviour mirrors `chatClient`:
 *   - Reads the current Supabase session, surfaces a typed
 *     `AchievementCardError { kind: "auth" }` when missing.
 *   - On 401 the client refreshes the session once and retries exactly
 *     one time; a second 401 signs the user out.
 *   - 429/503/timeouts/parse failures surface typed errors with friendly
 *     copy and never log the access token.
 *   - The client never logs the request body.
 */

const MAX_LEVEL = 10;
/** Same ceiling the chat request uses; the cloud renderer is the slow path. */
const REQUEST_TIMEOUT_MS = 60_000;

export interface NextMilestonePayload {
  label: string;
  hint: string;
}

export interface AchievementCardRequest {
  level: number;
  totalXp: number;
  streak: number;
  journeysCompleted: number;
  milestoneLabel?: string;
  tierLabel?: string;
  nextMilestone?: NextMilestonePayload | null;
}

export interface AchievementCardImage {
  blob: Blob;
  mimeType: "image/png";
  width: number;
  height: number;
  durationMs: number;
  requestId: string | null;
}

export type AchievementCardErrorKind =
  | "auth"
  | "rate-limit"
  | "unavailable"
  | "network"
  | "parse"
  | "empty"
  | "http"
  | "config"
  | "invalid-image";

export class AchievementCardError extends Error {
  readonly kind: AchievementCardErrorKind;
  readonly status: number | null;
  readonly requiresLogin: boolean;
  readonly requestId: string | null;
  readonly diagnostics: Record<string, unknown>;

  constructor(params: {
    kind: AchievementCardErrorKind;
    message: string;
    status?: number | null;
    requiresLogin?: boolean;
    requestId?: string | null;
    diagnostics?: Record<string, unknown>;
  }) {
    super(params.message);
    this.name = "AchievementCardError";
    this.kind = params.kind;
    this.status = params.status ?? null;
    this.requiresLogin = params.requiresLogin ?? false;
    this.requestId = params.requestId ?? null;
    this.diagnostics = params.diagnostics ?? {};
  }
}

export interface AchievementCardClientOptions {
  apiBaseUrl: string;
  fetchImpl?: HttpFetch;
  getSession?: () => Promise<{
    data: { session: { access_token: string } | null };
    error: { message: string } | null;
  }>;
  refreshSession?: () => Promise<{
    data: { session: { access_token: string } | null };
    error: { message: string } | null;
  }>;
  signOut?: () => Promise<unknown>;
}

const stripTrailingSlash = (url: string): string => url.replace(/\/+$/, "");

function base64ToUint8Array(base64: string): Uint8Array {
  const clean = base64.replace(/\s+/g, "");
  const binary = atob(clean);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function isAbortError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  if ((err as { name?: unknown }).name === "AbortError") return true;
  if ((err as { code?: unknown }).code === 20) return true;
  const message = (err as { message?: unknown }).message;
  return typeof message === "string" && /abort/i.test(message);
}

interface TimeoutHandle {
  signal: AbortSignal;
  clear: () => void;
}

function createTimeoutSignal(ms: number): TimeoutHandle {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer),
  };
}

interface AttemptResult {
  status: number;
  statusText: string;
  rawBody: string;
  requestId: string | null;
}

async function performRequest(
  httpFetch: HttpFetch,
  url: string,
  body: string,
  accessToken: string,
  signal: AbortSignal,
): Promise<AttemptResult> {
  let res;
  try {
    res = await httpFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body,
      signal,
    });
  } catch (e) {
    if (isAbortError(e)) {
      const aborted = new Error("Request aborted due to timeout");
      aborted.name = "AbortError";
      throw aborted;
    }
    const message = e instanceof Error ? e.message : "Network request failed";
    throw new AchievementCardError({
      kind: "network",
      message: `Network error: ${message}`,
      diagnostics: { url },
    });
  }

  const rawBody = await res.text();
  return {
    status: res.status,
    statusText: res.statusText,
    rawBody,
    requestId: res.headers["x-request-id"] ?? null,
  };
}

function validateRequest(req: AchievementCardRequest) {
  const positive = (n: unknown) => typeof n === "number" && Number.isFinite(n) && n >= 0;
  if (!positive(req.level) || req.level < 1 || req.level > MAX_LEVEL) {
    throw new AchievementCardError({
      kind: "config",
      message: `level must be between 1 and ${MAX_LEVEL}.`,
    });
  }
  if (!positive(req.totalXp)) {
    throw new AchievementCardError({
      kind: "config",
      message: "totalXp must be a non-negative number.",
    });
  }
  if (!positive(req.streak)) {
    throw new AchievementCardError({
      kind: "config",
      message: "streak must be a non-negative number.",
    });
  }
  if (!positive(req.journeysCompleted)) {
    throw new AchievementCardError({
      kind: "config",
      message: "journeysCompleted must be a non-negative number.",
    });
  }
  if (
    req.nextMilestone !== undefined &&
    req.nextMilestone !== null &&
    (typeof req.nextMilestone.label !== "string" ||
      typeof req.nextMilestone.hint !== "string")
  ) {
    throw new AchievementCardError({
      kind: "config",
      message: "nextMilestone must be { label, hint } or null.",
    });
  }
}

function buildPayload(req: AchievementCardRequest) {
  return {
    level: Math.floor(req.level),
    totalXp: Math.floor(req.totalXp),
    streak: Math.floor(req.streak),
    journeysCompleted: Math.floor(req.journeysCompleted),
    milestoneLabel: req.milestoneLabel ?? null,
    tierLabel: req.tierLabel ?? null,
    nextMilestone: req.nextMilestone ?? null,
    xpPerLevel: XP_PER_LEVEL,
    maxLevel: MAX_LEVEL,
  };
}

function parseResponse(attempt: AttemptResult, startedAt: number): AchievementCardImage {
  if (attempt.status === 429) {
    throw new AchievementCardError({
      kind: "rate-limit",
      message: "You're rendering cards too quickly. Please try again in a minute.",
      status: 429,
      requestId: attempt.requestId,
      diagnostics: { durationMs: Date.now() - startedAt },
    });
  }
  if (attempt.status === 503) {
    throw new AchievementCardError({
      kind: "unavailable",
      message:
        "The achievement card service is temporarily unavailable. Please try again shortly.",
      status: 503,
      requestId: attempt.requestId,
      diagnostics: { durationMs: Date.now() - startedAt },
    });
  }
  if (!attempt.rawBody) {
    throw new AchievementCardError({
      kind: "empty",
      message: "The card server returned an empty response.",
      status: attempt.status,
      requestId: attempt.requestId,
    });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(attempt.rawBody);
  } catch {
    throw new AchievementCardError({
      kind: "parse",
      message: "The card server returned an invalid response.",
      status: attempt.status,
      requestId: attempt.requestId,
      diagnostics: { raw: attempt.rawBody.slice(0, 500) },
    });
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new AchievementCardError({
      kind: "parse",
      message: "The card server returned an invalid response.",
      status: attempt.status,
      requestId: attempt.requestId,
    });
  }

  const obj = parsed as {
    imageBase64?: unknown;
    mimeType?: unknown;
    width?: unknown;
    height?: unknown;
    error?: { message?: unknown; code?: unknown };
  };

  const serverMessage =
    obj.error && typeof obj.error === "object" && typeof obj.error.message === "string"
      ? obj.error.message
      : null;
  if (serverMessage) {
    throw new AchievementCardError({
      kind: "http",
      message: serverMessage,
      status: attempt.status,
      requestId: attempt.requestId,
    });
  }

  if (typeof obj.imageBase64 !== "string" || !obj.imageBase64) {
    throw new AchievementCardError({
      kind: "empty",
      message: "The card server reply was empty.",
      status: attempt.status,
      requestId: attempt.requestId,
    });
  }

  const mimeType = obj.mimeType === "image/png" ? "image/png" : "image/png";
  const width = typeof obj.width === "number" ? obj.width : 1080;
  const height = typeof obj.height === "number" ? obj.height : 1080;

  let bytes: Uint8Array;
  try {
    bytes = base64ToUint8Array(obj.imageBase64);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Could not decode the image payload.";
    throw new AchievementCardError({
      kind: "invalid-image",
      message: `The card server returned an unreadable image: ${message}`,
      status: attempt.status,
      requestId: attempt.requestId,
    });
  }

  if (bytes.byteLength === 0) {
    throw new AchievementCardError({
      kind: "invalid-image",
      message: "The card server returned an empty image.",
      status: attempt.status,
      requestId: attempt.requestId,
    });
  }

  const blob = new Blob([bytes], { type: mimeType });
  return {
    blob,
    mimeType,
    width,
    height,
    durationMs: Date.now() - startedAt,
    requestId: attempt.requestId,
  };
}

export async function requestAchievementCard(
  req: AchievementCardRequest,
  options: AchievementCardClientOptions,
): Promise<AchievementCardImage> {
  const apiBaseUrl = stripTrailingSlash(options.apiBaseUrl);
  const httpFetch: HttpFetch = options.fetchImpl ?? (await getHttpFetch());

  validateRequest(req);

  const getSession =
    options.getSession ??
    (async () => {
      const { data, error } = await supabase.auth.getSession();
      return {
        data: { session: data.session },
        error: error ? { message: error.message } : null,
      };
    });
  const refreshSession =
    options.refreshSession ??
    (async () => {
      const { data, error } = await supabase.auth.refreshSession();
      return {
        data: { session: data.session },
        error: error ? { message: error.message } : null,
      };
    });
  const signOut = options.signOut ?? (async () => supabase.auth.signOut());

  const session1 = await getSession();
  if (session1.error || !session1.data.session) {
    throw new AchievementCardError({
      kind: "auth",
      message: "Please sign in to continue.",
      requiresLogin: true,
    });
  }

  const body = JSON.stringify(buildPayload(req));
  const url = `${apiBaseUrl}/achievements/card`;
  const startedAt = Date.now();
  const firstSignal = createTimeoutSignal(REQUEST_TIMEOUT_MS);
  let firstAttempt: AttemptResult;
  try {
    firstAttempt = await performRequest(
      httpFetch,
      url,
      body,
      session1.data.session.access_token,
      firstSignal.signal,
    );
  } catch (err) {
    if (isAbortError(err)) {
      throw new AchievementCardError({
        kind: "unavailable",
        message:
          "The card service is taking too long to respond. Please try again in a moment.",
        diagnostics: { reason: "timeout", timeoutMs: REQUEST_TIMEOUT_MS, url },
      });
    }
    throw err;
  } finally {
    firstSignal.clear();
  }

  if (firstAttempt.status !== 401) {
    return parseResponse(firstAttempt, startedAt);
  }

  const refresh = await refreshSession();
  if (refresh.error || !refresh.data.session) {
    await signOut().catch(() => undefined);
    throw new AchievementCardError({
      kind: "auth",
      message: "Your session expired. Please sign in again.",
      status: 401,
      requiresLogin: true,
      requestId: firstAttempt.requestId,
      diagnostics: { retried: true },
    });
  }

  const retrySignal = createTimeoutSignal(REQUEST_TIMEOUT_MS);
  let retryAttempt: AttemptResult;
  try {
    retryAttempt = await performRequest(
      httpFetch,
      url,
      body,
      refresh.data.session.access_token,
      retrySignal.signal,
    );
  } catch (err) {
    if (isAbortError(err)) {
      throw new AchievementCardError({
        kind: "unavailable",
        message:
          "The card service is taking too long to respond. Please try again in a moment.",
        status: 401,
        requestId: firstAttempt.requestId,
        diagnostics: {
          reason: "timeout",
          retried: true,
          timeoutMs: REQUEST_TIMEOUT_MS,
          url,
        },
      });
    }
    throw err;
  } finally {
    retrySignal.clear();
  }

  if (retryAttempt.status === 401) {
    await signOut().catch(() => undefined);
    throw new AchievementCardError({
      kind: "auth",
      message: "Your session expired. Please sign in again.",
      status: 401,
      requiresLogin: true,
      requestId: retryAttempt.requestId,
      diagnostics: { retried: true },
    });
  }

  return parseResponse(retryAttempt, startedAt);
}
