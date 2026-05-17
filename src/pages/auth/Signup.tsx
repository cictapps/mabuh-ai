import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuthActions } from "@/lib/auth";

export function Signup() {
  const { signUp } = useAuthActions();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);

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

      setInfo(
        result.needsEmailConfirmation
          ? "Check your email to confirm your account, then sign in."
          : "Account created. You can sign in now.",
      );
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12 text-foreground">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-tertiary/15 blur-3xl" />
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
      </div>

      <Card className="relative w-full max-w-md bg-card/80">
        <CardHeader className="space-y-3">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-tertiary/15 px-3.5 py-1.5 text-sm font-medium text-tertiary">
            <Sparkles className="size-4" />
            Begin gently
          </span>
          <CardTitle className="text-3xl tracking-[-0.03em]">Create your account</CardTitle>
          <CardDescription>A quiet place to reflect, at your own rhythm.</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="display-name" className="text-sm text-muted-foreground">
                Display name
              </label>
              <Input
                id="display-name"
                autoComplete="nickname"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.currentTarget.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm text-muted-foreground">
                Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm text-muted-foreground">
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
              />
              <p className="text-xs text-muted-foreground/80">At least 8 characters.</p>
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-400">
                {error}
              </p>
            )}
            {info && <p className="text-sm text-tertiary">{info}</p>}

            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? "Creating account..." : "Create account"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have one?{" "}
              <Link to="/login" className="text-tertiary hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

export default Signup;
