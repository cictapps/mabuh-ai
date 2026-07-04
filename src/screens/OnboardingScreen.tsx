import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useThemePreference } from "@/hooks/useThemePreference";
import {
  ArrowRight,
  BookOpen,
  Check,
  MessageCircleHeart,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
} from "lucide-react";

interface OnboardingScreenProps {
  onComplete: () => void;
}

type SlideVisual = {
  kind: "heart" | "moods" | "journal" | "support" | "ai-controls";
};

const AI_CONTEXT_PREVIEW_ROWS = ["Recent moods", "Journal entries", "Journey progress"];

interface OnboardingSlide {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  visual: SlideVisual;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: "welcome",
    eyebrow: "By students · for students",
    title: "A quiet space, made for students — by students.",
    body: "Mabuh-ai is a soft place to land between classes, deadlines, and the rest of life. Built by BSIS students of WVSU — CICT as a Mobile App Development project, it's made for fellow students who needed the same kind of space. The check-ins themselves are pressure-free — just a few minutes to notice how you're doing — and over time your Journey quietly reflects the rhythms you find.",
    bullets: [
      "Private by default — your entries stay yours",
      "Built for tired eyes and late nights",
      "Tone that meets you where you are",
    ],
    visual: { kind: "heart" },
  },
  {
    id: "checkin",
    eyebrow: "Daily check-in",
    title: "Notice, gently, every day.",
    body: "A 30-second check-in turns fuzzy feelings into something you can see. Tag what's present — sleep, school, friends, energy — and watch small shifts become clearer over time.",
    bullets: [
      "Pick a mood pebble that fits the moment",
      "Tag what shaped your day in a tap",
      "Spot your patterns in the Review tab",
    ],
    visual: { kind: "moods" },
  },
  {
    id: "reflect",
    eyebrow: "Reflect & grow",
    title: "A journal that actually listens.",
    body: "Drop a quick thought, save a memory, or capture an idea. Mabuh-ai quietly turns your entries into gentle insights so the bigger picture of your wellbeing stays visible — and yours.",
    bullets: [
      "Write short notes and check-in reflections",
      "Mask-Off mode for the unfiltered stuff",
      "Insights that respect your pace",
    ],
    visual: { kind: "journal" },
  },
  {
    id: "support",
    eyebrow: "Always with you",
    title: "Support, when things feel heavy.",
    body: "Talk things through with our empathetic AI companion, find local support across the Panay region, or reach a national crisis line in one tap. Whatever you're carrying, you don't have to carry it alone.",
    bullets: [
      "Gentle AI chat, available any hour",
      "Local support locator for Panay",
      "Urgent help button, one tap away",
    ],
    visual: { kind: "support" },
  },
  {
    id: "ai-controls",
    eyebrow: "Your choice",
    title: "Let the AI understand only what you choose.",
    body: "In Settings, you can let the AI companion use selected parts of your Mabuh-ai activity for more relevant support. These options start off, and you can change them anytime.",
    bullets: [
      "Choose context such as recent moods or journals",
      "Only enabled details are shared with the AI",
      "Turn any AI context option off in Settings",
    ],
    visual: { kind: "ai-controls" },
  },
];

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

function useTightViewport(): boolean {
  const [tight, setTight] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const evaluate = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setTight(w < 380 || h < 640);
    };
    evaluate();
    window.addEventListener("resize", evaluate);
    window.addEventListener("orientationchange", evaluate);
    return () => {
      window.removeEventListener("resize", evaluate);
      window.removeEventListener("orientationchange", evaluate);
    };
  }, []);
  return tight;
}

function AiControlsVisual() {
  const reducedMotion = usePrefersReducedMotion();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (reducedMotion) {
      setPhase(0);
      return;
    }

    const timeout = window.setTimeout(
      () => setPhase((current) => (current + 1) % 8),
      phase === 0 || phase === 4 ? 1_800 : 1_300,
    );
    return () => window.clearTimeout(timeout);
  }, [phase, reducedMotion]);

  const isEnabled = (index: number) => {
    if (phase >= 1 && phase <= 4) return index < Math.min(phase, 3);
    if (phase >= 5 && phase <= 7) return index >= phase - 4;
    return false;
  };

  return (
    <div
      aria-hidden
      style={{
        position: "relative",
        width: "100%",
        padding: "14px",
        borderRadius: 24,
        background:
          "linear-gradient(155deg, var(--surface-violet-high), var(--surface-fuchsia-low) 55%, rgba(255,185,84,0.08))",
        border: "1px solid var(--border-violet-soft)",
        boxShadow: "0 24px 60px -36px rgba(74, 60, 90, 0.28)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            display: "grid",
            placeItems: "center",
            width: 34,
            height: 34,
            borderRadius: 12,
            background: "var(--surface-violet-icon)",
            color: "var(--primary)",
            flexShrink: 0,
          }}
        >
          <ShieldCheck size={17} strokeWidth={1.8} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-on-surface)",
              fontWeight: 500,
              marginBottom: 2,
            }}
          >
            AI companion context
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--text-on-surface-strong)",
              lineHeight: 1.4,
            }}
          >
            You decide what can help personalize replies.
          </div>
        </div>
        <Settings size={15} color="var(--text-on-surface-strong)" />
      </div>

      {AI_CONTEXT_PREVIEW_ROWS.map((label, index) => {
        const enabled = isEnabled(index);
        return (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 10px",
              marginTop: 5,
              borderRadius: 14,
              background: enabled
                ? "var(--surface-violet-medium)"
                : "var(--surface-violet-low)",
              border: enabled
                ? "1px solid var(--surface-violet-icon)"
                : "1px solid var(--surface-violet-medium)",
              transition: reducedMotion
                ? "none"
                : "background 0.55s ease, border-color 0.55s ease",
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: enabled
                  ? "var(--text-on-surface)"
                  : "var(--text-on-surface-muted)",
                fontWeight: 500,
                flex: 1,
                transition: reducedMotion ? "none" : "color 0.55s ease",
              }}
            >
              {label}
            </span>
            <span
              style={{
                position: "relative",
                width: 36,
                height: 20,
                borderRadius: 999,
                background: enabled
                  ? "var(--surface-violet-icon-hover)"
                  : "var(--text-on-surface-faint)",
                boxShadow: enabled ? "0 0 16px var(--surface-violet-icon-hover)" : "none",
                flexShrink: 0,
                transition: reducedMotion
                  ? "none"
                  : "background 0.55s ease, box-shadow 0.55s ease",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  left: 2,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: enabled ? "var(--background)" : "var(--text-kicker)",
                  transform: enabled ? "translateX(16px)" : "translateX(0)",
                  transition: reducedMotion
                    ? "none"
                    : "transform 0.55s ease, background 0.55s ease",
                }}
              />
            </span>
          </div>
        );
      })}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          marginTop: 10,
          color: "var(--text-warn-quote)",
          fontSize: 10.5,
          lineHeight: 1.4,
        }}
      >
        <Settings size={12} />
        Settings → AI companion context
      </div>
    </div>
  );
}

function SlideVisual({ kind }: { kind: SlideVisual["kind"] }) {
  const { resolved: resolvedTheme } = useThemePreference();
  const logoSrc =
    resolvedTheme === "light" ? "/app-logo-dark.svg" : "/app-logo-light.svg";
  if (kind === "heart") {
    return (
      <div
        aria-hidden
        style={{
          position: "relative",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "clamp(8px, 3vw, 20px) 0 clamp(0px, 1.2vw, 4px)",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: "clamp(150px, 52vw, 220px)",
            height: "clamp(150px, 52vw, 220px)",
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 50% 40%, rgba(255,185,84,0.32), var(--surface-violet-icon) 55%, transparent 75%)",
            filter: "blur(8px)",
            animation: "onb-pulse 6s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "relative",
            width: "clamp(96px, 28vw, 132px)",
            height: "clamp(96px, 28vw, 132px)",
            borderRadius: "50%",
            background:
              "linear-gradient(160deg, var(--surface-violet-icon-hover), var(--surface-fuchsia-medium) 60%, rgba(255,185,84,0.55))",
            boxShadow:
              "0 28px 60px -28px var(--surface-violet-icon-hover), 0 0 48px -8px var(--surface-fuchsia-medium)",
            display: "grid",
            placeItems: "center",
            color: "#1a1c2b",
            animation:
              "onb-glow 4.5s ease-in-out infinite, onb-float 4.5s ease-in-out infinite",
            willChange: "transform, box-shadow",
          }}
        >
          <img
            src={logoSrc}
            alt=""
            aria-hidden
            style={{
              width: "clamp(54px, 15vw, 72px)",
              height: "clamp(54px, 15vw, 72px)",
              filter:
                "drop-shadow(0 0 6px rgba(255,255,255,0.6)) drop-shadow(0 0 16px var(--surface-fuchsia-medium)) drop-shadow(0 0 28px var(--surface-violet-icon-hover))",
            }}
          />
        </div>
        <span
          style={{
            position: "absolute",
            top: 6,
            right: "22%",
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "rgba(255,185,84,0.75)",
            boxShadow: "0 0 18px rgba(255,185,84,0.5)",
            animation: "onb-twinkle 3.2s ease-in-out infinite",
          }}
        />
        <span
          style={{
            position: "absolute",
            bottom: 12,
            left: "20%",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "var(--surface-fuchsia-medium)",
            boxShadow: "0 0 14px var(--surface-fuchsia-medium)",
            animation: "onb-twinkle 3.2s ease-in-out infinite",
            animationDelay: "1.6s",
          }}
        />
      </div>
    );
  }

  if (kind === "moods") {
    const pebbles = [
      { label: "Calm", color: "#6dba84", x: "18%", y: "32%", delay: "0s" },
      { label: "Okay", color: "#d4b84e", x: "70%", y: "22%", delay: "0.7s" },
      { label: "Worried", color: "#e0853c", x: "76%", y: "70%", delay: "1.4s" },
      { label: "Happy", color: "#5bb89e", x: "24%", y: "72%", delay: "2.1s" },
      { label: "Stressed", color: "#e05c6e", x: "48%", y: "48%", delay: "0.35s" },
    ];
    return (
      <div
        aria-hidden
        style={{
          position: "relative",
          width: "100%",
          height: "clamp(160px, 44vw, 200px)",
          marginTop: 4,
          marginBottom: 4,
          borderRadius: 28,
          background:
            "linear-gradient(160deg, var(--surface-violet-high), rgba(255,185,84,0.08) 60%, var(--surface-fuchsia-low))",
          border: "1px solid var(--border-violet-soft)",
          boxShadow: "0 24px 60px -36px rgba(74, 60, 90, 0.28)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 30% 110%, rgba(255,185,84,0.18), transparent 55%)",
            pointerEvents: "none",
          }}
        />
        {pebbles.map((p) => (
          <div
            key={p.label}
            style={{
              position: "absolute",
              left: p.x,
              top: p.y,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div
              className="onb-float"
              style={{
                animationDelay: p.delay,
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 13px 7px 9px",
                borderRadius: 999,
                background: "var(--ring-node-bg-soft)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                border: "1px solid var(--border-violet-soft)",
                boxShadow: "0 10px 24px -16px rgba(0,0,0,0.7)",
              }}
            >
              <span
                className="onb-float-dot"
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: p.color,
                  boxShadow: `0 0 10px ${p.color}80`,
                  animationDelay: p.delay,
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-on-surface)",
                  fontWeight: 500,
                  letterSpacing: "0.01em",
                }}
              >
                {p.label}
              </span>
            </div>
          </div>
        ))}
        <Sparkles
          size={14}
          style={{
            position: "absolute",
            top: 14,
            right: 16,
            color: "rgba(255,185,84,0.7)",
          }}
        />
      </div>
    );
  }

  if (kind === "journal") {
    return (
      <div
        aria-hidden
        style={{
          position: "relative",
          width: "100%",
          padding: "6px 4px 0",
        }}
      >
        <div
          style={{
            position: "relative",
            padding: "18px 56px 16px 18px",
            borderRadius: 22,
            background:
              "linear-gradient(160deg, var(--surface-violet-high), rgba(255,185,84,0.10) 65%, var(--surface-fuchsia-low))",
            border: "1px solid var(--border-violet-soft)",
            boxShadow: "0 24px 60px -36px rgba(74, 60, 90, 0.28)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <BookOpen size={14} color="rgba(255,185,84,0.85)" />
            <span
              style={{
                fontSize: 11,
                letterSpacing: "1.2px",
                textTransform: "uppercase",
                color: "var(--text-on-surface-strong)",
                fontWeight: 500,
              }}
            >
              Today's note
            </span>
          </div>
          <div
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 15,
              lineHeight: 1.55,
              color: "var(--text-on-surface)",
              fontStyle: "italic",
              wordBreak: "break-word",
              overflowWrap: "anywhere",
            }}
          >
            "Felt scattered before the exam, but the breathing pebble helped me land. Tiny
            win — counting it."
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              rowGap: 6,
              marginTop: 14,
            }}
          >
            {["#sleep", "#school", "#breath"].map((t) => (
              <span
                key={t}
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: "var(--surface-violet-medium)",
                  color: "var(--text-on-surface-strong)",
                  fontSize: 10.5,
                  letterSpacing: "0.02em",
                  whiteSpace: "nowrap",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            right: 6,
            top: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 30% 30%, rgba(255,185,84,0.7), var(--surface-violet-icon-hover))",
            boxShadow: "0 14px 30px -16px rgba(255,185,84,0.55)",
            color: "#1a1c2b",
            flexShrink: 0,
            zIndex: 1,
          }}
        >
          <Sparkles size={16} strokeWidth={1.8} />
        </div>
      </div>
    );
  }

  if (kind === "support") {
    return (
      <div
        aria-hidden
        style={{
          position: "relative",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "clamp(8px, 2.4vw, 12px) clamp(10px, 3vw, 14px)",
            borderRadius: 18,
            background: "var(--surface-violet-medium)",
            border: "1px solid var(--border-violet-soft)",
          }}
        >
          <div
            style={{
              display: "grid",
              placeItems: "center",
              width: 34,
              height: 34,
              borderRadius: 12,
              background:
                "linear-gradient(140deg, var(--surface-violet-icon-hover), var(--surface-fuchsia-medium))",
              color: "#1a1c2b",
              flexShrink: 0,
            }}
          >
            <MessageCircleHeart size={16} strokeWidth={1.8} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-on-surface)",
                fontWeight: 500,
                marginBottom: 2,
              }}
            >
              Companion chat
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--surface-violet-icon-hover)",
                lineHeight: 1.4,
              }}
            >
              Empathetic, available any hour.
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "clamp(8px, 2.4vw, 12px) clamp(10px, 3vw, 14px)",
            borderRadius: 18,
            background: "rgba(255,185,84,0.10)",
            border: "1px solid rgba(255,185,84,0.18)",
          }}
        >
          <div
            style={{
              display: "grid",
              placeItems: "center",
              width: 34,
              height: 34,
              borderRadius: 12,
              background: "rgba(255,185,84,0.85)",
              color: "#1a1c2b",
              flexShrink: 0,
            }}
          >
            <Sun size={16} strokeWidth={1.8} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-on-surface)",
                fontWeight: 500,
                marginBottom: 2,
              }}
            >
              Urgent help
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-warn)",
                lineHeight: 1.4,
              }}
            >
              One tap to crisis hotlines.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <AiControlsVisual />;
}

function PaginationDots({
  total,
  active,
  onSelect,
}: {
  total: number;
  active: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Onboarding progress"
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        justifyContent: "center",
        padding: "6px 0",
      }}
    >
      {Array.from({ length: total }).map((_, i) => {
        const isActive = i === active;
        return (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => onSelect(i)}
            style={{
              appearance: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              background: "transparent",
              width: isActive ? 26 : 8,
              height: 8,
              borderRadius: 999,
              backgroundColor: isActive
                ? "var(--surface-violet-icon-hover)"
                : "var(--surface-violet-icon-hover)",
              transition: "width 0.3s ease, background-color 0.3s ease",
            }}
          />
        );
      })}
    </div>
  );
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const reducedMotion = usePrefersReducedMotion();
  const { resolved: resolvedTheme } = useThemePreference();
  const logoSrc =
    resolvedTheme === "light" ? "/app-logo-dark.svg" : "/app-logo-light.svg";
  const tight = useTightViewport();
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const slide = SLIDES[index]!;
  const isLast = index === SLIDES.length - 1;
  const [skipFuture, setSkipFuture] = useState(true);

  const eyebrowLetter = useMemo(
    () => slide.eyebrow.charAt(0).toUpperCase(),
    [slide.eyebrow],
  );

  const goTo = (next: number) => {
    if (next === index) return;
    setDirection(next > index ? 1 : -1);
    setIndex(Math.max(0, Math.min(SLIDES.length - 1, next)));
  };

  const next = () => {
    if (isLast) {
      onComplete();
      return;
    }
    goTo(index + 1);
  };

  const prev = () => {
    if (index > 0) goTo(index - 1);
  };

  const handleSkip = () => {
    onComplete();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleSkip();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, isLast]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
    touchEndX.current = null;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = () => {
    if (touchStartX.current == null || touchEndX.current == null) return;
    const dx = touchEndX.current - touchStartX.current;
    if (Math.abs(dx) < 50) return;
    if (dx < 0) next();
    else prev();
  };

  const slideStyle: React.CSSProperties = reducedMotion
    ? { opacity: 1, transform: "none" }
    : {
        animation: `${direction === 1 ? "onb-slide-in" : "onb-slide-in-left"} 0.45s cubic-bezier(0.22, 1, 0.36, 1) both`,
      };

  const visualNode: ReactNode = <SlideVisual kind={slide.visual.kind} />;

  return (
    <div
      role="region"
      aria-label="Onboarding"
      style={{
        position: "relative",
        minHeight: "100dvh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        background:
          "radial-gradient(circle at 20% 0%, var(--surface-violet-icon), transparent 55%), radial-gradient(circle at 100% 100%, rgba(255,185,84,0.14), transparent 50%), var(--background)",
        overflowX: "hidden",
        color: "var(--text-on-surface)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 50% 110%, var(--surface-fuchsia-low), transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <header
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: tight
            ? "var(--app-header-top) 16px 4px"
            : "var(--app-screen-top) 20px 6px",
          zIndex: 2,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 10,
              overflow: "hidden",
              boxShadow: "0 14px 30px -16px var(--surface-violet-icon-hover)",
              flexShrink: 0,
            }}
            aria-hidden
          >
            <img
              src={logoSrc}
              alt=""
              width={32}
              height={32}
              style={{ display: "block", width: "100%", height: "100%" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
            <span
              className="font-serif"
              style={{ fontSize: 16, fontWeight: 500, letterSpacing: "-0.01em" }}
            >
              Mabuh-ai
            </span>
            <span
              style={{
                fontSize: 10,
                letterSpacing: "1.4px",
                textTransform: "uppercase",
                color: "var(--text-on-surface-strong)",
                fontWeight: 500,
              }}
            >
              Your sanctuary
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSkip}
          style={{
            appearance: "none",
            border: "none",
            background: "var(--surface-violet-medium)",
            color: "var(--text-on-surface-strong)",
            fontSize: 12.5,
            fontWeight: 500,
            padding: "8px 14px",
            borderRadius: 999,
            cursor: "pointer",
            transition: "background 0.2s ease, color 0.2s ease",
            fontFamily: "var(--font-sans)",
          }}
          onMouseDown={(e) =>
            (e.currentTarget.style.background = "var(--surface-violet-icon)")
          }
          onMouseUp={(e) =>
            (e.currentTarget.style.background = "var(--surface-violet-medium)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "var(--surface-violet-medium)")
          }
        >
          Skip
        </button>
      </header>

      <main
        key={slide.id}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          position: "relative",
          flex: "1 1 auto",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          padding: tight ? "4px 20px 0" : "8px 24px 0",
          zIndex: 1,
          ...slideStyle,
        }}
      >
        <div
          style={{
            flex: "1 1 auto",
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
            overscrollBehavior: "contain",
            WebkitOverflowScrolling: "touch",
            paddingRight: tight ? 4 : 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: tight ? 8 : 14,
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 26,
                height: 26,
                borderRadius: 9,
                background: "rgba(255,185,84,0.18)",
                color: "var(--icon-warm)",
                fontFamily: "var(--font-serif)",
                fontSize: 14,
                fontWeight: 600,
                lineHeight: 1,
                flexShrink: 0,
              }}
              aria-hidden
            >
              <span
                style={{
                  display: "block",
                  lineHeight: 1,
                  transform: "translateY(0.5px)",
                }}
              >
                {eyebrowLetter}
              </span>
            </span>
            <span
              style={{
                fontSize: 11,
                letterSpacing: "1.4px",
                textTransform: "uppercase",
                color: "var(--text-on-surface-strong)",
                fontWeight: 500,
              }}
            >
              {slide.eyebrow}
            </span>
          </div>

          <h1
            className="font-serif"
            style={{
              fontSize: tight ? "clamp(22px, 6.4vw, 28px)" : "clamp(26px, 7vw, 34px)",
              fontWeight: 500,
              lineHeight: 1.14,
              color: "var(--text-on-surface)",
              letterSpacing: "-0.025em",
              margin: 0,
              marginBottom: tight ? 8 : 14,
            }}
          >
            {slide.title}
          </h1>

          <p
            style={{
              fontSize: tight ? 13.5 : 14.5,
              lineHeight: 1.55,
              color: "var(--text-on-surface-strong)",
              margin: 0,
              marginBottom: tight ? 12 : 18,
              maxWidth: 360,
            }}
          >
            {slide.body}
          </p>

          <div style={{ marginBottom: tight ? 12 : 18 }}>{visualNode}</div>

          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: tight ? 7 : 10,
              paddingBottom: tight ? 8 : 0,
            }}
          >
            {slide.bullets.map((b) => (
              <li
                key={b}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  fontSize: tight ? 12.5 : 13.5,
                  color: "var(--text-on-surface-muted)",
                  lineHeight: 1.45,
                }}
              >
                <span
                  aria-hidden
                  style={{
                    display: "grid",
                    placeItems: "center",
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "rgba(109,186,132,0.18)",
                    color: "var(--icon-success)",
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  <Check size={12} strokeWidth={2.4} />
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </main>

      <footer
        style={{
          position: "relative",
          zIndex: 2,
          padding: tight
            ? "8px 16px calc(env(safe-area-inset-bottom, 0px) + 24px)"
            : "10px 20px calc(env(safe-area-inset-bottom, 0px) + 28px)",
          display: "flex",
          flexDirection: "column",
          gap: tight ? 8 : 14,
          flexShrink: 0,
        }}
      >
        <PaginationDots total={SLIDES.length} active={index} onSelect={goTo} />

        {isLast && (
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 12.5,
              color: "var(--text-on-surface-strong)",
              cursor: "pointer",
              userSelect: "none",
              padding: "4px 4px",
            }}
          >
            <span
              role="checkbox"
              aria-checked={skipFuture}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  setSkipFuture((v) => !v);
                }
              }}
              onClick={() => setSkipFuture((v) => !v)}
              style={{
                position: "relative",
                width: 18,
                height: 18,
                borderRadius: 6,
                background: skipFuture
                  ? "linear-gradient(140deg, var(--surface-violet-icon-hover), var(--surface-fuchsia-medium))"
                  : "var(--surface-violet-medium)",
                border: "1px solid var(--border-violet-high)",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                cursor: "pointer",
                transition: "background 0.2s ease",
              }}
            >
              {skipFuture && <Check size={12} strokeWidth={2.6} color="#1a1c2b" />}
            </span>
            <span onClick={() => setSkipFuture((v) => !v)}>
              Don't show this welcome again
            </span>
          </label>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          {index > 0 && !isLast ? (
            <button
              type="button"
              onClick={prev}
              style={{
                appearance: "none",
                border: "1px solid var(--border-violet-medium)",
                background: "var(--surface-violet-medium)",
                color: "var(--text-on-surface-strong)",
                borderRadius: 999,
                padding: "0 18px",
                height: 48,
                fontSize: 13.5,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                transition: "background 0.2s ease",
              }}
            >
              Back
            </button>
          ) : null}
          <button
            type="button"
            onClick={next}
            style={{
              flex: 1,
              appearance: "none",
              border: "none",
              cursor: "pointer",
              height: 48,
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.01em",
              color: "var(--primary-foreground)",
              background:
                "linear-gradient(120deg, var(--primary) 0%, var(--secondary) 55%, var(--tertiary) 130%)",
              boxShadow:
                "0 22px 50px -22px var(--surface-violet-icon-hover), inset 0 1px 0 rgba(255,255,255,0.25)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontFamily: "var(--font-sans)",
              transition: "transform 0.15s ease, box-shadow 0.2s ease, filter 0.2s ease",
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = "translateY(1px)";
              e.currentTarget.style.filter = "brightness(0.97)";
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.filter = "brightness(1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.filter = "brightness(1)";
            }}
          >
            {isLast ? "Begin" : "Continue"}
            <ArrowRight size={16} strokeWidth={2.2} />
          </button>
        </div>
      </footer>
    </div>
  );
};

export default OnboardingScreen;
