import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

export function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkRecoverySession() {
      const { data, error: sessionError } = await supabase.auth.getSession();

      if (cancelled) return;

      if (sessionError) {
        setError(sessionError.message);
      } else if (!data.session) {
        setError(
          "This reset link is invalid or expired. Request a new password reset link.",
        );
      } else {
        setHasRecoverySession(true);
      }

      setCheckingSession(false);
    }

    void checkRecoverySession();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      await supabase.auth.signOut().catch(() => {});
      setSuccess("Password updated. Sign in with your new password.");
      setTimeout(() => navigate("/login", { replace: true }), 1400);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      className="relative flex min-h-screen items-center justify-center bg-background px-4 pb-12 text-foreground"
      style={{ paddingTop: "var(--app-screen-top)" }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-secondary/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md rounded-[1.5rem] border border-white/10 bg-card/80 px-8 py-9 shadow-[0_28px_80px_-40px_rgba(74, 60, 90, 0.28)] backdrop-blur-xl">
        <div className="mb-7 space-y-2">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/15 px-3.5 py-1.5 text-sm font-medium text-primary">
            <KeyRound className="size-4" />
            Password reset
          </span>
          <h1 className="font-serif text-[2.25rem] leading-tight tracking-[-0.03em]">
            Choose a new password
          </h1>
          <p className="text-sm text-muted-foreground">
            Use at least 8 characters. After saving, you will sign in again.
          </p>
        </div>

        {checkingSession ? (
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-surface-highest px-4 py-3 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Checking reset link...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="new-password"
                className="text-sm font-medium text-muted-foreground"
              >
                New password
              </label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
                disabled={!hasRecoverySession || !!success}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="confirm-password"
                className="text-sm font-medium text-muted-foreground"
              >
                Confirm password
              </label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.currentTarget.value)}
                disabled={!hasRecoverySession || !!success}
              />
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div
                role="status"
                className="flex items-start gap-2.5 rounded-2xl border border-tertiary/30 bg-tertiary/10 px-4 py-3 text-sm text-tertiary"
              >
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={!hasRecoverySession || submitting || !!success}
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {submitting ? "Saving..." : "Save new password"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Remembered it?{" "}
              <Link to="/login" className="text-tertiary hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}

export default ResetPassword;
