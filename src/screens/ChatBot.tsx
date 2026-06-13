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
} from "lucide-react";

import { ChatBubble } from "../components/chatbot-components/ChatBubble";
import { PrivacyPolicy } from "./PrivacyPolicy";
import { useAuth } from "../lib/auth";
import { useMoodStore } from "../hooks/useMoodStore";
import { useJourneyStore } from "../lib/journey/useJourneyStore";
import { ChatError, sendChatMessage, type ChatIntent } from "../services/chatClient";
import { useAiConsentStore, hasAnyConsentEnabled } from "../lib/aiConsent";
import { buildChatContext, type ChatContextInput } from "../lib/aiContext";
import { detectCrisis, resourceForKey, type CrisisSignal } from "../lib/crisis";
import { CrisisResourcePanel } from "../components/shared/CrisisResourcePanel";
import { AiConsentDialog } from "../components/shared/AiConsentDialog";

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

  const { profile } = useAuth();
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
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [hasAcceptedPolicy, setHasAcceptedPolicy] = useState(false);
  const [showAiConsent, setShowAiConsent] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [activeCrisis, setActiveCrisis] = useState<{
    signal: CrisisSignal;
    id: string;
  } | null>(null);
  const [devPanelOpen, setDevPanelOpen] = useState(false);
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

  useEffect(() => {
    const accepted = localStorage.getItem("privacy_policy_accepted");
    const acceptedVersion = localStorage.getItem("privacy_policy_version");

    if (accepted === "true" && acceptedVersion === "2.2.0") {
      setHasAcceptedPolicy(true);
      return;
    }

    setShowPrivacyPolicy(true);
  }, []);

  const getInitialMessage = (mask: boolean): Message => ({
    id: "init",
    isAi: true,
    content: mask ? (
      <>
        <p>I'm here.</p>
        <p className="mt-2">No identity. No memory. Just speak.</p>
      </>
    ) : (
      <>
        <p>
          Kamusta! I&apos;m <span className="font-bold text-primary">Mabuh-ai</span>, your
          mental health companion. 🌿
        </p>
        <p className="mt-2">
          I&apos;m here to listen, support, and help you navigate your feelings. How are
          you feeling today?
        </p>
      </>
    ),
    hasActions: true,
    status: "done",
  });

  useEffect(() => {
    setMessages([getInitialMessage(isMaskMode)]);
  }, [isMaskMode]);

  useEffect(() => {
    if (!scrollRef.current) return;
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
    if (!hasAcceptedPolicy) {
      setShowPrivacyPolicy(true);
      return;
    }

    const offTopicCategory = detectOffTopicMessage(text);

    const userMessage: Message = {
      id: Date.now().toString(),
      isAi: false,
      content: text,
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

  const shellClasses = embedded
    ? "relative flex flex-1 h-full flex-col overflow-hidden bg-card/90 text-card-foreground backdrop-blur-xl"
    : "relative flex h-full min-h-screen flex-col overflow-hidden bg-background text-foreground";

  return (
    <div className={shellClasses}>
      <header
        className={`sticky top-0 z-10 flex items-center justify-between gap-3 border-b px-4 py-3 backdrop-blur-md sm:px-6 transition-all duration-300 ${
          isMaskMode ? "border-white/10 bg-black/70" : "border-border/60 bg-background/80"
        }`}
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 10px)",
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
          {hasAcceptedPolicy && (
            <button
              type="button"
              onClick={() => setShowPrivacyPolicy(true)}
              aria-label="Privacy and safety"
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300 ${
                isMaskMode
                  ? "border-white/15 bg-white/5 text-white hover:bg-white/10"
                  : "border-border bg-surface-low text-foreground hover:border-primary/40 hover:text-primary"
              }`}
            >
              <Shield size={15} />
            </button>
          )}

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
                      className={`fixed left-3 right-3 top-[calc(env(safe-area-inset-top,0px)+72px)] z-40 max-h-[70vh] overflow-y-auto rounded-2xl border p-3 text-xs shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-11 sm:max-h-[80vh] sm:w-80 sm:max-w-[calc(100vw-1.5rem)] ${
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
            onClick={() => setIsMaskMode((prev) => !prev)}
            aria-pressed={isMaskMode}
            aria-label="Toggle mask mode"
            className={`group inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 transition-all duration-300 ${
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
            <span className="pr-1 text-xs font-semibold tracking-wide">
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
        className={`flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6 transition-all duration-500 ${
          isMaskMode
            ? "bg-transparent"
            : "bg-gradient-to-b from-primary/5 via-transparent to-tertiary/10"
        }`}
      >
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
              className="flex flex-col gap-4"
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
                  className="ml-14 flex flex-col gap-2"
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
        className={`px-3 pt-2 transition-all duration-500 sm:px-6 ${
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
            className={`flex flex-1 items-end rounded-3xl border border-white/5 bg-surface-low/90 px-2 py-1.5 shadow-inner shadow-black/20 outline-none transition-shadow ${
              !hasAcceptedPolicy ? "opacity-60" : ""
            }`}
          >
            <button
              type="button"
              onClick={handleToggleEmojiPicker}
              aria-label={emojiPickerOpen ? "Close emoji picker" : "Open emoji picker"}
              aria-expanded={emojiPickerOpen}
              disabled={!hasAcceptedPolicy}
              className={`shrink-0 rounded-full p-2 transition-colors ${
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
              className="max-h-32 min-h-9 flex-1 resize-none border-0 bg-transparent px-1 py-2 text-[15px] leading-snug text-foreground placeholder:text-muted-foreground/80 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none disabled:cursor-not-allowed"
              placeholder={
                hasAcceptedPolicy
                  ? "Type a message..."
                  : "Read the privacy notice to start chatting"
              }
              rows={1}
              disabled={isLoading || !hasAcceptedPolicy}
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
            disabled={!inputText.trim() || isLoading || !hasAcceptedPolicy}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary via-secondary to-tertiary text-primary-foreground shadow-md shadow-primary/25 transition-all disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed"
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

      <PrivacyPolicy
        isOpen={showPrivacyPolicy}
        onClose={() => {
          if (!hasAcceptedPolicy) {
            setShowPrivacyPolicy(true);
            return;
          }
          setShowPrivacyPolicy(false);
        }}
        onAccept={() => {
          setHasAcceptedPolicy(true);
          setShowPrivacyPolicy(false);
        }}
        required={!hasAcceptedPolicy}
      />

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
