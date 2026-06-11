import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth, useAuthActions, useAuthStore } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Tab = "sign-in" | "sign-up";

const googleAuthEnabled = import.meta.env.VITE_AUTH_GOOGLE_ENABLED !== "false";

export interface AuthPageProps {
  initialTab?: Tab;
}

// ---------- Feedback banners ----------

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
    >
      <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function SuccessBanner({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="flex items-start gap-2 rounded-lg border border-tertiary/30 bg-tertiary/10 px-3.5 py-2.5 text-sm text-tertiary"
    >
      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

// ---------- Primary submit button ----------

function SubmitButton({
  loading,
  disabled,
  children,
  className,
}: {
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className={cn(
        "flex h-11 w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold",
        "bg-foreground text-background",
        "transition-colors duration-150 hover:bg-foreground/90",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

function GoogleButton({
  loading,
  onClick,
  mode,
}: {
  loading?: boolean;
  onClick: () => void;
  mode: Tab;
}) {
  const label = mode === "sign-in" ? "Sign in with Google" : "Sign up with Google";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      aria-label={label}
      className={cn(
        "flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-white/10 bg-transparent px-4",
        "text-sm font-medium text-foreground/90",
        "transition-colors duration-150 hover:bg-white/5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
      )}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <img src="/google-g.svg" alt="" width={18} height={18} />
      )}
      {loading ? "Opening Google..." : label}
    </button>
  );
}

function EmailDivider() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-white/10" />
      <span className="text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
        or
      </span>
      <div className="h-px flex-1 bg-white/10" />
    </div>
  );
}

// ---------- Sign-in form ----------

function SignInForm({ onForgotPassword }: { onForgotPassword: () => void }) {
  const { signIn, signInWithGoogle } = useAuthActions();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [oauthSubmitting, setOauthSubmitting] = useState(false);

  async function handleGoogleSignIn() {
    setError(null);
    setOauthSubmitting(true);
    try {
      await signInWithGoogle(from);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open Google sign-in.");
    } finally {
      setOauthSubmitting(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {googleAuthEnabled && (
        <>
          <GoogleButton
            mode="sign-in"
            loading={oauthSubmitting}
            onClick={() => void handleGoogleSignIn()}
          />
          <EmailDivider />
        </>
      )}

      <div className="space-y-3">
        <div className="space-y-1.5">
          <label
            htmlFor="si-email"
            className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground"
          >
            Email
          </label>
          <Input
            id="si-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@school.edu"
            className="h-11 rounded-lg text-sm"
            required
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="si-password"
              className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground"
            >
              Password
            </label>
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Forgot?
            </button>
          </div>
          <Input
            id="si-password"
            type="password"
            autoComplete="current-password"
            className="h-11 rounded-lg text-sm"
            required
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
          />
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      <SubmitButton loading={submitting} className="w-full">
        {submitting ? "Signing in…" : "Sign in"}
      </SubmitButton>
    </form>
  );
}

// ---------- Sign-up form ----------

function SignUpForm({ onSuccess }: { onSuccess: () => void }) {
  const { signUp, signInWithGoogle } = useAuthActions();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [oauthSubmitting, setOauthSubmitting] = useState(false);

  async function handleGoogleSignIn() {
    setError(null);
    setOauthSubmitting(true);
    try {
      await signInWithGoogle("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open Google sign-in.");
    } finally {
      setOauthSubmitting(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const trimmedDisplayName = displayName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedDisplayName) {
      setError("Display name is required.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await signUp(trimmedEmail, password, trimmedDisplayName);

      if (result.session) {
        navigate("/", { replace: true });
        return;
      }

      setSuccess(
        result.needsEmailConfirmation
          ? "Check your email to confirm your account, then sign in."
          : "Account created. You can sign in now.",
      );
      setTimeout(onSuccess, 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {googleAuthEnabled && (
        <>
          <GoogleButton
            mode="sign-up"
            loading={oauthSubmitting}
            onClick={() => void handleGoogleSignIn()}
          />
          <EmailDivider />
        </>
      )}

      <div className="space-y-3">
        <div className="space-y-1.5">
          <label
            htmlFor="su-name"
            className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground"
          >
            Display name
          </label>
          <Input
            id="su-name"
            autoComplete="nickname"
            placeholder="What should we call you?"
            className="h-11 rounded-lg text-sm"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.currentTarget.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="su-email"
            className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground"
          >
            Email
          </label>
          <Input
            id="su-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@school.edu"
            className="h-11 rounded-lg text-sm"
            required
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="su-password"
            className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground"
          >
            Password
          </label>
          <Input
            id="su-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            className="h-11 rounded-lg text-sm"
            required
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
          />
          <p className="text-xs text-muted-foreground/70">At least 8 characters.</p>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}
      {success && <SuccessBanner message={success} />}

      <SubmitButton loading={submitting} disabled={!!success} className="w-full">
        {submitting ? "Creating account…" : "Create account"}
      </SubmitButton>
    </form>
  );
}

// ---------- Forgot-password modal ----------

function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/auth/reset`,
        },
      );

      if (resetError) {
        const msg = resetError.message.toLowerCase();
        setError(
          msg.includes("not found") || msg.includes("no user") || msg.includes("invalid")
            ? "No account found with that email address."
            : resetError.message,
        );
        return;
      }

      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-6 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-xl border border-white/10 bg-card p-6 shadow-2xl">
        <h2 className="font-serif text-lg tracking-[-0.02em] text-foreground">
          Reset password
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Enter your email and we'll send you a reset link.
        </p>

        {sent ? (
          <div className="mt-5 space-y-4">
            <SuccessBanner message="Check your inbox — a reset link is on its way." />
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg border border-white/10 py-2.5 text-sm font-medium text-foreground/90 transition-colors hover:bg-white/5"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="fp-email"
                className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground"
              >
                Email
              </label>
              <Input
                id="fp-email"
                type="email"
                autoComplete="email"
                className="h-11 rounded-lg text-sm"
                required
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
              />
            </div>

            {error && <ErrorBanner message={error} />}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-white/10 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
              >
                Cancel
              </button>
              <SubmitButton loading={loading} className="flex-1">
                {loading ? "Sending…" : "Send link"}
              </SubmitButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ---------- Page ----------

export function AuthPage({ initialTab = "sign-in" }: AuthPageProps) {
  const initialize = useAuthStore((s) => s.initialize);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>(initialTab);
  const [showForgot, setShowForgot] = useState(false);
  const [nativeAuthError, setNativeAuthError] = useState<string | null>(null);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    function handleNativeAuthError(event: Event) {
      const message = (event as CustomEvent<string>).detail;
      if (message) setNativeAuthError(message);
    }

    window.addEventListener("mabuhai:auth-error", handleNativeAuthError);
    return () => window.removeEventListener("mabuhai:auth-error", handleNativeAuthError);
  }, []);

  function switchTab(t: Tab) {
    setTab(t);
  }

  return (
    <main className="relative min-h-dvh overflow-x-hidden overflow-y-auto bg-background text-foreground">
      {/* Subtle background gradient */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(188,194,255,0.06) 0%, transparent 60%)",
        }}
      />

      <section className="relative mx-auto flex min-h-dvh w-full max-w-[26rem] flex-col px-6 pb-[calc(var(--safe-bottom)+1.5rem)] pt-[calc(var(--safe-top)+2.5rem)]">
        <header className="flex flex-col items-center justify-start gap-4">
          <img
            src="/app-logo.svg"
            alt="Mabuh-ai"
            width={72}
            height={72}
            className="size-18"
          />
          <span className="font-serif text-4xl font-medium tracking-[-0.02em] text-foreground">
            Mabuh<span className="text-muted-foreground">-ai</span>
          </span>
        </header>

        <div className="flex flex-1 flex-col justify-center py-10">
          <div className="mb-8 space-y-2 text-left">
            <h1 className="font-serif text-[1.75rem] leading-[1.15] tracking-[-0.03em] text-foreground">
              {tab === "sign-in" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {tab === "sign-in"
                ? "Sign in to continue your check-ins."
                : "A quiet space for your check-ins and reflections."}
            </p>
          </div>

          <div
            className="mb-7 flex border-b border-white/10"
            role="tablist"
            aria-label="Account access"
          >
            {(["sign-in", "sign-up"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => switchTab(t)}
                className={cn(
                  "relative -mb-px px-1 pb-2.5 text-sm font-medium transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  tab === t
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground/70",
                )}
              >
                {t === "sign-in" ? "Sign in" : "Sign up"}
                {tab === t && (
                  <span
                    aria-hidden
                    className="absolute inset-x-0 -bottom-px h-px bg-foreground"
                  />
                )}
              </button>
            ))}
            <div className="ml-6" />
            <button
              type="button"
              onClick={() => switchTab(tab === "sign-in" ? "sign-up" : "sign-in")}
              className="ml-auto -mb-px pb-2.5 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground/70"
            >
              {tab === "sign-in" ? "New here? Create an account" : "Have an account? Sign in"}
            </button>
          </div>

          {nativeAuthError && (
            <div className="mb-4">
              <ErrorBanner message={nativeAuthError} />
            </div>
          )}

          <div
            key={tab}
            role="tabpanel"
            className="animate-in fade-in-0 duration-200"
          >
            {tab === "sign-in" ? (
              <SignInForm onForgotPassword={() => setShowForgot(true)} />
            ) : (
              <SignUpForm onSuccess={() => switchTab("sign-in")} />
            )}
          </div>
        </div>

        <footer className="flex flex-col items-center gap-2 pt-2 text-center text-[0.6875rem] leading-5 text-muted-foreground/50">
          <p>By continuing, you agree to our</p>
          <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <Link
              to="/terms"
              className="font-medium text-foreground/70 underline decoration-[rgba(188,194,255,0.35)] underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground"
            >
              Terms & Conditions
            </Link>
            <span aria-hidden className="text-muted-foreground/40">
              ·
            </span>
            <Link
              to="/privacy"
              className="font-medium text-foreground/70 underline decoration-[rgba(188,194,255,0.35)] underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground"
            >
              Privacy Policy
            </Link>
          </p>
          <p>Mabuh-ai supports wellbeing and does not replace professional care.</p>
        </footer>
      </section>

      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
    </main>
  );
}

export default AuthPage;
