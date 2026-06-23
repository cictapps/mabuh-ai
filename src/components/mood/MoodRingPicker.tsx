import React, { useCallback, useMemo, useState } from "react";
import {
  motion,
  useReducedMotion,
  AnimatePresence,
  type Transition,
} from "framer-motion";
import { MOODS } from "../../data";
import type { MoodType } from "../../types";

/* ──────────────────────────────────────────────────────────────────────
 * MoodRingPicker — Professional Redesign
 *
 * A premium, highly-interactive orbital mood picker with:
 * - Elegant glassmorphic design with depth
 * - Smooth spring-driven animations with custom easing
 * - Dynamic particle glow effects on selection
 * - Ripple feedback on tap/click
 * - Pulsing center logo with mood-based color transitions
 * - Connecting beams with gradient flows
 * - Orbital track with subtle chromatic aberration
 * - Hover states with scale and glow
 * - Full keyboard accessibility
 * - Respects `prefers-reduced-motion`
 *
 * Design Philosophy:
 * - Professional yet warm aesthetic
 * - Subtle micro-interactions that feel alive
 * - Clear visual hierarchy
 * - Touch-first with desktop polish
 * ──────────────────────────────────────────────────────────────────── */

interface MoodRingPickerProps {
  selectedMood: MoodType | null;
  onSelect: (mood: MoodType) => void;
  size?: "sm" | "md" | "lg";
}

/* ── Layout Constants ─────────────────────────────────────────────── */
const BASE_SIZE = 360;
const SMALL_SIZE = 280;
const LARGE_SIZE = 420;

const getSize = (size: "sm" | "md" | "lg") => {
  switch (size) {
    case "sm":
      return SMALL_SIZE;
    case "lg":
      return LARGE_SIZE;
    default:
      return BASE_SIZE;
  }
};

const getOrbitRadius = (size: "sm" | "md" | "lg") => {
  switch (size) {
    case "sm":
      return 110;
    case "lg":
      return 160;
    default:
      return 140;
  }
};

const getNodeSize = (size: "sm" | "md" | "lg", isSelected: boolean) => {
  const base = size === "sm" ? 40 : size === "lg" ? 52 : 46;
  const selected = base + (size === "sm" ? 8 : size === "lg" ? 14 : 10);
  return isSelected ? selected : base;
};

const getLogoSize = (size: "sm" | "md" | "lg") => {
  switch (size) {
    case "sm":
      return 72;
    case "lg":
      return 100;
    default:
      return 88;
  }
};

const getTrackWidth = (size: "sm" | "md" | "lg") => {
  switch (size) {
    case "sm":
      return 24;
    case "lg":
      return 32;
    default:
      return 28;
  }
};

const START_DEG = -90; // 12-o'clock position
const N = MOODS.length;
const STEP_DEG = 360 / N;

/* ── Mood Icons (Custom SVG-based for professional look) ───────────── */
const MoodIcon: React.FC<{ mood: MoodType; size: number; color: string }> = React.memo(
  ({ mood, size, color }) => {
    const iconSize = size * 0.6;

    // Custom icon mappings for each mood
    const getIcon = () => {
      switch (mood) {
        case "happy":
          return (
            <svg viewBox="0 0 24 24" width={iconSize} height={iconSize}>
              <path
                d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-3.5-9c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5s.67 1.5 1.5 1.5zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5zm2.5-8c.83 0 1.5-.67 1.5-1.5S15.33 8 14.5 8 13 8.67 13 9.5s.67 1.5 1.5 1.5z"
                fill={color}
              />
            </svg>
          );
        case "calm":
          return (
            <svg viewBox="0 0 24 24" width={iconSize} height={iconSize}>
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"
                fill={color}
              />
            </svg>
          );
        case "okay":
          return (
            <svg viewBox="0 0 24 24" width={iconSize} height={iconSize}>
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v2h-2zm0 4h2v6h-2z"
                fill={color}
              />
            </svg>
          );
        case "tired":
          return (
            <svg viewBox="0 0 24 24" width={iconSize} height={iconSize}>
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v2h-2zm0 4h2v6h-2z"
                fill={color}
              />
            </svg>
          );
        case "worried":
          return (
            <svg viewBox="0 0 24 24" width={iconSize} height={iconSize}>
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v2h-2zm0 4h2v6h-2z"
                fill={color}
              />
            </svg>
          );
        case "sad":
          return (
            <svg viewBox="0 0 24 24" width={iconSize} height={iconSize}>
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v2h-2zm0 4h2v6h-2z"
                fill={color}
              />
            </svg>
          );
        case "stressed":
          return (
            <svg viewBox="0 0 24 24" width={iconSize} height={iconSize}>
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v2h-2zm0 4h2v6h-2z"
                fill={color}
              />
            </svg>
          );
        default:
          return (
            <svg viewBox="0 0 24 24" width={iconSize} height={iconSize}>
              <circle cx="12" cy="12" r="10" fill={color} />
            </svg>
          );
      }
    };

    return <g style={{ pointerEvents: "none" }}>{getIcon()}</g>;
  },
);
MoodIcon.displayName = "MoodIcon";

/* ── Helpers ───────────────────────────────────────────────────────── */
function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function pointAt(radius: number, angleDeg: number): { x: number; y: number } {
  const a = toRad(angleDeg);
  return { x: radius * Math.cos(a), y: radius * Math.sin(a) };
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

function lightenHex(hex: string, amount: number): string {
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
  const lr = Math.round(r + (255 - r) * amount);
  const lg = Math.round(g + (255 - g) * amount);
  const lb = Math.round(b + (255 - b) * amount);
  return `#${lr.toString(16).padStart(2, "0")}${lg.toString(16).padStart(2, "0")}${lb.toString(16).padStart(2, "0")}`;
}

/* ── Spring Configurations ──────────────────────────────────────────── */
const springUltraSmooth: Transition = {
  type: "spring",
  stiffness: 200,
  damping: 30,
  mass: 0.8,
  restDelta: 0.01,
};

const springSnappy: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
  mass: 0.6,
  restDelta: 0.01,
};

const instantTransition: Transition = { duration: 0 };

/* ── Orbital Track (Enhanced with Chromatic Effects) ──────────────── */
const OrbitalTrack: React.FC<{ size: number; radius: number }> = React.memo(
  ({ size, radius }) => {
    const cx = size / 2;
    const cy = size / 2;
    const trackWidth = getTrackWidth(size >= 400 ? "lg" : size <= 300 ? "sm" : "md");

    return (
      <>
        <defs>
          {/* Main gradient with chromatic aberration effect */}
          <linearGradient
            id="orbit-gradient"
            x1="0"
            y1="0"
            x2="1"
            y2="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="rotate(45)"
          >
            {MOODS.map((m, i) => (
              <stop
                key={m.id}
                offset={`${((i / N) * 100).toFixed(1)}%`}
                stopColor={m.color}
                stopOpacity={0.18}
              />
            ))}
            <stop offset="100%" stopColor={MOODS[0].color} stopOpacity={0.18} />
          </linearGradient>
          {/* Inner glow gradient */}
          <radialGradient
            id="orbit-inner-glow"
            cx="50%"
            cy="50%"
            r="50%"
            fx="50%"
            fy="50%"
          >
            <stop offset="0%" stopColor="#bcc2ff" stopOpacity={0.08} />
            <stop offset="100%" stopColor="#bcc2ff" stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* Outer chromatic aberration effect (RGB split) */}
        <circle
          cx={cx}
          cy={cy}
          r={radius + 2}
          fill="none"
          stroke="rgba(255, 80, 80, 0.12)"
          strokeWidth={1}
          strokeDasharray="2,2"
          opacity={0.3}
          pointerEvents="none"
        />
        <circle
          cx={cx}
          cy={cy}
          r={radius + 4}
          fill="none"
          stroke="rgba(80, 255, 80, 0.12)"
          strokeWidth={1}
          strokeDasharray="2,2"
          strokeDashoffset="1"
          opacity={0.3}
          pointerEvents="none"
        />
        <circle
          cx={cx}
          cy={cy}
          r={radius + 6}
          fill="none"
          stroke="rgba(80, 80, 255, 0.12)"
          strokeWidth={1}
          strokeDasharray="2,2"
          strokeDashoffset="2"
          opacity={0.3}
          pointerEvents="none"
        />

        {/* Main orbital track with gradient */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="url(#orbit-gradient)"
          strokeWidth={trackWidth}
          opacity={0.4}
          style={{ filter: "blur(14px)" }}
          pointerEvents="none"
        />

        {/* Inner crisp track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="rgba(216,212,235,0.06)"
          strokeWidth={1.5}
          pointerEvents="none"
        />

        {/* Subtle inner glow */}
        <circle
          cx={cx}
          cy={cy}
          r={radius - 10}
          fill="url(#orbit-inner-glow)"
          opacity={0.5}
          pointerEvents="none"
        />
      </>
    );
  },
);
OrbitalTrack.displayName = "OrbitalTrack";

/* ── Active Arc with Particle Effect ──────────────────────────────── */
interface ActiveArcProps {
  selectedIdx: number;
  transition: Transition;
  size: number;
  radius: number;
}

const ActiveArc: React.FC<ActiveArcProps> = React.memo(
  ({ selectedIdx, transition, size, radius }) => {
    const activeMood = MOODS[selectedIdx];
    const cx = size / 2;
    const cy = size / 2;

    // Create particle positions along the arc
    const arcSpan = 60;
    const halfSpan = arcSpan / 2;
    const startAngle = START_DEG + selectedIdx * STEP_DEG - halfSpan;
    const endAngle = START_DEG + selectedIdx * STEP_DEG + halfSpan;

    const r = radius;
    const x1 = cx + r * Math.cos(toRad(startAngle));
    const y1 = cy + r * Math.sin(toRad(startAngle));
    const x2 = cx + r * Math.cos(toRad(endAngle));
    const y2 = cy + r * Math.sin(toRad(endAngle));

    const d = `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;

    // Generate particles along the arc
    const particles = (() => {
      const count = 8;
      const result = [];
      for (let i = 0; i < count; i++) {
        const angle = startAngle + (arcSpan * i) / (count - 1);
        const px = cx + (r + 4) * Math.cos(toRad(angle));
        const py = cy + (r + 4) * Math.sin(toRad(angle));
        const delay = (i / count) * 0.3;
        result.push({ x: px, y: py, delay, size: 2 + Math.random() * 2 });
      }
      return result;
    })();

    return (
      <>
        <defs>
          <filter id="active-arc-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
          <linearGradient id="arc-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={activeMood.color} stopOpacity={0} />
            <stop offset="30%" stopColor={activeMood.color} stopOpacity={0.35} />
            <stop offset="70%" stopColor={activeMood.color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={activeMood.color} stopOpacity={0} />
          </linearGradient>
          <radialGradient id="particle-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={activeMood.color} stopOpacity={0.6} />
            <stop offset="100%" stopColor={activeMood.color} stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* Glow layer */}
        <motion.path
          d={d}
          fill="none"
          initial={false}
          animate={{ stroke: activeMood.color }}
          transition={transition}
          strokeWidth={14}
          strokeLinecap="round"
          opacity={0.45}
          filter="url(#active-arc-glow)"
          pointerEvents="none"
        />

        {/* Particle glow effect */}
        {particles.map((p, i) => (
          <motion.circle
            key={`particle-${selectedIdx}-${i}`}
            cx={p.x}
            cy={p.y}
            r={p.size}
            fill="url(#particle-glow)"
            initial={{ opacity: 0, r: 0 }}
            animate={{ opacity: [0.3, 0.8, 0.3], r: p.size }}
            transition={{
              delay: p.delay,
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            pointerEvents="none"
          />
        ))}

        {/* Crisp arc with gradient */}
        <motion.path
          d={d}
          fill="none"
          initial={false}
          animate={{ stroke: `url(#arc-gradient)` }}
          transition={transition}
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.9}
          pointerEvents="none"
        />
      </>
    );
  },
);
ActiveArc.displayName = "ActiveArc";

/* ── Connection Beam with Gradient Flow ───────────────────────────── */
interface ConnectionBeamProps {
  selectedIdx: number;
  transition: Transition;
  size: number;
  orbitRadius: number;
  logoSize: number;
}

const ConnectionBeam: React.FC<ConnectionBeamProps> = React.memo(
  ({ selectedIdx, transition, size, orbitRadius, logoSize }) => {
    const mood = MOODS[selectedIdx];
    const angle = START_DEG + selectedIdx * STEP_DEG;
    const nodePos = pointAt(orbitRadius, angle);
    const cx = size / 2;
    const cy = size / 2;

    // Beam from logo edge to node
    const logoEdge = pointAt(logoSize / 2 + 6, angle);

    const gradId = `beam-grad-${selectedIdx}`;

    return (
      <>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={mood.color} stopOpacity={0} />
            <stop offset="30%" stopColor={mood.color} stopOpacity={0.3} />
            <stop offset="50%" stopColor={mood.color} stopOpacity={0.4} />
            <stop offset="70%" stopColor={mood.color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={mood.color} stopOpacity={0} />
          </linearGradient>
          <filter id="beam-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        {/* Glow beam */}
        <motion.line
          x1={logoEdge.x + cx}
          y1={logoEdge.y + cy}
          x2={nodePos.x + cx}
          y2={nodePos.y + cy}
          stroke={`url(#${gradId})`}
          strokeWidth={3}
          strokeLinecap="round"
          initial={{ opacity: 0, strokeWidth: 0 }}
          animate={{ opacity: 1, strokeWidth: 3 }}
          exit={{ opacity: 0, strokeWidth: 0 }}
          transition={{ ...transition, delay: 0.1 }}
          filter="url(#beam-glow)"
          pointerEvents="none"
        />

        {/* Crisp beam */}
        <motion.line
          x1={logoEdge.x + cx}
          y1={logoEdge.y + cy}
          x2={nodePos.x + cx}
          y2={nodePos.y + cy}
          stroke={mood.color}
          strokeWidth={1.5}
          strokeLinecap="round"
          initial={{ opacity: 0, pathLength: 0 }}
          animate={{ opacity: 1, pathLength: 1 }}
          exit={{ opacity: 0, pathLength: 0 }}
          transition={{ ...transition, delay: 0.15 }}
          pointerEvents="none"
        />

        {/* Pulsing dot at node connection */}
        <motion.circle
          cx={nodePos.x + cx}
          cy={nodePos.y + cy}
          r={4}
          fill={mood.color}
          initial={{ opacity: 0, r: 0 }}
          animate={{ opacity: [0.4, 0.8, 0.4], r: [2, 4, 2] }}
          transition={{
            delay: 0.2,
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          pointerEvents="none"
        />
      </>
    );
  },
);
ConnectionBeam.displayName = "ConnectionBeam";

/* ── Mood Node with Enhanced Interactivity ──────────────────────────── */
interface MoodNodeProps {
  mood: (typeof MOODS)[number];
  index: number;
  isSelected: boolean;
  transition: Transition;
  onClick: (id: MoodType) => void;
  size: number;
  orbitRadius: number;
  nodeSize: number;
  isHovered: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}

const MoodNode: React.FC<MoodNodeProps> = React.memo(
  ({
    mood,
    index,
    isSelected,
    transition,
    onClick,
    size,
    orbitRadius,
    nodeSize,
    isHovered,
    onHoverStart,
    onHoverEnd,
  }) => {
    const angle = START_DEG + index * STEP_DEG;
    const pos = pointAt(orbitRadius, angle);
    const half = nodeSize / 2;
    const cx = size / 2;
    const cy = size / 2;

    const x = pos.x + cx;
    const y = pos.y + cy;

    // Keep the click handling on a plain <g>. Applying framer-motion's
    // `animate={{ scale }}` + `whileTap` directly to a motion.g swallows
    // pointer events on some browsers, so the scale animation lives on
    // an inner motion.g instead.
    const handleSelect = () => onClick(mood.id);
    const handleKeyDown = (e: React.KeyboardEvent<SVGGElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleSelect();
      }
    };

    return (
      <g
        role="radio"
        aria-checked={isSelected}
        aria-label={mood.label}
        tabIndex={0}
        onClick={handleSelect}
        onPointerDown={handleSelect}
        onKeyDown={handleKeyDown}
        onMouseEnter={onHoverStart}
        onMouseLeave={onHoverEnd}
        style={{
          cursor: "pointer",
          outline: "none",
          pointerEvents: "auto",
          touchAction: "manipulation",
        }}
      >
        {/* Transparent hit area — all visual children sit inside a motion.g
            with pointerEvents="none", so the outer <g> has no hit target on
            its own. This circle guarantees clicks/pointerdowns land on a
            tappable surface even when the visual node is small or unselected. */}
        <circle cx={x} cy={y} r={half + 10} fill="transparent" pointerEvents="auto" />
        <motion.g
          initial={false}
          animate={{ scale: isHovered ? 1.08 : 1 }}
          whileTap={{ scale: 0.92 }}
          transition={springUltraSmooth}
          style={{
            transformOrigin: `${x}px ${y}px`,
            transformBox: "fill-box",
          }}
          pointerEvents="none"
        >
          {/* Ripple effect on click */}
          <AnimatePresence>
            {isSelected && (
              <motion.circle
                cx={x}
                cy={y}
                r={0}
                fill={mood.color}
                initial={{ r: 0, opacity: 0.4 }}
                animate={{ r: half * 2.5, opacity: 0 }}
                exit={{ r: 0, opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                pointerEvents="none"
                style={{ filter: "blur(8px)" }}
              />
            )}
          </AnimatePresence>

          {/* Outer selection ring */}
          <AnimatePresence>
            {isSelected && (
              <motion.circle
                cx={x}
                cy={y}
                r={half + 10}
                fill="none"
                stroke={mood.color}
                strokeWidth={2}
                initial={{ opacity: 0, r: half }}
                animate={{ opacity: 0.6, r: half + 10 }}
                exit={{ opacity: 0, r: half }}
                transition={transition}
                pointerEvents="none"
                style={{
                  filter: "drop-shadow(0 0 6px " + hexToRgba(mood.color, 0.4) + ")",
                }}
              />
            )}
          </AnimatePresence>

          {/* Ambient glow */}
          <motion.circle
            cx={x}
            cy={y}
            fill={mood.color}
            initial={false}
            animate={{
              r: isSelected ? half + 6 : isHovered ? half + 2 : half - 2,
              opacity: isSelected ? 0.35 : isHovered ? 0.12 : 0.06,
            }}
            transition={transition}
            style={{ filter: "blur(12px)" }}
            pointerEvents="none"
          />

          {/* Glassmorphic node body */}
          <motion.circle
            cx={x}
            cy={y}
            fill={isSelected ? hexToRgba(mood.color, 0.25) : "rgba(18,20,28,0.7)"}
            stroke={isSelected ? mood.color : "rgba(216,212,235,0.12)"}
            strokeWidth={isSelected ? 2.5 : 1.5}
            initial={false}
            animate={{ r: half }}
            transition={transition}
            pointerEvents="none"
            style={{
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: isSelected ? `0 0 20px ${hexToRgba(mood.color, 0.3)}` : "none",
            }}
          />

          {/* Icon container — lifts on selection */}
          <motion.g
            initial={false}
            animate={{ y: isSelected ? -2 : 0 }}
            transition={transition}
            pointerEvents="none"
            style={{ userSelect: "none" }}
            transform={`translate(${x - nodeSize * 0.4} ${y - nodeSize * 0.4})`}
          >
            <MoodIcon mood={mood.id} size={nodeSize * 0.8} color={mood.color} />
          </motion.g>

          {/* Label */}
          <motion.text
            x={x}
            y={y + half + 16}
            textAnchor="middle"
            fontFamily='"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif'
            fontSize={11}
            fontWeight={isSelected ? 700 : 500}
            letterSpacing="0.04em"
            initial={false}
            animate={{
              fill: isSelected
                ? mood.color
                : isHovered
                  ? "rgba(216,212,235,0.7)"
                  : "rgba(216,212,235,0.4)",
              opacity: isSelected ? 1 : isHovered ? 0.9 : 0.6,
            }}
            transition={transition}
            pointerEvents="none"
          >
            {mood.label}
          </motion.text>
        </motion.g>
      </g>
    );
  },
);
MoodNode.displayName = "MoodNode";

/* ── Center Logo with Enhanced Effects ──────────────────────────────── */
interface MoodCenterLogoProps {
  color: string;
  hasSelection: boolean;
  size: number;
  transition: Transition;
}

const MoodCenterLogo: React.FC<MoodCenterLogoProps> = React.memo(
  ({ color, hasSelection, size, transition }) => {
    const logoSize = size * 0.62;
    const isRgb = color.startsWith("rgb");
    const displayColor = isRgb ? color : lightenHex(color, 0.35);
    const glowColor = isRgb ? color : hexToRgba(color, 0.6);
    const ambientColor = isRgb ? color : hexToRgba(color, 0.22);

    return (
      <div
        style={{
          position: "relative",
          width: size,
          height: size,
          display: "grid",
          placeItems: "center",
        }}
      >
        {/* Pulsing ambient ring */}
        <motion.div
          aria-hidden
          initial={false}
          animate={{
            boxShadow: hasSelection
              ? `0 0 50px 16px ${ambientColor}, 0 0 100px 32px ${hexToRgba(
                  color.startsWith("rgb") ? "#bcc2ff" : color,
                  0.08,
                )}`
              : "0 0 30px 8px rgba(188,194,255,0.06)",
            scale: hasSelection ? [1, 1.05, 1] : 1,
          }}
          transition={{ ...transition, duration: 2, repeat: Infinity }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        />

        {/* Glassmorphic backdrop */}
        <motion.div
          aria-hidden
          initial={false}
          animate={{
            borderColor: hasSelection
              ? hexToRgba(color.startsWith("rgb") ? "#bcc2ff" : color, 0.22)
              : "rgba(188,194,255,0.08)",
            background: hasSelection
              ? `radial-gradient(circle at center, ${hexToRgba(
                  color.startsWith("rgb") ? "#bcc2ff" : color,
                  0.08,
                )}, rgba(18,20,28,0.5) 70%)`
              : "rgba(18,20,28,0.4)",
          }}
          transition={transition}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "2px solid",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            pointerEvents: "none",
          }}
        />

        {/* Logo with glow */}
        <motion.div
          aria-hidden
          initial={false}
          animate={{
            backgroundColor: displayColor,
            filter: `drop-shadow(0 0 8px ${glowColor}) drop-shadow(0 0 24px ${ambientColor})`,
            scale: hasSelection ? [1, 1.05, 1] : 1,
          }}
          transition={{ ...transition, duration: hasSelection ? 1.5 : 0.5 }}
          style={{
            position: "relative",
            width: logoSize,
            height: logoSize,
            borderRadius: 14,
            WebkitMaskImage: "url(/app-logo-white.svg)",
            maskImage: "url(/app-logo-white.svg)",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
            WebkitMaskSize: "contain",
            maskSize: "contain",
            pointerEvents: "none",
          }}
        />

        {/* Selection pulse ring */}
        <AnimatePresence>
          {hasSelection && (
            <motion.div
              aria-hidden
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.3, opacity: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: `2px solid ${color}`,
                pointerEvents: "none",
              }}
            />
          )}
        </AnimatePresence>
      </div>
    );
  },
);
MoodCenterLogo.displayName = "MoodCenterLogo";

/* ── Main Component ────────────────────────────────────────────────── */
export const MoodRingPicker: React.FC<MoodRingPickerProps> = ({
  selectedMood,
  onSelect,
  size: sizeProp = "md",
}) => {
  const shouldReduceMotion = useReducedMotion();
  const actualSize = getSize(sizeProp);
  const orbitRadius = getOrbitRadius(sizeProp);
  const logoSize = getLogoSize(sizeProp);

  const selectedIdx = selectedMood ? MOODS.findIndex((m) => m.id === selectedMood) : -1;
  const selectedMoodMeta = selectedIdx >= 0 ? MOODS[selectedIdx] : null;

  const transition = shouldReduceMotion ? instantTransition : springUltraSmooth;
  const snappyTransition = shouldReduceMotion ? instantTransition : springSnappy;

  // Track hovered node
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleClick = useCallback(
    (id: MoodType) => {
      onSelect(id);
    },
    [onSelect],
  );

  // Sorted so the selected mood renders last (on top)
  const sortedIndices = useMemo(() => {
    const indices = MOODS.map((_, i) => i);
    if (selectedIdx >= 0) {
      const withoutSelected = indices.filter((i) => i !== selectedIdx);
      withoutSelected.push(selectedIdx);
      return withoutSelected;
    }
    return indices;
  }, [selectedIdx]);

  return (
    <div
      className="mood-ring-picker"
      style={{
        position: "relative",
        width: "100%",
        maxWidth: actualSize + 40,
        margin: "0 auto",
      }}
    >
      <svg
        viewBox={`0 0 ${actualSize} ${actualSize}`}
        width="100%"
        style={{
          height: "auto",
          maxWidth: actualSize,
          margin: "0 auto",
          display: "block",
          touchAction: "manipulation",
          overflow: "visible",
        }}
        role="radiogroup"
        aria-label="How are you feeling right now?"
      >
        {/* Orbital track */}
        <OrbitalTrack size={actualSize} radius={orbitRadius} />

        {/* Active arc with particles */}
        {selectedIdx >= 0 && (
          <ActiveArc
            selectedIdx={selectedIdx}
            transition={transition}
            size={actualSize}
            radius={orbitRadius}
          />
        )}

        {/* Connection beam */}
        <AnimatePresence>
          {selectedIdx >= 0 && (
            <ConnectionBeam
              key={`beam-${selectedIdx}`}
              selectedIdx={selectedIdx}
              transition={snappyTransition}
              size={actualSize}
              orbitRadius={orbitRadius}
              logoSize={logoSize}
            />
          )}
        </AnimatePresence>

        {/* Mood nodes */}
        {sortedIndices.map((i) => {
          const nodeSize = getNodeSize(sizeProp, i === selectedIdx);
          return (
            <MoodNode
              key={MOODS[i].id}
              mood={MOODS[i]}
              index={i}
              isSelected={i === selectedIdx}
              transition={transition}
              onClick={handleClick}
              size={actualSize}
              orbitRadius={orbitRadius}
              nodeSize={nodeSize}
              isHovered={hoveredIndex === i}
              onHoverStart={() => setHoveredIndex(i)}
              onHoverEnd={() => setHoveredIndex(null)}
            />
          );
        })}
      </svg>

      {/* Center logo overlay */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <MoodCenterLogo
          color={selectedMoodMeta?.color ?? "rgba(188,194,255,0.55)"}
          hasSelection={selectedIdx >= 0}
          size={logoSize}
          transition={transition}
        />
      </div>
    </div>
  );
};

export default MoodRingPicker;
