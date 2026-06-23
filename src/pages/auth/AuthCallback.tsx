import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/lib/auth";

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

export function AuthCallback() {
  const initialize = useAuthStore((s) => s.initialize);
  const refresh = useAuthStore((s) => s.refresh);
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function finishAuthRedirect() {
      const params = new URLSearchParams(location.search);
      const redirectError = params.get("error_description") ?? params.get("error");

      if (redirectError) {
        setError(redirectError);
        return;
      }

      try {
        await initialize();
        await refresh();

        const settled = useAuthStore.getState();
        if (settled.session) {
          if (!cancelled) {
            navigate(getSafeNextPath(params.get("next")), { replace: true });
          }
          return;
        }

        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (!data.session) {
          setError("We could not finish signing you in. Please try again.");
          return;
        }

        if (!cancelled) {
          navigate(getSafeNextPath(params.get("next")), { replace: true });
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not finish authentication.",
          );
        }
      }
    }

    void finishAuthRedirect();

    return () => {
      cancelled = true;
    };
  }, [initialize, location.search, navigate, refresh]);

  return (
    <main
      className="relative flex min-h-screen items-center justify-center bg-background px-4 pb-12 text-foreground"
      style={{ paddingTop: "var(--app-screen-top)" }}
    >
      <div className="w-full max-w-md rounded-[1.5rem] border border-white/10 bg-card/80 p-8 shadow-[0_28px_80px_-40px_rgba(8,10,18,0.85)]">
        {error ? (
          <div className="space-y-5">
            <div className="space-y-2">
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-destructive/10 px-3.5 py-1.5 text-sm font-medium text-destructive">
                <AlertCircle className="size-4" />
                Auth error
              </span>
              <h1 className="font-serif text-3xl tracking-[-0.03em]">Sign-in stopped</h1>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <Button
              type="button"
              className="w-full"
              onClick={() => navigate("/login", { replace: true })}
            >
              Return to sign in
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Finishing sign-in...
          </div>
        )}
      </div>
    </main>
  );
}

export default AuthCallback;
