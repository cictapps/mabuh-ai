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
import {
  ActivitySelections,
  ActivitySectionId,
  MoodType,
  SocialInteraction,
} from "../types";
import { getMoodMeta, SUGGESTIONS } from "../data";
import { MoodArc } from "../components/mood/MoodArc";
import { MoodSelector } from "../components/mood/MoodSelector";
import { MoodTagGroup } from "../components/mood/MoodTagGroup";
import { JournalInput } from "../components/mood/JournalInput";
import { SaveMoodButton } from "../components/mood/SaveMoodButton";
import { SocialTrackingPanel } from "../components/mood/SocialTrackingPanel";
import { ActivitySectionsPanel } from "../components/mood/ActivitySectionsPanel";
import { SuggestionCard } from "../components/suggestions/SuggestionCard";
import { TopBarSettingsButton } from "../components/shared/TopBarSettingsButton";

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
  onOpenSettings: () => void;
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

const IDLE_SUBLINES: Record<"morning" | "midday" | "evening" | "night", string> = {
  morning: "Hey, glad you're here. Take it slow.",
  midday: "Pause for a moment. How is your heart right now?",
  evening: "Before the day closes, let's check in with you.",
  night: "It's been a long day. Let's sit with that for a bit.",
};

const MOOD_ACKNOWLEDGMENTS: Record<MoodType, string> = {
  stressed: "I hear you. That sounds really heavy, and it's okay to feel it.",
  worried: "Worry can be loud. You're not alone in this.",
  okay: "Okay is a perfectly good place to be.",
  calm: "I love that you're feeling this. Let it settle in.",
  happy: "Oh, this is wonderful. Hold onto this feeling.",
};

const AFFIRMATIONS: Record<MoodType, string> = {
  stressed: "You showed up for yourself today. That matters more than you know.",
  worried: "Naming the worry is a brave first step. Be gentle with yourself.",
  okay: "Steady days count too. You don't have to be anything more.",
  calm: "Treasure this feeling. You earned it.",
  happy: "Soak it in. Moments like this are worth remembering.",
};

const STRESSED_MOODS: ReadonlySet<MoodType> = new Set<MoodType>(["stressed", "worried"]);

const helperStyle: React.CSSProperties = {
  fontSize: 12,
  color: "rgba(188,194,255,0.45)",
  lineHeight: 1.55,
  margin: 0,
};

const sectionCardStyle: React.CSSProperties = {
  padding: 14,
  borderRadius: 16,
  background: "rgba(188,194,255,0.04)",
  border: "1px solid rgba(188,194,255,0.06)",
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
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 6px 6px 12px",
        borderRadius: 14,
        background: "rgba(188,194,255,0.05)",
        border: "1px solid rgba(188,194,255,0.08)",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span
        style={{
          fontFamily: "Plus Jakarta Sans, sans-serif",
          fontVariantNumeric: "tabular-nums",
          fontSize: 14,
          fontWeight: 600,
          color: "#e8eaf0",
          flex: 1,
          minWidth: 0,
        }}
      >
        {value}
        {unit ? (
          <span style={{ color: "rgba(188,194,255,0.5)", marginLeft: 4, fontSize: 12 }}>
            {unit}
          </span>
        ) : null}
      </span>
      <button
        type="button"
        onClick={dec}
        disabled={disabled || value <= min}
        aria-label="Decrease"
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          border: "none",
          background: "rgba(188,194,255,0.10)",
          color: "rgba(216,220,230,0.9)",
          cursor: value <= min ? "not-allowed" : "pointer",
          fontSize: 14,
          fontWeight: 700,
          display: "grid",
          placeItems: "center",
          transition: "background 0.15s ease",
        }}
        onMouseEnter={(e) => {
          if (value > min) e.currentTarget.style.background = "rgba(188,194,255,0.18)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(188,194,255,0.10)";
        }}
      >
        −
      </button>
      <button
        type="button"
        onClick={inc}
        disabled={disabled || value >= max}
        aria-label="Increase"
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          border: "none",
          background: "rgba(188,194,255,0.10)",
          color: "rgba(216,220,230,0.9)",
          cursor: value >= max ? "not-allowed" : "pointer",
          fontSize: 14,
          fontWeight: 700,
          display: "grid",
          placeItems: "center",
          transition: "background 0.15s ease",
        }}
        onMouseEnter={(e) => {
          if (value < max) e.currentTarget.style.background = "rgba(188,194,255,0.18)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(188,194,255,0.10)";
        }}
      >
        +
      </button>
    </div>
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
          color: "rgba(188,194,255,0.55)",
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
      style={{
        position: "relative",
        zIndex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "14px 14px 12px",
        borderRadius: 18,
        background:
          "linear-gradient(180deg, rgba(188,194,255,0.05), rgba(188,194,255,0.02))",
        border: "1px solid rgba(188,194,255,0.07)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: "1.2px",
            textTransform: "uppercase",
            color: "rgba(188,194,255,0.55)",
          }}
        >
          Just between us
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 10.5,
            color: "rgba(188,194,255,0.4)",
          }}
        >
          <span
            aria-hidden
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#bcc2ff",
              boxShadow: "0 0 8px rgba(188,194,255,0.5)",
            }}
          />
          about a minute
        </span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 8,
        }}
      >
        {IDLE_PROMPTS.map((p, i) => (
          <div
            key={p.label}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              padding: "10px 8px",
              borderRadius: 12,
              background: "rgba(188,194,255,0.03)",
              border: "1px solid rgba(188,194,255,0.05)",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                fontWeight: 600,
                color: "rgba(232,236,255,0.85)",
                letterSpacing: "0.1px",
              }}
            >
              <span
                style={{
                  display: "grid",
                  placeItems: "center",
                  width: 18,
                  height: 18,
                  borderRadius: 6,
                  background: "rgba(188,194,255,0.10)",
                  color: "rgba(220,224,255,0.9)",
                  flexShrink: 0,
                }}
                aria-hidden
              >
                {p.icon}
              </span>
              <span
                style={{
                  fontSize: 9.5,
                  color: "rgba(188,194,255,0.5)",
                  fontWeight: 600,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
            </span>
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                color: "rgba(232,236,255,0.92)",
                lineHeight: 1.3,
              }}
            >
              {p.label}
            </span>
            <span
              style={{
                fontSize: 10.5,
                color: "rgba(188,194,255,0.5)",
                lineHeight: 1.4,
              }}
            >
              {p.hint}
            </span>
          </div>
        ))}
      </div>
      <p
        style={{
          fontSize: 11,
          color: "rgba(188,194,255,0.4)",
          textAlign: "center",
          margin: "2px 0 0",
          lineHeight: 1.5,
          fontStyle: "italic",
        }}
      >
        This little space is just for you. No scores, no streaks — just a quiet moment.
      </p>
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
    <div
      style={{
        borderRadius: 20,
        background: filled ? "rgba(188,194,255,0.05)" : "rgba(188,194,255,0.03)",
        border: filled
          ? "1px solid rgba(188,194,255,0.10)"
          : "1px solid rgba(188,194,255,0.06)",
        overflow: "hidden",
        transition: "background 0.2s ease, border-color 0.2s ease",
      }}
    >
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
            color: filled ? "rgba(220,224,255,0.95)" : "rgba(188,194,255,0.55)",
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
              color: filled ? "rgba(232,236,255,0.95)" : "rgba(220,224,255,0.75)",
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
                  color: "rgba(188,194,255,0.4)",
                }}
              >
                {emptyHint ?? (filled ? "Logged" : "Optional")}
              </span>
            )}
          </div>
        </div>
        <ChevronDown
          size={16}
          color="rgba(220,224,255,0.7)"
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
  onOpenSettings,
  todaysCount = 0,
}) => {
  const displayMood = selectedMood ?? "okay";
  const meta = getMoodMeta(displayMood);
  const suggestions = useMemo(
    () => (SUGGESTIONS[displayMood] ?? []).slice(0, 3),
    [displayMood],
  );
  const showDetails = Boolean(selectedMood);
  const showCrisisHint = showDetails && STRESSED_MOODS.has(displayMood);
  const reducedMotion = usePrefersReducedMotion();

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const idleSubline = IDLE_SUBLINES[timeBucket(hour)];

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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const dismissTimer = useRef<number | null>(null);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const breathRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const arcRef = useRef<HTMLDivElement | null>(null);
  const selectorRef = useRef<HTMLDivElement | null>(null);
  const sublineRef = useRef<HTMLParagraphElement | null>(null);
  const detailsRef = useRef<HTMLDivElement | null>(null);
  const affirmationRef = useRef<HTMLDivElement | null>(null);
  const rippleRef = useRef<HTMLDivElement | null>(null);
  const arcWrapperRef = useRef<HTMLDivElement | null>(null);
  const arcLogoRef = useRef<HTMLDivElement | null>(null);
  const arcLogoGlowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      if (dismissTimer.current) window.clearTimeout(dismissTimer.current);
    };
  }, []);

  useGSAP(
    () => {
      if (reducedMotion) return;
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        headerRef.current,
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55 },
        0,
      )
        .fromTo(
          arcRef.current,
          { y: 22, opacity: 0, scale: 0.96 },
          { y: 0, opacity: 1, scale: 1, duration: 0.7 },
          0.08,
        )
        .fromTo(
          selectorRef.current,
          { y: 14, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5 },
          0.2,
        );

      if (breathRef.current) {
        gsap.to(breathRef.current, {
          scale: 1.18,
          opacity: 0.85,
          duration: 4,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
      }

      if (arcLogoGlowRef.current) {
        gsap.fromTo(
          arcLogoGlowRef.current,
          { scale: 0.94, opacity: 0.5 },
          {
            scale: 1.1,
            opacity: 0.95,
            duration: 5,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          },
        );
        if (arcLogoRef.current) {
          gsap.fromTo(
            arcLogoRef.current,
            { filter: "drop-shadow(0 0 0px rgba(255,255,255,0))" },
            {
              filter: `drop-shadow(0 0 16px ${hexToRgba(meta.color, 0.6)}) drop-shadow(0 0 36px ${hexToRgba(meta.color, 0.35)})`,
              duration: 5,
              ease: "sine.inOut",
              yoyo: true,
              repeat: -1,
            },
          );
        }
      }
    },
    { scope: rootRef, dependencies: [reducedMotion] },
  );

  useIsoLayoutEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {}, rootRef);

    ctx.add(() => {
      if (breathRef.current) {
        gsap.to(breathRef.current, {
          background: `radial-gradient(circle, ${hexToRgba(meta.color, 0.32)}, transparent 70%)`,
          duration: 0.6,
          ease: "power2.out",
        });
      }
      if (arcLogoGlowRef.current) {
        gsap.to(arcLogoGlowRef.current, {
          background: `radial-gradient(circle, ${hexToRgba(meta.color, 0.55)}, transparent 65%)`,
          duration: 0.6,
          ease: "power2.out",
        });
      }
      if (arcLogoRef.current) {
        gsap.to(arcLogoRef.current, {
          backgroundColor: meta.color,
          duration: 0.6,
          ease: "power2.out",
        });
      }
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

  // Keep the breath circle vertically aligned with the arc center across screen sizes.
  useEffect(() => {
    if (reducedMotion) return;
    const update = () => {
      const wrap = arcWrapperRef.current;
      if (!wrap || !breathRef.current) return;
      const rect = wrap.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      breathRef.current.style.top = `${centerY}px`;
    };
    update();
    window.addEventListener("resize", update);
    const ro = new ResizeObserver(update);
    if (arcWrapperRef.current) ro.observe(arcWrapperRef.current);
    return () => {
      window.removeEventListener("resize", update);
      ro.disconnect();
    };
  }, [reducedMotion]);

  async function handleSave(): Promise<boolean> {
    if (!selectedMood) return false;
    setSaveState("saving");
    try {
      const ok = await onSave();
      if (ok) {
        setSavedMood(selectedMood);
        setSaveState("saved");
        if (dismissTimer.current) window.clearTimeout(dismissTimer.current);
        dismissTimer.current = window.setTimeout(() => {
          setSaveState("idle");
          setSavedMood(null);
        }, 5200);
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
    if (dismissTimer.current) window.clearTimeout(dismissTimer.current);
    setSaveState("idle");
    setSavedMood(null);
  }

  // Animate the affirmation entrance + ripple.
  useEffect(() => {
    if (saveState !== "saved" || !affirmationRef.current) return;

    if (reducedMotion) return;

    const ctx = gsap.context(() => {}, affirmationRef);
    ctx.add(() => {
      if (rippleRef.current) {
        gsap.fromTo(
          rippleRef.current,
          { scale: 0.4, opacity: 0.55 },
          { scale: 2.4, opacity: 0, duration: 1.8, ease: "power2.out" },
        );
      }
      if (affirmationRef.current) {
        const items =
          affirmationRef.current.querySelectorAll<HTMLElement>("[data-affirm]");
        gsap.fromTo(
          items,
          { y: 10, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.55,
            ease: "power2.out",
            stagger: 0.08,
            delay: 0.1,
          },
        );
        const dot = affirmationRef.current.querySelector<HTMLElement>("[data-breath]");
        if (dot) {
          gsap.to(dot, {
            scale: 1.4,
            opacity: 0.55,
            duration: 3.2,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          });
        }
      }
    });
    return () => ctx.revert();
  }, [saveState, reducedMotion]);

  const isSaved = saveState === "saved" && savedMood;
  const savedMeta = savedMood ? getMoodMeta(savedMood) : meta;

  // Build a personalization line for the saved affirmation
  const journalWordCount = savedMood
    ? Math.max(1, Math.round(journal.trim().split(/\s+/).filter(Boolean).length))
    : 0;
  const personalization =
    journal.trim().length > 120
      ? `Thank you for sharing ${journalWordCount} honest words with us.`
      : hasSocial && socialInteractions.length > 0
        ? `${socialInteractions.length} kind connection${socialInteractions.length === 1 ? "" : "s"} noticed today.`
        : hasActivities && totalActivities > 0
          ? `${totalActivities} little moment${totalActivities === 1 ? "" : "s"} captured.`
          : null;

  return (
    <div
      ref={rootRef}
      className="checkin-root screen-enter"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 160px)" }}
    >
      <TopBarSettingsButton onClick={onOpenSettings} />

      {/* Soft static glow tied to the page */}
      <div
        className="checkin-glow"
        style={{
          ["--checkin-glow" as string]: hexToRgba(meta.color, 0.22),
        }}
        aria-hidden
      />

      {/* Breath circle aligned to the arc's center, recolored to the mood */}
      <div
        ref={breathRef}
        aria-hidden
        style={{
          position: "absolute",
          left: "50%",
          top: 175,
          width: 160,
          height: 160,
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${hexToRgba(meta.color, 0.22)}, transparent 70%)`,
          filter: "blur(16px)",
          pointerEvents: "none",
          zIndex: 0,
          willChange: "transform, opacity",
        }}
      />

      <div ref={headerRef} style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 6,
            flexWrap: "wrap",
          }}
        >
          <p
            style={{
              fontSize: "clamp(10px, 2.6vw, 11px)",
              fontWeight: 600,
              letterSpacing: "1.3px",
              textTransform: "uppercase",
              color: "rgba(220,224,255,0.72)",
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
                letterSpacing: "0.4px",
                padding: "2px 8px",
                borderRadius: 999,
                background: "rgba(188,194,255,0.08)",
                color: "rgba(188,194,255,0.6)",
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
            lineHeight: 1.18,
            color: "#eef1f6",
            marginBottom: 6,
            letterSpacing: "-0.03em",
          }}
        >
          {greeting}
        </h1>
        <p
          ref={sublineRef}
          className="font-serif"
          style={{
            fontSize: "clamp(14px, 4vw, 17px)",
            color: showDetails ? meta.color : "rgba(220,224,255,0.78)",
            letterSpacing: "0.2px",
            transition: "color 0.3s ease",
            minHeight: "1.5em",
          }}
        >
          {showDetails ? MOOD_ACKNOWLEDGMENTS[displayMood] : idleSubline}
        </p>
      </div>

      <div ref={arcRef} style={{ position: "relative", zIndex: 1, width: "100%" }}>
        <div
          ref={arcWrapperRef}
          style={{ width: "100%", maxWidth: 420, margin: "0 auto", position: "relative" }}
        >
          <MoodArc selectedMood={selectedMood} onSelect={onSelectMood} />
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: "50%",
              top: "70%",
              width: 168,
              height: 168,
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
            }}
          >
            <div
              ref={arcLogoGlowRef}
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 24,
                background: `radial-gradient(circle, ${hexToRgba(meta.color, 0.55)}, transparent 65%)`,
                filter: "blur(18px)",
                willChange: "transform, opacity",
                transformOrigin: "center",
              }}
            />
            <div
              ref={arcLogoRef}
              role="img"
              aria-label="MabuhAi logo"
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 24,
                backgroundColor: meta.color,
                WebkitMaskImage: "url(/app-logo-light.svg)",
                maskImage: "url(/app-logo-light.svg)",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
                WebkitMaskSize: "contain",
                maskSize: "contain",
                transition: "background-color 0.6s ease",
                transformOrigin: "center",
              }}
            />
          </div>
        </div>
      </div>

      <div ref={selectorRef} style={{ position: "relative", zIndex: 1 }}>
        <MoodSelector selectedMood={selectedMood} />
      </div>

      {!showDetails && <IdlePrompts />}

      {isSaved ? (
        <div
          ref={affirmationRef}
          aria-live="polite"
          style={{
            position: "relative",
            zIndex: 1,
            padding: "28px 22px 24px",
            borderRadius: 24,
            background: `linear-gradient(160deg, ${hexToRgba(savedMeta.color, 0.12)}, rgba(188,194,255,0.04))`,
            border: `1px solid ${hexToRgba(savedMeta.color, 0.22)}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            textAlign: "center",
            overflow: "hidden",
            boxShadow: `0 24px 60px -36px ${hexToRgba(savedMeta.color, 0.55)}`,
          }}
        >
          <div
            ref={rippleRef}
            aria-hidden
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 140,
              height: 140,
              transform: "translate(-50%, -50%)",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${hexToRgba(savedMeta.color, 0.5)}, transparent 65%)`,
              filter: "blur(8px)",
              pointerEvents: "none",
            }}
          />
          <div
            data-breath
            aria-hidden
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: savedMeta.color,
              boxShadow: `0 0 28px ${hexToRgba(savedMeta.color, 0.6)}`,
              position: "relative",
              zIndex: 1,
              marginBottom: 4,
            }}
          />
          <p
            data-affirm
            className="font-serif"
            style={{
              fontSize: 24,
              color: "#eef1f6",
              fontWeight: 500,
              letterSpacing: "-0.01em",
              position: "relative",
              zIndex: 1,
              maxWidth: 340,
              lineHeight: 1.2,
            }}
          >
            Saved with care. <span style={{ color: savedMeta.color }}>Thank you</span> for
            being here.
          </p>
          {todaysCount > 1 ? (
            <p
              data-affirm
              style={{
                fontSize: 11,
                color: "rgba(188,194,255,0.45)",
                letterSpacing: "0.4px",
                textTransform: "uppercase",
                position: "relative",
                zIndex: 1,
                margin: 0,
              }}
            >
              {todaysCount} check-ins today
            </p>
          ) : null}
          <p
            data-affirm
            style={{
              fontSize: 13,
              color: "rgba(188,194,255,0.6)",
              lineHeight: 1.6,
              position: "relative",
              zIndex: 1,
              maxWidth: 340,
            }}
          >
            {AFFIRMATIONS[savedMood as MoodType]}
          </p>
          {personalization && (
            <p
              data-affirm
              style={{
                fontSize: 12,
                color: "rgba(216,220,230,0.75)",
                lineHeight: 1.5,
                position: "relative",
                zIndex: 1,
                padding: "6px 12px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                fontStyle: "italic",
              }}
            >
              {personalization}
            </p>
          )}
          <div
            data-affirm
            style={{
              display: "flex",
              gap: 8,
              marginTop: 8,
              position: "relative",
              zIndex: 1,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <button
              type="button"
              onClick={handleDismissAffirmation}
              style={{
                padding: "10px 18px",
                borderRadius: 999,
                background: `linear-gradient(135deg, ${hexToRgba(savedMeta.color, 0.18)}, ${hexToRgba(savedMeta.color, 0.06)})`,
                border: `1px solid ${hexToRgba(savedMeta.color, 0.32)}`,
                color: "#eef1f6",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "Plus Jakarta Sans, sans-serif",
                transition: "transform 0.12s ease, background 0.15s ease",
              }}
            >
              Add another check-in
            </button>
            <button
              type="button"
              onClick={handleDismissAffirmation}
              style={{
                padding: "10px 18px",
                borderRadius: 999,
                background: "rgba(188,194,255,0.04)",
                border: "1px solid rgba(188,194,255,0.10)",
                color: "rgba(216,220,230,0.7)",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "Plus Jakarta Sans, sans-serif",
                transition: "background 0.15s ease",
              }}
            >
              I'm done for now
            </button>
          </div>
        </div>
      ) : showDetails ? (
        <>
          <div ref={detailsRef} style={{ ...detailsStyle, gap: 14 }}>
            {showCrisisHint && (
              <div
                data-stagger
                role="note"
                style={{
                  padding: "12px 14px",
                  borderRadius: 14,
                  background: "rgba(255,185,84,0.06)",
                  border: "1px solid rgba(255,185,84,0.14)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  color: "rgba(255,225,170,0.88)",
                  fontSize: 12,
                  lineHeight: 1.55,
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <Heart
                  size={14}
                  style={{ flexShrink: 0, color: "rgba(255,185,84,0.85)" }}
                />
                <span>
                  You don't have to carry this alone. The{" "}
                  <strong style={{ color: "rgba(255,225,170,0.95)" }}>Support</strong> tab
                  is here whenever you'd like someone to talk to.
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
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                    alignItems: "stretch",
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
                          color: "rgba(188,194,255,0.55)",
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
                          color: "rgba(188,194,255,0.45)",
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
                          color: "rgba(188,194,255,0.55)",
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
                          color: "rgba(188,194,255,0.45)",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {activityMinutes}m
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "rgba(188,194,255,0.5)",
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
                    padding: "10px 12px",
                    borderRadius: 14,
                    background: "rgba(188,194,255,0.04)",
                    border: "1px solid rgba(188,194,255,0.06)",
                  }}
                >
                  <PenLine size={14} color="rgba(188,194,255,0.55)" />
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
                      color: "#eef1f6",
                      fontFamily: "Plus Jakarta Sans, sans-serif",
                      fontSize: 13,
                      caretColor: "#bcc2ff",
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
                        color: "rgba(188,194,255,0.45)",
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
                        color: "rgba(188,194,255,0.4)",
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
              background:
                "linear-gradient(to top, rgba(18,20,22,0.98) 60%, rgba(18,20,22,0) 100%)",
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
                    color: "rgba(188,194,255,0.55)",
                    fontWeight: 500,
                  }}
                >
                  <span style={{ color: "rgba(216,220,230,0.85)" }}>{meta.label}</span>
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
                  color: "rgba(188,194,255,0.5)",
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: "pointer",
                  padding: 4,
                  borderRadius: 6,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "rgba(188,194,255,0.8)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "rgba(188,194,255,0.5)";
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
                color: "rgba(188,194,255,0.32)",
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
                background: "rgba(188,194,255,0.04)",
                border: "1px dashed rgba(188,194,255,0.10)",
                color: "rgba(188,194,255,0.55)",
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
    </div>
  );
};
