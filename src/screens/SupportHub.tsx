import React, { lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, MapPin, Phone, ShieldAlert, ArrowUpRight } from "lucide-react";

import { loadHotlines, summarizeDirectory, type HotlineRecord } from "../data/providers";
import { useThemePreference } from "../hooks/useThemePreference";
import { openExternal } from "../lib/openExternal";

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
  const { resolved: resolvedTheme } = useThemePreference();

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
      className="screen-enter relative flex w-full flex-col gap-5 px-4 pb-12 pt-5"
      style={{
        paddingTop: "var(--app-screen-top)",
        minHeight: "100%",
      }}
    >
      {/* Header */}
      <div className="relative" style={{ paddingRight: 0 }}>
        <div className="relative">
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--text-kicker)",
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
              color: "var(--text-on-surface)",
              marginBottom: 4,
              letterSpacing: "-0.03em",
            }}
          >
            Support
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "var(--text-on-surface-strong)",
              lineHeight: 1.55,
            }}
          >
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
          padding: 0,
          color: "var(--text-warn-soft)",
        }}
      >
        <img
          src={resolvedTheme === "light" ? "/app-logo-dark.svg" : "/app-logo-light.svg"}
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

      {/* Quick actions — primary entry points come first. */}
      <section aria-label="Quick actions" className="relative">
        <div className="flex flex-col gap-6">
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "var(--text-kicker)",
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
                color: "var(--text-on-surface)",
                lineHeight: 1.25,
              }}
            >
              Choose the right kind of help
            </h3>
          </div>

          <button
            type="button"
            onClick={() => navigate("/help")}
            className="flex items-center gap-3 rounded-2xl px-2 py-2 text-left transition-all duration-200 hover:bg-[var(--surface-violet-medium)] active:scale-[0.98]"
            style={{ color: "var(--text-on-surface)", cursor: "pointer" }}
          >
            <span
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--surface-violet-icon)] text-primary"
              aria-hidden
            >
              <MapPin size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-foreground">
                Find help nearby
              </span>
              <span className="mt-0.5 block text-[12px] leading-relaxed text-[color:var(--text-kicker)]">
                Verified clinics, hotlines, and nearby resources.
              </span>
            </span>
            <ArrowUpRight size={16} className="text-[color:var(--text-kicker)]" />
          </button>

          <button
            type="button"
            onClick={onOpenChat}
            className="flex items-center gap-3 rounded-2xl px-2 py-2 text-left transition-all duration-200 hover:bg-[rgba(255,185,84,0.10)] active:scale-[0.98]"
            style={{ color: "var(--text-on-surface)", cursor: "pointer" }}
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
              <span className="mt-0.5 block text-[12px] leading-relaxed text-[color:var(--tertiary)]">
                Talk to Mabuh-ai for private, conversational support.
              </span>
            </span>
            <ArrowUpRight size={16} className="text-tertiary/80" />
          </button>
        </div>
      </section>

      {/* Crisis safety — high visibility, comes after the primary actions. */}
      <section aria-label="Crisis safety" className="relative">
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <span
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-[rgba(255,123,123,0.18)]"
              style={{ color: "var(--icon-rose)" }}
              aria-hidden
            >
              <ShieldAlert size={18} />
            </span>
            <div className="min-w-0">
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "var(--text-danger-strong)",
                  lineHeight: 1.2,
                  margin: 0,
                }}
              >
                In immediate danger?
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--text-danger-soft)",
                  lineHeight: 1.45,
                  marginTop: 2,
                }}
              >
                Contact local emergency services right away.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {HOTLINES.map((h) => (
              <a
                key={h.key}
                href={h.tel}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (h.tel === "#") {
                    e.preventDefault();
                    return;
                  }
                  e.preventDefault();
                  void openExternal(h.tel);
                }}
                className="flex items-center gap-3 rounded-2xl px-2 py-2 text-[13px] transition-colors duration-200 hover:bg-[rgba(255,123,123,0.06)] active:bg-[rgba(255,123,123,0.10)]"
                style={{
                  color: "var(--text-on-surface)",
                  textDecoration: "none",
                  opacity: h.unverified ? 0.85 : 1,
                  cursor: h.tel === "#" ? "default" : "pointer",
                }}
              >
                <Phone size={14} color="var(--icon-rose)" />
                <span className="min-w-0 flex-1">
                  <span
                    className="block font-semibold"
                    style={{ color: "var(--text-danger-strong)", paddingRight: 8 }}
                  >
                    {h.label}
                  </span>
                  <span
                    className="mt-0.5 block text-[11px]"
                    style={{ color: "var(--text-danger-muted)", paddingRight: 8 }}
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
                      color: "var(--text-danger-strong)",
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
                        color: "var(--text-danger-muted)",
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
