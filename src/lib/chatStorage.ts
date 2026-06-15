export const CHAT_STORAGE_PREFIX = "mabuhai-chat-v1:";
export const CHAT_MESSAGE_LIMIT = 100;

export interface StoredChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  hasActions?: boolean;
}

interface StoredChatTranscript {
  version: 1;
  messages: StoredChatMessage[];
  updatedAt: number;
}

function storageKey(userId: string): string {
  return `${CHAT_STORAGE_PREFIX}${userId}`;
}

function isStoredMessage(value: unknown): value is StoredChatMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Record<string, unknown>;
  return (
    typeof message.id === "string" &&
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string" &&
    message.content.trim().length > 0 &&
    typeof message.createdAt === "number" &&
    Number.isFinite(message.createdAt) &&
    (message.hasActions === undefined || typeof message.hasActions === "boolean")
  );
}

export function loadChatTranscript(userId: string): StoredChatMessage[] {
  if (typeof window === "undefined" || !userId) return [];
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<StoredChatTranscript>;
    if (parsed.version !== 1 || !Array.isArray(parsed.messages)) return [];
    return parsed.messages.filter(isStoredMessage).slice(-CHAT_MESSAGE_LIMIT);
  } catch {
    return [];
  }
}

export function saveChatTranscript(userId: string, messages: StoredChatMessage[]): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    const transcript: StoredChatTranscript = {
      version: 1,
      messages: messages.filter(isStoredMessage).slice(-CHAT_MESSAGE_LIMIT),
      updatedAt: Date.now(),
    };
    window.localStorage.setItem(storageKey(userId), JSON.stringify(transcript));
  } catch {
    // Chat remains usable when storage is unavailable or full.
  }
}

export function removeChatTranscript(userId: string): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    window.localStorage.removeItem(storageKey(userId));
  } catch {
    // Ignore unavailable storage.
  }
}

export function removeAllChatTranscripts(): void {
  if (typeof window === "undefined") return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(CHAT_STORAGE_PREFIX)) keys.push(key);
    }
    keys.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Ignore unavailable storage.
  }
}
