import { useEffect, useState, type ReactNode } from "react";
import { MailCheck } from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth, useAuthActions, useAuthStore } from "./store";

type Props = {
  children: ReactNode;
};

export function ProtectedRoute({ children }: Props) {
  const initialize = useAuthStore((s) => s.initialize);
  const { isAuthenticated, isEmailVerified, loading, user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (loading) {
      document.body.classList.remove("app-ready");
      return;
    }

    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.body.classList.add("app-ready");
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [loading]);

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!isEmailVerified) {
    return <VerifyEmailGate email={user?.email ?? ""} />;
  }

  return <>{children}</>;
}

function VerifyEmailGate({ email }: { email: string }) {
  const { resendConfirmation, signOut } = useAuthActions();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function handleResend() {
    if (!email) {
      setError("This account does not have an email address to verify.");
      return;
    }

    setSending(true);
    setStatus(null);
    setError(null);

    try {
      await resendConfirmation(email);
      setStatus("Verification email sent. Open the link, then come back here.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send verification email.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main
      className="relative flex min-h-screen items-center justify-center bg-background px-4 pb-12 text-foreground"
      style={{ paddingTop: "var(--app-screen-top)" }}
    >
      <div className="w-full max-w-md rounded-[1.5rem] border border-white/10 bg-card/80 p-8 shadow-[0_28px_80px_-40px_rgba(74, 60, 90, 0.28)]">
        <div className="mb-6 space-y-2">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-tertiary/15 px-3.5 py-1.5 text-sm font-medium text-tertiary">
            <MailCheck className="size-4" />
            Verify email
          </span>
          <h1 className="font-serif text-3xl tracking-[-0.03em]">Check your inbox</h1>
          <p className="text-sm text-muted-foreground">
            Confirm {email || "your email address"} before opening your protected space.
          </p>
        </div>

        {status && (
          <p className="mb-4 rounded-2xl bg-tertiary/10 px-4 py-3 text-sm text-tertiary">
            {status}
          </p>
        )}
        {error && (
          <p className="mb-4 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <Button type="button" onClick={() => void handleResend()} disabled={sending}>
            {sending ? "Sending..." : "Resend verification email"}
          </Button>
          <Button type="button" variant="outline" onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </div>
    </main>
  );
}
