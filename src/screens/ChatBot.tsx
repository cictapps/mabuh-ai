import { useState, useRef, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, Send, Smile, Paperclip, 
  Leaf, Wind, Heart, Sparkles 
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

import { ChatBubble } from "../components/chatbot-components/ChatBubble";
import { MaskOverlay } from "../components/chatbot-components/MaskOverlay";

interface Message {
  id: string;
  isAi: boolean;
  content: ReactNode;
  hasActions?: boolean;
  status?: "typing" | "done";
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

export default function Chatbot() {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [isMaskMode, setIsMaskMode] = useState(false);
  const [inputText, setInputText] = useState("");
  const [showOverlay, setShowOverlay] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
          Kamusta! I'm{" "}
          <span className="font-bold text-primary dark:text-secondary">
            MabuhAi
          </span>, your mental health companion. 🌿
        </p>
        <p className="mt-2">
          I'm here to listen, support, and help you navigate your feelings. How are you feeling today?
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
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const sendMessage = async (text: string, intent: string = "general") => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      isAi: false,
      content: text,
      status: "done",
    };

    const aiMessageId = (Date.now() + 1).toString();

    // Show user message + typing dots immediately
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
      // Wait for full reply from Rust
      const reply = await invoke<string>("chat", { message: text, intent });

      // Replace typing dots with typewriter animation of full reply
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? { ...msg, content: reply, status: "typing" }
            : msg
        )
      );

      // After typewriter finishes, mark as done
      // speed=18ms per char, so wait that long before marking done
      const duration = reply.length * 18 + 200;
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? { ...msg, status: "done" }
              : msg
          )
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
            : msg
        )
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

  return (
    <div
      className={`flex flex-col h-screen transition-all duration-500 overflow-hidden ${
        isMaskMode
          ? "bg-[#0b0f14] text-white"
          : "bg-white dark:bg-twilight-dark text-slate-900 dark:text-white"
      }`}
    >
      <header className="px-6 py-4 flex items-center justify-between border-b border-indigo-100 dark:border-indigo-900/50 bg-white/80 dark:bg-twilight-dark/80 backdrop-blur-md sticky top-0 z-10 text-slate-900 dark:text-white">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          >
            <ChevronLeft className="size-6" />
          </button>

          <div className="relative ml-1">
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary via-secondary to-accent flex items-center justify-center text-white shadow-md">
              <Leaf className="size-5" />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-twilight-dark rounded-full" />
          </div>

          <div className="ml-2 text-left">
            <h1 className="font-bold text-lg tracking-tight leading-none">MabuhAi</h1>
            <p className="text-[10px] text-pink-500 uppercase tracking-widest font-bold mt-1">Twilight Glow</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-indigo-50/50 dark:bg-indigo-950/30 px-4 py-2 rounded-full border border-indigo-100/50 dark:border-indigo-900/50">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Mask-Off</span>
          <button
            onClick={() => setIsMaskMode((prev) => !prev)}
            className={`relative inline-flex h-6 w-11 rounded-full transition ${
              isMaskMode ? "bg-white" : "bg-slate-600"
            }`}
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
        className={`flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-6 transition-all duration-500 ${
          isMaskMode
            ? "bg-transparent"
            : "bg-linear-to-b from-indigo-50/20 to-white dark:from-twilight-dark/20 dark:to-slate-950"
        }`}
      >
        <div className="flex justify-center mb-4">
          <span className="px-3 py-1 rounded-full bg-white/50 dark:bg-indigo-950/50 text-[10px] font-bold text-indigo-400 uppercase tracking-widest border border-indigo-100 dark:border-indigo-900">
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
                  // Show typing dots while waiting for reply
                  msg.isAi && msg.status === "typing" && typeof msg.content === "string" && msg.content === "" ? (
                    <TypingDots isMaskMode={isMaskMode} />
                  ) : // Typewriter once reply arrives
                  msg.isAi && msg.status === "typing" && typeof msg.content === "string" ? (
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
                  className="flex flex-col gap-2 ml-14"
                >
                  <p className="text-[10px] font-bold uppercase ml-1 tracking-wider text-left text-slate-400">
                    {isMaskMode ? "Safe Actions" : "Nurturing Steps"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {isMaskMode ? (
                      <>
                        <button
                          onClick={() => sendWithIntent("I just need to talk", "vent")}
                          className="px-4 py-2 bg-white/10 border border-white/10 rounded-full text-xs text-white hover:bg-white/20 transition"
                        >
                          Speak freely
                        </button>
                        <button
                          onClick={() => sendWithIntent("Help me calm down", "calm")}
                          className="px-4 py-2 bg-white/10 border border-white/10 rounded-full text-xs text-white hover:bg-white/20 transition"
                        >
                          Calm me down
                        </button>
                        <button
                          onClick={() => sendWithIntent("I feel overwhelmed", "support")}
                          className="px-4 py-2 bg-white/10 border border-white/10 rounded-full text-xs text-white hover:bg-white/20 transition"
                        >
                          I need support
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => sendWithIntent("I need to vent", "vent")}
                          className="px-4 py-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-secondary/20 rounded-full text-xs font-semibold text-secondary hover:bg-secondary hover:text-white transition-all shadow-sm flex items-center gap-2"
                        >
                          <Wind className="size-4" /> I need to vent
                        </button>
                        <button
                          onClick={() => sendWithIntent("Give me a daily affirmation", "affirmation")}
                          className="px-4 py-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-accent/30 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-accent/10 transition-all shadow-sm flex items-center gap-2"
                        >
                          <Heart className="size-4 text-amber-500" /> Daily Affirmation
                        </button>
                        <button
                          onClick={() => sendWithIntent("Give me self-care tips", "self-care")}
                          className="px-4 py-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-indigo-200 dark:border-indigo-800 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 transition-all shadow-sm flex items-center gap-2"
                        >
                          <Sparkles className="size-4 text-indigo-500" /> Self-care tips
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
        className={`p-4 md:p-6 border-t transition-all duration-500 ${
          isMaskMode
            ? "bg-black/40 border-white/10 backdrop-blur-xl"
            : "bg-white dark:bg-twilight-dark border-indigo-50 dark:border-indigo-900/50"
        }`}
      >
        <div className="max-w-4xl mx-auto flex items-end gap-3">
          <div className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-2xl px-4 py-2 flex items-center gap-3 border border-slate-200 dark:border-slate-800 focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary/20 transition-all">
            <button className="text-slate-400 hover:text-secondary">
              <Smile className="size-5" />
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
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-1.5 placeholder:text-slate-400 resize-none max-h-32 text-slate-900 dark:text-white"
              placeholder="Type a message..."
              rows={1}
              disabled={isLoading}
            />
            <button className="text-slate-400 hover:text-secondary">
              <Paperclip className="size-5" />
            </button>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
            className="w-12 h-12 bg-linear-to-br from-primary to-secondary text-white rounded-xl flex items-center justify-center shadow-lg disabled:opacity-50 disabled:grayscale transition-all"
          >
            <Send className="size-5" />
          </motion.button>
        </div>

        <div className="mt-4 flex justify-center opacity-20">
          <div className="w-32 h-1 bg-slate-400 rounded-full" />
        </div>
      </footer>

      <MaskOverlay
        isOpen={showOverlay}
        onToggle={() => {
          setShowOverlay(false);
        }}
      />
    </div>
  );
}