import { useEffect, useMemo, useRef, useState, ReactNode } from "react";
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
} from "lucide-react";

import { ChatBubble } from "../components/chatbot-components/ChatBubble";
import { PrivacyPolicy } from "./PrivacyPolicy";

// The Mistral API key is never shipped with the mobile app. The chat
// proxies through a small Express server you deploy separately — the URL
// of that server is the only thing the client needs to know about, and
// it's read from the VITE_CHAT_SERVER_URL env var at build time. The
// hard-coded fallback below points at the original Render host so the
// app keeps working out-of-the-box.
const DEFAULT_CHAT_SERVER_URL = "https://mabuh-ai-server.onrender.com";
const SERVER_URL =
  (import.meta.env.VITE_CHAT_SERVER_URL as string | undefined)?.replace(
    /\/+$/,
    "",
  ) || DEFAULT_CHAT_SERVER_URL;

interface Message {
  id: string;
  isAi: boolean;
  content: ReactNode;
  hasActions?: boolean;
  status?: "typing" | "done";
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
      "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃",
      "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙",
      "😋", "😛", "🤔", "🤗", "🤭", "🫣", "🤫", "🤐", "😶", "😐",
    ],
  },
  {
    id: "gestures",
    label: "Gestures",
    emojis: [
      "👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉",
      "👆", "👇", "☝️", "✋", "🤚", "🖐️", "🖖", "👋", "🤝", "🙏",
      "✍️", "💪", "🤲", "🫶", "🤜", "🤛", "👏", "🙌", "👐",
    ],
  },
  {
    id: "hearts",
    label: "Hearts",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎",
      "💖", "💝", "💔", "💕", "💞", "💓", "💗", "💘", "💟", "❤️‍🔥", "❤️‍🩹",
    ],
  },
  {
    id: "nature",
    label: "Nature",
    emojis: [
      "🌿", "🌱", "🌳", "🌲", "🌴", "🌵", "🌾", "🌷", "🌸", "🌹",
      "🌺", "🌻", "🌼", "💐", "🍀", "🌎", "🌟", "✨", "⭐", "🌙",
      "☀️", "⛅", "🌧️", "⛈️", "🌈", "❄️", "🔥", "💧", "🌊",
    ],
  },
  {
    id: "food",
    label: "Food",
    emojis: [
      "🍎", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍒", "🍑",
      "🥭", "🍍", "🥥", "🥝", "🍅", "🥑", "🥦", "🥕", "🌽", "🍞",
      "🥐", "🧀", "🍕", "🍔", "🍟", "🍿", "🍩", "🍪", "🎂", "🍫",
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

  const [isMaskMode, setIsMaskMode] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [hasAcceptedPolicy, setHasAcceptedPolicy] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("privacy_policy_accepted");
    const acceptedVersion = localStorage.getItem("privacy_policy_version");

    if (accepted === "true" && acceptedVersion === "2.1.0") {
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
          Kamusta! I&apos;m{" "}
          <span className="font-bold text-primary">MabuhAi</span>, your mental health companion. 🌿
        </p>
        <p className="mt-2">
          I&apos;m here to listen, support, and help you navigate your feelings. How are you feeling today?
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

  const sendMessage = async (text: string, intent: string = "general") => {
    if (!text.trim() || isLoading) return;
    if (!hasAcceptedPolicy) {
      setShowPrivacyPolicy(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      isAi: false,
      content: text,
      status: "done",
    };

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
      const response = await fetch(`${SERVER_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          intent,
          history: [],
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      const reply = data.reply as string;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId ? { ...msg, content: reply, status: "typing" } : msg,
        ),
      );

      const duration = reply.length * 8 + 200;
      window.setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === aiMessageId ? { ...msg, status: "done" } : msg)),
        );
      }, duration);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? {
                ...msg,
                content: "Sorry, something went wrong. Please try again.",
                status: "done",
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
          isMaskMode
            ? "border-white/10 bg-black/70"
            : "border-border/60 bg-background/80"
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
            <p className={`mt-0.5 text-[11px] leading-none transition-colors ${
              isMaskMode ? "text-white/50" : "text-muted-foreground"
            }`}>
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
                  msg.isAi && msg.status === "typing" && typeof msg.content === "string" && msg.content === "" ? (
                    <TypingDots isMaskMode={isMaskMode} />
                  ) : msg.isAi && msg.status === "typing" && typeof msg.content === "string" ? (
                    <Typewriter text={msg.content} speed={18} />
                  ) : (
                    msg.content
                  )
                }
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
                          onClick={() => sendWithIntent("Give me a daily affirmation", "affirmation")}
                          className="flex items-center gap-2 rounded-full border border-border bg-surface-high px-4 py-2 text-xs font-semibold text-foreground shadow-sm transition-all hover:bg-accent"
                          type="button"
                        >
                          <Heart size={16} className="text-tertiary" /> Daily Affirmation
                        </button>
                        <button
                          onClick={() => sendWithIntent("Give me self-care tips", "self-care")}
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
        className={`p-4 transition-all duration-500 sm:p-6 ${
          isMaskMode ? "bg-black/40 backdrop-blur-xl" : "bg-card/80"
        }`}
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
        }}
      >
        <div className="relative mx-auto flex max-w-4xl items-end gap-3">
          <AnimatePresence>
            {emojiPickerOpen && hasAcceptedPolicy && (
              <EmojiPicker
                onSelect={insertEmoji}
                onClose={() => setEmojiPickerOpen(false)}
              />
            )}
          </AnimatePresence>

          <div className={`flex-1 rounded-2xl border border-border bg-surface-low px-3 py-2 transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 ${!hasAcceptedPolicy ? "opacity-60" : ""}`}>
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={handleToggleEmojiPicker}
                aria-label={emojiPickerOpen ? "Close emoji picker" : "Open emoji picker"}
                aria-expanded={emojiPickerOpen}
                disabled={!hasAcceptedPolicy}
                className={`shrink-0 rounded-full p-1.5 transition-colors ${
                  emojiPickerOpen
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-white/5 hover:text-primary"
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
                className="max-h-32 flex-1 resize-none border-none bg-transparent py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:ring-0 disabled:cursor-not-allowed"
                placeholder={hasAcceptedPolicy ? "Type a message..." : "Read the privacy notice to start chatting"}
                rows={1}
                disabled={isLoading || !hasAcceptedPolicy}
              />
            </div>
          </div>

          <motion.button
            whileHover={hasAcceptedPolicy ? { scale: 1.05 } : undefined}
            whileTap={hasAcceptedPolicy ? { scale: 0.95 } : undefined}
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isLoading || !hasAcceptedPolicy}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-secondary to-tertiary text-primary-foreground shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
            type="button"
            aria-label="Send message"
          >
            <Send size={20} />
          </motion.button>
        </div>

        <div className="mt-4 flex justify-center opacity-20">
          <div className="h-1 w-32 rounded-full bg-slate-400" />
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
    </div>
  );
}

export default function ChatbotRoute() {
  return <ChatbotShell />;
}
