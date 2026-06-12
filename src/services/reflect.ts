import { useCallback, useState } from "react";
import { resolveApiBaseUrl, sendChatMessage, normalizeChatIntent } from "./chatClient";

export interface ReflectContext {
  draftText?: string;
  existingEntryId?: string;
  mood?: {
    type: string;
    label: string;
  } | null;
  recentMoods?: Array<{
    date: string;
    mood: string;
    moodLabel: string;
    journal?: string;
  }>;
  recentJournal?: Array<{
    date: string;
    content: string;
    mood?: string;
  }>;
}

export interface ReflectResult {
  ok: true;
  reply: string;
}

export interface ReflectError {
  ok: false;
  message: string;
}

interface UseReflectOptions {
  buildContext: () => ReflectContext;
}

export function useReflect({ buildContext }: UseReflectOptions) {
  const [reply, setReply] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reflect = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        setError("Write a few words first, and I'll meet you there.");
        return;
      }
      setBusy(true);
      setError(null);
      setReply(null);
      try {
        const ctx = buildContext();
        const res = await sendChatMessage(
          {
            message: text,
            intent: "reflect",
            history: [],
            context: {
              ...ctx,
              feature: "reflect",
            },
          },
          {
            apiBaseUrl: resolveApiBaseUrl(),
          },
        );
        if (!res.ok) throw new Error("Reflection didn't come back.");
        const replyText = (res as { reply: string }).reply;
        setReply(replyText);
      } catch (err) {
        const message =
          (typeof err === "object" && err !== null && "message" in err &&
            (err as { message?: unknown }).message) ||
          (typeof err === "object" && err !== null && "hint" in err &&
            (err as { hint?: unknown }).hint) ||
          (err instanceof Error ? err.message : null) ||
          "Couldn't reach the AI just now. Try again in a moment.";
        setError(String(message));
      } finally {
        setBusy(false);
      }
    },
    [buildContext],
  );

  const reset = useCallback(() => {
    setReply(null);
    setError(null);
  }, []);

  return { reply, error, busy, reflect, reset };
}

// Exposed for tests that want to assert the server-bound intent.
export const REFLECT_INTENT = normalizeChatIntent("reflect");
