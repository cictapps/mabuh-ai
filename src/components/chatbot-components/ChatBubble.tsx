import { useState } from "react";
import { motion } from "framer-motion";
import { Ghost, Copy, Check } from "lucide-react";

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
  errorDiagnostics?: string | null;
}

export const ChatBubble = ({
  message,
  isAi = false,
  isTyping = false,
  isMaskMode = false,
  errorDiagnostics = null,
}: ChatBubbleProps) => {
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Parse markdown only for plain string AI messages
  const rendered =
    isAi && typeof message === "string"
      ? parseMarkdown(message)
      : message;

  const handleCopy = async () => {
    if (!errorDiagnostics) return;
    try {
      await navigator.clipboard.writeText(errorDiagnostics);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback: select the textarea so the user can copy manually
      const ta = document.getElementById(
        "chat-error-details",
      ) as HTMLTextAreaElement | null;
      if (ta) {
        ta.focus();
        ta.select();
      }
    }
  };

  return (
    <motion.div
      layout
      className={`flex w-full gap-3 sm:gap-4 ${
        isAi ? "max-w-2xl" : "justify-end ml-auto max-w-[85%] sm:max-w-2xl"
      }`}
    >
      {/* AI avatar */}
      {isAi && (
        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border overflow-hidden ${
          isMaskMode
            ? "border-white/10 bg-white/5"
            : "border-border bg-surface-high/80 backdrop-blur-sm"
        }`}>
          {isMaskMode ? (
            <Ghost
              size={18}
              className={`text-white/70 ${isTyping ? "animate-pulse" : ""}`}
            />
          ) : (
            <img
              src="/app-logo-light.svg"
              alt=""
              width={36}
              height={36}
              className={`h-9 w-9 ${isTyping ? "animate-pulse" : ""}`}
            />
          )}
        </div>
      )}

      {/* Message bubble */}
      <div
        className={`min-w-0 p-3.5 rounded-2xl text-sm transition-all sm:p-4 ${
          isTyping && isMaskMode
            ? "bg-[#0b0f14] border border-white/10"
            : isAi
              ? isMaskMode
                ? "bg-[#0b0f14] border border-white/10 text-white rounded-tl-none shadow-none"
                : "bg-card border border-border text-card-foreground rounded-tl-none shadow-[0_18px_48px_-34px_rgba(8,10,18,0.9)]"
              : isMaskMode
                ? "bg-white/10 text-white rounded-tr-none border border-white/10"
                : "bg-gradient-to-br from-primary via-secondary to-tertiary text-primary-foreground rounded-tr-none shadow-[0_18px_48px_-28px_rgba(188,194,255,0.6)]"
        }`}
      >
        {isTyping ? <TypingDots isMaskMode={isMaskMode} /> : rendered}

        {isAi && errorDiagnostics && !isTyping && (
          <div className="mt-3 border-t border-current/10 pt-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowDetails((v) => !v)}
                className="text-[11px] font-semibold uppercase tracking-wide opacity-70 hover:opacity-100"
              >
                {showDetails ? "Hide details" : "Show details"}
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide opacity-70 hover:opacity-100"
                aria-label="Copy error details to clipboard"
              >
                {copied ? (
                  <>
                    <Check size={12} /> Copied
                  </>
                ) : (
                  <>
                    <Copy size={12} /> Copy details
                  </>
                )}
              </button>
            </div>
            {showDetails && (
              <textarea
                id="chat-error-details"
                readOnly
                value={errorDiagnostics}
                className="mt-2 w-full resize-none rounded-md bg-black/20 p-2 font-mono text-[11px] leading-snug text-foreground/90 outline-none"
                rows={Math.min(12, errorDiagnostics.split("\n").length + 1)}
              />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
