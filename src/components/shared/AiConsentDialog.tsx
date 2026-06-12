import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { ShieldCheck, AlertCircle, X } from "lucide-react";
import {
  AI_CONTEXT_KEYS,
  CONTEXT_LABELS,
  DEFAULT_AI_TOGGLES,
  hasAnyConsentEnabled,
  useAiConsentStore,
  type AiContextKey,
  type AiContextToggles,
} from "@/lib/aiConsent";

interface AiConsentDialogProps {
  open: boolean;
  onClose: (decision: "accept" | "cancel") => void;
  canClose?: boolean;
}

function buildSummary(toggles: AiContextToggles): string {
  const enabled = AI_CONTEXT_KEYS.filter((k) => toggles[k]);
  if (enabled.length === 0) {
    return "By default, MabuhAi sends only the message you typed and a minimal context flag. No history, name, mood, or journal entries are forwarded.";
  }
  return (
    "With your current choices, each message will include: " +
    enabled.map((k) => CONTEXT_LABELS[k].title.toLowerCase()).join(", ") +
    ". You can change these in Settings at any time."
  );
}

export const AiConsentDialog: React.FC<AiConsentDialogProps> = ({
  open,
  onClose,
  canClose = true,
}) => {
  const toggles = useAiConsentStore((s) => s.toggles);
  const acknowledgeConsent = useAiConsentStore((s) => s.acknowledgeConsent);
  const [draft, setDraft] = useState<AiContextToggles>({ ...toggles });

  useEffect(() => {
    if (open) setDraft({ ...toggles });
  }, [open, toggles]);

  const handleToggle = useCallback((key: AiContextKey, value: boolean) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleAccept = useCallback(() => {
    useAiConsentStore.setState({ toggles: { ...draft } });
    acknowledgeConsent();
    onClose("accept");
  }, [draft, acknowledgeConsent, onClose]);

  const handleCancel = useCallback(() => {
    if (!canClose) return;
    onClose("cancel");
  }, [canClose, onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && canClose) handleCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, canClose, handleCancel]);

  if (!open || typeof document === "undefined") return null;

  const hasAny = hasAnyConsentEnabled(draft);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-consent-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && canClose) handleCancel();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10001,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "rgba(8,10,18,0.78)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          maxHeight: "90dvh",
          overflowY: "auto",
          padding: "22px 22px 20px",
          borderRadius: 28,
          background: "rgba(27,30,39,0.98)",
          border: "1px solid rgba(188,194,255,0.10)",
          boxShadow: "0 32px 80px -24px rgba(0,0,0,0.7)",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              aria-hidden
              style={{
                display: "grid",
                placeItems: "center",
                width: 36,
                height: 36,
                borderRadius: 12,
                background: "rgba(188,194,255,0.16)",
                color: "#bcc2ff",
              }}
            >
              <ShieldCheck size={18} />
            </span>
            <div>
              <h2
                id="ai-consent-title"
                className="font-serif"
                style={{
                  fontSize: 20,
                  fontWeight: 500,
                  color: "#eef1f6",
                  margin: 0,
                  letterSpacing: "-0.02em",
                }}
              >
                What the AI companion sees
              </h2>
              <p
                style={{
                  fontSize: 12,
                  color: "rgba(216,212,235,0.55)",
                  margin: 0,
                }}
              >
                Pick what context to share. Defaults are off.
              </p>
            </div>
          </div>
          {canClose && (
            <button
              type="button"
              onClick={handleCancel}
              aria-label="Close"
              style={{
                background: "transparent",
                border: "none",
                color: "rgba(216,212,235,0.55)",
                cursor: "pointer",
                padding: 4,
                borderRadius: 8,
              }}
            >
              <X size={16} />
            </button>
          )}
        </header>

        <div
          style={{
            padding: "12px 14px",
            borderRadius: 16,
            background: "rgba(255,185,84,0.08)",
            border: "1px solid rgba(255,185,84,0.18)",
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          <AlertCircle
            size={16}
            color="#ffd99a"
            style={{ marginTop: 2, flexShrink: 0 }}
            aria-hidden
          />
          <p
            style={{
              fontSize: 12,
              lineHeight: 1.55,
              color: "rgba(255,217,154,0.95)",
              margin: 0,
            }}
          >
            The AI runs on Mistral AI&apos;s free tier. Messages you send may be used to
            improve their models. Avoid sharing personal details like your full name,
            school, address, or phone number.
          </p>
        </div>

        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {AI_CONTEXT_KEYS.map((key) => {
            const { title, blurb } = CONTEXT_LABELS[key];
            const checked = draft[key];
            return (
              <li key={key}>
                <button
                  type="button"
                  role="switch"
                  aria-checked={checked}
                  onClick={() => handleToggle(key, !checked)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    background: checked
                      ? "rgba(188,194,255,0.10)"
                      : "rgba(188,194,255,0.04)",
                    border: checked
                      ? "1px solid rgba(188,194,255,0.22)"
                      : "1px solid rgba(188,194,255,0.08)",
                    borderRadius: 16,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.2s ease, border-color 0.2s ease",
                    color: "#eef1f6",
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      position: "relative",
                      width: 38,
                      height: 22,
                      borderRadius: 999,
                      background: checked
                        ? "rgba(188,194,255,0.55)"
                        : "rgba(216,212,235,0.18)",
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
                        background: checked ? "#121416" : "#eef1f6",
                        transition: "left 0.2s ease",
                      }}
                    />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        display: "block",
                        fontSize: 14,
                        fontWeight: 500,
                        color: "#eef1f6",
                      }}
                    >
                      {title}
                    </span>
                    <span
                      style={{
                        display: "block",
                        fontSize: 12,
                        color: "rgba(216,212,235,0.6)",
                        marginTop: 2,
                        lineHeight: 1.45,
                      }}
                    >
                      {blurb}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <p
          style={{
            fontSize: 12,
            color: "rgba(216,212,235,0.6)",
            lineHeight: 1.55,
            margin: 0,
          }}
        >
          {buildSummary(draft)}
        </p>

        <p
          style={{
            fontSize: 11,
            color: "rgba(216,212,235,0.5)",
            lineHeight: 1.55,
            margin: 0,
          }}
        >
          Mask mode only hides the structured context above — your Supabase session token
          is still used to authorize the request. The server URL is configured at build
          time and visible in the developer diagnostics panel.
        </p>

        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            marginTop: 4,
          }}
        >
          {canClose && (
            <button
              type="button"
              onClick={handleCancel}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                background: "rgba(188,194,255,0.06)",
                border: "1px solid rgba(188,194,255,0.12)",
                color: "#eef1f6",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleAccept}
            style={{
              padding: "10px 16px",
              borderRadius: 12,
              background: "linear-gradient(135deg, #bcc2ff, #d4bbff)",
              border: "none",
              color: "#121416",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              opacity: hasAny ? 1 : 0.85,
            }}
          >
            {hasAny ? "Save & continue" : "Send without context"}
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            setDraft({ ...DEFAULT_AI_TOGGLES });
          }}
          style={{
            alignSelf: "flex-start",
            background: "transparent",
            border: "none",
            color: "rgba(216,212,235,0.55)",
            fontSize: 12,
            cursor: "pointer",
            padding: 0,
            textDecoration: "underline",
          }}
        >
          Reset to defaults (all off)
        </button>
      </div>
    </div>,
    document.body,
  );
};

export default AiConsentDialog;
