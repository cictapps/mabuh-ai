import { useState } from "react";
import { Sparkles, AlertCircle, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useReflect, type ReflectContext } from "@/services/reflect";
import { useConnectivity } from "@/lib/connectivity";

interface ReflectWithAIPanelProps {
  /** The text to reflect on (a draft or an existing entry's content). */
  text: string;
  /** Build the context payload for the chat server request. */
  buildContext: () => ReflectContext;
  /** Optional label for the trigger button. */
  buttonLabel?: string;
  /** Compact mode hides the "what is this" copy. */
  compact?: boolean;
  /** Called when the user dismisses a finished reflection. */
  onClear?: () => void;
}

export function ReflectWithAIPanel({
  text,
  buildContext,
  buttonLabel = "Reflect with AI",
  compact = false,
  onClear,
}: ReflectWithAIPanelProps) {
  const { reply, error, busy, reflect, reset } = useReflect({ buildContext });
  const online = useConnectivity();
  const [open, setOpen] = useState(false);

  async function handleClick() {
    if (!text.trim()) {
      // still expand so the user sees the disclosure even on an empty draft
      setOpen(true);
      return;
    }
    setOpen(true);
    await reflect(text);
  }

  return (
    <div className="flex flex-col gap-3" data-stagger style={{ position: "relative" }}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => void handleClick()}
        disabled={busy || !online}
        aria-busy={busy}
        className="self-start"
      >
        <Sparkles className="size-3.5" />
        {busy
          ? "Thinking with you…"
          : online
            ? buttonLabel
            : "AI reflection needs internet"}
      </Button>

      {open && (
        <div className="flex flex-col gap-4">
          <Alert variant="info" className="border-white/10 bg-white/[0.04]">
            <Sparkles className="size-3.5" />
            <AlertTitle className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
              About this reflection
            </AlertTitle>
            <AlertDescription className="text-xs leading-relaxed text-muted-foreground">
              This is an AI-assisted reflection powered by{" "}
              <strong className="font-medium text-foreground/85">
                Mistral AI&apos;s free tier
              </strong>
              . On that tier, the prompts and replies you send may be used by Mistral to
              train and improve their models. Keep this in mind — share only what feels
              safe, and avoid personal details. Want a private alternative? Tap{" "}
              <em className="not-italic font-medium text-foreground/75">Mask Mode</em> or
              write it out by hand.
            </AlertDescription>
          </Alert>

          {error ? (
            <Alert variant="destructive" role="alert">
              <AlertCircle className="size-3.5" />
              <AlertTitle className="text-[0.7rem] uppercase tracking-[0.18em]">
                Reflection didn&apos;t land
              </AlertTitle>
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          ) : null}

          {reply ? (
            <div
              className="relative rounded-2xl border p-4 text-sm leading-relaxed"
              style={{
                background: "var(--surface-fuchsia-low)",
                borderColor: "var(--surface-fuchsia-medium)",
                color: "var(--text-on-surface)",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  reset();
                  setOpen(false);
                  onClear?.();
                }}
                aria-label="Close reflection"
                className="absolute right-2 top-2 grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
              <p
                className="mb-2 text-[0.65rem] uppercase tracking-[0.22em]"
                style={{ color: "var(--surface-fuchsia-medium)" }}
              >
                Mistral reflection
              </p>
              <p className="m-0 whitespace-pre-wrap pr-6 font-serif text-[15px] italic">
                {reply}
              </p>
              {!compact && (
                <p className="mt-3 text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground/55">
                  A gentle nudge, not advice. Trust your own knowing.
                </p>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
