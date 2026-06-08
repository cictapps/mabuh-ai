import { useEffect, useState } from "react";
import { Compass, Sparkles, MapPin, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";

type IntroOverlayProps = {
  open: boolean;
  onChoose: (option: "setup" | "start") => void;
};

const STEPS: { icon: typeof Compass; title: string; body: string }[] = [
  {
    icon: Compass,
    title: "A gentle path through your day",
    body: "Think of your day as a quiet sky. You'll have a few small waypoints to check in with yourself — no pressure to hit them all.",
  },
  {
    icon: MapPin,
    title: "Waypoints, not schedules",
    body: "Pick a few soft moments: a morning pause, a midday breath, an evening reflection. The app will gently nudge you when one is near.",
  },
  {
    icon: Wind,
    title: "Pause is always welcome",
    body: "Tough moment? Tap \"Need a pause\" anytime for a grounding breath, a kind thought, and quick access to support.",
  },
];

export function IntroOverlay({ open, onChoose }: IntroOverlayProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  if (!open) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div
      className="screen-enter fixed inset-0 z-50 flex items-end justify-center bg-black/55 px-4 pb-6 backdrop-blur-md sm:items-center sm:pb-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby="journey-intro-title"
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-[1.75rem] border border-[rgba(188,194,255,0.12)] bg-card p-6 shadow-[0_40px_120px_-40px_rgba(8,10,18,0.95)] backdrop-blur-xl"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,185,84,0.18),transparent_60%)] blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,rgba(188,194,255,0.18),transparent_60%)] blur-2xl"
        />

        <div className="relative flex items-center gap-2">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={
                "h-1 flex-1 rounded-full transition-colors " +
                (i <= step
                  ? "bg-gradient-to-r from-primary via-secondary to-tertiary"
                  : "bg-[rgba(188,194,255,0.12)]")
              }
            />
          ))}
        </div>

        <div className="relative mt-6 flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-[rgba(255,185,84,0.25)] bg-[rgba(255,185,84,0.12)] text-tertiary">
            <Icon className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Welcome to your journey
            </p>
            <h2
              id="journey-intro-title"
              className="mt-1 font-serif text-2xl leading-tight tracking-[-0.02em] text-foreground"
            >
              {current.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {current.body}
            </p>
          </div>
        </div>

        <div className="relative mt-6 space-y-2">
          {isLast ? (
            <>
              <Button
                size="lg"
                className="w-full"
                onClick={() => onChoose("setup")}
              >
                <Sparkles className="size-4" />
                Set up my waypoints
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="w-full"
                onClick={() => onChoose("start")}
              >
                Just start my day
              </Button>
            </>
          ) : (
            <Button
              size="lg"
              className="w-full"
              onClick={() => setStep((s) => s + 1)}
            >
              Continue
            </Button>
          )}
          <button
            type="button"
            onClick={() => onChoose("start")}
            className="block w-full pt-1 text-center text-xs font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {isLast ? "I'll explore on my own" : "Skip intro"}
          </button>
        </div>
      </div>
    </div>
  );
}
