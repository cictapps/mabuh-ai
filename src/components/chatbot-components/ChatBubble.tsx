import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

// ─── Rich Text Parser ────────────────────────────────────────────────────────

function parseInline(text: string): React.ReactNode[] {
  // Handles: **bold**, __bold__, *italic*, _italic_, `code`
  const tokens = text.split(/(\*\*.*?\*\*|__.*?__|(?<!\*)\*(?!\*).*?(?<!\*)\*(?!\*)|(?<!_)_(?!_).*?(?<!_)_(?!_)|`.*?`)/g);

  return tokens.map((token, i) => {
    if ((token.startsWith("**") && token.endsWith("**")) ||
        (token.startsWith("__") && token.endsWith("__"))) {
      return <strong key={i}>{token.slice(2, -2)}</strong>;
    }
    if ((token.startsWith("*") && token.endsWith("*")) ||
        (token.startsWith("_") && token.endsWith("_"))) {
      return <em key={i}>{token.slice(1, -1)}</em>;
    }
    if (token.startsWith("`") && token.endsWith("`")) {
      return (
        <code key={i} className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-xs">
          {token.slice(1, -1)}
        </code>
      );
    }
    return token;
  });
}

function parseMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listBuffer: { type: "bullet" | "numbered"; items: string[] } | null = null;

  const flushList = (key: string) => {
    if (!listBuffer) return;
    if (listBuffer.type === "bullet") {
      elements.push(
        <ul key={key} className="mt-1 mb-1 space-y-1 pl-1">
          {listBuffer.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-current shrink-0 opacity-60" />
              <span>{parseInline(item)}</span>
            </li>
          ))}
        </ul>
      );
    } else {
      elements.push(
        <ol key={key} className="mt-1 mb-1 space-y-1 pl-1 list-none">
          {listBuffer.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="shrink-0 font-semibold opacity-60 text-xs mt-0.5">{i + 1}.</span>
              <span>{parseInline(item)}</span>
            </li>
          ))}
        </ol>
      );
    }
    listBuffer = null;
  };

  lines.forEach((line, idx) => {
    const key = String(idx);

    // H2 header: ## text
    if (/^## /.test(line)) {
      flushList(`list-${key}`);
      elements.push(
        <p key={key} className="font-bold text-base mt-2 mb-0.5">
          {parseInline(line.replace(/^## /, ""))}
        </p>
      );
      return;
    }

    // H3 header: ### text
    if (/^### /.test(line)) {
      flushList(`list-${key}`);
      elements.push(
        <p key={key} className="font-semibold mt-1.5 mb-0.5">
          {parseInline(line.replace(/^### /, ""))}
        </p>
      );
      return;
    }

    // Bullet: •, -, or *
    const bulletMatch = line.match(/^[•\-\*] (.+)/);
    if (bulletMatch) {
      if (listBuffer?.type !== "bullet") {
        flushList(`list-${key}`);
        listBuffer = { type: "bullet", items: [] };
      }
      listBuffer.items.push(bulletMatch[1]);
      return;
    }

    // Numbered: 1. 2. etc.
    const numberedMatch = line.match(/^\d+\. (.+)/);
    if (numberedMatch) {
      if (listBuffer?.type !== "numbered") {
        flushList(`list-${key}`);
        listBuffer = { type: "numbered", items: [] };
      }
      listBuffer.items.push(numberedMatch[1]);
      return;
    }

    // Empty line → paragraph break
    if (line.trim() === "") {
      flushList(`list-${key}`);
      elements.push(<div key={key} className="h-2" />);
      return;
    }

    // Regular paragraph line
    flushList(`list-${key}`);
    elements.push(
      <p key={key} className="leading-relaxed">
        {parseInline(line)}
      </p>
    );
  });

  flushList("list-end");
  return <div className="space-y-0.5">{elements}</div>;
}

// ─── Typing Dots ─────────────────────────────────────────────────────────────

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

// ─── ChatBubble ───────────────────────────────────────────────────────────────

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
}: ChatBubbleProps) => {
  // Parse markdown only for plain string AI messages
  const rendered =
    isAi && typeof message === "string"
      ? parseMarkdown(message)
      : message;

  return (
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

      {/* Message bubble */}
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
        {isTyping ? <TypingDots isMaskMode={isMaskMode} /> : rendered}
      </div>
    </motion.div>
  );
};