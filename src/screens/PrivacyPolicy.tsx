import React, { useState, useEffect, useRef } from "react";
import {
  Shield,
  Database,
  Cpu,
  Lock,
  Trash2,
  ShieldCheck,
  Heart,
  UserCheck,
  FileText,
  X,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

interface PrivacyPolicyProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
  required?: boolean;
}

const CURRENT_VERSION = "2.3.0";

const SUMMARY_ITEMS = [
  "Chats authenticated with your Supabase session",
  "AI context is opt-in (defaults to off)",
  "AI runs on Mistral free tier",
  "Not a replacement for therapy",
];

const SECTIONS = [
  {
    icon: Database,
    title: "Information we collect",
    content: [
      "A Supabase-issued access token is sent with each chat request so the server can authorize the call. Tokens are never logged by the client.",
      "By default, the message you type is the only context forwarded to the AI server. Other context (display name, recent moods, recent journals, social stats, journey stats, analytics) is opt-in and disabled until you turn it on in Settings → AI companion context.",
      "Mask Mode hides the structured context above, but the request is still authorized with your Supabase session token. There is no anonymous tier that does not authenticate the user.",
      "Normal chat messages and replies are saved locally on this device under your signed-in account so the conversation can be restored. They are not synced to Supabase.",
      "Mask on conversations are temporary and are not saved locally. Crisis-related keywords are detected on the device before any network call and surface local crisis resources immediately.",
    ],
  },
  {
    icon: Cpu,
    title: "AI model: Mistral Small (free tier)",
    content: [
      "Model: mistral-small-latest (Mistral AI).",
      "Mabuh-ai uses the free tier of Mistral AI. As part of their free-tier terms, the prompts and messages you send may be used by Mistral to improve and train their models.",
      "Please do not share anything you would not be comfortable being seen by an AI provider. Avoid personal names, school names, addresses, phone numbers, or anything sensitive.",
      "Encryption: TLS 1.3 in transit.",
      "Servers: Mistral infrastructure (EU region, GDPR compliant).",
    ],
  },
  {
    icon: Lock,
    title: "How we use your data",
    content: [
      "To provide emotional support and maintain session context.",
      "Client-side crisis detection to surface local help resources.",
      "No model-performance telemetry is sent from the device.",
    ],
  },
  {
    icon: Trash2,
    title: "Data storage & deletion",
    content: [
      "Mabuh-ai is an emotional-support companion, not a clinical record. Normal chat history is stored only on this device, scoped to your signed-in account, and limited to the latest 100 completed messages.",
      "Saved transcripts are used only to restore the screen. They are not cloud-synced or sent back to the AI as conversation history. Mask on conversations are never saved.",
      "On Android, check-ins and journals are saved first in app-private SQLite storage. When internet is available, queued changes sync to your Supabase account for backup and multi-device access.",
      "Signing out removes locally cached wellness data from that device. Account and cloud-data deletion require an internet connection so the server copy can be removed.",
      "You can remove the local transcript through Settings → Your data. Deleting all data or deleting your account also removes it from this device.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Safety measures & guardrails",
    content: [
      "Client-side crisis keyword detection (see lib/crisis.ts) — runs before the AI request and shows local resources when triggered.",
      "Rate limiting: 2 requests per second on the chat server.",
      "No medical advice — companion only, not a therapist.",
    ],
  },
  {
    icon: Heart,
    title: "Crisis intervention",
    content: [
      "Suicide or self-harm keywords trigger an immediate in-app resources panel pointing at NCMH (1553), DOH Hopeline, and the national emergency line (911).",
      "The current implementation does not contact emergency services automatically. Please call the numbers above or your local equivalent if you are in immediate danger.",
    ],
  },
  {
    icon: UserCheck,
    title: "Your rights",
    content: [
      "Access: view the data we hold for you in Settings → Your data → Export my data.",
      "Deletion: Settings → Sign out → Delete account removes your profile, check-ins, and journals from Supabase. This action requires internet access.",
      "Opt-out: you can use the rest of the app without ever opening the AI companion. You can also reset all AI context toggles in Settings.",
      "Export: download your check-ins, journals, and preferences as JSON.",
    ],
  },
  {
    icon: FileText,
    title: "Legal compliance",
    content: [
      "GDPR compliant for EU users.",
      "CCPA compliant for California residents.",
      "No data sold to third parties.",
      "Children under 13 require parental consent.",
    ],
  },
];

const pillBase: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  padding: "2px 10px",
  borderRadius: 999,
};

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({
  isOpen,
  onClose,
  onAccept,
  onDecline,
  required = false,
}) => {
  const [checked, setChecked] = useState(false);
  const [aiConsent, setAiConsent] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const [accepted, setAccepted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (!required) return;
    const stored = localStorage.getItem("privacy_policy_accepted");
    const storedVersion = localStorage.getItem("privacy_policy_version");
    const storedDate = localStorage.getItem("privacy_policy_date");

    if (stored === "true" && storedVersion === CURRENT_VERSION && storedDate) {
      const days = Math.floor((Date.now() - new Date(storedDate).getTime()) / 86_400_000);
      if (days < 90) {
        onAccept?.();
        onClose();
      }
    }
  }, [isOpen, required]);

  useEffect(() => {
    if (isOpen) {
      setChecked(false);
      setAiConsent(false);
      setScrolledToBottom(false);
      setExpandedSection(null);
      setAccepted(false);
    }
  }, [isOpen]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (!scrolledToBottom && el.scrollHeight - el.scrollTop - el.clientHeight < 20) {
      setScrolledToBottom(true);
    }
  };

  const handleAccept = () => {
    localStorage.setItem("privacy_policy_accepted", "true");
    localStorage.setItem("privacy_policy_version", CURRENT_VERSION);
    localStorage.setItem("privacy_policy_date", new Date().toISOString());
    setAccepted(true);
    onAccept?.();
    setTimeout(onClose, 600);
  };

  const handleDecline = () => {
    if (onDecline) {
      onDecline();
    } else {
      onClose();
    }
  };

  const canAccept = checked && aiConsent && scrolledToBottom;

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "rgba(15, 14, 24, 0.55)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
      onClick={() => !required && scrolledToBottom && onClose()}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: 576,
          maxHeight: "88dvh",
          background: "var(--card)",
          color: "var(--text-on-surface)",
          borderRadius: 20,
          boxShadow: "var(--shadow-card)",
          overflow: "hidden",
          border: "1px solid var(--find-help-border-soft)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            flexShrink: 0,
            padding: "24px 28px 20px",
            borderBottom: "1px solid var(--find-help-border-soft)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Shield
                size={18}
                color="var(--text-on-surface-soft)"
                style={{ marginTop: 2 }}
              />
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 500,
                  color: "var(--text-on-surface-strong)",
                }}
              >
                Privacy &amp; safety policy
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className={required ? "invisible pointer-events-none" : ""}
              style={{
                padding: 4,
                borderRadius: 6,
                border: "none",
                background: "transparent",
                color: "var(--text-on-surface-soft)",
                cursor: required ? "default" : "pointer",
                transition: "color 0.15s ease, background 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (required) return;
                e.currentTarget.style.color = "var(--text-on-surface)";
                e.currentTarget.style.background = "var(--surface-violet-low)";
              }}
              onMouseLeave={(e) => {
                if (required) return;
                e.currentTarget.style.color = "var(--text-on-surface-soft)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <X size={16} />
            </button>
          </div>

          <p
            style={{
              margin: "6px 0 0",
              paddingLeft: 30,
              fontSize: 12,
              color: "var(--text-kicker)",
            }}
          >
            Last updated June 2026 · Version {CURRENT_VERSION}
          </p>

          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 12,
              paddingLeft: 30,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                ...pillBase,
                background: "var(--success-soft)",
                color: "var(--text-success-strong)",
                border: "1px solid rgba(53, 108, 72, 0.25)",
              }}
            >
              GDPR compliant
            </span>
            <span
              style={{
                ...pillBase,
                background: "var(--surface-violet-medium)",
                color: "var(--primary)",
                border: "1px solid var(--border-violet-medium)",
              }}
            >
              EU servers
            </span>
            <span
              style={{
                ...pillBase,
                background: "var(--surface-violet-low)",
                color: "var(--text-on-surface-strong)",
                border: "1px solid var(--border-violet-soft)",
              }}
            >
              Mistral AI · Free tier
            </span>
          </div>
        </div>

        {/* Scrollable body */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 28px",
            color: "var(--text-on-surface)",
          }}
        >
          {/* Summary grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              padding: 16,
              borderRadius: 14,
              background: "var(--surface-violet-low)",
              border: "1px solid var(--border-violet-soft)",
            }}
          >
            {SUMMARY_ITEMS.map((item) => (
              <div
                key={item}
                style={{ display: "flex", alignItems: "flex-start", gap: 8 }}
              >
                <CheckCircle2
                  size={14}
                  color="var(--icon-success)"
                  style={{ marginTop: 2, flexShrink: 0 }}
                />
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text-on-surface-strong)",
                    lineHeight: 1.5,
                  }}
                >
                  {item}
                </span>
              </div>
            ))}
          </div>

          {/* AI free-tier disclosure callout */}
          <div
            style={{
              marginTop: 20,
              borderRadius: 14,
              padding: 16,
              background: "var(--surface-warm-low)",
              border: "1px solid var(--border-warm)",
            }}
          >
            <h4
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text-on-warm-strong)",
                margin: "0 0 6px",
              }}
            >
              About the AI behind Mabuh-ai
            </h4>
            <p
              style={{
                fontSize: 12,
                color: "var(--text-on-surface-strong)",
                lineHeight: 1.55,
                margin: 0,
              }}
            >
              Mabuh-ai runs on the free tier of Mistral AI. Because of how the free tier
              works, the messages you send here may be used by Mistral to train and
              improve their models. Please keep this in mind — share only what feels safe
              to share, and avoid personal details like your full name, school, address,
              or contact info.
            </p>
            <p
              style={{
                fontSize: 11,
                color: "var(--text-on-warm)",
                marginTop: 8,
                lineHeight: 1.55,
              }}
            >
              This feature is optional. If you prefer not to use the AI companion, you can
              close this dialog and continue using the rest of Mabuh-ai — check-ins,
              journal, and support resources will still be available to you.
            </p>
          </div>

          {/* Accordion sections */}
          <div
            style={{ marginTop: 20, borderTop: "1px solid var(--border-violet-soft)" }}
          >
            {SECTIONS.map((section, idx) => {
              const Icon = section.icon;
              const isOpen = expandedSection === idx;
              return (
                <div
                  key={idx}
                  style={{ borderBottom: "1px solid var(--border-violet-soft)" }}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedSection(isOpen ? null : idx)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 0",
                      textAlign: "left",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "inherit",
                      fontFamily: "inherit",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <Icon
                        size={15}
                        color="var(--text-on-surface-soft)"
                        style={{ flexShrink: 0 }}
                      />
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: "var(--text-on-surface-strong)",
                        }}
                      >
                        {section.title}
                      </span>
                    </div>
                    <ChevronRight
                      size={15}
                      color="var(--text-kicker)"
                      style={{
                        flexShrink: 0,
                        transition: "transform 0.2s ease",
                        transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                      }}
                    />
                  </button>

                  {isOpen && (
                    <div
                      style={{
                        paddingBottom: 16,
                        paddingLeft: 27,
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      {section.content.map((line, i) => (
                        <p
                          key={i}
                          style={{
                            fontSize: 13,
                            color: "var(--text-on-surface-muted)",
                            lineHeight: 1.55,
                            margin: 0,
                          }}
                        >
                          {line}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div
            style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 14,
              background: "var(--surface-violet-low)",
              border: "1px solid var(--border-violet-soft)",
            }}
          >
            <h3
              style={{
                fontWeight: 600,
                color: "var(--text-on-surface-strong)",
                margin: "0 0 8px",
                fontSize: 13,
              }}
            >
              🇵🇭 Questions or Concerns?
            </h3>
            <p
              style={{
                fontSize: 12,
                color: "var(--text-on-surface-muted)",
                margin: "0 0 8px",
                lineHeight: 1.55,
              }}
            >
              For privacy inquiries, data deletion requests, or safety concerns:
            </p>
            <div
              style={{
                fontSize: 12,
                display: "flex",
                flexDirection: "column",
                gap: 4,
                color: "var(--text-on-surface-strong)",
              }}
            >
              <p style={{ margin: 0 }}>📧 Email: cictapps@wvsu.edu.ph</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            flexShrink: 0,
            padding: "16px 28px 18px",
            background: "var(--card)",
            borderTop: "1px solid var(--find-help-border-soft)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              <input
                type="checkbox"
                checked={aiConsent}
                onChange={(e) => setAiConsent(e.target.checked)}
                style={{
                  marginTop: 2,
                  accentColor: "var(--success)",
                  cursor: "pointer",
                }}
              />
              <span
                style={{
                  fontSize: 12,
                  color: "var(--text-on-surface-strong)",
                  lineHeight: 1.55,
                }}
              >
                I understand the AI companion runs on Mistral AI's free tier, and that my
                messages may be used to train their models. I will avoid sharing personal
                or sensitive details.
              </span>
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                style={{ accentColor: "var(--success)", cursor: "pointer" }}
              />
              <span style={{ fontSize: 12, color: "var(--text-on-surface-strong)" }}>
                I have read and agree to the rest of this policy
              </span>
            </label>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span
              style={{
                fontSize: 11,
                color: "var(--text-kicker)",
                textAlign: "center",
              }}
            >
              The AI companion is optional — you can skip it.
            </span>
            <div
              style={{
                display: "flex",
                flexDirection: "column-reverse",
                gap: 8,
              }}
            >
              {required ? (
                <button
                  type="button"
                  onClick={handleDecline}
                  disabled={accepted}
                  style={{
                    width: "100%",
                    flexShrink: 0,
                    borderRadius: 10,
                    padding: "10px 14px",
                    fontSize: 12,
                    fontFamily: "inherit",
                    color: "var(--text-on-surface-strong)",
                    background: "transparent",
                    border: "1px solid var(--border-violet-soft)",
                    cursor: accepted ? "not-allowed" : "pointer",
                    opacity: accepted ? 0.5 : 1,
                    transition: "background 0.15s ease, color 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (accepted) return;
                    e.currentTarget.style.background = "var(--surface-violet-low)";
                  }}
                  onMouseLeave={(e) => {
                    if (accepted) return;
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  Not now
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleAccept}
                disabled={!canAccept}
                style={{
                  width: "100%",
                  flexShrink: 0,
                  borderRadius: 10,
                  padding: "10px 20px",
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "inherit",
                  border: "none",
                  cursor: canAccept ? "pointer" : "not-allowed",
                  background: accepted
                    ? "var(--success)"
                    : canAccept
                      ? "var(--primary)"
                      : "var(--surface-violet-low)",
                  color: accepted
                    ? "var(--success-foreground)"
                    : canAccept
                      ? "var(--primary-foreground)"
                      : "var(--text-kicker)",
                  transition: "background 0.2s ease, color 0.2s ease, opacity 0.2s ease",
                  opacity: accepted ? 1 : canAccept ? 1 : 0.85,
                }}
              >
                {accepted ? "✓ Accepted" : "I understand & continue"}
              </button>
            </div>
          </div>
        </div>

        {!scrolledToBottom && (
          <div
            style={{
              flexShrink: 0,
              padding: "8px 0 12px",
              textAlign: "center",
              background: "var(--card)",
              borderTop: "1px solid var(--find-help-border-soft)",
            }}
          >
            <p style={{ margin: 0, fontSize: 12, color: "var(--text-kicker)" }}>
              Scroll to the bottom to enable acceptance
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
