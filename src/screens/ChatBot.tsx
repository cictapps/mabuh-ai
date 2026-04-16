import { useState, useRef, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, Send, Smile, Paperclip, 
  Leaf, Wind, Heart, Sparkles 
} from "lucide-react";

// reusable components import
import { ChatBubble } from "../components/chatbot-components/ChatBubble";
import { MaskOverlay } from "../components/chatbot-components/MaskOverlay";

// 1. Defining the message interface
interface Message {
  id: string;
  isAi: boolean;
  content: ReactNode;
  hasActions?: boolean;
}

// typing animation
const Typewriter = ({ text, speed = 20 }: { text: string; speed?: number }) => {
  const characters = text.split("");

  return (
    <motion.span>
      {characters.map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.1,
            delay: index * (speed / 1000),
          }}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  );
};

export default function Chatbot() {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // State
  const [isMaskActive, setIsMaskActive] = useState(false);
  const [isTyping, setIsTyping] = useState(false); // Typing animation state
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      isAi: true,
      content: (
        <>
          <p>Kamusta! I'm <span className="font-bold text-primary dark:text-secondary">MabuhAi</span>, your mental health companion. 🌿</p>
          <p className="mt-2">I'm here to listen, support, and help you navigate your feelings. How are you feeling today?</p>
        </>
      ),
      hasActions: true 
    }
  ]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ 
        top: scrollRef.current.scrollHeight, 
        behavior: 'smooth' 
      });
    }
  }, [messages, isTyping]);

  // 3. Message Handlers
  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    // Add User Message
    const userMessage: Message = {
      id: Date.now().toString(),
      isAi: false,
      content: inputText,
      hasActions: false
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");

    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false); // Stop typing animation
      const aiReply: Message = {
        id: (Date.now() + 1).toString(),
        isAi: true,
        content: "I'm just a placeholder for now, but I hear you! We'll hook up the real AI soon. 🌿",
        hasActions: false
      };
      setMessages((prev) => [...prev, aiReply]);
    }, 2000); // 2-second delay for a natural feel
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-twilight-dark transition-colors duration-500 overflow-hidden">
      
      {/* HEADER SECTION */}
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

        {/* CUSTOM TOGGLE SWITCH */}
        <div className="flex items-center gap-3 bg-indigo-50/50 dark:bg-indigo-950/30 px-4 py-2 rounded-full border border-indigo-100/50 dark:border-indigo-900/50">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Mask-Off</span>
          <button 
            onClick={() => setIsMaskActive(!isMaskActive)} 
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${isMaskActive ? "bg-accent" : "bg-slate-200 dark:bg-slate-700"}`}
          >
            <motion.span 
              animate={{ x: isMaskActive ? 20 : 0 }}
              className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
            />
          </button>
        </div>
      </header>

      {/* CHAT AREA SECTION */}
      <main 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-6 bg-linear-to-b from-indigo-50/20 to-white dark:from-twilight-dark/20 dark:to-slate-950"
      >
        <div className="flex justify-center mb-4">
          <span className="px-3 py-1 rounded-full bg-white/50 dark:bg-indigo-950/50 text-[10px] font-bold text-indigo-400 uppercase tracking-widest border border-indigo-100 dark:border-indigo-900">Today</span>
        </div>

        <AnimatePresence mode="popLayout">
          {messages.map((msg, index) => (
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
                message={msg.isAi && index === messages.length - 1 && typeof msg.content === "string" ? (
                    <Typewriter text={msg.content} />
                ) : (
                    msg.content
                )} 
                />
              
              {msg.hasActions && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-col gap-2 ml-14"
                >
                  <p className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-wider text-left">Nurturing Steps</p>
                  <div className="flex flex-wrap gap-2">
                    <button className="px-4 py-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-secondary/20 rounded-full text-xs font-semibold text-secondary hover:bg-secondary hover:text-white transition-all shadow-sm flex items-center gap-2">
                      <Wind className="size-4" /> I need to vent
                    </button>
                    <button className="px-4 py-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-accent/30 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-accent/10 transition-all shadow-sm flex items-center gap-2">
                      <Heart className="size-4 text-amber-500" /> Daily Affirmation
                    </button>
                    <button className="px-4 py-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-indigo-200 dark:border-indigo-800 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 transition-all shadow-sm flex items-center gap-2">
                      <Sparkles className="size-4 text-indigo-500" /> Self-care tips
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}

          {/* AI Typing Indicator Bubble */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-4"
            >
              <ChatBubble isAi={true} isTyping={true} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FOOTER INPUT SECTION */}
      <footer className="p-4 md:p-6 bg-white dark:bg-twilight-dark border-t border-indigo-50 dark:border-indigo-900/50">
        <div className="max-w-4xl mx-auto flex items-end gap-3">
          <div className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-2xl px-4 py-2 flex items-center gap-3 border border-slate-200 dark:border-slate-800 focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary/20 transition-all">
            <button className="text-slate-400 hover:text-secondary"><Smile className="size-5" /></button>
            <textarea 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-1.5 placeholder:text-slate-400 resize-none max-h-32 text-slate-900 dark:text-white" 
              placeholder="Type a message..." 
              rows={1} 
            />
            <button className="text-slate-400 hover:text-secondary"><Paperclip className="size-5" /></button>
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isTyping}
            className="w-12 h-12 bg-linear-to-br from-primary to-secondary text-white rounded-xl flex items-center justify-center shadow-lg disabled:opacity-50 disabled:grayscale transition-all"
          >
            <Send className="size-5" />
          </motion.button>
        </div>
        
        <div className="mt-4 flex justify-center opacity-20">
          <div className="w-32 h-1 bg-slate-400 rounded-full" />
        </div>
      </footer>

      {/* OVERLAY COMPONENT */}
      <MaskOverlay isOpen={isMaskActive} onToggle={() => setIsMaskActive(false)} />
    </div>
  );
}