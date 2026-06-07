import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Heart } from "lucide-react";
import { ActivitySelections, ActivitySectionId, MoodType, SocialInteraction } from "../types";
import { getMoodMeta, SUGGESTIONS } from "../data";
import { MoodArc } from "../components/mood/MoodArc";
import { MoodSelector } from "../components/mood/MoodSelector";
import { MoodTagGroup } from "../components/mood/MoodTagGroup";
import { JournalInput } from "../components/mood/JournalInput";
import { SaveMoodButton } from "../components/mood/SaveMoodButton";
import { SocialTrackingPanel } from "../components/mood/SocialTrackingPanel";
import { ActivitySectionsPanel } from "../components/mood/ActivitySectionsPanel";
import { SectionLabel } from "../components/shared/SectionLabel";
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
  morning: "A quiet moment to begin.",
  midday: "A breath, mid-day.",
  evening: "How did today land?",
  night: "A small reflection before rest.",
};

const MOOD_ACKNOWLEDGMENTS: Record<MoodType, string> = {
  stressed: "That's heavy. You're allowed to feel it.",
  worried: "Uncertainty is part of being human.",
  okay: "Steady is good.",
  calm: "Hold this gently.",
  happy: "Let this stay with you.",
};

const AFFIRMATIONS: Record<MoodType, string> = {
  stressed: "That took courage. Rest is part of the work.",
  worried: "Noticing worry is a form of care.",
  okay: "Steady is good. A small anchor.",
  calm: "Hold this gently.",
  happy: "Savor it. Let it stay.",
};

const STRESSED_MOODS: ReadonlySet<MoodType> = new Set<MoodType>(["stressed", "worried"]);

const helperStyle: React.CSSProperties = {
  fontSize: 12,
  color: "rgba(188,194,255,0.45)",
  lineHeight: 1.55,
  margin: "0 0 12px",
};

const sectionStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 1,
  display: "flex",
  flexDirection: "column",
  gap: 0,
};

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

  void [
    schoolLoad,
    activityMinutes,
    dayNote,
    onSchoolLoadChange,
    onActivityMinutesChange,
    onDayNoteChange,
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const idleSubline = IDLE_SUBLINES[timeBucket(hour)];

  const dateLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
    .format(new Date())
    .toUpperCase();

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [savedMood, setSavedMood] = useState<MoodType | null>(null);
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
      if (sublineRef.current) {
        gsap.fromTo(
          sublineRef.current,
          { y: 6, opacity: 0.5 },
          { y: 0, opacity: 1, color: hexToRgba(meta.color, 1), duration: 0.5, ease: "power2.out" },
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
        { y: 0, opacity: 1, duration: 0.55, ease: "power2.out", stagger: 0.09, delay: 0.05 },
      );
    } else {
      gsap.to(targets, { y: -6, opacity: 0, duration: 0.2, ease: "power2.in", stagger: 0.02 });
    }
  }, [showDetails, reducedMotion]);

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
        }, 4200);
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
          { scale: 2.2, opacity: 0, duration: 1.6, ease: "power2.out" },
        );
      }
      if (affirmationRef.current) {
        const items = affirmationRef.current.querySelectorAll<HTMLElement>("[data-affirm]");
        gsap.fromTo(
          items,
          { y: 10, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.55, ease: "power2.out", stagger: 0.08, delay: 0.1 },
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

  return (
    <div
      ref={rootRef}
      className="checkin-root screen-enter"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 140px)" }}
    >
      <div
        ref={breathRef}
        aria-hidden
        style={{
          position: "absolute",
          left: "50%",
          top: 175,
          width: 140,
          height: 140,
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${hexToRgba(meta.color, 0.22)}, transparent 70%)`,
          filter: "blur(14px)",
          pointerEvents: "none",
          zIndex: 0,
          willChange: "transform, opacity",
        }}
      />

      <div ref={headerRef} style={{ position: "relative", zIndex: 1 }}>
        <p
          style={{
            fontSize: "clamp(10px, 2.6vw, 11px)",
            fontWeight: 500,
            letterSpacing: "1.3px",
            textTransform: "uppercase",
            color: "rgba(216,220,230,0.42)",
            marginBottom: 6,
          }}
        >
          {dateLabel}
        </p>
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
            color: showDetails ? meta.color : "rgba(188,194,255,0.55)",
            letterSpacing: "0.2px",
            transition: "color 0.3s ease",
            minHeight: "1.5em",
          }}
        >
          {showDetails ? MOOD_ACKNOWLEDGMENTS[displayMood] : idleSubline}
        </p>
      </div>

      <div ref={arcRef} style={{ position: "relative", zIndex: 1, width: "100%" }}>
        <div style={{ width: "100%", maxWidth: 420, margin: "0 auto" }}>
          <MoodArc selectedMood={selectedMood} onSelect={onSelectMood} />
        </div>
      </div>

      <div ref={selectorRef} style={{ position: "relative", zIndex: 1 }}>
        <MoodSelector selectedMood={selectedMood} />
      </div>

      {isSaved ? (
        <div
          ref={affirmationRef}
          aria-live="polite"
          style={{
            position: "relative",
            zIndex: 1,
            padding: "26px 20px 22px",
            borderRadius: 22,
            background: `linear-gradient(160deg, ${hexToRgba(savedMeta.color, 0.1)}, rgba(188,194,255,0.03))`,
            border: `1px solid ${hexToRgba(savedMeta.color, 0.18)}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            textAlign: "center",
            overflow: "hidden",
          }}
        >
          <div
            ref={rippleRef}
            aria-hidden
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 120,
              height: 120,
              transform: "translate(-50%, -50%)",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${hexToRgba(savedMeta.color, 0.45)}, transparent 65%)`,
              filter: "blur(6px)",
              pointerEvents: "none",
            }}
          />
          <div
            data-breath
            aria-hidden
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: savedMeta.color,
              boxShadow: `0 0 24px ${hexToRgba(savedMeta.color, 0.55)}`,
              position: "relative",
              zIndex: 1,
              marginBottom: 4,
            }}
          />
          <p
            data-affirm
            className="font-serif"
            style={{
              fontSize: 22,
              color: "#eef1f6",
              fontWeight: 500,
              letterSpacing: "-0.01em",
              position: "relative",
              zIndex: 1,
              maxWidth: 320,
            }}
          >
            Thank you for showing up.
          </p>
          <p
            data-affirm
            style={{
              fontSize: 13,
              color: "rgba(188,194,255,0.55)",
              lineHeight: 1.6,
              position: "relative",
              zIndex: 1,
              maxWidth: 320,
            }}
          >
            {AFFIRMATIONS[savedMood as MoodType]}
          </p>
          <button
            data-affirm
            type="button"
            onClick={handleDismissAffirmation}
            style={{
              marginTop: 10,
              padding: "10px 18px",
              borderRadius: 999,
              background: "rgba(188,194,255,0.08)",
              border: "1px solid rgba(188,194,255,0.12)",
              color: "rgba(216,220,230,0.85)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              position: "relative",
              zIndex: 1,
              fontFamily: "Plus Jakarta Sans, sans-serif",
            }}
          >
            Check in again later
          </button>
        </div>
      ) : showDetails ? (
        <>
          <div ref={detailsRef} style={sectionStyle}>
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
                <Heart size={14} style={{ flexShrink: 0, color: "rgba(255,185,84,0.85)" }} />
                <span>
                  If you'd like to talk to someone, the <strong style={{ color: "rgba(255,225,170,0.95)" }}>Support</strong> tab is
                  here whenever you need it.
                </span>
              </div>
            )}

            <div data-stagger style={sectionStyle}>
              <SectionLabel>A word for it?</SectionLabel>
              <p style={helperStyle}>
                Tap any that feel close. Skip what doesn't fit.
              </p>
              <MoodTagGroup
                tags={meta.tags}
                selectedTags={selectedTags}
                accentColor={meta.color}
                onToggle={onToggleTag}
              />
            </div>

            <div data-stagger style={sectionStyle}>
              <SectionLabel>Anything to put down?</SectionLabel>
              <p style={helperStyle}>
                A line is enough. Only you can read this.
              </p>
              <JournalInput
                value={journal}
                onChange={onJournalChange}
                placeholder="Write freely… this is your safe space."
                rows={3}
              />
            </div>

            <div data-stagger style={sectionStyle}>
              <SectionLabel>What filled today?</SectionLabel>
              <p style={helperStyle}>
                Tap what feels true. Leave what wasn't there.
              </p>
              <ActivitySectionsPanel
                selections={activitiesBySection}
                onToggle={onToggleActivity}
                onAddCustom={onAddCustomActivity}
              />
            </div>

            <div data-stagger style={sectionStyle}>
              <SectionLabel>Who lifted you up?</SectionLabel>
              <p style={helperStyle}>
                Add as many or as few as you'd like. There's no count to beat.
              </p>
              <SocialTrackingPanel
                interactions={socialInteractions}
                onAdd={onAddSocialInteraction}
                onRemove={onRemoveSocialInteraction}
                onUpdate={onUpdateSocialInteraction}
              />
            </div>

            <div data-stagger style={sectionStyle}>
              <SectionLabel>A small idea, if you'd like</SectionLabel>
              <p style={helperStyle}>
                Gently held. No pressure to do any.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {suggestions.map((suggestion) => (
                  <SuggestionCard key={suggestion.id} suggestion={suggestion} />
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              position: "sticky",
              bottom: 0,
              marginTop: 8,
              paddingTop: 18,
              paddingBottom: 10,
              background:
                "linear-gradient(to top, rgba(18,20,22,0.96) 55%, rgba(18,20,22,0) 100%)",
              zIndex: 5,
            }}
          >
            <SaveMoodButton
              disabled={!selectedMood || saveState === "saving"}
              onSave={handleSave}
              label={
                selectedTags.length === 0 && !journal.trim() && socialInteractions.length === 0
                  ? "Save this moment"
                  : "Save what you noticed"
              }
              savingLabel="Saving…"
              savedLabel="Saved"
            />
            <p
              style={{
                fontSize: 11,
                color: "rgba(188,194,255,0.32)",
                textAlign: "center",
                marginTop: 8,
                letterSpacing: "0.4px",
                lineHeight: 1.5,
              }}
            >
              Take your time. You can always come back.
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
};
