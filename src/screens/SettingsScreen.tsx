import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  Check,
  Cloud,
  CloudOff,
  Cpu as CpuIcon,
  Download,
  Info,
  KeyRound,
  LoaderCircle,
  LogOut,
  Mail,
  PlayCircle,
  Save,
  Trash2,
  User as UserIcon,
  Users,
} from "lucide-react";

function GithubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z"
      />
    </svg>
  );
}
import { useAuth, useAuthActions } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import type { ReminderPreferences } from "../hooks/useMoodStore";
import { TopBarBackButton } from "../components/shared/TopBarBackButton";
import { AiConsentSettings } from "../components/shared/AiConsentSettings";
import type { ReminderStatus } from "../lib/reminders";
import { openExternal } from "../lib/openExternal";
import type { SyncStatus } from "../lib/db/moodRepository";

interface SettingsScreenProps {
  reminder: ReminderPreferences;
  reminderStatus: ReminderStatus | null;
  onSetReminder: (next: Partial<ReminderPreferences>) => void;
  onExportData: () => void;
  onClearAllLocalData: () => void;
  onDeleteAllData: () => Promise<void>;
  onReplayOnboarding?: () => void;
  onBack: () => void;
  online: boolean;
  syncStatus: SyncStatus;
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
  error,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  busy?: boolean;
  error?: string | null;
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
        {error && <StatusLine kind="error" message={error} />}
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
  reminderStatus,
  onSetReminder,
  onExportData,
  onClearAllLocalData,
  onDeleteAllData,
  onReplayOnboarding,
  onBack,
  online,
  syncStatus,
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

  const [confirmWipeData, setConfirmWipeData] = useState(false);
  const [wipeBusy, setWipeBusy] = useState(false);
  const [wipeError, setWipeError] = useState<string | null>(null);

  const [contributorsOpen, setContributorsOpen] = useState(false);

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
    if (!online) {
      setNameError("Connect to the internet to update your profile.");
      setNameStatus("error");
      return;
    }
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
    if (!online) {
      setResetError("Connect to the internet to request a reset link.");
      setResetStatus("error");
      return;
    }
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
    if (!online) {
      setPwError("Connect to the internet to change your password.");
      setPwStatus("error");
      return;
    }
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
      onClearAllLocalData();
      await signOut();
      navigate("/login", { replace: true });
    } catch {
      setSignOutBusy(false);
      setConfirmSignOut(false);
    }
  }

  async function handleDeleteAccount() {
    if (!online) {
      setDeleteError("Connect to the internet to delete your account.");
      return;
    }
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

  async function handleWipeData() {
    if (!online) {
      setWipeError("Connect to the internet to delete cloud data.");
      return;
    }
    setWipeBusy(true);
    setWipeError(null);
    try {
      await onDeleteAllData();
      setConfirmWipeData(false);
    } catch (err) {
      setWipeError(err instanceof Error ? err.message : "Could not delete your data.");
    } finally {
      setWipeBusy(false);
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
          label="Daily care notifications"
          description="A gentle check-in or warm note once a day. Everything stays on this device."
          checked={reminder.enabled}
          onChange={(next) => onSetReminder({ enabled: next })}
        />
        {reminder.enabled && (
          <p
            role="status"
            style={{
              fontSize: 11,
              color:
                reminderStatus?.permission === "granted"
                  ? "rgba(109,186,132,0.9)"
                  : "rgba(255,185,84,0.9)",
              lineHeight: 1.5,
              margin: 0,
              marginTop: -4,
            }}
          >
            {!reminderStatus && "Preparing your daily notifications…"}
            {reminderStatus?.permission === "granted" &&
              reminderStatus.delivery === "native" &&
              `Mabuh-ai will check in at ${formatHour(reminder.hour, reminder.minute)}, even when the app is closed.`}
            {reminderStatus?.permission === "granted" &&
              reminderStatus.delivery === "browser" &&
              `Mabuh-ai will check in at ${formatHour(reminder.hour, reminder.minute)} while this browser is open.`}
            {reminderStatus?.permission === "default" &&
              "Allow notifications when prompted to start receiving reminders."}
            {reminderStatus?.permission === "denied" &&
              "Notifications are blocked. Allow Mabuh-ai notifications in your device or browser settings."}
            {reminderStatus?.permission === "unsupported" &&
              "Notifications are not supported here. You can keep using the rest of Mabuh-ai normally."}
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
          Mabuh-ai can do. Your data and settings stay exactly as they are.
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
        <div
          aria-live="polite"
          className="relative overflow-hidden rounded-2xl border border-[rgba(188,194,255,0.12)] bg-[rgba(188,194,255,0.04)] px-4 py-3.5"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-14 size-28 rounded-full bg-[radial-gradient(circle_at_center,rgba(188,194,255,0.14),transparent_65%)] blur-xl"
          />
          <div className="relative flex items-center gap-3">
            <span
              className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                syncStatus.error && online
                  ? "bg-[rgba(255,123,123,0.12)] text-[rgba(255,170,170,0.95)]"
                  : !online
                    ? "bg-[rgba(255,185,84,0.12)] text-tertiary"
                    : "bg-[rgba(188,194,255,0.14)] text-primary"
              }`}
            >
              {syncStatus.syncing ? (
                <LoaderCircle
                  size={18}
                  className="animate-spin motion-reduce:animate-none"
                />
              ) : !online ? (
                <CloudOff size={18} />
              ) : syncStatus.pendingCount > 0 || syncStatus.error ? (
                <Cloud size={18} />
              ) : (
                <Check size={18} />
              )}
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold text-foreground">
                  {syncStatus.syncing
                    ? "Syncing your data"
                    : !online
                      ? "Saved on this device"
                      : syncStatus.error
                        ? "Sync paused"
                        : "Everything is up to date"}
                </span>
                {syncStatus.pendingCount > 0 && (
                  <span className="shrink-0 rounded-full bg-[rgba(255,185,84,0.14)] px-2 py-0.5 text-[10px] font-semibold text-[#ffd99a]">
                    {syncStatus.pendingCount} pending
                  </span>
                )}
              </span>
              <span className="mt-0.5 block text-[11px] leading-relaxed text-[#d8d4eb]">
                {syncStatus.error && online
                  ? syncStatus.error
                  : syncStatus.pendingCount > 0
                    ? "Changes will upload automatically when the connection is ready."
                    : syncStatus.lastSyncedAt
                      ? `Last synced ${new Date(syncStatus.lastSyncedAt).toLocaleString()}.`
                      : "Check-ins and journals save locally before cloud backup."}
              </span>
            </span>
          </div>
        </div>
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

        <div
          style={{
            height: 1,
            background: "rgba(188,194,255,0.08)",
            margin: "4px 0",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p
            style={{
              fontSize: 12,
              color: "rgba(255,185,84,0.85)",
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            Delete all my data — wipes every check-in, journal entry, and journey progress
            from Mabuh-ai. Your account stays, so you can start fresh whenever you're
            ready.
          </p>
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setWipeError(null);
                setConfirmWipeData(true);
              }}
              style={{
                borderColor: "rgba(255,185,84,0.4)",
                color: "rgba(255,217,154,0.95)",
                background: "rgba(255,185,84,0.08)",
              }}
            >
              <Trash2 size={14} />
              Delete all my data
            </Button>
          </div>
          {wipeError && <StatusLine kind="error" message={wipeError} />}
        </div>
      </Section>

      <Section title="About" icon={<Info size={16} />}>
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
        <div style={{ display: "flex", gap: 8, paddingTop: 2 }}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setContributorsOpen(true)}
            style={{ flex: 1 }}
          >
            <Users size={14} />
            Contributors
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void openExternal("https://github.com/cictapps/mabuh-ai")}
            style={{ flex: 1 }}
          >
            <GithubIcon size={14} />
            GitHub
          </Button>
        </div>
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
        error={deleteError}
        onCancel={() => {
          if (deleteBusy) return;
          setConfirmDelete(false);
          setDeleteError(null);
        }}
        onConfirm={() => void handleDeleteAccount()}
      />

      <ConfirmDialog
        open={confirmWipeData}
        title="Delete all your data?"
        description="This removes every check-in, journal entry, and journey progress tied to your account. Your Mabuh-ai account stays, and you can keep using the app from a clean slate. This cannot be undone."
        confirmLabel="Delete everything"
        destructive
        busy={wipeBusy}
        error={wipeError}
        onCancel={() => {
          if (wipeBusy) return;
          setConfirmWipeData(false);
          setWipeError(null);
        }}
        onConfirm={() => void handleWipeData()}
      />

      <ContributorsDialog open={contributorsOpen} onOpenChange={setContributorsOpen} />
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

const CONTRIBUTOR_GROUPS: { title: string; members: string[] }[] = [
  {
    title: "Group 1: Authentication & User Access",
    members: [
      "Agustin, James A. Juanillo",
      "Luces, Francine G. Sioco",
      "Polaron, Meryll K. Abanto",
      "Siaton, Nash E. Ana",
      "Ssirilan, Romyl P. Mosquera Irilan",
    ],
  },
  {
    title: "Group 2: AI Chat Support & Safety",
    members: [
      "Bengaora, Nicole K. Dividina",
      "Catalino, Joel I.",
      "Dagohoy, Cherry J. Valencia",
      "Gain, Phil A. Na",
      "Catolin, Diether J.",
    ],
  },
  {
    title: "Group 3: Mood Tracking & Insights",
    members: [
      "Bulotaolo, Ashley N. Balinton",
      "Castor, Lorraine A. Nobleza",
      "Lombendencio, Trisha M. Cabayao",
      "Maulas, Frederic M. Manciba",
      "Tabiolo, Gero A. Tacayon",
    ],
  },
  {
    title: "Group 4: Mask Off Mode",
    members: [
      "Abordo, Aya Y. Alegario",
      "Buncag, Katrina A. Sanchez",
      "Delizo, Chelsea C.",
      "Guancia, Shenna J. Bonto",
      "Sison, Denzel K. Continente",
    ],
  },
  {
    title: "Group 5: Self-Care, Tips, and Gamification",
    members: [
      "Beliran, Benedict E. Penpillo",
      "Espinosa, Franz A. Labtic",
      "Guarnes, Shaqkiell J. Gaitan",
      "Sorbito, Alejandro M. Balleras",
      "Beray, Ianna Y. Concepcion",
    ],
  },
  {
    title: "Group 6: GIS, Community, and Urgent Help",
    members: [
      "Anes, Anton G. Torre",
      "Bustamante",
      "Bustamante, Mhel B.",
      "Polong, Michael A. Febrero",
      "Sasi, Jay A. Ogabar",
    ],
  },
  {
    title: "Group 7: Branding, Promotion, and Presentation",
    members: [
      "Celeste, Skye D. Saladar",
      "Jaen, Raven C. Balbalore",
      "Sinfuego, Japhet R. Tabares",
      "Tacsagon, King P. Tagal",
      "Tuvilla, Ilych J. Anila",
    ],
  },
];

const SUBJECT_TEACHER = "Mark Joseph J. Solidarios";

function ContributorsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#d8d4eb",
            }}
          >
            Built with care
          </div>
          <DialogTitle>Contributors</DialogTitle>
          <DialogDescription>
            Mabuh-ai was developed by BSIS students of WVSU — CICT as a project for their
            Mobile App Development class. With guidance from their subject teacher, each
            group shaped a part of the app you use today.
          </DialogDescription>
        </DialogHeader>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            marginTop: 4,
          }}
        >
          {CONTRIBUTOR_GROUPS.map((group) => (
            <section
              key={group.title}
              style={{ display: "flex", flexDirection: "column", gap: 6 }}
            >
              <h4
                className="font-serif"
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#eef1f6",
                  letterSpacing: "-0.01em",
                  margin: 0,
                }}
              >
                {group.title}
              </h4>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                {group.members.map((member) => (
                  <li
                    key={member}
                    style={{
                      fontSize: 13,
                      color: "rgba(216,212,235,0.75)",
                      lineHeight: 1.55,
                    }}
                  >
                    {member}
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <div
            aria-hidden
            style={{
              height: 1,
              background: "rgba(188,194,255,0.10)",
              margin: "4px 0 2px",
            }}
          />

          <section style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <h4
              className="font-serif"
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "#eef1f6",
                letterSpacing: "-0.01em",
                margin: 0,
              }}
            >
              Subject Teacher
            </h4>
            <p
              style={{
                fontSize: 13,
                color: "rgba(216,212,235,0.75)",
                lineHeight: 1.55,
                margin: 0,
              }}
            >
              {SUBJECT_TEACHER}
            </p>
          </section>
        </div>

        <div
          style={{
            marginTop: 6,
            paddingTop: 12,
            borderTop: "1px solid rgba(188,194,255,0.08)",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void openExternal("https://github.com/cictapps/mabuh-ai")}
          >
            <GithubIcon size={14} />
            View on GitHub
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SettingsScreen;
