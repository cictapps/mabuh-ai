// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";
import {
  CHAT_MESSAGE_LIMIT,
  CHAT_STORAGE_PREFIX,
  loadChatTranscript,
  removeAllChatTranscripts,
  removeChatTranscript,
  saveChatTranscript,
  type StoredChatMessage,
} from "./chatStorage";

const message = (id: string): StoredChatMessage => ({
  id,
  role: Number(id) % 2 === 0 ? "assistant" : "user",
  content: `message ${id}`,
  createdAt: Number(id),
});

describe("chatStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("isolates transcripts by account", () => {
    saveChatTranscript("user-a", [message("1")]);
    saveChatTranscript("user-b", [message("2")]);

    expect(loadChatTranscript("user-a").map((item) => item.id)).toEqual(["1"]);
    expect(loadChatTranscript("user-b").map((item) => item.id)).toEqual(["2"]);
  });

  it("recovers from malformed and invalid stored data", () => {
    localStorage.setItem(`${CHAT_STORAGE_PREFIX}broken`, "{");
    expect(loadChatTranscript("broken")).toEqual([]);

    localStorage.setItem(
      `${CHAT_STORAGE_PREFIX}mixed`,
      JSON.stringify({
        version: 1,
        messages: [message("1"), { id: "bad", role: "user", content: 4 }],
      }),
    );
    expect(loadChatTranscript("mixed")).toEqual([message("1")]);
  });

  it("keeps only the newest messages up to the limit", () => {
    const messages = Array.from({ length: CHAT_MESSAGE_LIMIT + 5 }, (_, index) =>
      message(String(index)),
    );
    saveChatTranscript("user-a", messages);

    const stored = loadChatTranscript("user-a");
    expect(stored).toHaveLength(CHAT_MESSAGE_LIMIT);
    expect(stored[0].id).toBe("5");
  });

  it("removes one account or every chat transcript", () => {
    saveChatTranscript("user-a", [message("1")]);
    saveChatTranscript("user-b", [message("2")]);
    localStorage.setItem("unrelated", "keep");

    removeChatTranscript("user-a");
    expect(loadChatTranscript("user-a")).toEqual([]);
    expect(loadChatTranscript("user-b")).toHaveLength(1);

    removeAllChatTranscripts();
    expect(loadChatTranscript("user-b")).toEqual([]);
    expect(localStorage.getItem("unrelated")).toBe("keep");
  });
});
