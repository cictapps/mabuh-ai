import React, { useCallback, useId, useMemo } from "react";
import { motion, useReducedMotion, type Transition } from "framer-motion";
import { MOODS } from "../../data";
import type { MoodType } from "../../types";

interface MoodRingPickerProps {
  selectedMood: MoodType | null;
  onSelect: (mood: MoodType) => void;
  size?: "sm" | "md" | "lg";
}

const PICKER_SIZES = {
  sm: 292,
  md: 340,
  lg: 380,
} as const;

const VIEWBOX_SIZE = 340;
const CENTER = VIEWBOX_SIZE / 2;
const OUTER_RADIUS = 121;
const TRACK_RADIUS = 104;
const INNER_GLOW_RADIUS = 74;
const MOOD_DOT_RADIUS = 122;
const LABEL_RADIUS = 146;
const START_DEG = -90;
const STEP_DEG = 360 / MOODS.length;
const DEFAULT_MOOD: MoodType = "okay";

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function pointAt(radius: number, angleDeg: number): { x: number; y: number } {
  const angle = toRad(angleDeg);
  return {
    x: CENTER + radius * Math.cos(angle),
    y: CENTER + radius * Math.sin(angle),
  };
}

function hexToRgba(hex: string, alpha: number): string {
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

function angleForIndex(index: number): number {
  return START_DEG + index * STEP_DEG;
}

const ClockTicks: React.FC = React.memo(() => {
  const ticks = Array.from({ length: 28 }, (_, i) => {
    const angle = START_DEG + i * (360 / 28);
    const isMajor = i % 4 === 0;
    const outer = pointAt(TRACK_RADIUS, angle);
    const inner = pointAt(TRACK_RADIUS - (isMajor ? 11 : 6), angle);

    return (
      <line
        key={i}
        x1={inner.x}
        y1={inner.y}
        x2={outer.x}
        y2={outer.y}
        stroke={isMajor ? "var(--ring-tick-strong)" : "var(--ring-tick-soft)"}
        strokeLinecap="round"
        strokeWidth={isMajor ? 1.7 : 1.05}
      />
    );
  });

  return <>{ticks}</>;
});
ClockTicks.displayName = "ClockTicks";

interface MoodStopMarksProps {
  selectedMood: MoodType | null;
  labelTransition: Transition;
  reduceMotion: boolean;
}

const MoodStopMarks: React.FC<MoodStopMarksProps> = React.memo(
  ({ selectedMood, labelTransition, reduceMotion }) => (
    <>
      {MOODS.map((mood, index) => {
        const angle = angleForIndex(index);
        const dot = pointAt(MOOD_DOT_RADIUS, angle);
        const label = pointAt(LABEL_RADIUS, angle);
        const isActive = mood.id === selectedMood;
        const isPreview = !selectedMood && mood.id === DEFAULT_MOOD;
        const unitX = Math.cos(toRad(angle));
        const unitY = Math.sin(toRad(angle));
        const textAnchor =
          Math.abs(unitX) < 0.22 ? "middle" : unitX > 0 ? "start" : "end";
        const dominantSide = Math.abs(unitX) > Math.abs(unitY) ? "side" : "vertical";

        return (
          <g key={mood.id}>
            {isActive ? (
              <motion.circle
                cx={dot.x}
                cy={dot.y}
                r="13"
                fill={mood.color}
                initial={false}
                animate={{
                  opacity: reduceMotion ? 0.16 : [0.12, 0.24, 0.12],
                  scale: reduceMotion ? 1 : [0.96, 1.12, 0.96],
                }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
                }
                style={{
                  transformBox: "fill-box",
                  transformOrigin: "center",
                }}
              />
            ) : null}
            <motion.circle
              cx={dot.x}
              cy={dot.y}
              r={isActive ? 7 : 5.25}
              fill={isActive || isPreview ? mood.color : "var(--ring-dot-muted)"}
              stroke="var(--ring-dot-stroke)"
              strokeWidth="3.5"
              initial={false}
              animate={{
                opacity: isActive || isPreview ? 1 : 0.82,
                scale: isActive && !reduceMotion ? [1, 1.08, 1] : 1,
              }}
              transition={
                isActive && !reduceMotion
                  ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
                  : labelTransition
              }
              style={{
                filter: `drop-shadow(0 0 ${isActive ? 16 : 8}px ${hexToRgba(
                  mood.color,
                  isActive ? 0.9 : 0.34,
                )})`,
                transformBox: "fill-box",
                transformOrigin: "center",
              }}
            />
            <motion.text
              x={label.x}
              y={label.y}
              dy={dominantSide === "vertical" && unitY > 0 ? 11 : 3.5}
              textAnchor={textAnchor}
              fontSize="11"
              fontWeight="600"
              letterSpacing="0"
              fill={
                isActive
                  ? "var(--text-on-surface)"
                  : isPreview
                    ? "var(--text-on-surface-muted)"
                    : "var(--text-on-surface-softer)"
              }
              initial={false}
              animate={{
                opacity: isActive || isPreview ? 1 : 0.72,
              }}
              transition={labelTransition}
              style={{
                textShadow: isActive ? `0 0 18px ${hexToRgba(mood.color, 0.82)}` : "none",
              }}
            >
              {mood.label}
            </motion.text>
          </g>
        );
      })}
    </>
  ),
);
MoodStopMarks.displayName = "MoodStopMarks";

export const MoodRingPicker: React.FC<MoodRingPickerProps> = ({
  selectedMood,
  onSelect,
  size = "md",
}) => {
  const reduceMotion = Boolean(useReducedMotion());
  const svgId = useId().replace(/:/g, "");
  const faceGradientId = `mood-ring-face-${svgId}`;
  const innerGradientId = `mood-ring-inner-${svgId}`;
  const shadowFilterId = `mood-ring-shadow-${svgId}`;
  const activeMoodId = selectedMood ?? DEFAULT_MOOD;
  const activeIndex = Math.max(
    0,
    MOODS.findIndex((mood) => mood.id === activeMoodId),
  );
  const activeMood = MOODS[activeIndex];
  const hasSelection = Boolean(selectedMood);

  const springTransition: Transition = useMemo(
    () =>
      reduceMotion
        ? { duration: 0 }
        : {
            type: "spring",
            stiffness: 180,
            damping: 26,
            mass: 0.8,
          },
    [reduceMotion],
  );

  const labelTransition: Transition = useMemo(
    () =>
      reduceMotion
        ? { duration: 0 }
        : {
            type: "spring",
            stiffness: 320,
            damping: 28,
            mass: 0.65,
          },
    [reduceMotion],
  );

  const handleSelect = useCallback(
    (mood: MoodType) => {
      onSelect(mood);
    },
    [onSelect],
  );

  const moodStops = useMemo(
    () =>
      MOODS.map((mood, index) => {
        const angle = angleForIndex(index);
        const point = pointAt(MOOD_DOT_RADIUS, angle);
        const isActive = mood.id === selectedMood;

        return (
          <button
            key={mood.id}
            type="button"
            aria-label={`Select ${mood.label} mood`}
            aria-pressed={isActive}
            className="absolute size-14 -translate-x-1/2 -translate-y-1/2 rounded-2xl transition-transform duration-200 active:scale-[0.96] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
            style={{
              left: `${(point.x / VIEWBOX_SIZE) * 100}%`,
              top: `${(point.y / VIEWBOX_SIZE) * 100}%`,
            }}
            onClick={() => handleSelect(mood.id)}
          />
        );
      }),
    [handleSelect, selectedMood],
  );

  return (
    <div
      className="relative mx-auto w-full select-none"
      style={{
        maxWidth: PICKER_SIZES[size],
      }}
    >
      <div
        className="relative mx-auto aspect-square w-full"
        aria-label="Mood clock picker"
        role="group"
      >
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-[12%] rounded-full"
          animate={{
            boxShadow: hasSelection
              ? `0 0 64px ${hexToRgba(activeMood.color, 0.34)}`
              : "0 0 42px var(--ring-idle-glow)",
          }}
          transition={springTransition}
        />

        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
        >
          <defs>
            <radialGradient id={faceGradientId} cx="50%" cy="49%" r="57%">
              <stop
                offset="0%"
                stopColor={hexToRgba(activeMood.color, hasSelection ? 0.16 : 0.08)}
              />
              <stop offset="42%" stopColor="var(--ring-face-center)" />
              <stop offset="76%" stopColor="var(--ring-face-mid)" />
              <stop offset="100%" stopColor="var(--ring-face-edge)" />
            </radialGradient>
            <radialGradient id={innerGradientId} cx="50%" cy="48%" r="58%">
              <stop offset="0%" stopColor="transparent" />
              <stop
                offset="52%"
                stopColor={hexToRgba(activeMood.color, hasSelection ? 0.12 : 0.05)}
              />
              <stop offset="100%" stopColor="var(--ring-inner-halo)" />
            </radialGradient>
            <filter id={shadowFilterId} x="-35%" y="-35%" width="170%" height="170%">
              <feDropShadow
                dx="0"
                dy="14"
                stdDeviation="14"
                floodColor="var(--ring-shadow-color)"
                floodOpacity="0.22"
              />
            </filter>
          </defs>

          <circle
            cx={CENTER}
            cy={CENTER}
            r={OUTER_RADIUS + 8}
            fill="var(--ring-outer-shadow)"
            opacity="0.58"
            filter={`url(#${shadowFilterId})`}
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            r={OUTER_RADIUS + 3}
            fill="none"
            stroke="var(--ring-shell-highlight)"
            strokeWidth="12"
            opacity="0.9"
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            r={OUTER_RADIUS}
            fill={`url(#${faceGradientId})`}
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            r={OUTER_RADIUS}
            fill="none"
            stroke="var(--ring-track)"
            strokeWidth="1.2"
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            r={TRACK_RADIUS}
            fill="none"
            stroke="var(--ring-track-inner)"
            strokeWidth="1"
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            r={INNER_GLOW_RADIUS}
            fill={`url(#${innerGradientId})`}
            opacity="0.92"
          />
          <ClockTicks />
          <MoodStopMarks
            selectedMood={selectedMood}
            labelTransition={labelTransition}
            reduceMotion={reduceMotion}
          />
        </svg>

        {moodStops}

        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 grid size-[108px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
          animate={{ opacity: 1 }}
          transition={springTransition}
          style={{
            background:
              "radial-gradient(circle, var(--ring-logo-plate), transparent 66%)",
          }}
        >
          <motion.span
            className="block h-[84px] w-[84px]"
            animate={{
              backgroundColor: hasSelection ? activeMood.color : "var(--ring-logo-fill)",
            }}
            transition={springTransition}
            style={{
              WebkitMask: "url('/app-logo.svg') center / contain no-repeat",
              mask: "url('/app-logo.svg') center / contain no-repeat",
            }}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default MoodRingPicker;
