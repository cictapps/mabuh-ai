import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  Heart,
  Sparkles,
  BookOpen,
  Activity,
  Users,
  Gauge,
  Timer,
  PenLine,
  ChevronDown,
  X,
} from "lucide-react";
import type {
  ActivitySelections,
  ActivitySectionId,
  MoodType,
  SocialInteraction,
} from "../types";
import { getMoodMeta, SUGGESTIONS } from "../data";
import { MoodRingPicker } from "../components/mood/MoodRingPicker";
import { MoodTagGroup } from "../components/mood/MoodTagGroup";
import { JournalInput } from "../components/mood/JournalInput";
import { SaveMoodButton } from "../components/mood/SaveMoodButton";
import { SavedAffirmationDialog } from "../components/mood/SavedAffirmationDialog";
import { SocialTrackingPanel } from "../components/mood/SocialTrackingPanel";
import { ActivitySectionsPanel } from "../components/mood/ActivitySectionsPanel";
import { SuggestionCard } from "../components/suggestions/SuggestionCard";

interface CheckInScreenProps {
  selectedMood: MoodType | null;
  selectedTags: string[];
  journal: string;
  schoolLoad: number;
  activityMinutes: number;
  dayNote: string;
  socialInteractions: SocialInteraction[];
  activitiesBySection: ActivitySelections;
  /**
   * How many check-ins the user has already saved today. Used for
   * "add another" affordance and copy.
   */
  todaysCount: number;
  onSelectMood: (mood: MoodType) => void;
  onToggleTag: (tag: string) => void;
  onJournalChange: (val: string) => void;
  onSchoolLoadChange: (val: number) => void;
  onActivityMinutesChange: (val: number) => void;
  onDayNoteChange: (val: string) => void;
  onAddSocialInteraction: () => void;
  onRemoveSocialInteraction: (id: string) => void;
  onUpdateSocialInteraction: (id: string, update: Partial<SocialInteraction>) => void;
  onToggleActivity: (section: ActivitySectionId, label: string) => void;
  onAddCustomActivity: (section: ActivitySectionId, label: string) => void;
  onSave: () => Promise<boolean>;
}

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

// A monotonically-increasing "session token". It bumps on:
//  - the first mount of the screen,
//  - whenever the tab/window returns to the foreground
//    (visibilitychange -> visible, focus, pageshow).
// Each bump is a new "visit" so the subline can pick a fresh variant.
function useSessionToken() {
  const [token, setToken] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const bump = () => setToken((t) => t + 1);
    const onVisibility = () => {
      if (document.visibilityState === "visible") bump();
    };
    window.addEventListener("focus", bump);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", bump);
    return () => {
      window.removeEventListener("focus", bump);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", bump);
    };
  }, []);
  return token;
}

function hexToRgba(hex: string, alpha: number) {
  const cleaned = hex.replace("#", "");
  const bigint = parseInt(
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((c) => c + c)
          .join("")
      : cleaned,
    16,
  );
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function timeBucket(hour: number): "morning" | "midday" | "evening" | "night" {
  if (hour < 5) return "night";
  if (hour < 12) return "morning";
  if (hour < 17) return "midday";
  if (hour < 21) return "evening";
  return "night";
}

// Tone bank for the no-mood-selected "hello" subline, keyed by time bucket.
// Several variants per bucket so it never feels templated; a seeded picker
// (see `subline` useMemo below) rotates between them on each visit.
const MOOD_HELLO: Record<"morning" | "midday" | "evening" | "night", string[]> = {
  morning: [
    "Good morning. Let's name how today is starting.",
    "A small hello before the day unfolds. How is it feeling?",
    "Morning check-in — what color is closest to home?",
  ],
  midday: [
    "Midday hello. How has the day been sitting with you?",
    "A quiet pause in the middle of things. How are you?",
    "Take a breath. What does right now feel like?",
  ],
  evening: [
    "Evening hello. How did today actually go?",
    "Before the day ends, a small check-in.",
    "Winding down — let's land softly together.",
  ],
  night: [
    "Quiet hour. How is your heart, really?",
    "A gentle check-in for the late hours.",
    "Before rest, a small honest moment with yourself.",
  ],
};

const MOOD_ACKNOWLEDGMENTS: Record<MoodType, string[]> = {
  stressed: [
    "I hear you. That sounds really heavy, and it's okay to feel it without fixing everything tonight.",
    "Stress can fill the whole room. You're not weak for noticing it and needing a softer pace.",
    "Take one slow breath. You don't have to solve this right now; naming it is already care.",
    "Carrying a lot today? Just naming it helps, and you can take the next part gently.",
  ],
  sad: [
    "I'm sorry you're sitting with this. It's allowed to feel heavy, even if no one else sees it.",
    "Sadness deserves a place. You don't have to push through it or make it smaller right now.",
    "Just notice it for a moment without trying to fix anything yet. A soft pause still counts.",
    "This kind of low is real. You don't have to explain it away or earn a reason to rest.",
  ],
  worried: [
    "Worry can be loud. You're not alone in this, and you can meet it one thought at a time.",
    "Anxious thoughts can spin. Let's slow one down together and leave the rest for later.",
    "It's okay to not have answers yet. You just need a soft place to land for a minute.",
    "Your mind is working hard. Let's give it a small rest before asking it for anything more.",
  ],
  tired: [
    "Tired is your body asking for a softer pace. Listen to it before the day asks for more.",
    "Low energy is not a failure; it's information. You can move gently from here.",
    "Rest is part of showing up. Even a small pause can help your body feel less alone.",
    "You don't have to perform today. Quiet is enough, and doing less can still be care.",
  ],
  okay: [
    "Okay is a perfectly good place to be. A steady middle still deserves to be noticed.",
    "Steady is enough. Not every day has to be a big feeling to be worth checking in.",
    "Alright is allowed. A quiet middle is still a real place, and it can hold you gently.",
    "A calm, ordinary kind of day has its own good. Let the small steadiness be enough.",
  ],
  calm: [
    "I love that you're feeling this. Let it settle in and take up a little more space.",
    "A soft, steady mood is here. Breathe into it for a moment and let it stay.",
    "This is a kind place to be. Stay with it as long as you like before moving on.",
    "Calm is worth noticing. It's doing good work inside you, even in small ways.",
  ],
  happy: [
    "Oh, this is wonderful. Hold onto this feeling and let it mark the day gently.",
    "A bright moment is here. Let it land, because you get to enjoy this too.",
    "This is the kind of day worth remembering later. Give the good parts a name.",
    "Lovely to see you here, feeling this way. Soak it in and let it be real.",
  ],
};

// Tiny seeded PRNG so a given (bucket, mood, session) combo always
// resolves to the same variant, but a new session/visit yields a new line.
function seededRandom(seed: number) {
  // mulberry32 — small, fast, good enough for picking a message
  let t = seed >>> 0;
  return function next() {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pickVariant<T>(options: T[], seed: number): T {
  if (options.length === 0) {
    throw new Error("pickVariant requires at least one option");
  }
  const rnd = seededRandom(seed);
  const idx = Math.floor(rnd() * options.length) % options.length;
  return options[idx];
}

function pickNonRepeatingIndex(
  optionCount: number,
  seed: number,
  previousIndex: number | undefined,
): number {
  if (optionCount <= 0) {
    throw new Error("pickNonRepeatingIndex requires at least one option");
  }
  const rnd = seededRandom(seed);
  let idx = Math.floor(rnd() * optionCount) % optionCount;
  if (optionCount > 1 && idx === previousIndex) {
    idx = (idx + 1) % optionCount;
  }
  return idx;
}

function hashSeed(parts: (string | number)[]): number {
  // FNV-1a 32-bit
  let h = 0x811c9dc5;
  for (const part of parts) {
    const s = String(part);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
  }
  return h >>> 0;
}

const SUPPORT_HINT_MOODS: ReadonlySet<MoodType> = new Set<MoodType>([
  "stressed",
  "sad",
  "worried",
]);

const helperStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--text-on-surface-muted)",
  lineHeight: 1.55,
  margin: 0,
};

const sectionCardStyle: React.CSSProperties = {
  padding: "14px 0",
  display: "flex",
  flexDirection: "column",
  gap: 12,
  minHeight: 0,
};

const detailsStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 1,
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

function Stepper({
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  unit,
  disabled,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
}) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  const dec = () => onChange(clamp(value - step));
  const inc = () => onChange(clamp(value + step));
  const decDisabled = disabled || value <= min;
  const incDisabled = disabled || value >= max;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "6px 0",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span
        style={{
          fontFamily: "Plus Jakarta Sans, sans-serif",
          fontVariantNumeric: "tabular-nums",
          fontSize: 14,
          fontWeight: 600,
          color: "var(--text-on-surface)",
          flex: 1,
          minWidth: 0,
        }}
      >
        {value}
        {unit ? (
          <span
            style={{ color: "var(--text-on-surface-muted)", marginLeft: 4, fontSize: 12 }}
          >
            {unit}
          </span>
        ) : null}
      </span>
      <StepperButton
        onClick={dec}
        disabled={decDisabled}
        ariaLabel="Decrease"
        symbol="−"
      />
      <StepperButton
        onClick={inc}
        disabled={incDisabled}
        ariaLabel="Increase"
        symbol="+"
      />
    </div>
  );
}

function StepperButton({
  onClick,
  disabled,
  ariaLabel,
  symbol,
}: {
  onClick: () => void;
  disabled: boolean;
  ariaLabel: string;
  symbol: string;
}) {
  const [pressed, setPressed] = useState(false);
  const baseBg = "rgba(188,194,255,0.10)";
  const hoverBg = "rgba(188,194,255,0.18)";
  const activeBg = "rgba(188,194,255,0.28)";
  const restingBg = disabled ? baseBg : pressed ? activeBg : baseBg;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      onPointerDown={() => !disabled && setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        border: "none",
        background: restingBg,
        color: "var(--text-on-surface)",
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: 18,
        fontWeight: 700,
        display: "grid",
        placeItems: "center",
        transition: "background 0.15s ease, transform 0.15s ease",
        transform: pressed ? "scale(0.92)" : "scale(1)",
        touchAction: "manipulation",
        WebkitTapHighlightColor: "transparent",
      }}
      onMouseEnter={(e) => {
        if (!disabled && !pressed) e.currentTarget.style.background = hoverBg;
      }}
      onMouseLeave={(e) => {
        if (!disabled) e.currentTarget.style.background = baseBg;
      }}
    >
      {symbol}
    </button>
  );
}

function LoadMeter({
  value,
  max = 5,
  color,
}: {
  value: number;
  max?: number;
  color: string;
}) {
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: `repeat(${max}, 1fr)`,
          gap: 4,
          minWidth: 0,
        }}
      >
        {Array.from({ length: max }, (_, i) => {
          const isFilled = i < value;
          return (
            <span
              key={i}
              style={{
                height: 6,
                borderRadius: 999,
                background: isFilled ? color : "rgba(188,194,255,0.10)",
                opacity: isFilled ? 0.9 : 1,
                transition: "background 0.2s ease",
              }}
            />
          );
        })}
      </div>
      <span
        style={{
          fontSize: 11,
          color: "var(--text-on-surface-muted)",
          fontVariantNumeric: "tabular-nums",
          flexShrink: 0,
          minWidth: 32,
          textAlign: "right",
        }}
      >
        {Math.round(pct * 100)}%
      </span>
    </div>
  );
}

interface CheckInDetailCardProps {
  icon: React.ReactNode;
  title: string;
  filled: boolean;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  summary?: React.ReactNode;
  emptyHint?: string;
}

const IDLE_PROMPTS: { icon: React.ReactNode; label: string; hint: string }[] = [
  {
    icon: <Heart size={13} />,
    label: "Name how you feel",
    hint: "Tap the color that feels closest to home.",
  },
  {
    icon: <Sparkles size={13} />,
    label: "Add a word or two",
    hint: "Just a small word is more than enough.",
  },
  {
    icon: <BookOpen size={13} />,
    label: "Save when you're ready",
    hint: "There's no rush. Your mood is what matters.",
  },
];
function IdlePrompts() {
  return (
    <div
      aria-hidden={false}
      className="relative"
      style={{
        zIndex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div className="relative">
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 10,
            marginBottom: 2,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <span
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "var(--text-kicker)",
              }}
            >
              Just between us
            </span>
            <span
              className="font-serif"
              style={{
                display: "block",
                marginTop: 6,
                fontSize: 20,
                lineHeight: 1.2,
                fontWeight: 500,
                letterSpacing: "-0.03em",
                color: "var(--text-on-surface)",
              }}
            >
              A tiny pause before you choose.
            </span>
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 4,
            marginTop: 14,
          }}
        >
          {IDLE_PROMPTS.map((p, i) => (
            <div
              key={p.label}
              style={{
                display: "grid",
                gridTemplateColumns: "34px 1fr auto",
                alignItems: "center",
                gap: 12,
                minHeight: 54,
                padding: "8px 0",
              }}
            >
              <span
                style={{
                  display: "grid",
                  placeItems: "center",
                  width: 34,
                  height: 34,
                  color: "var(--icon-warm)",
                }}
                aria-hidden
              >
                {p.icon}
              </span>
              <span style={{ minWidth: 0 }}>
                <span
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-on-surface-strong)",
                    lineHeight: 1.25,
                  }}
                >
                  {p.label}
                </span>
                <span
                  style={{
                    display: "block",
                    marginTop: 2,
                    fontSize: 11.5,
                    color: "var(--text-on-surface-strong)",
                    opacity: 0.78,
                    lineHeight: 1.4,
                  }}
                >
                  {p.hint}
                </span>
              </span>
              <span
                style={{
                  display: "grid",
                  placeItems: "center",
                  width: 24,
                  height: 24,
                  borderRadius: 10,
                  color: "var(--text-on-surface-soft)",
                  fontSize: 10,
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {i + 1}
              </span>
            </div>
          ))}
        </div>
        <p
          style={{
            fontSize: 12,
            color: "var(--text-on-surface)",
            opacity: 0.78,
            margin: "14px 0 0",
            lineHeight: 1.55,
          }}
        >
          There's nothing to get right here. This is simply a quiet place to notice what
          is true right now.
        </p>
      </div>
    </div>
  );
}
function CheckInDetailCard({
  icon,
  title,
  filled,
  expanded,
  onToggle,
  children,
  summary,
  emptyHint,
}: CheckInDetailCardProps) {
  const headerId = `checkin-card-${title.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-16 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(188,194,255,0.12),transparent_60%)] blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-16 -left-10 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(212,187,255,0.08),transparent_60%)] blur-2xl"
      />
      <div className="relative">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={`${headerId}-body`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            width: "100%",
            padding: "14px 16px",
            background: "transparent",
            border: "none",
            outline: "none",
            cursor: "pointer",
            textAlign: "left",
            fontFamily: "Plus Jakarta Sans, sans-serif",
            color: "inherit",
            transition: "background 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(188,194,255,0.04)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <span
            style={{
              display: "grid",
              placeItems: "center",
              width: 30,
              height: 30,
              borderRadius: 9,
              background: filled ? "rgba(188,194,255,0.16)" : "rgba(188,194,255,0.07)",
              color: filled ? "var(--text-on-surface)" : "var(--text-on-surface-soft)",
              transition: "background 0.2s ease, color 0.2s ease",
              flexShrink: 0,
            }}
            aria-hidden
          >
            {icon}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "1.1px",
                textTransform: "uppercase",
                color: filled
                  ? "var(--text-on-surface-strong)"
                  : "var(--text-on-surface)",
                transition: "color 0.2s ease",
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {title}
            </p>
            <div
              style={{
                marginTop: 4,
                minHeight: 16,
                maxHeight: 20,
                display: "flex",
                alignItems: "center",
                overflow: "hidden",
              }}
            >
              {summary ?? (
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--text-on-surface-softest)",
                  }}
                >
                  {emptyHint ?? (filled ? "Logged" : "Optional")}
                </span>
              )}
            </div>
          </div>
          <ChevronDown
            size={16}
            color="var(--text-on-surface-soft)"
            style={{
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
              flexShrink: 0,
            }}
          />
        </button>
        <div
          id={`${headerId}-body`}
          style={{
            maxHeight: expanded ? "3000px" : 0,
            opacity: expanded ? 1 : 0,
            overflow: "hidden",
            transition: "max-height 0.32s ease, opacity 0.24s ease",
          }}
          aria-hidden={!expanded}
        >
          <div
            style={{
              padding: "4px 16px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export const CheckInScreen: React.FC<CheckInScreenProps> = ({
  selectedMood,
  selectedTags,
  journal,
  schoolLoad,
  activityMinutes,
  dayNote,
  socialInteractions,
  activitiesBySection,
  onSelectMood,
  onToggleTag,
  onJournalChange,
  onSchoolLoadChange,
  onActivityMinutesChange,
  onDayNoteChange,
  onAddSocialInteraction,
  onRemoveSocialInteraction,
  onUpdateSocialInteraction,
  onToggleActivity,
  onAddCustomActivity,
  onSave,
  todaysCount = 0,
}) => {
  const displayMood = selectedMood ?? "okay";
  const meta = getMoodMeta(displayMood);
  const suggestions = useMemo(
    () => (SUGGESTIONS[displayMood] ?? []).slice(0, 3),
    [displayMood],
  );
  const showDetails = Boolean(selectedMood);
  const showCrisisHint = showDetails && SUPPORT_HINT_MOODS.has(displayMood);
  const reducedMotion = usePrefersReducedMotion();

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const bucket = timeBucket(hour);
  const sessionToken = useSessionToken();
  const dayKey = new Date().toDateString();
  const acknowledgmentStepRef = useRef(0);
  const lastAcknowledgmentIndexByMoodRef = useRef<Partial<Record<MoodType, number>>>({});

  const [subline, setSubline] = useState(() => {
    const pool = MOOD_HELLO[bucket];
    return pickVariant(pool, hashSeed([bucket, "hello", dayKey, sessionToken]));
  });

  useEffect(() => {
    if (!selectedMood) {
      const pool = MOOD_HELLO[bucket];
      setSubline(pickVariant(pool, hashSeed([bucket, "hello", dayKey, sessionToken])));
      return;
    }

    const pool = MOOD_ACKNOWLEDGMENTS[selectedMood];
    const step = acknowledgmentStepRef.current + 1;
    acknowledgmentStepRef.current = step;
    const idx = pickNonRepeatingIndex(
      pool.length,
      hashSeed([bucket, selectedMood, dayKey, sessionToken, step]),
      lastAcknowledgmentIndexByMoodRef.current[selectedMood],
    );
    lastAcknowledgmentIndexByMoodRef.current[selectedMood] = idx;
    setSubline(pool[idx]);
  }, [bucket, dayKey, selectedMood, sessionToken]);

  const dateLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
    .format(new Date())
    .toUpperCase();

  const todayCountLabel =
    todaysCount === 0
      ? null
      : todaysCount === 1
        ? "1 check-in so far"
        : `${todaysCount} check-ins so far`;

  // Per-section "filled" state
  const hasLoad = schoolLoad > 0 || activityMinutes > 0 || dayNote.trim().length > 0;
  const hasTags = selectedTags.length > 0;
  const hasJournal = journal.trim().length > 0;
  const totalActivities = useMemo(
    () =>
      Object.values(activitiesBySection).reduce(
        (sum, items) => sum + (items?.length ?? 0),
        0,
      ),
    [activitiesBySection],
  );
  const hasActivities = totalActivities > 0;
  const hasSocial = socialInteractions.length > 0;

  const detailSections = [
    { id: "load", filled: hasLoad },
    { id: "words", filled: hasTags || hasJournal },
    { id: "activities", filled: hasActivities },
    { id: "social", filled: hasSocial },
  ];
  const filledCount = detailSections.filter((s) => s.filled).length;

  // Progressive disclosure: load and words stay open by default, the heavy
  // optional cards (activities / social / suggestions) are mutually exclusive.
  type HeavyCardId = "activities" | "social" | "suggestions";
  type AlwaysCardId = "load" | "words";
  type CardId = AlwaysCardId | HeavyCardId;

  const [expandedCards, setExpandedCards] = useState<Set<CardId>>(
    () => new Set<CardId>(["load", "words"]),
  );

  const isCardOpen = (id: CardId) => expandedCards.has(id);

  const toggleCard = (id: AlwaysCardId) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleHeavyCard = (id: HeavyCardId) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        return next;
      }
      next.delete("activities");
      next.delete("social");
      next.delete("suggestions");
      next.add(id);
      return next;
    });
  };

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [savedMood, setSavedMood] = useState<MoodType | null>(null);
  const [savedAtMs, setSavedAtMs] = useState<number | null>(null);
  const [savedPersonalization, setSavedPersonalization] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const arcRef = useRef<HTMLDivElement | null>(null);
  const sublineRef = useRef<HTMLParagraphElement | null>(null);
  const detailsRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      if (reducedMotion) return;
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        headerRef.current,
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45 },
        0,
      ).fromTo(
        arcRef.current,
        { y: 14, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55 },
        0.08,
      );
    },
    { scope: rootRef, dependencies: [reducedMotion] },
  );

  useIsoLayoutEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {}, rootRef);

    ctx.add(() => {
      if (sublineRef.current) {
        gsap.fromTo(
          sublineRef.current,
          { y: 6, opacity: 0.5 },
          {
            y: 0,
            opacity: 1,
            color: hexToRgba(meta.color, 1),
            duration: 0.5,
            ease: "power2.out",
          },
        );
      }
    });

    return () => ctx.revert();
  }, [meta.color, reducedMotion]);

  // Soft re-fade whenever the subline text changes (visit, focus, mood).
  // Color settles to the mood color when a mood is selected, otherwise
  // stays at the soft neutral muted tone.
  useEffect(() => {
    if (reducedMotion) return;
    if (!sublineRef.current) return;
    gsap.fromTo(
      sublineRef.current,
      { y: 6, opacity: 0.45 },
      {
        y: 0,
        opacity: 1,
        duration: 0.45,
        ease: "power2.out",
        overwrite: "auto",
      },
    );
  }, [subline, reducedMotion]);

  useEffect(() => {
    if (reducedMotion || !detailsRef.current) return;
    const targets = detailsRef.current.querySelectorAll<HTMLElement>("[data-stagger]");
    if (!targets.length) return;

    if (showDetails) {
      gsap.fromTo(
        targets,
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.55,
          ease: "power2.out",
          stagger: 0.09,
          delay: 0.05,
        },
      );
    } else {
      gsap.to(targets, {
        y: -6,
        opacity: 0,
        duration: 0.2,
        ease: "power2.in",
        stagger: 0.02,
      });
    }
  }, [showDetails, reducedMotion]);

  async function handleSave(): Promise<boolean> {
    if (!selectedMood) return false;
    setSaveState("saving");
    try {
      const ok = await onSave();
      if (ok) {
        setSavedMood(selectedMood);
        setSavedAtMs(Date.now());
        setSavedPersonalization(computePersonalization());
        setSaveState("saved");
      } else {
        setSaveState("idle");
      }
      return ok;
    } catch {
      setSaveState("idle");
      return false;
    }
  }

  function handleDismissAffirmation() {
    setSaveState("idle");
    setSavedMood(null);
    setSavedAtMs(null);
    setSavedPersonalization(null);
  }

  // Compute the personalization line from the *current* form state
  // (called right before the form resets in handleSave so the dialog
  // can show the line that was true at the moment of saving).
  function computePersonalization(): string | null {
    const journalWordCount = Math.max(
      1,
      Math.round(journal.trim().split(/\s+/).filter(Boolean).length),
    );
    if (journal.trim().length > 120) {
      return `Thank you for sharing ${journalWordCount} honest words with us.`;
    }
    if (hasSocial && socialInteractions.length > 0) {
      return `${socialInteractions.length} kind connection${socialInteractions.length === 1 ? "" : "s"} noticed today.`;
    }
    if (hasActivities && totalActivities > 0) {
      return `${totalActivities} little moment${totalActivities === 1 ? "" : "s"} captured.`;
    }
    return null;
  }

  const isSaved = saveState === "saved" && savedMood !== null;
  const savedMeta = savedMood ? getMoodMeta(savedMood) : meta;

  return (
    <div
      ref={rootRef}
      className="screen-enter relative flex w-full flex-col gap-5 px-4 pb-12 pt-5"
      style={{
        paddingTop: "var(--app-screen-top)",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 220px)",
      }}
    >
      {/* Header section */}
      <div ref={headerRef} className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-16 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,185,84,0.10),transparent_60%)] blur-2xl"
        />
        <div className="relative">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 10,
              flexWrap: "wrap",
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "var(--text-kicker)",
                margin: 0,
              }}
            >
              {dateLabel}
            </p>
            {todayCountLabel ? (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.18em",
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "rgba(188,194,255,0.08)",
                  color: "var(--text-kicker)",
                }}
              >
                {todayCountLabel}
              </span>
            ) : null}
          </div>
          <h1
            className="font-serif"
            style={{
              fontSize: "clamp(24px, 6.5vw, 30px)",
              fontWeight: 500,
              lineHeight: 1.15,
              color: "var(--text-on-surface)",
              marginBottom: 4,
              letterSpacing: "-0.03em",
            }}
          >
            {greeting}
          </h1>
          <p
            ref={sublineRef}
            className="font-serif"
            style={{
              fontSize: "clamp(14px, 4vw, 16px)",
              color: showDetails ? meta.color : "var(--text-on-surface-soft)",
              letterSpacing: "0.2px",
              lineHeight: 1.45,
              transition: "color 0.3s ease",
              minHeight: "2.9em",
            }}
          >
            {subline}
          </p>
        </div>
      </div>

      {/* Mood ring — professional picker with the selected mood name in the centre */}
      <div
        ref={arcRef}
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 420,
          margin: "0 auto",
          overflow: "visible",
        }}
      >
        <MoodRingPicker selectedMood={selectedMood} onSelect={onSelectMood} size="sm" />
      </div>

      {!showDetails && <IdlePrompts />}

      {showDetails ? (
        <>
          <div ref={detailsRef} style={{ ...detailsStyle, gap: 14 }}>
            {showCrisisHint && (
              <div
                data-stagger
                role="note"
                style={{
                  padding: "12px 0",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  color: "var(--text-on-warm)",
                  fontSize: 12,
                  lineHeight: 1.55,
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <Heart size={14} style={{ flexShrink: 0, color: "var(--icon-warm)" }} />
                <span>
                  You don't have to carry this alone. The{" "}
                  <strong style={{ color: "var(--text-warn-strong)" }}>Support</strong>{" "}
                  tab is here whenever you'd like someone to talk to.
                </span>
              </div>
            )}

            <div data-stagger>
              <CheckInDetailCard
                icon={<Gauge size={14} />}
                title="Today's load"
                filled={hasLoad}
                expanded={isCardOpen("load")}
                onToggle={() => toggleCard("load")}
                summary={
                  hasLoad
                    ? `${schoolLoad > 0 ? `School ${schoolLoad}/5` : ""}${
                        schoolLoad > 0 && activityMinutes > 0 ? " · " : ""
                      }${activityMinutes > 0 ? `${activityMinutes} active min` : ""}${
                        dayNote.trim() ? " · note saved" : ""
                      }`.trim()
                    : undefined
                }
                emptyHint="Only if it feels right"
              >
                <p style={helperStyle}>
                  A small, honest read on how today has been sitting with you.
                </p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div style={sectionCardStyle}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          letterSpacing: "0.6px",
                          textTransform: "uppercase",
                          color: "var(--text-kicker)",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Gauge size={11} /> School
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--text-on-surface-muted)",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {schoolLoad}/5
                      </span>
                    </div>
                    <LoadMeter value={schoolLoad} max={5} color={meta.color} />
                    <Stepper
                      value={schoolLoad}
                      onChange={onSchoolLoadChange}
                      min={0}
                      max={5}
                    />
                  </div>

                  <div style={sectionCardStyle}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          letterSpacing: "0.6px",
                          textTransform: "uppercase",
                          color: "var(--text-kicker)",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Timer size={11} /> Active
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--text-on-surface-muted)",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {activityMinutes}m
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-on-surface-muted)",
                        lineHeight: 1.45,
                        minHeight: 16,
                      }}
                    >
                      {activityMinutes === 0
                        ? "Rest counts too. Your body thanks you for listening."
                        : activityMinutes < 20
                          ? "Even a few minutes of moving is a kind thing to do for yourself."
                          : activityMinutes < 60
                            ? "Lovely movement today — your body is probably grateful."
                            : "What a beautifully active day. Be proud of yourself."}
                    </div>
                    <Stepper
                      value={activityMinutes}
                      onChange={onActivityMinutesChange}
                      min={0}
                      max={180}
                      step={15}
                      unit="min"
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 0",
                  }}
                >
                  <PenLine size={14} color="var(--text-on-surface-soft)" />
                  <input
                    type="text"
                    value={dayNote}
                    onChange={(e) => onDayNoteChange(e.target.value)}
                    placeholder="A little note for today, if you'd like…"
                    maxLength={120}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      color: "var(--text-on-surface)",
                      fontFamily: "Plus Jakarta Sans, sans-serif",
                      fontSize: 13,
                      caretColor: "var(--text-on-surface-soft)",
                    }}
                  />
                  {dayNote.trim().length > 0 && (
                    <button
                      type="button"
                      onClick={() => onDayNoteChange("")}
                      aria-label="Clear day note"
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "var(--text-on-surface-muted)",
                        cursor: "pointer",
                        padding: 4,
                        borderRadius: 6,
                        display: "grid",
                        placeItems: "center",
                        transition: "color 0.15s ease, background 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "rgba(188,194,255,0.85)";
                        e.currentTarget.style.background = "rgba(188,194,255,0.08)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "rgba(188,194,255,0.45)";
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </CheckInDetailCard>
            </div>

            <div data-stagger>
              <CheckInDetailCard
                icon={<BookOpen size={14} />}
                title="A few words for today"
                filled={hasTags || hasJournal}
                expanded={isCardOpen("words")}
                onToggle={() => toggleCard("words")}
                summary={
                  hasTags || hasJournal
                    ? `${selectedTags.length > 0 ? `${selectedTags.length} ${selectedTags.length === 1 ? "tag" : "tags"}` : ""}${
                        selectedTags.length > 0 && hasJournal ? " · " : ""
                      }${hasJournal ? `${journal.trim().split(/\s+/).filter(Boolean).length} words` : ""}`.trim()
                    : undefined
                }
                emptyHint="Pick a few words, or just write a line"
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <MoodTagGroup
                    tags={meta.tags}
                    selectedTags={selectedTags}
                    accentColor={meta.color}
                    onToggle={onToggleTag}
                  />
                </div>
                <div style={{ height: 1, background: "rgba(188,194,255,0.08)" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <p style={helperStyle}>
                    Even a single line is enough. This is just for you.
                  </p>
                  <JournalInput
                    value={journal}
                    onChange={onJournalChange}
                    placeholder="Write freely… this is your safe space."
                    rows={3}
                  />
                </div>
              </CheckInDetailCard>
            </div>

            <div data-stagger>
              <CheckInDetailCard
                icon={<Activity size={14} />}
                title="What filled your day?"
                filled={hasActivities}
                expanded={isCardOpen("activities")}
                onToggle={() => toggleHeavyCard("activities")}
                summary={
                  hasActivities
                    ? `${totalActivities} ${totalActivities === 1 ? "thing" : "things"} logged`
                    : undefined
                }
                emptyHint="Optional"
              >
                <ActivitySectionsPanel
                  selections={activitiesBySection}
                  onToggle={onToggleActivity}
                  onAddCustom={onAddCustomActivity}
                  collapsed={!isCardOpen("activities")}
                />
              </CheckInDetailCard>
            </div>

            <div data-stagger>
              <CheckInDetailCard
                icon={<Users size={14} />}
                title="Who warmed your day?"
                filled={hasSocial}
                expanded={isCardOpen("social")}
                onToggle={() => toggleHeavyCard("social")}
                summary={
                  hasSocial
                    ? `${socialInteractions.length} ${socialInteractions.length === 1 ? "person" : "people"} tracked`
                    : undefined
                }
                emptyHint="Optional"
              >
                <SocialTrackingPanel
                  interactions={socialInteractions}
                  onAdd={onAddSocialInteraction}
                  onRemove={onRemoveSocialInteraction}
                  onUpdate={onUpdateSocialInteraction}
                  collapsed={!isCardOpen("social")}
                />
              </CheckInDetailCard>
            </div>

            <div data-stagger>
              <CheckInDetailCard
                icon={<Sparkles size={14} />}
                title="A gentle idea for you"
                filled={suggestions.length > 0}
                expanded={isCardOpen("suggestions")}
                onToggle={() => toggleHeavyCard("suggestions")}
                summary={suggestions.length > 0 ? suggestions[0].title : undefined}
                emptyHint="Optional"
              >
                <p style={helperStyle}>
                  Just little ideas to gently hold onto. Do them only if they feel right.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {(isCardOpen("suggestions")
                    ? suggestions
                    : suggestions.slice(0, 1)
                  ).map((suggestion) => (
                    <SuggestionCard key={suggestion.id} suggestion={suggestion} />
                  ))}
                  {!isCardOpen("suggestions") && suggestions.length > 1 && (
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--text-on-surface-softest)",
                        textAlign: "center",
                        marginTop: 2,
                      }}
                    >
                      +{suggestions.length - 1} more gentle idea
                      {suggestions.length - 1 === 1 ? "" : "s"} waiting inside
                    </span>
                  )}
                </div>
              </CheckInDetailCard>
            </div>
          </div>

          {/* Sticky save bar — always visible while details are open. */}
          <div
            style={{
              position: "sticky",
              bottom: 0,
              marginTop: 16,
              paddingTop: 18,
              paddingBottom: 8,
              background: "var(--sticky-save-fade)",
              zIndex: 5,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  minWidth: 0,
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: meta.color,
                    boxShadow: `0 0 10px ${hexToRgba(meta.color, 0.55)}`,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text-on-surface-soft)",
                    fontWeight: 500,
                  }}
                >
                  <span style={{ color: "var(--text-on-surface)" }}>{meta.label}</span>
                  {" · "}
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>
                    {filledCount}/{detailSections.length}
                  </span>{" "}
                  shared
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                aria-expanded={showAdvanced}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  border: "none",
                  background: "transparent",
                  color: "var(--text-on-surface-muted)",
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: "pointer",
                  padding: 4,
                  borderRadius: 6,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-on-surface-muted)";
                }}
              >
                {showAdvanced ? "Hide" : "A little tip"}
                <ChevronDown
                  size={12}
                  style={{
                    transform: showAdvanced ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }}
                />
              </button>
            </div>
            <SaveMoodButton
              disabled={!selectedMood || saveState === "saving"}
              onSave={handleSave}
              label={
                todaysCount > 0
                  ? "Add this check-in"
                  : filledCount === 0
                    ? "Save this moment"
                    : `Save what you've shared`
              }
              savingLabel="Saving…"
              savedLabel="All saved"
            />
            <div
              style={{
                textAlign: "center",
                fontSize: 11,
                color: "var(--text-on-surface-softest)",
                letterSpacing: "0.4px",
                lineHeight: 1.5,
                minHeight: 16,
              }}
            >
              {todaysCount > 0
                ? "Your day can hold more than one moment. Add another whenever it shifts."
                : "Your mood is the heart of this. Save whenever you're ready, with as much or as little as you'd like."}
            </div>
          </div>

          {showAdvanced && (
            <div
              role="region"
              aria-label="Quick save tips"
              style={{
                position: "relative",
                zIndex: 1,
                padding: "12px 14px",
                borderRadius: 14,
                background: "var(--surface-violet-low)",
                border: "1px dashed var(--border-violet-faint)",
                color: "var(--text-on-surface-muted)",
                fontSize: 11.5,
                lineHeight: 1.55,
              }}
            >
              You can save whenever feels right, even with nothing filled in. A few little
              notes help you notice patterns later, but your mood is always the part that
              matters most.
            </div>
          )}
        </>
      ) : null}
      <SavedAffirmationDialog
        open={isSaved}
        onOpenChange={(open) => {
          if (!open) handleDismissAffirmation();
        }}
        moodColor={savedMeta.color}
        personalization={savedPersonalization}
        checkInsToday={todaysCount}
        savedAt={savedAtMs}
      />
    </div>
  );
};
