import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
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
      className="flex items-start gap-2.5 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function SuccessBanner({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="flex items-start gap-2.5 rounded-2xl border border-tertiary/30 bg-tertiary/10 px-4 py-3 text-sm text-tertiary"
    >
      <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

// ---------- Password field ----------

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  minLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  minLength?: number;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={minLength}
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
          className="h-12 pr-11 text-base"
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
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
        "flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-primary-foreground",
        "bg-gradient-to-r from-primary via-secondary to-primary",
        "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20",
        "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0",
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
        "relative flex h-12 w-full items-center justify-center rounded-full border border-[#8e918f] bg-[#131314] px-12",
        "font-['Roboto',sans-serif] text-sm font-medium text-[#e3e3e3]",
        "transition-all duration-200 hover:bg-[#202124] hover:shadow-lg hover:shadow-black/20",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25",
        "disabled:cursor-not-allowed disabled:opacity-60",
      )}
    >
      <span className="absolute left-4 flex size-5 items-center justify-center">
        {loading ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <img src="/google-g.svg" alt="" width={20} height={20} />
        )}
      </span>
      {loading ? "Opening Google..." : label}
    </button>
  );
}

function EmailDivider() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-border" />
      <span className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        or use email
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

// ---------- Stagger wrapper ----------

function Stagger({ delay, children }: { delay: string; children: React.ReactNode }) {
  return (
    <div
      className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
      style={{ animationDelay: delay, animationFillMode: "both" }}
    >
      {children}
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {googleAuthEnabled && (
        <>
          <Stagger delay="40ms">
            <GoogleButton
              mode="sign-in"
              loading={oauthSubmitting}
              onClick={() => void handleGoogleSignIn()}
            />
          </Stagger>

          <Stagger delay="100ms">
            <EmailDivider />
          </Stagger>
        </>
      )}

      <Stagger delay="140ms">
        <div className="space-y-1.5">
          <label htmlFor="si-email" className="text-sm font-medium text-muted-foreground">
            Email
          </label>
          <Input
            id="si-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@school.edu"
            className="h-12 text-base"
            required
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
          />
        </div>
      </Stagger>

      <Stagger delay="200ms">
        <PasswordField
          id="si-password"
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />
      </Stagger>

      <Stagger delay="260ms">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-xs text-primary transition-colors hover:text-primary/80"
          >
            Forgot password?
          </button>
        </div>
      </Stagger>

      {error && <ErrorBanner message={error} />}

      <Stagger delay="320ms">
        <SubmitButton loading={submitting} className="w-full">
          {submitting ? "Signing in…" : "Sign in"}
        </SubmitButton>
      </Stagger>
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {googleAuthEnabled && (
        <>
          <Stagger delay="40ms">
            <GoogleButton
              mode="sign-up"
              loading={oauthSubmitting}
              onClick={() => void handleGoogleSignIn()}
            />
          </Stagger>

          <Stagger delay="100ms">
            <EmailDivider />
          </Stagger>
        </>
      )}

      <Stagger delay="140ms">
        <div className="space-y-1.5">
          <label htmlFor="su-name" className="text-sm font-medium text-muted-foreground">
            Display name
          </label>
          <Input
            id="su-name"
            autoComplete="nickname"
            placeholder="What should we call you?"
            className="h-12 text-base"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.currentTarget.value)}
          />
        </div>
      </Stagger>

      <Stagger delay="200ms">
        <div className="space-y-1.5">
          <label htmlFor="su-email" className="text-sm font-medium text-muted-foreground">
            Email
          </label>
          <Input
            id="su-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@school.edu"
            className="h-12 text-base"
            required
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
          />
        </div>
      </Stagger>

      <Stagger delay="260ms">
        <div>
          <PasswordField
            id="su-password"
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            minLength={8}
          />
          <p className="mt-1.5 pl-0.5 text-xs text-muted-foreground">
            At least 8 characters.
          </p>
        </div>
      </Stagger>

      {error && <ErrorBanner message={error} />}
      {success && <SuccessBanner message={success} />}

      <Stagger delay="330ms">
        <SubmitButton loading={submitting} disabled={!!success} className="w-full">
          {submitting ? "Creating account…" : "Create account"}
        </SubmitButton>
      </Stagger>
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 px-4 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-[1.5rem] border border-white/10 bg-card/90 p-7 shadow-[0_28px_80px_-40px_rgba(8,10,18,0.85)] backdrop-blur-xl">
        <h2 className="font-serif text-xl tracking-[-0.03em] text-foreground">
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
              className="w-full rounded-full py-2.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="fp-email"
                className="text-sm font-medium text-muted-foreground"
              >
                Email
              </label>
              <Input
                id="fp-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
              />
            </div>

            {error && <ErrorBanner message={error} />}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
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
  const [slideDir, setSlideDir] = useState<"left" | "right">("right");
  const [showForgot, setShowForgot] = useState(false);
  const [nativeAuthError, setNativeAuthError] = useState<string | null>(null);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    setTab(initialTab);
    setSlideDir(initialTab === "sign-up" ? "right" : "left");
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
    setSlideDir(t === "sign-up" ? "right" : "left");
    setTab(t);
  }

  return (
    <main className="relative min-h-dvh overflow-x-hidden overflow-y-auto bg-background text-foreground">
      {/* Animated gradient overlay */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{ animation: "aurora-shift 18s ease-in-out infinite" }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: [
              "radial-gradient(ellipse 60% 50% at 20% 15%, rgba(188,194,255,0.08) 0%, transparent 100%)",
              "radial-gradient(ellipse 50% 60% at 80% 85%, rgba(212,187,255,0.08) 0%, transparent 100%)",
              "radial-gradient(ellipse 40% 40% at 55% 105%, rgba(255,185,84,0.07) 0%, transparent 100%)",
            ].join(", "),
          }}
        />
      </div>

      {/* Decorative blur circles */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-secondary/20 blur-3xl" />
      </div>

      <section className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-[calc(var(--safe-bottom)+1.25rem)] pt-[calc(var(--safe-top)+1.25rem)] sm:px-7">
        <header className="flex flex-col items-center text-center">
          <div className="relative">
            <div
              aria-hidden
              className="absolute inset-3 rounded-full bg-primary/20 blur-2xl"
            />
            <img
              src="/app-logo.svg"
              alt="Mabuh-ai"
              width={104}
              height={104}
              className="relative size-[6.5rem] drop-shadow-[0_16px_28px_rgba(0,0,0,0.28)]"
            />
          </div>
          <p className="-mt-1 text-xs font-medium tracking-wide text-muted-foreground">
            Your quiet campus companion
          </p>
        </header>

        <div className="flex flex-1 flex-col justify-center py-6">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-tertiary">
              {tab === "sign-in" ? "Welcome back" : "Start your space"}
            </p>
            <h1 className="mt-2 font-serif text-[2rem] leading-[1.08] tracking-[-0.04em]">
              {tab === "sign-in" ? "Take a breath. You’re back." : "A space that’s yours."}
            </h1>
            <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              {tab === "sign-in"
                ? "Sign in to continue your check-ins and reflections."
                : "Create an account for private check-ins, reflection, and support."}
            </p>
          </div>

          <div
            className="mb-5 flex min-h-12 rounded-full bg-surface-highest p-1"
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
                  "flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20",
                  tab === t
                    ? "bg-primary/20 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                    : "text-muted-foreground active:bg-white/5",
                )}
              >
                {t === "sign-in" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          {nativeAuthError && (
            <div className="mb-4">
              <ErrorBanner message={nativeAuthError} />
            </div>
          )}

          <div
            key={tab}
            role="tabpanel"
            className={cn(
              "animate-in fade-in-0 duration-200",
              slideDir === "right" ? "slide-in-from-right-4" : "slide-in-from-left-4",
            )}
          >
            {tab === "sign-in" ? (
              <SignInForm onForgotPassword={() => setShowForgot(true)} />
            ) : (
              <SignUpForm onSuccess={() => switchTab("sign-in")} />
            )}
          </div>
        </div>

        <footer className="text-center text-[0.6875rem] leading-5 text-muted-foreground/70">
          <p>Your reflections stay connected to your account.</p>
          <p>Mabuh-ai supports wellbeing and does not replace professional care.</p>
        </footer>
      </section>

      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
    </main>
  );
}

export default AuthPage;
