import { useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Send,
  Smile,
  Wind,
  Heart,
  Sparkles,
  Ghost,
  MessageCircle,
  Shield,
  X,
  Wrench,
  RefreshCw,
  LockKeyhole,
} from "lucide-react";

import { ChatBubble } from "../components/chatbot-components/ChatBubble";
import { useAuth } from "../lib/auth";
import { useMoodStore } from "../hooks/useMoodStore";
import { useJourneyStore } from "../lib/journey/useJourneyStore";
import { ChatError, sendChatMessage, type ChatIntent } from "../services/chatClient";
import { useAiConsentStore, hasAnyConsentEnabled } from "../lib/aiConsent";
import { buildChatContext, type ChatContextInput } from "../lib/aiContext";
import { detectCrisis, resourceForKey, type CrisisSignal } from "../lib/crisis";
import { CrisisResourcePanel } from "../components/shared/CrisisResourcePanel";
import { AiConsentDialog } from "../components/shared/AiConsentDialog";
import {
  loadChatTranscript,
  saveChatTranscript,
  type StoredChatMessage,
} from "../lib/chatStorage";
import { useConnectivity } from "../lib/connectivity";

// The Mistral API key is never shipped with the mobile app. The chat
// proxies through a small Express server you deploy separately — the URL
// of that server is the only thing the client needs to know about, and
// it's read from the VITE_CHAT_SERVER_URL env var at build time. The
// hard-coded fallback below points at the original Render host so the
// app keeps working out-of-the-box.
const DEFAULT_CHAT_SERVER_URL = "https://mabuh-ai-server-29h8.onrender.com";
const SERVER_URL = (() => {
  const raw = (import.meta.env.VITE_CHAT_SERVER_URL as string | undefined) ?? "";
  return raw.replace(/\/+$/, "") || DEFAULT_CHAT_SERVER_URL;
})();
const IS_DEV = import.meta.env.DEV;

const OFF_TOPIC_PATTERNS: Array<{ category: string; re: RegExp }> = [
  {
    category: "coding",
    re: /\b(code|coding|programmer?|programming|developer?|dev\b|software|debug(ging)?|debugs?|refactor(ing)?|implement(ing)?|build(ing)? a (?:function|class|app|website|api|script)|write (?:me )?(?:a|an|the)?\s*(?:function|class|app|website|api|script|program|code)|syntax|compile[rs]?|runtime error|stack ?trace|git (?:commit|push|pull|merge|rebase)|sql query|regex|html|css|javascript|typescript|python|java\b|c\+\+|c#|ruby|rust\b|go(?:lang)?|php|kotlin|swift|react|vue|angular|node\.?js|express|django|flask|api endpoint|frontend|backend|fullstack|machine learning|deep learning|train(ing)? a model|neural net|algorithm|data structure)\b/i,
  },
  {
    category: "homework-help",
    re: /\b(solve (?:this|my|the)?\s*(?:equation|problem|math|algebra|calculus)|homework|assignment|essay|thesis|dissertation|take ?home exam|multiple choice|answer key)\b/i,
  },
  {
    category: "general-knowledge",
    re: /\b(who is the (?:president|prime minister|ceo)|what is the capital|capital of|define\s+\w+|translate (?:this|to))\b/i,
  },
];

const OFF_TOPIC_REPLIES: Record<string, string> = {
  coding:
    "I'm Mabuh-ai, your emotional support companion — I can't help with coding or programming tasks. 💙 I'm here for your feelings, stress, or whatever's on your mind though. What's been weighing on you lately?",
  "homework-help":
    "I'm Mabuh-ai, your emotional support companion — I can't help solve homework or assignments. 💙 But if school pressure is stressing you out, I'm all ears. Want to talk about how it's been going?",
  "general-knowledge":
    "I'm Mabuh-ai, your emotional support companion — I can't look up facts or definitions. 💙 What I can do is listen. Is there something on your mind I can help you sit with?",
};

function detectOffTopicMessage(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  for (const { category, re } of OFF_TOPIC_PATTERNS) {
    if (re.test(trimmed)) return category;
  }
  return null;
}

type ChatErrorKind =
  | "auth"
  | "rate-limit"
  | "unavailable"
  | "network"
  | "http"
  | "parse"
  | "empty"
  | "config"
  | "unknown";

function buildFriendlyError(kind: ChatErrorKind, err: Error | null): ReactNode {
  const msg = err?.message ?? "Unknown error";
  if (kind === "auth") {
    return (
      <>
        <p>You need to be signed in to chat.</p>
        <p className="mt-1 text-xs opacity-70">Details: {msg}</p>
      </>
    );
  }
  if (kind === "rate-limit") {
    return (
      <>
        <p>
          You&apos;re sending messages too quickly. Take a breath and try again in a
          minute.
        </p>
        <p className="mt-1 text-xs opacity-70">Details: {msg}</p>
      </>
    );
  }
  if (kind === "unavailable") {
    return (
      <>
        <p>The chat service is temporarily unavailable. Please try again in a moment.</p>
        <p className="mt-1 text-xs opacity-70">Details: {msg}</p>
      </>
    );
  }
  if (kind === "network") {
    return (
      <>
        <p>
          I couldn&apos;t reach the chat server. Please check your internet connection.
        </p>
        <p className="mt-1 text-xs opacity-70">Details: {msg}</p>
      </>
    );
  }
  if (kind === "http") {
    const m = /^Server error (\d+)(?::\s*(.*))?$/.exec(msg);
    const status = m?.[1] ?? "?";
    const reason = m?.[2] ?? msg;
    if (status === "401" || status === "403") {
      return (
        <>
          <p>The chat server rejected the request ({status}).</p>
          <p className="mt-1 text-xs opacity-70">Server said: {reason}</p>
        </>
      );
    }
    if (status === "404") {
      return (
        <>
          <p>
            Chat endpoint not found (404). The server URL may be wrong, or the server
            doesn&apos;t expose <code className="rounded bg-white/10 px-1">/chat</code>.
          </p>
          <p className="mt-1 text-xs opacity-70">Server said: {reason}</p>
        </>
      );
    }
    if (status === "429") {
      return (
        <>
          <p>
            You&apos;re sending messages too quickly. Take a breath and try again in a
            minute.
          </p>
          <p className="mt-1 text-xs opacity-70">Details: {reason}</p>
        </>
      );
    }
    if (status === "502" || status === "503" || status === "504") {
      return (
        <>
          <p>
            The chat server is having trouble reaching its AI backend ({status}). Try
            again in a moment.
          </p>
          <p className="mt-1 text-xs opacity-70">Details: {reason}</p>
        </>
      );
    }
    return (
      <>
        <p>Chat server returned an error ({status}).</p>
        <p className="mt-1 text-xs opacity-70">Details: {reason}</p>
      </>
    );
  }
  if (kind === "parse") {
    return (
      <>
        <p>The chat server sent back something I couldn&apos;t read.</p>
        <p className="mt-1 text-xs opacity-70">Details: {msg}</p>
      </>
    );
  }
  if (kind === "empty") {
    return (
      <>
        <p>The chat server didn&apos;t include a reply. It may be misconfigured.</p>
        <p className="mt-1 text-xs opacity-70">Details: {msg}</p>
      </>
    );
  }
  return (
    <>
      <p>Sorry, something went wrong. Please try again.</p>
      <p className="mt-1 text-xs opacity-70">Details: {msg}</p>
    </>
  );
}

interface Message {
  id: string;
  isAi: boolean;
  content: ReactNode;
  createdAt: number;
  hasActions?: boolean;
  status?: "typing" | "done";
  errorDiagnostics?: string | null;
}

interface ChatbotShellProps {
  embedded?: boolean;
  onBack?: () => void;
}

const Typewriter = ({ text, speed = 18 }: { text: string; speed?: number }) => {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    let i = 0;
    setDisplayed("");
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      <span className="opacity-60 animate-pulse">|</span>
    </span>
  );
};

const TypingDots = ({ isMaskMode }: { isMaskMode: boolean }) => (
  <div className="flex gap-1.5 px-1 py-2 bg-transparent">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className={`w-1.5 h-1.5 rounded-full ${
          isMaskMode ? "bg-white/30" : "bg-secondary/50"
        }`}
        animate={{ opacity: [0.2, 1, 0.2] }}
        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
      />
    ))}
  </div>
);

const EMOJI_CATEGORIES: Array<{ id: string; label: string; emojis: string[] }> = [
  {
    id: "smileys",
    label: "Smileys",
    emojis: [
      "😀",
      "😃",
      "😄",
      "😁",
      "😆",
      "😅",
      "🤣",
      "😂",
      "🙂",
      "🙃",
      "😉",
      "😊",
      "😇",
      "🥰",
      "😍",
      "🤩",
      "😘",
      "😗",
      "😚",
      "😙",
      "😋",
      "😛",
      "🤔",
      "🤗",
      "🤭",
      "🫣",
      "🤫",
      "🤐",
      "😶",
      "😐",
    ],
  },
  {
    id: "gestures",
    label: "Gestures",
    emojis: [
      "👍",
      "👎",
      "👌",
      "✌️",
      "🤞",
      "🤟",
      "🤘",
      "🤙",
      "👈",
      "👉",
      "👆",
      "👇",
      "☝️",
      "✋",
      "🤚",
      "🖐️",
      "🖖",
      "👋",
      "🤝",
      "🙏",
      "✍️",
      "💪",
      "🤲",
      "🫶",
      "🤜",
      "🤛",
      "👏",
      "🙌",
      "👐",
    ],
  },
  {
    id: "hearts",
    label: "Hearts",
    emojis: [
      "❤️",
      "🧡",
      "💛",
      "💚",
      "💙",
      "💜",
      "🖤",
      "🤍",
      "🤎",
      "💖",
      "💝",
      "💔",
      "💕",
      "💞",
      "💓",
      "💗",
      "💘",
      "💟",
      "❤️‍🔥",
      "❤️‍🩹",
    ],
  },
  {
    id: "nature",
    label: "Nature",
    emojis: [
      "🌿",
      "🌱",
      "🌳",
      "🌲",
      "🌴",
      "🌵",
      "🌾",
      "🌷",
      "🌸",
      "🌹",
      "🌺",
      "🌻",
      "🌼",
      "💐",
      "🍀",
      "🌎",
      "🌟",
      "✨",
      "⭐",
      "🌙",
      "☀️",
      "⛅",
      "🌧️",
      "⛈️",
      "🌈",
      "❄️",
      "🔥",
      "💧",
      "🌊",
    ],
  },
  {
    id: "food",
    label: "Food",
    emojis: [
      "🍎",
      "🍊",
      "🍋",
      "🍌",
      "🍉",
      "🍇",
      "🍓",
      "🫐",
      "🍒",
      "🍑",
      "🥭",
      "🍍",
      "🥥",
      "🥝",
      "🍅",
      "🥑",
      "🥦",
      "🥕",
      "🌽",
      "🍞",
      "🥐",
      "🧀",
      "🍕",
      "🍔",
      "🍟",
      "🍿",
      "🍩",
      "🍪",
      "🎂",
      "🍫",
    ],
  },
];

function EmojiPicker({
  onSelect,
  onClose,
}: {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}) {
  const [activeCategory, setActiveCategory] = useState(EMOJI_CATEGORIES[0].id);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const active = useMemo(
    () => EMOJI_CATEGORIES.find((c) => c.id === activeCategory) ?? EMOJI_CATEGORIES[0],
    [activeCategory],
  );

  return (
    <motion.div
      ref={panelRef}
      role="dialog"
      aria-label="Emoji picker"
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.98 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className="absolute bottom-full left-0 right-0 mb-2 mx-4 sm:mx-auto sm:max-w-2xl rounded-2xl border border-border bg-card/95 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.6)] backdrop-blur-xl overflow-hidden"
    >
      <div className="flex items-center justify-between px-3 pt-2 pb-1">
        <div className="flex gap-1 overflow-x-auto">
          {EMOJI_CATEGORIES.map((cat) => {
            const isActive = cat.id === active.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close emoji picker"
          className="ml-2 shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
        >
          <X size={14} />
        </button>
      </div>

      <div className="grid grid-cols-8 sm:grid-cols-10 gap-1 p-2 max-h-56 overflow-y-auto">
        {active.emojis.map((emoji, i) => (
          <button
            key={`${active.id}-${i}`}
            type="button"
            onClick={() => onSelect(emoji)}
            className="aspect-square rounded-lg text-xl leading-none flex items-center justify-center transition-transform hover:bg-white/5 active:scale-90"
            aria-label={`Insert ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

export function ChatbotShell({ embedded = false, onBack }: ChatbotShellProps) {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const pullStartYRef = useRef<number | null>(null);
  const isNearBottomRef = useRef(true);

  const { profile, user } = useAuth();
  const online = useConnectivity();
  // The user agreed to the Privacy Policy at the login screen
  // ("By continuing, you agree to our Terms & Conditions · Privacy Policy").
  // The chat-specific gate is no longer needed.
  const hasAcceptedPolicy = true;
  const {
    history: moodHistory,
    journalEntries,
    socialStats,
    analyticsStats,
  } = useMoodStore();
  const streak = useJourneyStore((s) => s.streak);
  const totalXp = useJourneyStore((s) => s.totalXp);
  const flightsCompleted = useJourneyStore((s) => s.flightsCompleted);
  const journeyPhase = useJourneyStore((s) => s.phase);
  const preflightMood = useJourneyStore((s) => s.preflightMood);
  const checkpointMood = useJourneyStore((s) => s.checkpointMood);
  const finalMood = useJourneyStore((s) => s.finalMood);
  const lastFlightDate = useJourneyStore((s) => s.lastFlightDate);

  const consentToggles = useAiConsentStore((s) => s.toggles);
  const consentAcknowledged = useAiConsentStore((s) => s.consentAcknowledged);

  const fullContextInput = useMemo<ChatContextInput>(() => {
    return {
      displayName: profile?.display_name ?? null,
      moods: moodHistory.slice(-7).map((e) => ({
        date: e.date,
        mood: e.mood,
        tags: e.tags,
        schoolLoad: e.schoolLoad,
        activityMinutes: e.activityMinutes,
        activities: e.activities,
        socialInteractions: e.socialInteractions,
        dayNote: e.dayNote,
      })),
      journals: journalEntries.slice(0, 5).map((j) => ({
        date: j.date,
        content: j.content,
        source: j.source,
        mood: j.mood,
      })),
      socialStats,
      analytics: {
        currentStreak: analyticsStats?.currentStreak ?? null,
        lifetimeDays: analyticsStats?.lifetimeDays ?? null,
        stabilityScore: analyticsStats?.stabilityScore ?? null,
      },
      journey: {
        phase: journeyPhase,
        streak,
        totalXp,
        flightsCompleted,
        lastFlightDate,
        preflightMood,
        checkpointMood,
        finalMood,
      },
    };
  }, [
    profile?.display_name,
    moodHistory,
    journalEntries,
    socialStats,
    analyticsStats,
    journeyPhase,
    streak,
    totalXp,
    flightsCompleted,
    lastFlightDate,
    preflightMood,
    checkpointMood,
    finalMood,
  ]);

  const sharedContext = useMemo(
    () => buildChatContext(fullContextInput, consentToggles),
    [fullContextInput, consentToggles],
  );

  const chatContext = useMemo(() => {
    return {
      ...sharedContext.payload,
      audience: sharedContext.audience,
      timestamp: Date.now(),
    };
  }, [sharedContext]);

  const [isMaskMode, setIsMaskMode] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAiConsent, setShowAiConsent] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [activeCrisis, setActiveCrisis] = useState<{
    signal: CrisisSignal;
    id: string;
  } | null>(null);
  const [devPanelOpen, setDevPanelOpen] = useState(false);
  const [hydratedUserId, setHydratedUserId] = useState<string | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null);
  const [devTest, setDevTest] = useState<
    | { state: "idle" }
    | { state: "running" }
    | { state: "ok"; status: number; durationMs: number; body: string }
    | { state: "fail"; status: number; durationMs: number; body: string }
  >({ state: "idle" });

  const runDevTest = useCallback(async () => {
    setDevTest({ state: "running" });
    const started = Date.now();
    try {
      const result = await sendChatMessage(
        {
          message: "[dev ping]",
          intent: "general",
          history: [],
          context: { devPing: true, timestamp: Date.now() },
        },
        { apiBaseUrl: SERVER_URL },
      );
      const dur = Date.now() - started;
      setDevTest({
        state: "ok",
        status: result.status,
        durationMs: dur,
        body: JSON.stringify(
          {
            replyPreview: result.reply.slice(0, 400),
            durationMs: result.durationMs,
            requestId: result.requestId,
          },
          null,
          2,
        ),
      });
    } catch (e) {
      const dur = Date.now() - started;
      if (e instanceof ChatError) {
        setDevTest({
          state: "fail",
          status: e.status ?? 0,
          durationMs: dur,
          body: JSON.stringify(
            {
              kind: e.kind,
              message: e.message,
              requiresLogin: e.requiresLogin,
              requestId: e.requestId,
              diagnostics: e.diagnostics,
            },
            null,
            2,
          ),
        });
      } else {
        setDevTest({
          state: "fail",
          status: 0,
          durationMs: dur,
          body: e instanceof Error ? e.message : String(e),
        });
      }
    }
  }, []);

  const getInitialMessage = (mask: boolean): Message => ({
    id: "init",
    isAi: true,
    content: mask
      ? "I'm here.\n\nNo identity. No memory. Just speak."
      : "Kamusta! I'm **Mabuh-ai**, your mental health companion. 🌿\n\nI'm here to listen, support, and help you navigate your feelings. How are you feeling today?",
    createdAt: Date.now(),
    hasActions: true,
    status: "done",
  });

  useEffect(() => {
    if (!user?.id) return;
    const stored = loadChatTranscript(user.id);
    setMessages(
      stored.length > 0
        ? stored.map((message) => ({
            id: message.id,
            isAi: message.role === "assistant",
            content: message.content,
            createdAt: message.createdAt,
            hasActions: message.hasActions,
            status: "done",
          }))
        : [getInitialMessage(false)],
    );
    setHydratedUserId(user.id);
  }, [user?.id]);

  useEffect(() => {
    if (hydratedUserId !== user?.id || isMaskMode || !user?.id) return;
    const stored: StoredChatMessage[] = messages.flatMap((message) => {
      if (
        message.status !== "done" ||
        typeof message.content !== "string" ||
        !message.content.trim()
      ) {
        return [];
      }
      return [
        {
          id: message.id,
          role: message.isAi ? "assistant" : "user",
          content: message.content,
          createdAt: message.createdAt,
          hasActions: message.hasActions,
        },
      ];
    });
    saveChatTranscript(user.id, stored);
  }, [hydratedUserId, isMaskMode, messages, user?.id]);

  useEffect(() => {
    if (!scrollRef.current) return;
    if (!isNearBottomRef.current) return;
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const lineHeight = 22;
    const maxHeight = lineHeight * 5 + 16;
    const next = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [inputText]);

  useEffect(() => {
    if (!devPanelOpen) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest?.("[data-dev-panel]")) return;
      setDevPanelOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [devPanelOpen]);

  const sendMessage = async (text: string, intent: string = "general") => {
    if (!text.trim() || isLoading) return;
    if (!online) {
      setRefreshNotice("Chat needs an internet connection.");
      window.setTimeout(() => setRefreshNotice(null), 2400);
      return;
    }
    if (!hasAcceptedPolicy) {
      setShowAiConsent(true);
      return;
    }

    const offTopicCategory = detectOffTopicMessage(text);

    const userMessage: Message = {
      id: Date.now().toString(),
      isAi: false,
      content: text,
      createdAt: Date.now(),
      status: "done",
    };

    const crisisSignal = detectCrisis(text);
    if (crisisSignal) {
      setActiveCrisis({ signal: crisisSignal, id: `${Date.now()}-crisis` });
    }

    if (offTopicCategory) {
      setMessages((prev) => [
        ...prev,
        userMessage,
        {
          id: (Date.now() + 1).toString(),
          isAi: true,
          content: OFF_TOPIC_REPLIES[offTopicCategory],
          createdAt: Date.now() + 1,
          status: "done",
        },
      ]);
      return;
    }

    if (
      !isMaskMode &&
      !consentAcknowledged &&
      hasAnyConsentEnabled(consentToggles) === false
    ) {
      setShowAiConsent(true);
    }

    const aiMessageId = (Date.now() + 1).toString();

    setMessages((prev) => [
      ...prev,
      userMessage,
      {
        id: aiMessageId,
        isAi: true,
        content: "",
        createdAt: Date.now() + 1,
        status: "typing",
      },
    ]);

    setIsLoading(true);

    try {
      const context = isMaskMode
        ? { audience: "student", anonymous: true, timestamp: Date.now() }
        : chatContext;

      const result = await sendChatMessage(
        {
          message: text,
          intent: intent as ChatIntent,
          history: [],
          context,
        },
        { apiBaseUrl: SERVER_URL },
      );

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? { ...msg, content: result.reply, status: "typing" }
            : msg,
        ),
      );

      const duration = result.reply.length * 8 + 200;
      window.setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === aiMessageId ? { ...msg, status: "done" } : msg)),
        );
      }, duration);
    } catch (error) {
      let kind: ChatErrorKind = "unknown";
      let diagnostics: Record<string, unknown> | null = null;
      let requiresLogin = false;
      if (error instanceof ChatError) {
        kind = error.kind;
        diagnostics = error.diagnostics ?? null;
        requiresLogin = error.requiresLogin;
      }
      if (IS_DEV) {
        console.error("[chat] error", {
          kind,
          message: error instanceof Error ? error.message : String(error),
          diagnostics,
        });
      }
      if (requiresLogin) {
        navigate("/login", { replace: true });
        return;
      }
      const friendly = buildFriendlyError(kind, error as Error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? {
                ...msg,
                content: friendly,
                status: "done",
                errorDiagnostics: diagnostics
                  ? JSON.stringify(diagnostics, null, 2)
                  : null,
              }
            : msg,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => {
    isNearBottomRef.current = true;
    sendMessage(inputText, "general");
    setInputText("");
    setEmojiPickerOpen(false);
  };

  const sendWithIntent = (text: string, intent: string) => {
    sendMessage(text, intent);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    navigate(-1);
  };

  const insertEmoji = (emoji: string) => {
    const el = textareaRef.current;
    if (!el) {
      setInputText((prev) => prev + emoji);
      return;
    }
    const start = el.selectionStart ?? inputText.length;
    const end = el.selectionEnd ?? inputText.length;
    const next = inputText.slice(0, start) + emoji + inputText.slice(end);
    setInputText(next);
    const caret = start + emoji.length;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  };

  const handleToggleEmojiPicker = () => {
    setEmojiPickerOpen((prev) => !prev);
  };

  const restoreSavedTranscript = useCallback(() => {
    if (!user?.id) return;
    const stored = loadChatTranscript(user.id);
    setMessages(
      stored.length > 0
        ? stored.map((message) => ({
            id: message.id,
            isAi: message.role === "assistant",
            content: message.content,
            createdAt: message.createdAt,
            hasActions: message.hasActions,
            status: "done",
          }))
        : [getInitialMessage(false)],
    );
    isNearBottomRef.current = true;
  }, [user?.id]);

  const handleMaskToggle = () => {
    const nextMaskMode = !isMaskMode;
    setEmojiPickerOpen(false);
    setInputText("");
    setActiveCrisis(null);
    setRefreshNotice(null);
    setIsMaskMode(nextMaskMode);
    if (nextMaskMode) {
      setMessages([getInitialMessage(true)]);
    } else {
      restoreSavedTranscript();
    }
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    const el = scrollRef.current;
    if (!el || el.scrollTop > 0 || isLoading || isRefreshing) return;
    pullStartYRef.current = event.touches[0]?.clientY ?? null;
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLElement>) => {
    if (pullStartYRef.current == null) return;
    const currentY = event.touches[0]?.clientY;
    if (currentY == null) return;
    const distance = Math.max(0, Math.min(88, (currentY - pullStartYRef.current) * 0.55));
    setPullDistance(distance);
  };

  const handleTouchEnd = () => {
    pullStartYRef.current = null;
    if (pullDistance < 64) {
      setPullDistance(0);
      return;
    }
    setPullDistance(0);
    if (isMaskMode) {
      setRefreshNotice("Mask on chats stay only in this session.");
      window.setTimeout(() => setRefreshNotice(null), 2200);
      return;
    }
    setIsRefreshing(true);
    restoreSavedTranscript();
    setRefreshNotice("Saved chat reloaded");
    window.setTimeout(() => {
      setIsRefreshing(false);
      setRefreshNotice(null);
    }, 700);
  };

  const shellClasses = embedded
    ? "relative flex flex-1 h-full flex-col overflow-hidden bg-card/90 text-card-foreground backdrop-blur-xl"
    : "relative flex h-full min-h-screen flex-col overflow-hidden bg-background text-foreground";

  return (
    <div className={shellClasses}>
      <header
        className={`relative z-20 flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2.5 backdrop-blur-xl sm:gap-3 sm:px-6 sm:py-3 transition-all duration-300 ${
          isMaskMode ? "border-white/10 bg-black/70" : "border-border/60 bg-background/80"
        }`}
        style={{
          paddingTop: "var(--app-header-top)",
        }}
      >
        <div className="flex min-w-0 items-center gap-2">
          <button
            onClick={handleBack}
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            aria-label="Back"
            type="button"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold tracking-tight leading-none text-foreground">
              Chat
            </h1>
            <p
              className={`mt-0.5 text-[11px] leading-none transition-colors ${
                isMaskMode ? "text-white/50" : "text-muted-foreground"
              }`}
            >
              {isMaskMode ? "Anonymous session" : "Companion chat"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/privacy")}
            aria-label="Privacy and safety"
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300 ${
              isMaskMode
                ? "border-white/15 bg-white/5 text-white hover:bg-white/10"
                : "border-border bg-surface-low text-foreground hover:border-primary/40 hover:text-primary"
            }`}
          >
            <Shield size={15} />
          </button>

          {IS_DEV && (
            <>
              <button
                type="button"
                onClick={() => setDevPanelOpen((v) => !v)}
                aria-expanded={devPanelOpen}
                aria-label="Developer diagnostics"
                title="Developer diagnostics (dev build only)"
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300 ${
                  isMaskMode
                    ? "border-white/15 bg-white/5 text-white hover:bg-white/10"
                    : "border-amber-400/30 bg-amber-300/10 text-amber-300 hover:bg-amber-300/20"
                }`}
              >
                <Wrench size={15} />
              </button>
              <AnimatePresence>
                {devPanelOpen && (
                  <>
                    <motion.button
                      type="button"
                      aria-label="Close diagnostics"
                      onClick={() => setDevPanelOpen(false)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm sm:hidden"
                    />
                    <motion.div
                      data-dev-panel
                      role="dialog"
                      aria-label="Developer diagnostics"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className={`fixed left-3 right-3 top-[calc(var(--app-top-inset)+72px)] z-40 max-h-[70vh] overflow-y-auto rounded-2xl border p-3 text-xs shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-11 sm:max-h-[80vh] sm:w-80 sm:max-w-[calc(100vw-1.5rem)] ${
                        isMaskMode
                          ? "border-white/15 bg-black/90 text-white"
                          : "border-border bg-card text-card-foreground"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <p className="font-semibold uppercase tracking-wide opacity-70">
                          Dev diagnostics
                        </p>
                        <button
                          type="button"
                          onClick={() => setDevPanelOpen(false)}
                          aria-label="Close"
                          className="rounded p-1 opacity-60 hover:opacity-100"
                        >
                          <X size={12} />
                        </button>
                      </div>
                      <dl className="space-y-1 font-mono text-[11px]">
                        <div className="flex items-start justify-between gap-2">
                          <dt className="shrink-0 opacity-60">Server URL</dt>
                          <dd className="break-all text-right">{SERVER_URL}</dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt className="opacity-60">Auth</dt>
                          <dd>Supabase JWT</dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt className="opacity-60">Mask mode</dt>
                          <dd>{isMaskMode ? "on" : "off"}</dd>
                        </div>
                      </dl>
                      <button
                        type="button"
                        onClick={runDevTest}
                        disabled={devTest.state === "running"}
                        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-current/20 bg-current/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide hover:bg-current/20 disabled:opacity-50 sm:py-1.5"
                      >
                        <RefreshCw
                          size={12}
                          className={devTest.state === "running" ? "animate-spin" : ""}
                        />
                        {devTest.state === "running" ? "Pinging…" : "Re-test /chat"}
                      </button>
                      {devTest.state !== "idle" && devTest.state !== "running" && (
                        <div
                          className={`mt-2 rounded-md p-2 font-mono text-[11px] ${
                            devTest.state === "ok"
                              ? "bg-emerald-400/10 text-emerald-300"
                              : "bg-rose-400/10 text-rose-300"
                          }`}
                        >
                          <p>
                            HTTP {devTest.status} · {devTest.durationMs} ms
                          </p>
                          <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-all">
                            {devTest.body}
                          </pre>
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </>
          )}

          <button
            type="button"
            onClick={handleMaskToggle}
            aria-pressed={isMaskMode}
            aria-label="Toggle mask mode"
            className={`group inline-flex shrink-0 items-center gap-2 rounded-full border px-2 py-1.5 transition-all duration-300 sm:px-2.5 ${
              isMaskMode
                ? "border-white/15 bg-white/5 text-white"
                : "border-border bg-surface-low text-foreground hover:border-primary/40"
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
                isMaskMode ? "bg-white/10 text-white" : "bg-primary/10 text-primary"
              }`}
            >
              {isMaskMode ? <Ghost size={14} /> : <Smile size={14} />}
            </span>
            <span className="hidden pr-1 text-xs font-semibold tracking-wide sm:inline">
              {isMaskMode ? "Mask on" : "Mask off"}
            </span>
            <span
              className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                isMaskMode ? "bg-white/40" : "bg-muted-foreground/30"
              }`}
            >
              <motion.span
                animate={{ x: isMaskMode ? 12 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={`h-3 w-3 rounded-full shadow ${
                  isMaskMode ? "bg-white" : "bg-foreground"
                }`}
              />
            </span>
          </button>
        </div>
      </header>

      <main
        ref={scrollRef}
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className={`relative flex min-h-0 flex-1 touch-pan-y flex-col gap-6 overflow-y-auto overscroll-y-contain p-4 transition-all duration-500 sm:p-6 ${
          isMaskMode
            ? "bg-transparent"
            : "bg-gradient-to-b from-primary/5 via-transparent to-tertiary/10"
        }`}
      >
        <div
          aria-live="polite"
          className="pointer-events-none flex shrink-0 items-center justify-center overflow-hidden transition-[height,opacity] duration-200"
          style={{
            height: isRefreshing || refreshNotice ? 40 : pullDistance,
            opacity: isRefreshing || refreshNotice ? 1 : Math.min(1, pullDistance / 40),
          }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/90 px-3 py-1.5 text-[11px] font-semibold text-[color:var(--text-on-surface-muted)] shadow-lg backdrop-blur-xl">
            {isMaskMode ? (
              <LockKeyhole size={13} />
            ) : (
              <RefreshCw
                size={13}
                className={isRefreshing ? "animate-spin motion-reduce:animate-none" : ""}
                style={{
                  transform: isRefreshing
                    ? undefined
                    : `rotate(${Math.min(180, pullDistance * 2.5)}deg)`,
                }}
              />
            )}
            {refreshNotice ??
              (pullDistance >= 64
                ? isMaskMode
                  ? "Anonymous chat is not saved"
                  : "Release to reload"
                : "Pull to reload saved chat")}
          </div>
        </div>

        <div className="flex justify-center">
          <span className="rounded-full border border-border bg-card/70 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Today
          </span>
        </div>

        {activeCrisis && (
          <motion.div
            key={activeCrisis.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <CrisisResourcePanel
              level={activeCrisis.signal.level}
              resource={resourceForKey(activeCrisis.signal.resourceKey)}
              onDismiss={() => setActiveCrisis(null)}
            />
          </motion.div>
        )}

        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="flex flex-col gap-5"
            >
              <ChatBubble
                isAi={msg.isAi}
                isMaskMode={isMaskMode}
                message={
                  msg.isAi &&
                  msg.status === "typing" &&
                  typeof msg.content === "string" &&
                  msg.content === "" ? (
                    <TypingDots isMaskMode={isMaskMode} />
                  ) : msg.isAi &&
                    msg.status === "typing" &&
                    typeof msg.content === "string" ? (
                    <Typewriter text={msg.content} speed={18} />
                  ) : (
                    msg.content
                  )
                }
                errorDiagnostics={msg.errorDiagnostics ?? null}
              />

              {msg.hasActions && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="ml-0 flex flex-col gap-3 sm:ml-14"
                >
                  <p className="ml-1 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {isMaskMode ? "Safe Actions" : "Nurturing Steps"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {isMaskMode ? (
                      <>
                        <button
                          onClick={() => sendWithIntent("I just need to talk", "vent")}
                          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs text-white transition hover:bg-white/20"
                          type="button"
                        >
                          <MessageCircle size={16} /> Speak freely
                        </button>
                        <button
                          onClick={() => sendWithIntent("Help me calm down", "calm")}
                          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs text-white transition hover:bg-white/20"
                          type="button"
                        >
                          <Wind size={16} /> Calm me down
                        </button>
                        <button
                          onClick={() => sendWithIntent("I feel overwhelmed", "support")}
                          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs text-white transition hover:bg-white/20"
                          type="button"
                        >
                          <Heart size={16} /> I need support
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => sendWithIntent("I need to vent", "vent")}
                          className="flex items-center gap-2 rounded-full border border-secondary/20 bg-surface-high px-4 py-2 text-xs font-semibold text-secondary shadow-sm transition-all hover:bg-secondary hover:text-secondary-foreground"
                          type="button"
                        >
                          <Wind size={16} /> I need to vent
                        </button>
                        <button
                          onClick={() =>
                            sendWithIntent("Give me a daily affirmation", "affirmation")
                          }
                          className="flex items-center gap-2 rounded-full border border-border bg-surface-high px-4 py-2 text-xs font-semibold text-foreground shadow-sm transition-all hover:bg-accent"
                          type="button"
                        >
                          <Heart size={16} className="text-tertiary" /> Daily Affirmation
                        </button>
                        <button
                          onClick={() =>
                            sendWithIntent("Give me self-care tips", "self-care")
                          }
                          className="flex items-center gap-2 rounded-full border border-primary/20 bg-surface-high px-4 py-2 text-xs font-semibold text-foreground shadow-sm transition-all hover:bg-primary/10"
                          type="button"
                        >
                          <Sparkles size={16} className="text-primary" /> Self-care tips
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </main>

      <footer
        className={`relative z-20 shrink-0 border-t border-border px-3 pt-3 transition-all duration-500 sm:px-6 ${
          isMaskMode ? "bg-black/55 backdrop-blur-2xl" : "bg-card/70 backdrop-blur-2xl"
        }`}
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)",
        }}
      >
        <div className="relative mx-auto flex max-w-4xl items-end gap-2">
          <AnimatePresence>
            {emojiPickerOpen && hasAcceptedPolicy && (
              <EmojiPicker
                onSelect={insertEmoji}
                onClose={() => setEmojiPickerOpen(false)}
              />
            )}
          </AnimatePresence>

          <div
            className={`relative flex flex-1 items-end overflow-hidden rounded-[1.75rem] border border-border bg-card px-2 py-1.5 shadow-[var(--shadow-card)] backdrop-blur-xl transition-all focus-within:border-primary/50 focus-within:shadow-[var(--shadow-glow-active)] ${
              !hasAcceptedPolicy ? "opacity-60" : ""
            }`}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-12 -top-16 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,185,84,0.12),transparent_60%)] blur-2xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-16 -left-10 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(188,194,255,0.14),transparent_60%)] blur-2xl"
            />
            <button
              type="button"
              onClick={handleToggleEmojiPicker}
              aria-label={emojiPickerOpen ? "Close emoji picker" : "Open emoji picker"}
              aria-expanded={emojiPickerOpen}
              disabled={!hasAcceptedPolicy}
              className={`relative shrink-0 rounded-2xl p-2 transition-colors ${
                emojiPickerOpen
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground active:bg-white/5"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Smile size={20} />
            </button>
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
                if (e.key === "Escape" && emojiPickerOpen) {
                  setEmojiPickerOpen(false);
                }
              }}
              onFocus={(e) => {
                e.currentTarget.setSelectionRange(
                  e.currentTarget.value.length,
                  e.currentTarget.value.length,
                );
              }}
              className="relative max-h-32 min-h-10 flex-1 resize-none border-0 bg-transparent px-2 py-2.5 text-[15px] leading-snug text-foreground placeholder:text-[color:var(--text-on-surface-softest)] outline-none focus:outline-none focus:ring-0 focus-visible:outline-none disabled:cursor-not-allowed"
              placeholder={
                hasAcceptedPolicy
                  ? online
                    ? "Type a message..."
                    : "Chat is unavailable offline"
                  : "Read the privacy notice to start chatting"
              }
              rows={1}
              disabled={isLoading || !hasAcceptedPolicy || !online}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="sentences"
              spellCheck={false}
              enterKeyHint="send"
            />
          </div>

          <motion.button
            whileHover={hasAcceptedPolicy ? { scale: 1.05 } : undefined}
            whileTap={hasAcceptedPolicy ? { scale: 0.92 } : undefined}
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isLoading || !hasAcceptedPolicy || !online}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-primary via-secondary to-primary text-primary-foreground shadow-[var(--shadow-glow-active)] transition-all disabled:cursor-not-allowed disabled:opacity-40 disabled:grayscale"
            type="button"
            aria-label="Send message"
          >
            <Send size={18} />
          </motion.button>
        </div>

        <div className="mt-3 flex justify-center opacity-15">
          <div className="h-1 w-28 rounded-full bg-slate-300" />
        </div>
      </footer>

      <AiConsentDialog
        open={showAiConsent}
        canClose
        onClose={() => setShowAiConsent(false)}
      />
    </div>
  );
}

export default function ChatbotRoute() {
  return <ChatbotShell />;
}
