import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ChatError,
  resolveApiBaseUrl,
  sendChatMessage,
  type HttpFetch,
} from "./chatClient";

function makeHttp(impl: HttpFetch): HttpFetch {
  return impl;
}

function ok(body: unknown, headers: Record<string, string> = {}): HttpFetch {
  return async () => ({
    status: 200,
    statusText: "OK",
    headers,
    text: async () => JSON.stringify(body),
  });
}

function httpStatus(
  status: number,
  body: unknown = {},
  headers: Record<string, string> = {},
): HttpFetch {
  return async () => ({
    status,
    statusText: "ERR",
    headers,
    text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
  });
}

function networkError(message = "fetch failed"): HttpFetch {
  return async () => {
    throw new Error(message);
  };
}

const sessionA = { access_token: "token-A" };
const sessionB = { access_token: "token-B" };

describe("sendChatMessage", () => {
  let getSession: ReturnType<typeof vi.fn>;
  let refreshSession: ReturnType<typeof vi.fn>;
  let signOut: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getSession = vi.fn();
    refreshSession = vi.fn();
    signOut = vi.fn().mockResolvedValue(undefined);
  });

  it("sends the Authorization header with the Supabase access token", async () => {
    getSession.mockResolvedValue({ data: { session: sessionA }, error: null });
    const httpFetch = vi
      .fn()
      .mockImplementation(ok({ reply: "hi back" }, { "x-request-id": "req-1" }));

    const res = await sendChatMessage(
      { message: "hello", intent: "general", history: [] },
      {
        apiBaseUrl: "https://chat.example.com/",
        fetchImpl: makeHttp(httpFetch),
        getSession,
        refreshSession,
        signOut,
      },
    );

    expect(res).toMatchObject({ ok: true, reply: "hi back", status: 200 });
    expect(httpFetch).toHaveBeenCalledTimes(1);
    const [url, init] = httpFetch.mock.calls[0];
    expect(url).toBe("https://chat.example.com/chat");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer token-A");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(init.body)).toEqual({
      message: "hello",
      intent: "general",
      history: [],
      context: { audience: "student" },
    });
  });

  it("throws a ChatError with kind=auth and requiresLogin when no session", async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null });
    const httpFetch = vi.fn();

    await expect(
      sendChatMessage(
        { message: "hi", intent: "general", history: [] },
        {
          apiBaseUrl: "https://chat.example.com",
          fetchImpl: makeHttp(httpFetch),
          getSession,
          refreshSession,
          signOut,
        },
      ),
    ).rejects.toMatchObject({
      name: "ChatError",
      kind: "auth",
      requiresLogin: true,
    });
    expect(httpFetch).not.toHaveBeenCalled();
    expect(refreshSession).not.toHaveBeenCalled();
  });

  it("throws auth when getSession returns an error", async () => {
    getSession.mockResolvedValue({
      data: { session: null },
      error: { message: "boom" },
    });
    await expect(
      sendChatMessage(
        { message: "hi", intent: "general", history: [] },
        {
          apiBaseUrl: "https://chat.example.com",
          fetchImpl: makeHttp(vi.fn()),
          getSession,
          refreshSession,
          signOut,
        },
      ),
    ).rejects.toBeInstanceOf(ChatError);
  });

  it("refreshes the session once after a 401 and retries the request", async () => {
    getSession.mockResolvedValue({ data: { session: sessionA }, error: null });
    refreshSession.mockResolvedValue({
      data: { session: sessionB },
      error: null,
    });
    const httpFetch = vi
      .fn()
      .mockImplementationOnce(httpStatus(401, { error: { message: "expired" } }))
      .mockImplementationOnce(ok({ reply: "after-refresh" }));

    const res = await sendChatMessage(
      { message: "hi", intent: "general", history: [] },
      {
        apiBaseUrl: "https://chat.example.com",
        fetchImpl: makeHttp(httpFetch),
        getSession,
        refreshSession,
        signOut,
      },
    );

    expect(res.reply).toBe("after-refresh");
    expect(httpFetch).toHaveBeenCalledTimes(2);
    const [, firstInit] = httpFetch.mock.calls[0];
    const [, secondInit] = httpFetch.mock.calls[1];
    expect(firstInit.headers.Authorization).toBe("Bearer token-A");
    expect(secondInit.headers.Authorization).toBe("Bearer token-B");
    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(signOut).not.toHaveBeenCalled();
  });

  it("does not retry a second time if the post-refresh request also 401s", async () => {
    getSession.mockResolvedValue({ data: { session: sessionA }, error: null });
    refreshSession.mockResolvedValue({
      data: { session: sessionB },
      error: null,
    });
    const httpFetch = vi
      .fn()
      .mockImplementationOnce(httpStatus(401))
      .mockImplementationOnce(httpStatus(401));

    await expect(
      sendChatMessage(
        { message: "hi", intent: "general", history: [] },
        {
          apiBaseUrl: "https://chat.example.com",
          fetchImpl: makeHttp(httpFetch),
          getSession,
          refreshSession,
          signOut,
        },
      ),
    ).rejects.toMatchObject({
      kind: "auth",
      requiresLogin: true,
      status: 401,
    });

    expect(httpFetch).toHaveBeenCalledTimes(2);
    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it("surfaces auth error when refreshSession itself fails after a 401", async () => {
    getSession.mockResolvedValue({ data: { session: sessionA }, error: null });
    refreshSession.mockResolvedValue({
      data: { session: null },
      error: { message: "refresh failed" },
    });
    const httpFetch = vi.fn().mockImplementationOnce(httpStatus(401));

    await expect(
      sendChatMessage(
        { message: "hi", intent: "general", history: [] },
        {
          apiBaseUrl: "https://chat.example.com",
          fetchImpl: makeHttp(httpFetch),
          getSession,
          refreshSession,
          signOut,
        },
      ),
    ).rejects.toMatchObject({ kind: "auth", requiresLogin: true });
    expect(httpFetch).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it("never makes more than two HTTP calls in any flow", async () => {
    getSession.mockResolvedValue({ data: { session: sessionA }, error: null });
    refreshSession.mockResolvedValue({
      data: { session: sessionB },
      error: null,
    });
    const httpFetch = vi
      .fn()
      .mockImplementationOnce(httpStatus(401))
      .mockImplementationOnce(ok({ reply: "ok" }));

    await sendChatMessage(
      { message: "hi", intent: "general", history: [] },
      {
        apiBaseUrl: "https://chat.example.com",
        fetchImpl: makeHttp(httpFetch),
        getSession,
        refreshSession,
        signOut,
      },
    );
    expect(httpFetch.mock.calls.length).toBeLessThanOrEqual(2);
  });

  it("maps 429 to a rate-limit ChatError", async () => {
    getSession.mockResolvedValue({ data: { session: sessionA }, error: null });
    const httpFetch = vi.fn().mockImplementation(httpStatus(429));

    await expect(
      sendChatMessage(
        { message: "hi", intent: "general", history: [] },
        {
          apiBaseUrl: "https://chat.example.com",
          fetchImpl: makeHttp(httpFetch),
          getSession,
          refreshSession,
          signOut,
        },
      ),
    ).rejects.toMatchObject({ kind: "rate-limit", status: 429 });
    expect(refreshSession).not.toHaveBeenCalled();
  });

  it("maps 503 to an unavailable ChatError", async () => {
    getSession.mockResolvedValue({ data: { session: sessionA }, error: null });
    const httpFetch = vi.fn().mockImplementation(httpStatus(503));

    await expect(
      sendChatMessage(
        { message: "hi", intent: "general", history: [] },
        {
          apiBaseUrl: "https://chat.example.com",
          fetchImpl: makeHttp(httpFetch),
          getSession,
          refreshSession,
          signOut,
        },
      ),
    ).rejects.toMatchObject({ kind: "unavailable", status: 503 });
  });

  it("maps a network failure to a network ChatError", async () => {
    getSession.mockResolvedValue({ data: { session: sessionA }, error: null });
    const httpFetch = vi.fn().mockImplementation(networkError("offline"));

    await expect(
      sendChatMessage(
        { message: "hi", intent: "general", history: [] },
        {
          apiBaseUrl: "https://chat.example.com",
          fetchImpl: makeHttp(httpFetch),
          getSession,
          refreshSession,
          signOut,
        },
      ),
    ).rejects.toMatchObject({ kind: "network" });
    expect(refreshSession).not.toHaveBeenCalled();
  });

  it("maps a malformed JSON response to a parse ChatError", async () => {
    getSession.mockResolvedValue({ data: { session: sessionA }, error: null });
    const httpFetch = vi.fn().mockImplementation(httpStatus(200, "<<<not-json>>>"));

    await expect(
      sendChatMessage(
        { message: "hi", intent: "general", history: [] },
        {
          apiBaseUrl: "https://chat.example.com",
          fetchImpl: makeHttp(httpFetch),
          getSession,
          refreshSession,
          signOut,
        },
      ),
    ).rejects.toMatchObject({ kind: "parse", status: 200 });
  });

  it("maps a 200 with an empty/missing reply to an empty ChatError", async () => {
    getSession.mockResolvedValue({ data: { session: sessionA }, error: null });
    const httpFetch = vi.fn().mockImplementation(ok({ not_reply: "nope" }));

    await expect(
      sendChatMessage(
        { message: "hi", intent: "general", history: [] },
        {
          apiBaseUrl: "https://chat.example.com",
          fetchImpl: makeHttp(httpFetch),
          getSession,
          refreshSession,
          signOut,
        },
      ),
    ).rejects.toMatchObject({ kind: "empty" });
  });

  it("passes context through when provided", async () => {
    getSession.mockResolvedValue({ data: { session: sessionA }, error: null });
    const httpFetch = vi.fn().mockImplementation(ok({ reply: "ok" }));

    await sendChatMessage(
      {
        message: "hi",
        intent: "general",
        history: [],
        context: { journey: { streak: 3 } },
      },
      {
        apiBaseUrl: "https://chat.example.com",
        fetchImpl: makeHttp(httpFetch),
        getSession,
        refreshSession,
        signOut,
      },
    );
    const [, init] = httpFetch.mock.calls[0];
    expect(JSON.parse(init.body).context).toEqual({
      journey: { streak: 3 },
      audience: "student",
    });
  });

  it("strips trailing slashes from the api base url", async () => {
    getSession.mockResolvedValue({ data: { session: sessionA }, error: null });
    const httpFetch = vi.fn().mockImplementation(ok({ reply: "ok" }));

    await sendChatMessage(
      { message: "hi", intent: "general", history: [] },
      {
        apiBaseUrl: "https://chat.example.com///",
        fetchImpl: makeHttp(httpFetch),
        getSession,
        refreshSession,
        signOut,
      },
    );
    const [url] = httpFetch.mock.calls[0];
    expect(url).toBe("https://chat.example.com/chat");
  });

  it("rejects when message is missing without contacting the server", async () => {
    getSession.mockResolvedValue({ data: { session: sessionA }, error: null });
    const httpFetch = vi.fn();

    await expect(
      sendChatMessage(
        { message: "", intent: "general", history: [] },
        {
          apiBaseUrl: "https://chat.example.com",
          fetchImpl: makeHttp(httpFetch),
          getSession,
          refreshSession,
          signOut,
        },
      ),
    ).rejects.toMatchObject({ kind: "config" });
    expect(httpFetch).not.toHaveBeenCalled();
  });

  it.each([
    ["vent", "vent"],
    ["calm", "general"],
    ["affirmation", "affirmation"],
    ["self-care", "self_care"],
    ["general", "general"],
    ["support", "support"],
  ] as const)(
    "normalizes client intent %s to server intent %s",
    async (clientIntent, serverIntent) => {
      getSession.mockResolvedValue({ data: { session: sessionA }, error: null });
      const httpFetch = vi.fn().mockImplementation(ok({ reply: "ok" }));

      await sendChatMessage(
        { message: "hi", intent: clientIntent, history: [] },
        {
          apiBaseUrl: "https://chat.example.com",
          fetchImpl: makeHttp(httpFetch),
          getSession,
          refreshSession,
          signOut,
        },
      );

      const [, init] = httpFetch.mock.calls[0];
      expect(JSON.parse(init.body).intent).toBe(serverIntent);
    },
  );

  it("merges audience=student into a caller-provided context object", async () => {
    getSession.mockResolvedValue({ data: { session: sessionA }, error: null });
    const httpFetch = vi.fn().mockImplementation(ok({ reply: "ok" }));

    await sendChatMessage(
      {
        message: "hi",
        intent: "general",
        history: [],
        context: { journey: { streak: 3 } },
      },
      {
        apiBaseUrl: "https://chat.example.com",
        fetchImpl: makeHttp(httpFetch),
        getSession,
        refreshSession,
        signOut,
      },
    );
    const [, init] = httpFetch.mock.calls[0];
    expect(JSON.parse(init.body).context).toEqual({
      journey: { streak: 3 },
      audience: "student",
    });
  });

  it("wraps a non-object context and still attaches audience=student", async () => {
    getSession.mockResolvedValue({ data: { session: sessionA }, error: null });
    const httpFetch = vi.fn().mockImplementation(ok({ reply: "ok" }));

    await sendChatMessage(
      {
        message: "hi",
        intent: "general",
        history: [],
        context: "raw-string-context",
      },
      {
        apiBaseUrl: "https://chat.example.com",
        fetchImpl: makeHttp(httpFetch),
        getSession,
        refreshSession,
        signOut,
      },
    );
    const [, init] = httpFetch.mock.calls[0];
    expect(JSON.parse(init.body).context).toEqual({ audience: "student" });
  });

  it("surfaces a structured server error message instead of an empty reply", async () => {
    getSession.mockResolvedValue({ data: { session: sessionA }, error: null });
    const httpFetch = vi
      .fn()
      .mockImplementation(
        httpStatus(400, { error: { code: "INVALID", message: "intent must be general or support" } }),
      );

    await expect(
      sendChatMessage(
        { message: "hi", intent: "general", history: [] },
        {
          apiBaseUrl: "https://chat.example.com",
          fetchImpl: makeHttp(httpFetch),
          getSession,
          refreshSession,
          signOut,
        },
      ),
    ).rejects.toMatchObject({
      kind: "http",
      status: 400,
      message: "intent must be general or support",
    });
  });
});

describe("resolveApiBaseUrl", () => {
  it("strips trailing slashes from env override", () => {
    const original = import.meta.env.VITE_CHAT_SERVER_URL;
    try {
      (import.meta.env as Record<string, string | undefined>).VITE_CHAT_SERVER_URL =
        "https://env.example.com//";
      expect(resolveApiBaseUrl()).toBe("https://env.example.com");
    } finally {
      (import.meta.env as Record<string, string | undefined>).VITE_CHAT_SERVER_URL =
        original;
    }
  });
});

describe("sendChatMessage timeout", () => {
  let getSession: ReturnType<typeof vi.fn>;
  let refreshSession: ReturnType<typeof vi.fn>;
  let signOut: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getSession = vi.fn();
    refreshSession = vi.fn();
    signOut = vi.fn();
  });

  it("surfaces a friendly 'unavailable' error when the fetch rejects with an AbortError", async () => {
    getSession.mockResolvedValue({ data: { session: sessionA }, error: null });

    const httpFetch = vi.fn().mockImplementation(async (): Promise<never> => {
      const err = new Error("aborted") as Error & { name: string };
      err.name = "AbortError";
      throw err;
    });

    await expect(
      sendChatMessage(
        { message: "hi", intent: "general", history: [] },
        {
          apiBaseUrl: "https://chat.example.com",
          fetchImpl: makeHttp(httpFetch),
          getSession,
          refreshSession,
          signOut,
        },
      ),
    ).rejects.toMatchObject({
      kind: "unavailable",
      diagnostics: { reason: "timeout" },
    });
  });

  it("passes the AbortSignal into the http fetch", async () => {
    getSession.mockResolvedValue({ data: { session: sessionA }, error: null });
    const httpFetch = vi.fn().mockImplementation(ok({ reply: "ok" }));

    await sendChatMessage(
      { message: "hi", intent: "general", history: [] },
      {
        apiBaseUrl: "https://chat.example.com",
        fetchImpl: makeHttp(httpFetch),
        getSession,
        refreshSession,
        signOut,
      },
    );

    const [, init] = httpFetch.mock.calls[0];
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });
});
