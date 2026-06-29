import React, { useCallback, useMemo } from "react";
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
const TRACK_RADIUS = 114;
const MOOD_DOT_RADIUS = 124;
const LABEL_RADIUS = 142;
const HAND_LENGTH = MOOD_DOT_RADIUS;
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
    const isHour = i % 4 === 0;
    const outer = pointAt(TRACK_RADIUS, angle);
    const inner = pointAt(TRACK_RADIUS - (isHour ? 12 : 7), angle);

    return (
      <line
        key={i}
        x1={inner.x}
        y1={inner.y}
        x2={outer.x}
        y2={outer.y}
        stroke={isHour ? "var(--ring-tick-strong)" : "var(--ring-tick-soft)"}
        strokeLinecap="round"
        strokeWidth={isHour ? 2 : 1.35}
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
            <motion.circle
              cx={dot.x}
              cy={dot.y}
              r={isActive ? 5.25 : 4.35}
              fill={mood.color}
              initial={false}
              animate={{
                opacity: isActive || isPreview ? 1 : 0.68,
                scale: isActive ? [1, 1.22, 1] : 1,
              }}
              transition={
                isActive && !reduceMotion
                  ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
                  : labelTransition
              }
              style={{
                filter: `drop-shadow(0 0 ${isActive ? 12 : 7}px ${hexToRgba(
                  mood.color,
                  isActive ? 0.82 : 0.32,
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
  const activeMoodId = selectedMood ?? DEFAULT_MOOD;
  const activeIndex = Math.max(
    0,
    MOODS.findIndex((mood) => mood.id === activeMoodId),
  );
  const activeMood = MOODS[activeIndex];
  const activeAngle = angleForIndex(activeIndex);
  const handRotation = activeAngle + 90;
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
              ? `0 0 58px ${hexToRgba(activeMood.color, 0.3)}`
              : "0 0 38px var(--surface-violet-icon)",
          }}
          transition={springTransition}
        />

        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
        >
          <defs>
            <radialGradient id="mood-clock-face" cx="50%" cy="47%" r="62%">
              <stop offset="0%" stopColor="var(--surface-violet-high)" />
              <stop offset="58%" stopColor="var(--surface-violet-low)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <filter
              id="mood-clock-hand-glow"
              x="-80%"
              y="-80%"
              width="260%"
              height="260%"
            >
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation="7"
                floodColor={activeMood.color}
                floodOpacity={hasSelection ? "0.65" : "0.22"}
              />
            </filter>
          </defs>

          <circle cx={CENTER} cy={CENTER} r={122} fill="url(#mood-clock-face)" />
          <circle
            cx={CENTER}
            cy={CENTER}
            r={TRACK_RADIUS}
            fill="none"
            stroke="var(--ring-track)"
            strokeWidth="1.5"
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            r={82}
            fill="none"
            stroke="var(--ring-track-inner)"
            strokeWidth="1"
          />
          <ClockTicks />
          <MoodStopMarks
            selectedMood={selectedMood}
            labelTransition={labelTransition}
            reduceMotion={reduceMotion}
          />

          <motion.g
            style={{
              transformBox: "view-box",
              transformOrigin: `${CENTER}px ${CENTER}px`,
            }}
            animate={{ rotate: handRotation }}
            transition={springTransition}
          >
            <line
              x1={CENTER}
              y1={CENTER + 14}
              x2={CENTER}
              y2={CENTER - HAND_LENGTH}
              stroke={activeMood.color}
              strokeLinecap="round"
              strokeWidth={hasSelection ? 4.5 : 3.5}
              filter="url(#mood-clock-hand-glow)"
            />
            <circle
              cx={CENTER}
              cy={CENTER - HAND_LENGTH}
              r={hasSelection ? 7 : 5.5}
              fill={activeMood.color}
              opacity={hasSelection ? 0.95 : 0.55}
            />
          </motion.g>

          <circle
            cx={CENTER}
            cy={CENTER}
            r={18}
            fill="var(--ring-center-fill)"
            stroke={hasSelection ? activeMood.color : "var(--border-violet-medium)"}
            strokeWidth="2"
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            r={5}
            fill={hasSelection ? activeMood.color : "var(--text-on-surface-softer)"}
          />
        </svg>

        {moodStops}

        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 flex w-28 -translate-x-1/2 translate-y-7 flex-col items-center text-center"
          animate={{
            color: hasSelection ? activeMood.color : "var(--text-on-surface-soft)",
          }}
          transition={springTransition}
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--text-kicker)]">
            {hasSelection ? "Selected" : "Start at"}
          </span>
          <span className="mt-1 font-serif text-[22px] font-medium leading-none tracking-[-0.03em]">
            {activeMood.label}
          </span>
        </motion.div>
      </div>
    </div>
  );
};

export default MoodRingPicker;
