import React from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, MapPin, Phone, ShieldAlert, ArrowUpRight } from "lucide-react";

import { ChatbotShell } from "./ChatBot";

type SupportView = "hub" | "chat";

interface SupportHubProps {
  view: SupportView;
  onOpenChat: () => void;
  onCloseChat: () => void;
}

interface Hotline {
  label: string;
  detail: string;
  number: string;
}

const HOTLINES: Hotline[] = [
  { label: "NCMH Crisis Hotline", detail: "Toll-free, 24/7", number: "1553" },
  { label: "DOH Hopeline", detail: "Globe · 24/7", number: "09175584673" },
  { label: "Hopeline (Landline)", detail: "Globe · 24/7", number: "8044673" },
];

function telHref(number: string): string {
  return `tel:${number.replace(/[^+\d]/g, "")}`;
}

export const SupportHub: React.FC<SupportHubProps> = ({ view, onOpenChat, onCloseChat }) => {
  const navigate = useNavigate();

  if (view === "chat") {
    return (
      <div
        className="screen-enter"
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          width: "100%",
          minHeight: 0,
        }}
      >
        <ChatbotShell embedded onBack={onCloseChat} />
      </div>
    );
  }

  return (
    <div
      className="screen-enter"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        padding: "calc(env(safe-area-inset-top, 0px) + 26px) 22px 52px",
        gap: 18,
      }}
    >
      <header>
        <p
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "1.3px",
            textTransform: "uppercase",
            color: "rgba(188,194,255,0.32)",
            marginBottom: 10,
          }}
        >
          Get support
        </p>
        <h2
          className="font-serif"
          style={{ fontSize: 26, fontWeight: 400, color: "#e8eaf0", marginBottom: 4 }}
        >
          Support
        </h2>
        <p style={{ fontSize: 13, color: "rgba(188,194,255,0.36)" }}>
          Find help resources or open the companion chat without leaving the app
        </p>
      </header>

      {/* Crisis safety card — high visibility, top of the action area. */}
      <section
        aria-label="Crisis safety"
        style={{
          padding: 16,
          borderRadius: 20,
          background:
            "linear-gradient(160deg, rgba(255,123,123,0.10), rgba(255,185,84,0.06))",
          border: "1px solid rgba(255,123,123,0.22)",
          boxShadow: "0 18px 40px -28px rgba(255,123,123,0.45)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span
            style={{
              display: "grid",
              placeItems: "center",
              width: 30,
              height: 30,
              borderRadius: 10,
              background: "rgba(255,123,123,0.18)",
              color: "rgba(255,170,170,0.95)",
            }}
            aria-hidden
          >
            <ShieldAlert size={16} />
          </span>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "rgba(255,210,210,0.98)",
                lineHeight: 1.2,
              }}
            >
              In immediate danger?
            </p>
            <p
              style={{
                fontSize: 12,
                color: "rgba(255,200,200,0.7)",
                lineHeight: 1.45,
                marginTop: 2,
              }}
            >
              Contact local emergency services right away.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {HOTLINES.map((h) => (
            <a
              key={h.number}
              href={telHref(h.number)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "#f5e5e5",
                textDecoration: "none",
                fontSize: 13,
              }}
            >
              <Phone size={14} color="rgba(255,170,170,0.85)" />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontWeight: 600, color: "#f7e4e4" }}>
                  {h.label}
                </span>
                <span
                  style={{
                    display: "block",
                    fontSize: 11,
                    color: "rgba(255,200,200,0.55)",
                  }}
                >
                  {h.detail}
                </span>
              </span>
              <span
                style={{
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                  fontVariantNumeric: "tabular-nums",
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: "0.4px",
                  color: "rgba(255,210,210,0.98)",
                }}
              >
                {h.number}
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* Quick actions card */}
      <section
        aria-label="Quick actions"
        style={{
          padding: 18,
          borderRadius: 20,
          background:
            "linear-gradient(180deg, rgba(109,186,132,0.10), rgba(188,194,255,0.04))",
          border: "1px solid rgba(188,194,255,0.08)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div>
          <p
            style={{
              fontSize: 11,
              letterSpacing: "1px",
              textTransform: "uppercase",
              color: "rgba(188,194,255,0.45)",
              marginBottom: 6,
            }}
          >
            Quick actions
          </p>
          <h3
            className="font-serif"
            style={{ fontSize: 19, fontWeight: 500, color: "#f5f1ff", lineHeight: 1.3 }}
          >
            Choose the right kind of help
          </h3>
        </div>

        <button
          type="button"
          onClick={() => navigate("/help")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            width: "100%",
            padding: "14px 16px",
            borderRadius: 16,
            border: "1px solid rgba(188,194,255,0.12)",
            background: "rgba(255,255,255,0.04)",
            color: "#f5f1ff",
            cursor: "pointer",
            textAlign: "left",
            transition: "background 0.2s ease, border-color 0.2s ease, transform 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(188,194,255,0.07)";
            e.currentTarget.style.borderColor = "rgba(188,194,255,0.22)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
            e.currentTarget.style.borderColor = "rgba(188,194,255,0.12)";
          }}
        >
          <span
            style={{
              display: "grid",
              placeItems: "center",
              width: 36,
              height: 36,
              borderRadius: 12,
              background: "rgba(188,194,255,0.12)",
              color: "#bcc2ff",
              flexShrink: 0,
            }}
            aria-hidden
          >
            <MapPin size={18} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
              Find help nearby
            </span>
            <span
              style={{
                display: "block",
                fontSize: 12,
                color: "rgba(188,194,255,0.5)",
                lineHeight: 1.5,
              }}
            >
              Verified clinics, hotlines, and nearby resources.
            </span>
          </span>
          <ArrowUpRight size={16} color="rgba(188,194,255,0.5)" />
        </button>

        <button
          type="button"
          onClick={onOpenChat}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            width: "100%",
            padding: "14px 16px",
            borderRadius: 16,
            border: "1px solid rgba(255,185,84,0.20)",
            background: "rgba(255,185,84,0.10)",
            color: "#f5f1ff",
            cursor: "pointer",
            textAlign: "left",
            transition: "background 0.2s ease, border-color 0.2s ease, transform 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,185,84,0.16)";
            e.currentTarget.style.borderColor = "rgba(255,185,84,0.32)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,185,84,0.10)";
            e.currentTarget.style.borderColor = "rgba(255,185,84,0.20)";
          }}
        >
          <span
            style={{
              display: "grid",
              placeItems: "center",
              width: 36,
              height: 36,
              borderRadius: 12,
              background: "rgba(255,185,84,0.18)",
              color: "#ffcf86",
              flexShrink: 0,
            }}
            aria-hidden
          >
            <MessageCircle size={18} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
              Open companion chat
            </span>
            <span
              style={{
                display: "block",
                fontSize: 12,
                color: "rgba(255,241,214,0.75)",
                lineHeight: 1.5,
              }}
            >
              Talk to MabuhAi for private, conversational support.
            </span>
          </span>
          <ArrowUpRight size={16} color="rgba(255,207,134,0.7)" />
        </button>
      </section>
    </div>
  );
};
