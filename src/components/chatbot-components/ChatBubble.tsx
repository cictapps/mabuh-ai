import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const TypingDots = () => (
  <div className="flex gap-1.5 px-1 py-2">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="w-1.5 h-1.5 bg-secondary/50 rounded-full"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
      />
    ))}
  </div>
);

interface ChatBubbleProps {
  message?: React.ReactNode; 
  isAi?: boolean;
  isTyping?: boolean;
}

export const ChatBubble = ({ message, isAi = false, isTyping = false }: ChatBubbleProps) => (
  <motion.div 
    layout
    className={`flex gap-4 ${isAi ? "max-w-2xl" : "justify-end ml-auto max-w-2xl"}`}
  >
    {isAi && (
      <div className="w-9 h-9 rounded-full bg-linear-to-br from-primary/10 to-secondary/10 flex items-center justify-center shrink-0 border border-secondary/10">
        <Sparkles className={`size-4 ${isTyping ? "text-secondary/40 animate-pulse" : "text-secondary"}`} />
      </div>
    )}
    <div className={`p-4 rounded-2xl shadow-sm text-sm ${
      isAi 
      ? "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none" 
      : "bg-linear-to-br from-primary to-secondary text-white rounded-tr-none"
    }`}>
      {/* if isTyping is true, show dots. Otherwise, show the message. */}
      {isTyping ? <TypingDots /> : message}
    </div>
  </motion.div>
);