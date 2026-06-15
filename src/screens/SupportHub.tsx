import React, { lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, MapPin, Phone, ShieldAlert, ArrowUpRight } from "lucide-react";

import { loadHotlines, summarizeDirectory, type HotlineRecord } from "../data/providers";

const ChatbotShell = lazy(async () => {
  const mod = await import("./ChatBot");
  return { default: mod.ChatbotShell };
});

function ChatFallback() {
  return (
    <div
      className="flex flex-1 w-full items-center justify-center py-10 text-xs text-muted-foreground"
      aria-live="polite"
    >
      Loading chat…
    </div>
  );
}

type SupportView = "hub" | "chat";

interface SupportHubProps {
  view: SupportView;
  onOpenChat: () => void;
  onCloseChat: () => void;
}

interface HotlineView {
  key: string;
  label: string;
  detail: string;
  number: string;
  tel: string;
  unverified: boolean;
}

function viewFor(h: HotlineRecord): HotlineView {
  const number = h.phone ?? "";
  const detail = h.hours?.display
    ? h.hours.isConfirmed
      ? h.coverage
        ? `${h.coverage} · ${h.hours.display}`
        : h.hours.display
      : `Hours: ${h.hours.display} (unverified)`
    : (h.coverage ?? "Philippines");
  return {
    key: h.id,
    label: h.name,
    detail,
    number,
    tel: number ? `tel:${number.replace(/[^+\d]/g, "")}` : "#",
    unverified: h.verification.lastVerifiedAt == null,
  };
}

const HOTLINES: HotlineView[] = loadHotlines().map(viewFor);

const directorySummary = summarizeDirectory();
const PRIMARY_REGIONS = directorySummary.regions.filter((r) => r !== "National");

export const SupportHub: React.FC<SupportHubProps> = ({
  view,
  onOpenChat,
  onCloseChat,
}) => {
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
        <Suspense fallback={<ChatFallback />}>
          <ChatbotShell embedded onBack={onCloseChat} />
        </Suspense>
      </div>
    );
  }

  return (
    <div
      className="screen-enter relative flex w-full flex-col gap-4 px-4 pb-12 pt-5"
      style={{
        paddingTop: "var(--app-screen-top)",
        minHeight: "100%",
      }}
    >
      {/* Decorative background blobs (matches journey aesthetic) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,185,84,0.10),transparent_60%)] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 top-40 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(188,194,255,0.10),transparent_60%)] blur-3xl"
      />

      {/* Header card */}
      <div
        className="relative overflow-hidden rounded-[1.75rem] border border-[rgba(188,194,255,0.10)] bg-card p-5 shadow-[0_28px_80px_-40px_rgba(8,10,18,0.85)] backdrop-blur-xl"
        style={{
          paddingRight: 72,
          clipPath: `path('M 28 0 H calc(100% - 72px) A 52 52 0 0 1 calc(100% - 0px) 48 V calc(100% - 28px) A 28 28 0 0 1 calc(100% - 56px) calc(100% - 0px) H 28 A 28 28 0 0 1 0 calc(100% - 56px) V 28 A 28 28 0 0 1 28 0 Z')`,
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,185,84,0.16),transparent_60%)] blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-12 h-44 w-44 rounded-full bg-[radial-gradient(circle_at_center,rgba(188,194,255,0.16),transparent_60%)] blur-2xl"
        />
        <div className="relative">
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#d8d4eb",
              marginBottom: 10,
            }}
          >
            Get support
          </p>
          <h2
            className="font-serif"
            style={{
              fontSize: 30,
              fontWeight: 500,
              lineHeight: 1.15,
              color: "#eef1f6",
              marginBottom: 4,
              letterSpacing: "-0.03em",
            }}
          >
            Support
          </h2>
          <p style={{ fontSize: 13, color: "rgba(216,212,235,0.7)", lineHeight: 1.55 }}>
            Find help resources or open the companion chat without leaving the app
          </p>
        </div>
      </div>

      <div
        role="note"
        aria-label="Local coverage notice"
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          padding: "12px 14px",
          borderRadius: 18,
          background: "rgba(255,185,84,0.08)",
          border: "1px solid rgba(255,185,84,0.18)",
          color: "rgba(255,225,184,0.95)",
        }}
      >
        <img
          src="/app-logo-light.svg"
          alt=""
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 object-contain"
        />
        <p
          style={{
            fontSize: 12,
            lineHeight: 1.55,
            margin: 0,
          }}
        >
          {PRIMARY_REGIONS.length > 0
            ? `Local listings currently focus on ${PRIMARY_REGIONS.join(" and ")}. National hotlines are also listed. Coverage and operating hours are still being verified — please confirm details with the provider before travelling.`
            : "Local listings are still being assembled. National hotlines are listed below. Please confirm details with the provider before travelling."}
        </p>
      </div>

      {/* Quick actions card — primary entry points come first. */}
      <section
        aria-label="Quick actions"
        className="relative overflow-hidden rounded-[1.75rem] border border-[rgba(188,194,255,0.10)] bg-card p-5 shadow-[0_28px_80px_-40px_rgba(8,10,18,0.85)] backdrop-blur-xl"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-16 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(109,186,132,0.16),transparent_60%)] blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 -left-10 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(188,194,255,0.14),transparent_60%)] blur-2xl"
        />
        <div className="relative flex flex-col gap-4">
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#d8d4eb",
                marginBottom: 6,
              }}
            >
              Quick actions
            </p>
            <h3
              className="font-serif"
              style={{
                fontSize: 20,
                fontWeight: 500,
                color: "#f5f1ff",
                lineHeight: 1.25,
              }}
            >
              Choose the right kind of help
            </h3>
          </div>

          <button
            type="button"
            onClick={() => navigate("/help")}
            className="flex items-center gap-3 rounded-2xl border border-[rgba(188,194,255,0.12)] bg-[rgba(188,194,255,0.04)] px-4 py-3 text-left transition-all duration-200 hover:border-[rgba(188,194,255,0.22)] hover:bg-[rgba(188,194,255,0.07)] active:scale-[0.98]"
            style={{ color: "#f5f1ff", cursor: "pointer" }}
          >
            <span
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-[rgba(188,194,255,0.16)] text-primary"
              aria-hidden
            >
              <MapPin size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-foreground">
                Find help nearby
              </span>
              <span className="mt-0.5 block text-[12px] leading-relaxed text-[#d8d4eb]">
                Verified clinics, hotlines, and nearby resources.
              </span>
            </span>
            <ArrowUpRight size={16} className="text-[#d8d4eb]" />
          </button>

          <button
            type="button"
            onClick={onOpenChat}
            className="flex items-center gap-3 rounded-2xl border border-[rgba(255,185,84,0.22)] bg-[rgba(255,185,84,0.10)] px-4 py-3 text-left transition-all duration-200 hover:border-[rgba(255,185,84,0.32)] hover:bg-[rgba(255,185,84,0.16)] active:scale-[0.98]"
            style={{ color: "#f5f1ff", cursor: "pointer" }}
          >
            <span
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-[rgba(255,185,84,0.18)] text-tertiary"
              aria-hidden
            >
              <MessageCircle size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-foreground">
                Open companion chat
              </span>
              <span className="mt-0.5 block text-[12px] leading-relaxed text-[#ffd99a]">
                Talk to Mabuh-ai for private, conversational support.
              </span>
            </span>
            <ArrowUpRight size={16} className="text-tertiary/80" />
          </button>
        </div>
      </section>

      {/* Crisis safety card — high visibility, comes after the primary actions. */}
      <section
        aria-label="Crisis safety"
        className="relative overflow-hidden rounded-[1.75rem] border border-[rgba(255,123,123,0.22)] p-5 backdrop-blur-xl"
        style={{
          background:
            "linear-gradient(160deg, rgba(255,123,123,0.10), rgba(255,185,84,0.06))",
          boxShadow: "0 28px 80px -40px rgba(255,123,123,0.45)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-16 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,123,123,0.20),transparent_60%)] blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 -left-10 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,185,84,0.16),transparent_60%)] blur-2xl"
        />
        <div className="relative flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-[rgba(255,123,123,0.18)]"
              style={{ color: "rgba(255,170,170,0.95)" }}
              aria-hidden
            >
              <ShieldAlert size={18} />
            </span>
            <div className="min-w-0">
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "rgba(255,210,210,0.98)",
                  lineHeight: 1.2,
                  margin: 0,
                }}
              >
                In immediate danger?
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "rgba(255,200,200,0.75)",
                  lineHeight: 1.45,
                  marginTop: 2,
                }}
              >
                Contact local emergency services right away.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {HOTLINES.map((h) => (
              <a
                key={h.key}
                href={h.tel}
                onClick={(e) => {
                  if (h.tel === "#") e.preventDefault();
                }}
                className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/5 px-3 py-2.5 text-[13px] transition-colors duration-200 hover:bg-white/10"
                style={{
                  borderColor: "rgba(255,255,255,0.08)",
                  color: "#f5e5e5",
                  textDecoration: "none",
                  opacity: h.unverified ? 0.85 : 1,
                }}
              >
                <Phone size={14} color="rgba(255,170,170,0.85)" />
                <span className="min-w-0 flex-1">
                  <span
                    className="block font-semibold"
                    style={{ color: "#f7e4e4", paddingRight: 8 }}
                  >
                    {h.label}
                  </span>
                  <span
                    className="mt-0.5 block text-[11px]"
                    style={{ color: "rgba(255,200,200,0.65)", paddingRight: 8 }}
                  >
                    {h.detail}
                  </span>
                </span>
                <span
                  className="flex shrink-0 flex-col items-end gap-1"
                  style={{ minWidth: "fit-content" }}
                >
                  <span
                    style={{
                      fontFamily: "Plus Jakarta Sans, sans-serif",
                      fontVariantNumeric: "tabular-nums",
                      fontSize: 14,
                      fontWeight: 700,
                      letterSpacing: "0.4px",
                      color: "rgba(255,210,210,0.98)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h.number}
                  </span>
                  {h.unverified && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 500,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "rgba(255,200,200,0.7)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      unverified
                    </span>
                  )}
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
