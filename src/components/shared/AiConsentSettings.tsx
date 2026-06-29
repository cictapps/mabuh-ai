import { useState } from "react";
import { ShieldCheck, ChevronDown } from "lucide-react";
import {
  useAiConsentStore,
  AI_CONTEXT_KEYS,
  CONTEXT_LABELS,
  type AiContextKey,
} from "@/lib/aiConsent";

function ToggleRow({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        padding: "10px 4px",
        background: "transparent",
        border: "none",
        outline: "none",
        cursor: "pointer",
        textAlign: "left",
        color: "var(--text-on-surface)",
      }}
    >
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 14, fontWeight: 500 }}>{title}</span>
        <span
          style={{
            display: "block",
            fontSize: 12,
            color: "var(--text-on-surface-strong)",
            marginTop: 2,
            lineHeight: 1.45,
          }}
        >
          {description}
        </span>
      </span>
      <span
        aria-hidden
        style={{
          position: "relative",
          width: 38,
          height: 22,
          borderRadius: 999,
          background: checked
            ? "var(--surface-violet-icon-hover)"
            : "var(--text-on-surface-faint)",
          transition: "background 0.2s ease",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: checked ? 18 : 2,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: checked ? "var(--background)" : "var(--text-on-surface)",
            transition: "left 0.2s ease",
          }}
        />
      </span>
    </button>
  );
}

export const AiConsentSettings: React.FC<{ compact?: boolean }> = ({
  compact = false,
}) => {
  const toggles = useAiConsentStore((s) => s.toggles);
  const setToggle = useAiConsentStore((s) => s.setToggle);
  const [expanded, setExpanded] = useState(!compact);

  const enabledCount = AI_CONTEXT_KEYS.filter((k) => toggles[k]).length;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 4px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--text-on-surface)",
          textAlign: "left",
        }}
      >
        <span
          aria-hidden
          style={{
            display: "grid",
            placeItems: "center",
            width: 28,
            height: 28,
            borderRadius: 10,
            background: "var(--surface-violet-icon)",
            color: "var(--primary)",
            flexShrink: 0,
          }}
        >
          <ShieldCheck size={14} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 14, fontWeight: 500 }}>
            AI companion context
          </span>
          <span
            style={{
              display: "block",
              fontSize: 12,
              color: "var(--text-on-surface-strong)",
              marginTop: 2,
            }}
          >
            {enabledCount === 0
              ? "Sharing no context. Just your message."
              : `Sharing ${enabledCount} of ${AI_CONTEXT_KEYS.length} context sources.`}
          </span>
        </span>
        <ChevronDown
          size={16}
          color="var(--text-on-surface-strong)"
          style={{
            transition: "transform 0.2s ease",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {expanded && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            paddingLeft: 2,
          }}
        >
          {AI_CONTEXT_KEYS.map((key: AiContextKey) => {
            const { title, blurb } = CONTEXT_LABELS[key];
            return (
              <ToggleRow
                key={key}
                title={title}
                description={blurb}
                checked={toggles[key]}
                onChange={(v) => setToggle(key, v)}
              />
            );
          })}
          <p
            style={{
              fontSize: 11,
              color: "var(--text-on-surface-muted)",
              lineHeight: 1.5,
              marginTop: 4,
              marginBottom: 0,
            }}
          >
            Default is off. Your Supabase session token is always used to authorize the
            request, even in Mask Mode. The chat server URL is configured at build time.
          </p>
        </div>
      )}
    </div>
  );
};

export default AiConsentSettings;
