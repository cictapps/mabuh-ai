import React from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";

import { Button } from "../components/ui/button";
import { useAuth } from "../lib/auth";
import { ChatbotShell } from "./ChatBot";

type SupportView = "hub" | "chat";

interface SupportHubProps {
  view: SupportView;
  onOpenChat: () => void;
  onCloseChat: () => void;
}

export const SupportHub: React.FC<SupportHubProps> = ({ view, onOpenChat, onCloseChat }) => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();

  return (
    <div
      className="screen-enter"
      style={
        view === "chat"
          ? {
              display: "flex",
              flexDirection: "column",
              flex: 1,
              width: "100%",
              minHeight: 0,
            }
          : {
              display: "flex",
              flexDirection: "column",
              minHeight: "100%",
              padding: "calc(env(safe-area-inset-top, 0px) + 26px) 22px 52px",
              gap: 18,
            }
      }
    >
      {view !== "chat" && (
        <div>
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
        </div>
      )}

      {view === "hub" ? (
        <>
          <div
            style={{
              padding: 18,
              borderRadius: 20,
              background: "linear-gradient(180deg, rgba(109,186,132,0.12), rgba(188,194,255,0.04))",
              border: "1px solid rgba(188,194,255,0.08)",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 11,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  color: "rgba(188,194,255,0.45)",
                  marginBottom: 8,
                }}
              >
                Quick actions
              </p>
              <h3 className="font-serif" style={{ fontSize: 21, fontWeight: 500, color: "#f5f1ff" }}>
                Choose the right kind of help
              </h3>
            </div>

            <button
              type="button"
              onClick={() => navigate("/help")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                width: "100%",
                padding: "14px 16px",
                borderRadius: 16,
                border: "1px solid rgba(188,194,255,0.12)",
                background: "rgba(255,255,255,0.04)",
                color: "#f5f1ff",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Find help nearby</div>
                <div style={{ fontSize: 12, color: "rgba(188,194,255,0.42)" }}>
                  Browse verified support, hotlines, and nearby resources.
                </div>
              </div>
              <span style={{ fontSize: 18, color: "#bcc2ff" }}>→</span>
            </button>

            <button
              type="button"
              onClick={onOpenChat}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                width: "100%",
                padding: "14px 16px",
                borderRadius: 16,
                border: "1px solid rgba(255,185,84,0.14)",
                background: "rgba(255,185,84,0.08)",
                color: "#f5f1ff",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Open companion chat</div>
                <div style={{ fontSize: 12, color: "rgba(255,241,214,0.72)" }}>
                  Talk to MabuhAi for private, conversational support.
                </div>
              </div>
              <MessageCircle size={18} color="#ffcf86" />
            </button>
          </div>

          <div
            style={{
              padding: "14px 16px",
              borderRadius: 16,
              background: "rgba(188,194,255,0.04)",
              border: "1px solid rgba(188,194,255,0.08)",
              color: "rgba(188,194,255,0.42)",
              fontSize: 12,
              lineHeight: 1.6,
            }}
          >
            If you are in immediate danger, contact local emergency services right away.
          </div>

          <div style={{ marginTop: 4, display: "flex", justifyContent: "center" }}>
            <Button type="button" variant="outline" size="sm" onClick={onOpenChat}>
              Open chat
            </Button>
          </div>

          <div
            style={{
              marginTop: "auto",
              paddingTop: 24,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 12,
                background: "linear-gradient(135deg, rgba(255,185,84,0.22), rgba(188,194,255,0.14))",
                display: "grid",
                placeItems: "center",
                color: "#f5e5b1",
                fontSize: 14,
                flexShrink: 0,
              }}
              aria-hidden
            >
              ✶
            </div>
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  fontSize: 11,
                  letterSpacing: "1.2px",
                  textTransform: "uppercase",
                  color: "rgba(188,194,255,0.32)",
                  marginBottom: 2,
                }}
              >
                Signed in as
              </p>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#e8eaf0",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {profile?.display_name ?? user?.email ?? "friend"}
              </p>
            </div>
          </div>
        </>
      ) : (
        <ChatbotShell embedded onBack={onCloseChat} />
      )}
    </div>
  );
};
