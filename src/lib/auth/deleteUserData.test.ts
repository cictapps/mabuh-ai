import { describe, expect, it, vi } from "vitest";
import { deleteUserData } from "./deleteUserData";
import type { HttpFetch } from "@/lib/http";

function response(status: number, body: unknown): HttpFetch {
  return async () => ({
    status,
    statusText: status < 300 ? "OK" : "ERR",
    headers: {},
    text: async () => (body === null ? "" : JSON.stringify(body)),
  });
}

const currentSession = {
  data: { session: { access_token: "current-token" } },
  error: null,
};
const refreshedSession = {
  data: { session: { access_token: "refreshed-token" } },
  error: null,
};

describe("deleteUserData", () => {
  it("calls the RPC through the HTTP layer with the current access token", async () => {
    const fetchImpl = vi.fn().mockImplementation(response(204, null));

    await deleteUserData({
      fetchImpl,
      getSession: async () => currentSession,
      refreshSession: async () => refreshedSession,
      supabaseUrl: "https://project.supabase.co/",
      anonKey: "anon-key",
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://project.supabase.co/rest/v1/rpc/delete_user_data",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          apikey: "anon-key",
          Authorization: "Bearer current-token",
          "Content-Type": "application/json",
        }),
        body: "{}",
      }),
    );
  });

  it("refreshes the session and retries when the RPC rejects authentication", async () => {
    const fetchImpl = vi
      .fn()
      .mockImplementationOnce(
        response(400, { code: "P0001", message: "Not authenticated" }),
      )
      .mockImplementationOnce(response(204, null));
    const refreshSession = vi.fn().mockResolvedValue(refreshedSession);

    await deleteUserData({
      fetchImpl,
      getSession: async () => currentSession,
      refreshSession,
      supabaseUrl: "https://project.supabase.co",
      anonKey: "anon-key",
    });

    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls[1][1].headers.Authorization).toBe(
      "Bearer refreshed-token",
    );
  });

  it("surfaces non-authentication RPC errors", async () => {
    await expect(
      deleteUserData({
        fetchImpl: response(500, { message: "Database unavailable" }),
        getSession: async () => currentSession,
        refreshSession: async () => refreshedSession,
        supabaseUrl: "https://project.supabase.co",
        anonKey: "anon-key",
      }),
    ).rejects.toThrow("Database unavailable");
  });
});
