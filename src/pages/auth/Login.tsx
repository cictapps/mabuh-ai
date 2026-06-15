import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MoonStar } from "lucide-react";
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

export function Login() {
  const { signIn } = useAuthActions();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    <main
      className="relative flex min-h-screen items-center justify-center bg-background px-4 pb-12 text-foreground"
      style={{ paddingTop: "var(--app-screen-top)" }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-16 bottom-24 h-64 w-64 rounded-full bg-secondary/15 blur-3xl" />
      </div>

      <Card className="relative w-full max-w-md bg-card/80">
        <CardHeader className="space-y-3">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-surface-high px-3.5 py-1.5 text-sm text-muted-foreground">
            <MoonStar className="size-4 text-secondary" />
            Welcome back
          </span>
          <CardTitle className="text-3xl tracking-[-0.03em]">Sign in to your sanctuary</CardTitle>
          <CardDescription>Your space, your pace. We'll keep it safe.</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-400">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign in"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              New here?{" "}
              <Link to="/signup" className="text-tertiary hover:underline">
                Create an account
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

export default Login;
