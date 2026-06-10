import { supabase } from "@/lib/supabase";
import { getHttpFetch, type HttpFetch } from "@/lib/http";

export type { HttpFetch } from "@/lib/http";

/**
 * Supabase-authenticated chat client.
 *
 * Contract:
 *   POST {API_BASE_URL}/chat
 *   Authorization: Bearer <supabase access_token>
 *   Content-Type: application/json
 *   { message, intent, history, context? }
 *   → 200 { reply: string }
 *
 * Behaviour:
 *   - Always reads the current Supabase session via `auth.getSession()`.
 *   - Throws `ChatError { kind: "auth", requiresLogin: true }` when
 *     there is no valid session (the caller is expected to route the
 *     user to /login).
 *   - On a 401 the client refreshes the session once and retries the
 *     request exactly one time. A second 401 surfaces the same
 *     `auth` error so the user can sign in again.
 *   - On 429 and 503 the client surfaces typed errors with friendly
 *     copy.
 *
 * The client never logs the access token or the request body.
 */

const DEFAULT_API_BASE_URL = "https://mabuh-ai-server-29h8.onrender.com";

export type ChatIntent =
  | "general"
  | "vent"
  | "calm"
  | "support"
  | "affirmation"
  | "self-care";

export interface ChatRequest {
  message: string;
  intent: ChatIntent;
  history: ReadonlyArray<{ role: "user" | "assistant"; content: string }>;
  context?: unknown;
}

export interface ChatSuccess {
  ok: true;
  reply: string;
  status: number;
  durationMs: number;
  requestId: string | null;
}

export type ChatErrorKind =
  | "auth"
  | "rate-limit"
  | "unavailable"
  | "network"
  | "parse"
  | "empty"
  | "http"
  | "config";

export class ChatError extends Error {
  readonly kind: ChatErrorKind;
  readonly status: number | null;
  readonly requiresLogin: boolean;
  readonly requestId: string | null;
  readonly diagnostics: Record<string, unknown>;

  constructor(params: {
    kind: ChatErrorKind;
    message: string;
    status?: number | null;
    requiresLogin?: boolean;
    requestId?: string | null;
    diagnostics?: Record<string, unknown>;
  }) {
    super(params.message);
    this.name = "ChatError";
    this.kind = params.kind;
    this.status = params.status ?? null;
    this.requiresLogin = params.requiresLogin ?? false;
    this.requestId = params.requestId ?? null;
    this.diagnostics = params.diagnostics ?? {};
  }
}

export interface ChatClientOptions {
  apiBaseUrl: string;
  fetchImpl?: HttpFetch;
  /**
   * Override the session lookup. Defaults to `supabase.auth.getSession`.
   */
  getSession?: () => Promise<{
    data: { session: { access_token: string } | null };
    error: { message: string } | null;
  }>;
  /**
   * Override the session refresh. Defaults to
   * `supabase.auth.refreshSession`.
   */
  refreshSession?: () => Promise<{
    data: { session: { access_token: string } | null };
    error: { message: string } | null;
  }>;
  /**
   * Override the Supabase sign-out. Defaults to `supabase.auth.signOut`.
   * Called when refresh-and-retry still 401s, so a stale token is not
   * held in memory.
   */
  signOut?: () => Promise<unknown>;
}

const stripTrailingSlash = (url: string): string => url.replace(/\/+$/, "");

export function resolveApiBaseUrl(): string {
  const raw = (import.meta.env.VITE_CHAT_SERVER_URL as string | undefined) ?? "";
  return stripTrailingSlash(raw) || DEFAULT_API_BASE_URL;
}

export type ServerChatIntent =
  | "general"
  | "support"
  | "vent"
  | "affirmation"
  | "self_care";

export function normalizeChatIntent(intent: ChatIntent): ServerChatIntent {
  switch (intent) {
    case "support":
      return "support";
    case "vent":
      return "vent";
    case "affirmation":
      return "affirmation";
    case "self-care":
      return "self_care";
    case "calm":
    case "general":
    default:
      return "general";
  }
}

export async function sendChatMessage(
  req: ChatRequest,
  options: ChatClientOptions,
): Promise<ChatSuccess> {
  const apiBaseUrl = stripTrailingSlash(options.apiBaseUrl);
  const httpFetch: HttpFetch = options.fetchImpl ?? (await getHttpFetch());
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

  if (!req.message || typeof req.message !== "string") {
    throw new ChatError({
      kind: "config",
      message: "Message is required",
    });
  }

  const session1 = await getSession();
  if (session1.error || !session1.data.session) {
    throw new ChatError({
      kind: "auth",
      message: "Please sign in to continue.",
      requiresLogin: true,
    });
  }

  const baseContext =
    req.context && typeof req.context === "object" && !Array.isArray(req.context)
      ? ({ ...(req.context as Record<string, unknown>) })
      : {};
  baseContext.audience = "student";

  const body = JSON.stringify({
    message: req.message,
    intent: normalizeChatIntent(req.intent),
    history: req.history,
    context: baseContext,
  });

  const url = `${apiBaseUrl}/chat`;
  const requestStartedAt = Date.now();
  const firstAttempt = await performRequest(
    httpFetch,
    url,
    body,
    session1.data.session.access_token,
  );

  if (firstAttempt.status !== 401) {
    return handleResponse(firstAttempt, requestStartedAt);
  }

  // Single refresh-and-retry. If this also 401s, surface auth error.
  const refresh = await refreshSession();
  if (refresh.error || !refresh.data.session) {
    await signOut().catch(() => undefined);
    throw new ChatError({
      kind: "auth",
      message: "Your session expired. Please sign in again.",
      status: 401,
      requiresLogin: true,
      requestId: firstAttempt.requestId,
      diagnostics: { retried: true },
    });
  }

  const retryStartedAt = Date.now();
  const secondAttempt = await performRequest(
    httpFetch,
    url,
    body,
    refresh.data.session.access_token,
  );

  if (secondAttempt.status === 401) {
    await signOut().catch(() => undefined);
    throw new ChatError({
      kind: "auth",
      message: "Your session expired. Please sign in again.",
      status: 401,
      requiresLogin: true,
      requestId: secondAttempt.requestId,
      diagnostics: { retried: true },
    });
  }

  return handleResponse(secondAttempt, retryStartedAt);
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
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Network request failed";
    throw new ChatError({
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

function handleResponse(attempt: AttemptResult, startedAt: number): ChatSuccess {
  const durationMs = Date.now() - startedAt;

  if (attempt.status === 429) {
    throw new ChatError({
      kind: "rate-limit",
      message: "You're sending messages too quickly. Please try again in a minute.",
      status: 429,
      requestId: attempt.requestId,
      diagnostics: { durationMs },
    });
  }
  if (attempt.status === 503) {
    throw new ChatError({
      kind: "unavailable",
      message: "The chat service is temporarily unavailable. Please try again shortly.",
      status: 503,
      requestId: attempt.requestId,
      diagnostics: { durationMs },
    });
  }
  if (!attempt.rawBody) {
    throw new ChatError({
      kind: "empty",
      message: "The chat server returned an empty response.",
      status: attempt.status,
      requestId: attempt.requestId,
    });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(attempt.rawBody);
  } catch {
    throw new ChatError({
      kind: "parse",
      message: "The chat server returned an invalid response.",
      status: attempt.status,
      requestId: attempt.requestId,
      diagnostics: { raw: attempt.rawBody.slice(0, 500), durationMs },
    });
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new ChatError({
      kind: "parse",
      message: "The chat server returned an invalid response.",
      status: attempt.status,
      requestId: attempt.requestId,
    });
  }

  const obj = parsed as { reply?: unknown; error?: { message?: unknown } };
  const reply = obj.reply;
  if (typeof reply === "string" && reply) {
    return {
      ok: true,
      reply,
      status: attempt.status,
      durationMs,
      requestId: attempt.requestId,
    };
  }

  const serverMessage =
    obj.error && typeof obj.error === "object" && typeof obj.error.message === "string"
      ? obj.error.message
      : null;

  if (serverMessage) {
    throw new ChatError({
      kind: "http",
      message: serverMessage,
      status: attempt.status,
      requestId: attempt.requestId,
      diagnostics: { durationMs },
    });
  }

  throw new ChatError({
    kind: "empty",
    message: "The chat server reply was empty.",
    status: attempt.status,
    requestId: attempt.requestId,
  });
}
