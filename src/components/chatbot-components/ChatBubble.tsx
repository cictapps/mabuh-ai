import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const TypingDots = ({ isMaskMode }: { isMaskMode: boolean }) => (
  <div className="flex gap-1.5 px-1 py-2">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className={`w-1.5 h-1.5 rounded-full ${
          isMaskMode ? "bg-white/30" : "bg-secondary/50"
        }`}
        animate={
          isMaskMode
            ? { opacity: [0.2, 0.5, 0.2] }
            : { opacity: [0.3, 1, 0.3] }
        }
        transition={{
          duration: isMaskMode ? 1.6 : 1,
          repeat: Infinity,
          delay: i * 0.2,
        }}
      />
    ))}
  </div>
);

interface ChatBubbleProps {
  message?: React.ReactNode;
  isAi?: boolean;
  isTyping?: boolean;
  isMaskMode?: boolean;
}

export const ChatBubble = ({
  message,
  isAi = false,
  isTyping = false,
  isMaskMode = false,
}: ChatBubbleProps) => (
  <motion.div
    layout
    className={`flex gap-4 ${
      isAi ? "max-w-2xl" : "justify-end ml-auto max-w-2xl"
    }`}
  >
    {/* AI avatar */}
    {isAi && (
      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border border-white/10 bg-white/5">
        <Sparkles
          className={`size-4 ${
            isTyping
              ? "text-white/40 animate-pulse"
              : isMaskMode
              ? "text-white/70"
              : "text-secondary"
          }`}
        />
      </div>
    )}

    {/* MESSAGE BUBBLE */}
    <div
      className={`p-4 rounded-2xl text-sm transition-all ${
        isTyping && isMaskMode
          ? "bg-[#0b0f14] border border-white/10"
          : isAi
            ? isMaskMode
              ? "bg-[#0b0f14] border border-white/10 text-white rounded-tl-none shadow-none"
              : "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none"
            : isMaskMode
              ? "bg-white/10 text-white rounded-tr-none border border-white/10"
              : "bg-linear-to-br from-primary to-secondary text-white rounded-tr-none"
      }`}
    >
      {isTyping ? (
        <TypingDots isMaskMode={isMaskMode} />
      ) : (
        message
      )}
    </div>
  </motion.div>
);