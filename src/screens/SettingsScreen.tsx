import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  AlertTriangle,
  Cpu as CpuIcon,
  Download,
  KeyRound,
  LogOut,
  Mail,
  PlayCircle,
  Save,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import { useAuth, useAuthActions } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import type { ReminderPreferences } from "../hooks/useMoodStore";
import { TopBarBackButton } from "../components/shared/TopBarBackButton";
import { AiConsentSettings } from "../components/shared/AiConsentSettings";
import { getReminderPermission } from "../lib/reminders";

interface SettingsScreenProps {
  reminder: ReminderPreferences;
  onSetReminder: (next: Partial<ReminderPreferences>) => void;
  onExportData: () => void;
  onClearAllLocalData: () => void;
  onReplayOnboarding?: () => void;
  onBack: () => void;
}

const APP_VERSION = "0.1.0";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

function useIsoLayoutEffect() {
  return typeof window !== "undefined" ? useLayoutEffect : useEffect;
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        padding: "12px 4px",
        background: "transparent",
        border: "none",
        outline: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        textAlign: "left",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: "block",
            fontSize: 14,
            color: "#e8eaf0",
            fontWeight: 500,
          }}
        >
          {label}
        </span>
        {description && (
          <span
            style={{
              display: "block",
              fontSize: 12,
              color: "rgba(220,224,255,0.7)",
              marginTop: 2,
              lineHeight: 1.5,
            }}
          >
            {description}
          </span>
        )}
      </span>
      <span
        aria-hidden
        style={{
          position: "relative",
          width: 42,
          height: 24,
          borderRadius: 999,
          background: checked ? "rgba(255,185,84,0.85)" : "rgba(188,194,255,0.18)",
          transition: "background 0.2s ease",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: checked ? 20 : 2,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: checked ? "#121416" : "#e8eaf0",
            transition: "left 0.2s ease, background 0.2s ease",
            boxShadow: "0 4px 10px -4px rgba(0,0,0,0.5)",
          }}
        />
      </span>
    </button>
  );
}

function Section({
  title,
  icon,
  children,
  innerRef,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  innerRef?: React.Ref<HTMLDivElement>;
}) {
  return (
    <section
      ref={innerRef}
      data-stagger
      style={{
        position: "relative",
        zIndex: 1,
        padding: "18px 20px",
        borderRadius: 20,
        background: "rgba(188,194,255,0.04)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 4,
        }}
      >
        <span
          style={{
            display: "grid",
            placeItems: "center",
            width: 32,
            height: 32,
            borderRadius: 12,
            background: "rgba(255,185,84,0.16)",
            color: "#ffd99a",
          }}
        >
          {icon}
        </span>
        <h2
          className="font-serif"
          style={{
            fontSize: 18,
            color: "#eef1f6",
            fontWeight: 500,
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h2>
      </header>
      {children}
    </section>
  );
}

function StatusLine({ kind, message }: { kind: "success" | "error"; message: string }) {
  const isError = kind === "error";
  return (
    <p
      role={isError ? "alert" : "status"}
      style={{
        fontSize: 12,
        color: isError ? "rgba(255,123,123,0.9)" : "rgba(109,186,132,0.95)",
        marginTop: 2,
      }}
    >
      {message}
    </p>
  );
}

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive,
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    const prevPosition = document.body.style.position;
    const scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.position = prevPosition;
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100dvh",
        minHeight: "100vh",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "rgba(8,10,18,0.78)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        overscrollBehavior: "contain",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          padding: "22px 22px 18px",
          borderRadius: 20,
          background: "rgba(27,30,39,0.98)",
          border: "1px solid rgba(188,194,255,0.10)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          boxShadow: "0 32px 80px -24px rgba(0,0,0,0.6)",
          margin: "auto",
        }}
      >
        <h3
          className="font-serif"
          style={{ fontSize: 20, color: "#eef1f6", fontWeight: 500 }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: 13,
            color: "rgba(188,194,255,0.6)",
            lineHeight: 1.55,
            margin: 0,
          }}
        >
          {description}
        </p>
        <div
          style={{ display: "flex", gap: 10, marginTop: 8, justifyContent: "flex-end" }}
        >
          <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            style={
              destructive
                ? { background: "rgba(255,123,123,0.9)", color: "#1a0606" }
                : undefined
            }
          >
            {busy ? "Working…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function formatHour(hour: number, minute: number) {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const m = minute.toString().padStart(2, "0");
  const ampm = hour < 12 ? "AM" : "PM";
  return `${h}:${m} ${ampm}`;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  reminder,
  onSetReminder,
  onExportData,
  onClearAllLocalData,
  onReplayOnboarding,
  onBack,
}) => {
  const { user, profile } = useAuth();
  const { signOut, updateProfile, requestPasswordReset, changePassword, deleteAccount } =
    useAuthActions();
  const navigate = useNavigate();
  const reducedMotion = usePrefersReducedMotion();
  const useIso = useIsoLayoutEffect();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [nameStatus, setNameStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [nameError, setNameError] = useState<string | null>(null);

  const [resetStatus, setResetStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [resetError, setResetError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [pwStatus, setPwStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [pwError, setPwError] = useState<string | null>(null);

  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [signOutBusy, setSignOutBusy] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setDisplayName(profile?.display_name ?? "");
  }, [profile?.display_name]);

  useGSAP(
    () => {
      if (reducedMotion) return;
      const targets = rootRef.current?.querySelectorAll<HTMLElement>("[data-stagger]");
      if (!targets || !targets.length) return;
      gsap.fromTo(
        targets,
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", stagger: 0.06 },
      );
    },
    { scope: rootRef, dependencies: [reducedMotion] },
  );

  // Refresh the access token in the background so password / account
  // operations work even after a long idle session.
  useIso(() => {
    supabase.auth.getSession().catch(() => {});
  }, []);

  async function handleSaveName() {
    const trimmed = displayName.trim();
    if (!trimmed) {
      setNameError("Display name can't be empty.");
      setNameStatus("error");
      return;
    }
    if (trimmed.length > 40) {
      setNameError("Keep it under 40 characters.");
      setNameStatus("error");
      return;
    }
    setNameStatus("saving");
    setNameError(null);
    try {
      await updateProfile({ display_name: trimmed });
      setNameStatus("saved");
      setTimeout(() => setNameStatus("idle"), 2200);
    } catch (err) {
      setNameError(err instanceof Error ? err.message : "Could not save name.");
      setNameStatus("error");
    }
  }

  async function handleSendReset() {
    if (!user?.email) return;
    setResetStatus("sending");
    setResetError(null);
    try {
      await requestPasswordReset(user.email);
      setResetStatus("sent");
      setTimeout(() => setResetStatus("idle"), 4000);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Could not send reset link.");
      setResetStatus("error");
    }
  }

  async function handleChangePassword() {
    if (newPassword.length < 8) {
      setPwError("Password must be at least 8 characters.");
      setPwStatus("error");
      return;
    }
    setPwStatus("saving");
    setPwError(null);
    try {
      await changePassword(newPassword);
      setNewPassword("");
      setPwStatus("saved");
      setTimeout(() => setPwStatus("idle"), 2200);
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Could not change password.");
      setPwStatus("error");
    }
  }

  async function handleSignOut() {
    setSignOutBusy(true);
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch {
      setSignOutBusy(false);
      setConfirmSignOut(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      onClearAllLocalData();
      navigate("/login", { replace: true });
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Could not delete account.");
      setDeleteBusy(false);
    }
  }

  return (
    <div
      ref={rootRef}
      className="checkin-root screen-enter"
      style={{ gap: "clamp(14px, 4vw, 22px)" }}
    >
      <header
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          gap: 12,
          minHeight: 40,
        }}
      >
        <TopBarBackButton onClick={onBack} />
        <h1
          className="font-serif"
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: "clamp(18px, 4.6vw, 20px)",
            fontWeight: 500,
            lineHeight: 1.2,
            color: "#eef1f6",
            letterSpacing: "-0.02em",
            margin: 0,
            textAlign: "left",
          }}
        >
          Settings
        </h1>
      </header>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <p
          className="font-serif"
          style={{
            fontSize: "clamp(14px, 4vw, 16px)",
            color: "rgba(188,194,255,0.55)",
            letterSpacing: "0.2px",
            margin: 0,
          }}
        >
          Tune the space to feel like yours.
        </p>
      </div>

      <Section title="Profile" icon={<UserIcon size={16} />}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label
            style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "1.1px",
              textTransform: "uppercase",
              color: "rgba(220,224,255,0.7)",
            }}
          >
            Display name
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 200px", minWidth: 0 }}>
              <Input
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  if (nameStatus === "error") setNameStatus("idle");
                }}
                placeholder="How should we call you?"
                maxLength={40}
                autoComplete="nickname"
                disabled={nameStatus === "saving"}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void handleSaveName()}
              disabled={
                nameStatus === "saving" ||
                displayName.trim() === (profile?.display_name ?? "").trim()
              }
            >
              <Save size={14} />
              {nameStatus === "saving" ? "Saving…" : "Save"}
            </Button>
          </div>
          {nameStatus === "saved" && (
            <StatusLine kind="success" message="Name updated." />
          )}
          {nameStatus === "error" && nameError && (
            <StatusLine kind="error" message={nameError} />
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 14px",
            borderRadius: 14,
            background: "rgba(188,194,255,0.03)",
          }}
        >
          <Mail size={14} style={{ color: "rgba(188,194,255,0.5)" }} />
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "1.1px",
                textTransform: "uppercase",
                color: "rgba(220,224,255,0.7)",
              }}
            >
              Email
            </span>
            <span
              style={{
                fontSize: 13,
                color: "#e8eaf0",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user?.email ?? "—"}
            </span>
          </div>
        </div>
      </Section>

      <Section title="AI companion context" icon={<CpuIcon />}>
        <AiConsentSettings compact />
        <p
          style={{
            fontSize: 11,
            color: "rgba(216,212,235,0.5)",
            lineHeight: 1.55,
            margin: 0,
            marginTop: 4,
          }}
        >
          Each toggle only affects what gets sent to the AI server. You will be reminded
          of this choice before your first chat message.
        </p>
      </Section>

      <Section
        title="Daily reminder"
        icon={
          <img
            src="/app-logo-light.svg"
            alt=""
            aria-hidden="true"
            className="size-4 object-contain"
          />
        }
      >
        <ToggleRow
          label="Gentle check-in nudge"
          description="We'll quietly remind you once a day. The reminder stays on this device only."
          checked={reminder.enabled}
          onChange={(next) => onSetReminder({ enabled: next })}
        />
        {reminder.enabled && (
          <p
            role="status"
            style={{
              fontSize: 11,
              color:
                getReminderPermission() === "granted"
                  ? "rgba(109,186,132,0.9)"
                  : "rgba(255,185,84,0.9)",
              lineHeight: 1.5,
              margin: 0,
              marginTop: -4,
            }}
          >
            {getReminderPermission() === "granted" &&
              `Reminders will fire at ${formatHour(reminder.hour, reminder.minute)} daily in this browser. Allow notifications if you don't see one.`}
            {getReminderPermission() === "default" &&
              "Allow notifications when prompted to start receiving reminders."}
            {getReminderPermission() === "denied" &&
              "Notifications are blocked in this browser. Update site permissions to receive reminders."}
            {getReminderPermission() === "unsupported" &&
              "This browser does not support notifications. Reminders are off until you switch to a supported browser."}
          </p>
        )}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            opacity: reminder.enabled ? 1 : 0.45,
            pointerEvents: reminder.enabled ? "auto" : "none",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 14, color: "#e8eaf0", fontWeight: 500 }}>Time</span>
            <span style={{ fontSize: 12, color: "rgba(188,194,255,0.45)" }}>
              {formatHour(reminder.hour, reminder.minute)}
            </span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              type="number"
              min={0}
              max={23}
              value={reminder.hour}
              onChange={(e) => {
                const v = Math.max(0, Math.min(23, Number(e.target.value) || 0));
                onSetReminder({ hour: v });
              }}
              aria-label="Reminder hour"
              style={timeInputStyle}
            />
            <span style={{ color: "rgba(188,194,255,0.45)", alignSelf: "center" }}>
              :
            </span>
            <input
              type="number"
              min={0}
              max={59}
              value={reminder.minute.toString().padStart(2, "0")}
              onChange={(e) => {
                const v = Math.max(0, Math.min(59, Number(e.target.value) || 0));
                onSetReminder({ minute: v });
              }}
              aria-label="Reminder minute"
              style={timeInputStyle}
            />
          </div>
        </div>
      </Section>

      <Section title="Security" icon={<KeyRound size={16} />}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p
            style={{
              fontSize: 12,
              color: "rgba(188,194,255,0.5)",
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            Send a reset link to {user?.email ?? "your email"}.
          </p>
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void handleSendReset()}
              disabled={resetStatus === "sending" || !user?.email}
            >
              {resetStatus === "sending" ? "Sending…" : "Send password reset email"}
            </Button>
          </div>
          {resetStatus === "sent" && (
            <StatusLine kind="success" message="Check your inbox for the reset link." />
          )}
          {resetStatus === "error" && resetError && (
            <StatusLine kind="error" message={resetError} />
          )}
        </div>

        <div
          style={{
            height: 1,
            background: "rgba(188,194,255,0.08)",
            margin: "4px 0",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label
            style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "1.1px",
              textTransform: "uppercase",
              color: "rgba(220,224,255,0.7)",
            }}
          >
            Change password
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 200px", minWidth: 0 }}>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (pwStatus === "error") setPwStatus("idle");
                }}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                minLength={8}
                disabled={pwStatus === "saving"}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void handleChangePassword()}
              disabled={pwStatus === "saving" || newPassword.length < 8}
            >
              {pwStatus === "saving" ? "Updating…" : "Update"}
            </Button>
          </div>
          {pwStatus === "saved" && (
            <StatusLine kind="success" message="Password updated." />
          )}
          {pwStatus === "error" && pwError && (
            <StatusLine kind="error" message={pwError} />
          )}
        </div>
      </Section>

      <Section title="Welcome tour" icon={<PlayCircle size={16} />}>
        <p
          style={{
            fontSize: 13,
            color: "rgba(188,194,255,0.55)",
            lineHeight: 1.55,
            margin: 0,
          }}
        >
          Reopen the first-time introduction whenever you'd like a refresher on what
          MabuhAi can do. Your data and settings stay exactly as they are.
        </p>
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onReplayOnboarding?.()}
            disabled={!onReplayOnboarding}
          >
            <PlayCircle size={14} />
            Replay welcome tour
          </Button>
        </div>
      </Section>

      <Section title="Your data" icon={<Download size={16} />}>
        <p
          style={{
            fontSize: 13,
            color: "rgba(188,194,255,0.55)",
            lineHeight: 1.55,
            margin: 0,
          }}
        >
          Download a copy of every check-in, journal entry, and your saved preferences.
          The file is a single JSON you can keep or move elsewhere.
        </p>
        <div>
          <Button type="button" variant="outline" size="sm" onClick={onExportData}>
            <Download size={14} />
            Export my data
          </Button>
        </div>
      </Section>

      <Section title="About" icon={<AlertTriangle size={16} />}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
          }}
        >
          <InfoTile label="App" value="Mabuh-ai" />
          <InfoTile label="Version" value={APP_VERSION} />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 18,
            padding: "14px 12px",
            borderRadius: 14,
            background: "rgba(188,194,255,0.04)",
            border: "1px solid rgba(188,194,255,0.06)",
          }}
        >
          <img
            src="/wvsu-logo.svg"
            alt="West Visayas State University"
            style={{ height: 56, width: "auto", opacity: 0.9 }}
          />
          <span
            aria-hidden
            style={{
              width: 1,
              height: 40,
              background: "rgba(188,194,255,0.12)",
            }}
          />
          <img
            src="/cict-logo.svg"
            alt="College of Information and Communications Technology"
            style={{ height: 56, width: "auto", opacity: 0.9 }}
          />
        </div>
        <p
          style={{
            fontSize: 11,
            color: "rgba(188,194,255,0.35)",
            lineHeight: 1.55,
            margin: 0,
          }}
        >
          Mabuh-ai is a quiet space for reflection, made with care for students.
        </p>
        <p
          style={{
            fontSize: 11,
            color: "rgba(188,194,255,0.45)",
            lineHeight: 1.6,
            margin: 0,
            textAlign: "center",
            fontStyle: "italic",
          }}
        >
          Created with care by BSIS students of West Visayas State University — College of
          Information and Communications Technology, as a project for their Mobile App
          Development class.
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            paddingTop: 4,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(216,212,235,0.55)",
            }}
          >
            <span
              aria-hidden
              style={{ flex: 1, height: 1, background: "rgba(188,194,255,0.10)" }}
            />
            <span>Legal</span>
            <span
              aria-hidden
              style={{ flex: 1, height: 1, background: "rgba(188,194,255,0.10)" }}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => navigate("/terms")}
              style={{
                flex: 1,
                appearance: "none",
                cursor: "pointer",
                padding: "10px 12px",
                borderRadius: 12,
                background: "rgba(188,194,255,0.06)",
                border: "0.5px solid rgba(188,194,255,0.12)",
                color: "#eef1f6",
                fontSize: 13,
                fontWeight: 500,
                fontFamily: "var(--font-sans)",
                transition: "background 0.15s ease",
              }}
            >
              Terms & Conditions
            </button>
            <button
              type="button"
              onClick={() => navigate("/privacy")}
              style={{
                flex: 1,
                appearance: "none",
                cursor: "pointer",
                padding: "10px 12px",
                borderRadius: 12,
                background: "rgba(188,194,255,0.06)",
                border: "0.5px solid rgba(188,194,255,0.12)",
                color: "#eef1f6",
                fontSize: 13,
                fontWeight: 500,
                fontFamily: "var(--font-sans)",
                transition: "background 0.15s ease",
              }}
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </Section>

      <section
        data-stagger
        style={{
          position: "relative",
          zIndex: 1,
          padding: "18px 20px",
          borderRadius: 20,
          background: "rgba(255,123,123,0.06)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 4,
          }}
        >
          <span
            style={{
              display: "grid",
              placeItems: "center",
              width: 32,
              height: 32,
              borderRadius: 12,
              background: "rgba(255,123,123,0.15)",
              color: "rgba(255,123,123,0.95)",
            }}
          >
            <LogOut size={16} />
          </span>
          <h2
            className="font-serif"
            style={{
              fontSize: 18,
              color: "#eef1f6",
              fontWeight: 500,
              letterSpacing: "-0.01em",
            }}
          >
            Sign out
          </h2>
        </header>
        <p
          style={{
            fontSize: 13,
            color: "rgba(188,194,255,0.5)",
            lineHeight: 1.55,
            margin: 0,
          }}
        >
          You'll need to sign in again next time you open Mabuh-ai. Your data stays safe
          and waiting.
        </p>
        <div>
          <Button type="button" variant="outline" onClick={() => setConfirmSignOut(true)}>
            <LogOut size={14} />
            Sign out
          </Button>
        </div>

        <div
          style={{
            height: 1,
            background: "rgba(255,123,123,0.18)",
            margin: "4px 0",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p
            style={{
              fontSize: 12,
              color: "rgba(255,123,123,0.85)",
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            Delete account — permanently removes your profile, check-ins, journals, and
            account from Mabuh-ai. This cannot be undone.
          </p>
          <div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDelete(true)}
              style={{
                borderColor: "rgba(255,123,123,0.4)",
                color: "rgba(255,123,123,0.95)",
                background: "rgba(255,123,123,0.08)",
              }}
            >
              <Trash2 size={14} />
              Delete account
            </Button>
          </div>
          {deleteError && <StatusLine kind="error" message={deleteError} />}
        </div>
      </section>

      <ConfirmDialog
        open={confirmSignOut}
        title="Sign out of Mabuh-ai?"
        description="You can always come back. Your data will be here when you return."
        confirmLabel="Sign out"
        busy={signOutBusy}
        onCancel={() => setConfirmSignOut(false)}
        onConfirm={() => void handleSignOut()}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Delete your account?"
        description="This permanently deletes your profile, every check-in, and every journal entry on Mabuh-ai. This cannot be undone."
        confirmLabel="Delete forever"
        destructive
        busy={deleteBusy}
        onCancel={() => {
          if (deleteBusy) return;
          setConfirmDelete(false);
          setDeleteError(null);
        }}
        onConfirm={() => void handleDeleteAccount()}
      />
    </div>
  );
};

const timeInputStyle: React.CSSProperties = {
  width: 52,
  height: 38,
  textAlign: "center",
  borderRadius: 12,
  background: "rgba(188,194,255,0.06)",
  border: "1px solid rgba(188,194,255,0.1)",
  color: "#e8eaf0",
  fontFamily: "Plus Jakarta Sans, sans-serif",
  fontSize: 14,
  fontVariantNumeric: "tabular-nums",
  outline: "none",
};

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: 12,
        background: "rgba(188,194,255,0.04)",
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: "1.1px",
          textTransform: "uppercase",
          color: "rgba(220,224,255,0.7)",
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 13, color: "#e8eaf0", fontWeight: 500 }}>{value}</div>
    </div>
  );
}

export default SettingsScreen;
