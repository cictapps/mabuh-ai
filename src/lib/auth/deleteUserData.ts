import { getHttpFetch, type HttpFetch } from "@/lib/http";
import { supabase } from "@/lib/supabase";

type SessionResult = {
  data: {
    session: {
      access_token: string;
    } | null;
  };
  error: {
    message: string;
  } | null;
};

type DeleteUserDataOptions = {
  fetchImpl?: HttpFetch;
  getSession?: () => Promise<SessionResult>;
  refreshSession?: () => Promise<SessionResult>;
  supabaseUrl?: string;
  anonKey?: string;
};

type RpcResult = {
  status: number;
  body: unknown;
};

const DELETE_USER_DATA_TIMEOUT_MS = 20_000;

export async function deleteUserData(options: DeleteUserDataOptions = {}): Promise<void> {
  const fetchImpl = options.fetchImpl ?? (await getHttpFetch());
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
  const supabaseUrl = options.supabaseUrl ?? import.meta.env.VITE_SUPABASE_URL;
  const anonKey = options.anonKey ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Supabase is not configured.");
  }

  const current = await getSession();
  if (current.error || !current.data.session) {
    throw new Error("Your session expired. Please sign in again.");
  }

  const url = `${supabaseUrl.replace(/\/+$/, "")}/rest/v1/rpc/delete_user_data`;
  let result = await callDeleteRpc(
    fetchImpl,
    url,
    anonKey,
    current.data.session.access_token,
  );

  if (isAuthFailure(result)) {
    const refreshed = await refreshSession();
    if (refreshed.error || !refreshed.data.session) {
      throw new Error("Your session expired. Please sign in again.");
    }
    result = await callDeleteRpc(
      fetchImpl,
      url,
      anonKey,
      refreshed.data.session.access_token,
    );
  }

  if (result.status < 200 || result.status >= 300) {
    throw new Error(readErrorMessage(result.body, result.status));
  }
}

async function callDeleteRpc(
  fetchImpl: HttpFetch,
  url: string,
  anonKey: string,
  accessToken: string,
): Promise<RpcResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DELETE_USER_DATA_TIMEOUT_MS);

  try {
    const response = await fetchImpl(url, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: "{}",
      signal: controller.signal,
    });
    const rawBody = await response.text();
    return {
      status: response.status,
      body: parseResponseBody(rawBody),
    };
  } catch (error) {
    if (isAbortError(error)) {
      throw new Error(
        "Deleting your data took too long. Check your connection and try again.",
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function parseResponseBody(rawBody: string): unknown {
  if (!rawBody) return null;
  try {
    return JSON.parse(rawBody);
  } catch {
    return rawBody;
  }
}

function isAuthFailure(result: RpcResult): boolean {
  if (result.status === 401) return true;
  if (!result.body || typeof result.body !== "object") return false;
  const body = result.body as { code?: unknown; message?: unknown };
  return (
    body.code === "P0001" &&
    typeof body.message === "string" &&
    /not authenticated/i.test(body.message)
  );
}

function readErrorMessage(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const message = (body as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  if (typeof body === "string" && body.trim()) return body;
  return `Could not delete your data (HTTP ${status}).`;
}

function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  if ((error as { name?: unknown }).name === "AbortError") return true;
  const message = (error as { message?: unknown }).message;
  return typeof message === "string" && /abort/i.test(message);
}
