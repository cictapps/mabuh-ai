import { useEffect, useRef, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Send,
  Smile,
  Paperclip,
  Leaf,
  Wind,
  Heart,
  Sparkles,
  Ghost,
  MessageCircle,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

import { ChatBubble } from "../components/chatbot-components/ChatBubble";
import { PrivacyPolicy } from "./PrivacyPolicy";

const SERVER_URL = "https://mabuh-ai-server.onrender.com";

interface Message {
  id: string;
  isAi: boolean;
  content: ReactNode;
  hasActions?: boolean;
  status?: "typing" | "done";
}

type ModelState = "checking" | "downloading" | "loading" | "ready";

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

const ModelLoadingOverlay = ({ embedded }: { embedded: boolean }) => (
  <div
    className={`absolute inset-0 z-50 flex items-center justify-center p-6 ${
      embedded ? "rounded-[1.75rem] bg-background/90 backdrop-blur-sm" : "bg-background/95 backdrop-blur-sm"
    }`}
  >
    <div className="w-full max-w-xs flex flex-col items-center gap-6">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-secondary to-tertiary flex items-center justify-center shadow-lg shadow-primary/20">
        <Leaf className="size-7 text-primary-foreground" />
      </div>
      <div className="text-center">
        <h2 className="text-foreground font-bold text-lg">MabuhAi</h2>
        <p className="text-muted-foreground text-xs mt-1">Getting things ready...</p>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm">Connecting...</p>
      </div>
    </div>
  </div>
);

export function ChatbotShell({ embedded = false, onBack }: ChatbotShellProps) {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [isMaskMode, setIsMaskMode] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [modelState, setModelState] = useState<ModelState>("checking");

  useEffect(() => {
    const accepted = localStorage.getItem("privacy_policy_accepted");
    const acceptedVersion = localStorage.getItem("privacy_policy_version");

    if (accepted === "true" && acceptedVersion === "2.0.0") {
      return;
    }

    const timer = window.setTimeout(() => {
      setShowPrivacyPolicy(true);
    }, 1000);

    return () => window.clearTimeout(timer);
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

  useEffect(() => {
    const initModel = async () => {
      try {
        setModelState("checking");
        await invoke<boolean>("check_model");
        setModelState("ready");
      } catch (error) {
        console.error("Init failed:", error);
        setModelState("ready");
      }
    };

    initModel();
  }, []);

  const sendMessage = async (text: string, intent: string = "general") => {
    if (!text.trim() || isLoading || modelState !== "ready") return;

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

  const shellClasses = embedded
    ? "relative flex flex-1 h-full flex-col overflow-hidden bg-card/90 text-card-foreground backdrop-blur-xl"
    : "relative flex h-full min-h-screen flex-col overflow-hidden bg-background text-foreground";

  return (
    <div className={shellClasses}>
      <AnimatePresence>
        {modelState !== "ready" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-50"
          >
            <ModelLoadingOverlay embedded={embedded} />
          </motion.div>
        )}
      </AnimatePresence>

      <header
        className={`sticky top-0 z-10 flex items-center justify-between px-5 py-4 backdrop-blur-md sm:px-6 transition-all duration-500 ${
          isMaskMode
            ? "bg-black/40 backdrop-blur-xl"
            : embedded
            ? "bg-card/80"
            : "bg-background/80"
        }`}
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)",
        }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={handleBack}
            className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            aria-label="Back"
            type="button"
          >
            <ChevronLeft size={24} />
          </button>

          <div className="relative ml-1">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full text-primary-foreground shadow-md transition-all duration-500 ${
              isMaskMode
                ? "bg-white/10 shadow-white/5 border border-white/10"
                : "bg-gradient-to-br from-primary via-secondary to-tertiary shadow-primary/20"
            }`}>
              {isMaskMode ? (
                <Ghost size={20} className="text-white/80" />
              ) : (
                <Leaf size={20} />
              )}
            </div>
            <div
              className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 ${
                modelState === "ready" ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
              } ${isMaskMode ? "border-black" : embedded ? "border-card" : "border-background"}`}
            />
          </div>

          <div className="ml-2 text-left">
            <h1 className="text-lg font-bold tracking-tight leading-none">MabuhAi</h1>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-tertiary">
              Twilight Glow
            </p>
          </div>
        </div>

        <div className={`flex items-center gap-3 rounded-full border px-4 py-2 transition-all duration-500 ${
          isMaskMode
            ? "border-white/20 bg-white/5"
            : "border-border bg-surface-low"
        }`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-500 ${
            isMaskMode ? "text-white" : "text-muted-foreground"
          }`}>
            Mask-Off
          </span>
          <button
            onClick={() => setIsMaskMode((prev) => !prev)}
            className={`relative inline-flex h-6 w-11 rounded-full transition ${
              isMaskMode ? "bg-white" : "bg-slate-600"
            }`}
            type="button"
            aria-pressed={isMaskMode}
          >
            <motion.span
              animate={{ x: isMaskMode ? 20 : 0 }}
              className="w-5 h-5 bg-black rounded-full"
            />
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
          isMaskMode
            ? "bg-black/40 backdrop-blur-xl"
            : "bg-card/80"
        }`}
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
        }}
      >
        <div className="mx-auto flex max-w-4xl items-end gap-3">
          <div className="flex-1 rounded-2xl border border-border bg-surface-low px-4 py-2 transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20">
            <div className="flex items-center gap-3">
              <button className="text-muted-foreground transition-colors hover:text-primary" type="button">
                <Smile size={20} />
              </button>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="max-h-32 flex-1 resize-none border-none bg-transparent py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:ring-0"
                placeholder={modelState !== "ready" ? "Waiting for model..." : "Type a message..."}
                rows={1}
                disabled={isLoading || modelState !== "ready"}
              />
              <button className="text-muted-foreground transition-colors hover:text-primary" type="button">
                <Paperclip size={20} />
              </button>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isLoading || modelState !== "ready"}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-secondary to-tertiary text-primary-foreground shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:grayscale"
            type="button"
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
        onClose={() => setShowPrivacyPolicy(false)}
        onAccept={() => undefined}
      />
    </div>
  );
}

export default function ChatbotRoute() {
  return <ChatbotShell />;
}
