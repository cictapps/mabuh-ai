import React, { useCallback, useMemo } from "react";
import {
  motion,
  useReducedMotion,
  AnimatePresence,
  type Transition,
} from "framer-motion";
import type { MoodType } from "../../types";
import { MOODS } from "../../data";

/* ──────────────────────────────────────────────────────────────────────
 * MoodArc — redesigned orbital mood picker
 *
 * A 360° orbital ring where each mood floats as a glowing node with its
 * emoji icon. The MabuhAi logo sits at dead-centre, recoloured by the
 * active mood with a soft volumetric glow. Selecting a mood fires a
 * spring-driven orbital rotation, pulses the node, and washes the
 * centre with mood colour.
 *
 * Accessibility: full keyboard support via radiogroup/radio semantics.
 * Respects `prefers-reduced-motion`.
 * ──────────────────────────────────────────────────────────────────── */

interface MoodArcProps {
  selectedMood: MoodType | null;
  onSelect: (mood: MoodType) => void;
}

/* ── Layout constants ─────────────────────────────────────────────── */
const SIZE = 340;
const VIEWBOX_PAD = 36; // headroom so blurred outer glow + SVG filters aren't clipped
const VISUAL_SIZE = SIZE + VIEWBOX_PAD * 2;
const VIEWBOX = `${-VIEWBOX_PAD} ${-VIEWBOX_PAD} ${VISUAL_SIZE} ${VISUAL_SIZE}`;
const SVG_MAX_WIDTH = 380 * (VISUAL_SIZE / SIZE);
const CX = SIZE / 2;
const CY = SIZE / 2;
const ORBIT_RADIUS = 130; // radius of the orbital track
const NODE_SIZE = 44; // base node diameter (≥ 44px touch)
const NODE_SIZE_SELECTED = 54; // selected node diameter
const LOGO_SIZE = 88; // centre logo size
const START_DEG = -90; // 12-o'clock

const N = MOODS.length;
const STEP_DEG = 360 / N;

/* Mood emoji map — one per mood for instant visual recognition */
const MOOD_EMOJI: Record<MoodType, string> = {
  stressed: "😰",
  worried: "😟",
  okay: "😐",
  calm: "😌",
  happy: "😊",
  sad: "😢",
  tired: "😴",
};

/* ── Helpers ───────────────────────────────────────────────────────── */
function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function pointAt(radius: number, angleDeg: number) {
  const a = toRad(angleDeg);
  return { x: CX + radius * Math.cos(a), y: CY + radius * Math.sin(a) };
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

/** Blend a hex colour toward white so the logo reads brighter. */
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

/* ── Spring configs ────────────────────────────────────────────────── */
const springSnappy: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 28,
  mass: 0.6,
};
const springGentle: Transition = {
  type: "spring",
  stiffness: 180,
  damping: 24,
  mass: 0.8,
};
const instantTransition: Transition = { duration: 0 };

/* ── Orbital track gradient (SVG) ──────────────────────────────────── */
const OrbitTrack: React.FC = React.memo(() => {
  const id = "orbit-track-grad";
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          {MOODS.map((m, i) => (
            <stop
              key={m.id}
              offset={`${((i / N) * 100).toFixed(1)}%`}
              stopColor={m.color}
              stopOpacity={0.22}
            />
          ))}
          <stop offset="100%" stopColor={MOODS[0].color} stopOpacity={0.22} />
        </linearGradient>
      </defs>
      {/* Soft outer glow of the track */}
      <circle
        cx={CX}
        cy={CY}
        r={ORBIT_RADIUS}
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth={28}
        opacity={0.35}
        style={{ filter: "blur(12px)" }}
      />
      {/* Crisp orbital track */}
      <circle
        cx={CX}
        cy={CY}
        r={ORBIT_RADIUS}
        fill="none"
        stroke="rgba(216,212,235,0.08)"
        strokeWidth={1.5}
      />
    </>
  );
});
OrbitTrack.displayName = "OrbitTrack";

/* ── Active arc — sweeps between nodes ─────────────────────────────── */
const ActiveArc: React.FC<{
  selectedIdx: number;
  transition: Transition;
}> = React.memo(({ selectedIdx, transition }) => {
  const activeMood = MOODS[selectedIdx];

  // Build a partial arc centred on the selected node
  const arcSpan = 50; // degrees, visual weight of the arc
  const halfSpan = arcSpan / 2;
  const startAngle = START_DEG + selectedIdx * STEP_DEG - halfSpan;
  const endAngle = START_DEG + selectedIdx * STEP_DEG + halfSpan;

  const r = ORBIT_RADIUS;
  const x1 = CX + r * Math.cos(toRad(startAngle));
  const y1 = CY + r * Math.sin(toRad(startAngle));
  const x2 = CX + r * Math.cos(toRad(endAngle));
  const y2 = CY + r * Math.sin(toRad(endAngle));

  const d = `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;

  return (
    <>
      <defs>
        <filter id="active-arc-glow" x="-50%" y="-1200%" width="200%" height="2500%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>
      {/* Glow layer */}
      <motion.path
        d={d}
        fill="none"
        initial={false}
        animate={{ stroke: activeMood.color }}
        transition={transition}
        strokeWidth={12}
        strokeLinecap="round"
        opacity={0.45}
        filter="url(#active-arc-glow)"
        pointerEvents="none"
      />
      {/* Crisp arc */}
      <motion.path
        d={d}
        fill="none"
        initial={false}
        animate={{ stroke: activeMood.color }}
        transition={transition}
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.9}
        pointerEvents="none"
      />
    </>
  );
});
ActiveArc.displayName = "ActiveArc";

/* ── Single mood node ──────────────────────────────────────────────── */
interface MoodNodeProps {
  mood: (typeof MOODS)[number];
  index: number;
  isSelected: boolean;
  transition: Transition;
  onClick: (id: MoodType) => void;
}

const MoodNode: React.FC<MoodNodeProps> = React.memo(
  ({ mood, index, isSelected, transition, onClick }) => {
    const angle = START_DEG + index * STEP_DEG;
    const pos = pointAt(ORBIT_RADIUS, angle);
    const size = isSelected ? NODE_SIZE_SELECTED : NODE_SIZE;
    const half = size / 2;

    return (
      <motion.g
        role="radio"
        aria-checked={isSelected}
        aria-label={mood.label}
        tabIndex={0}
        onClick={() => onClick(mood.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick(mood.id);
          }
        }}
        style={{ cursor: "pointer", outline: "none" }}
      >
        {/* Outer glow ring on selection */}
        <AnimatePresence>
          {isSelected && (
            <motion.circle
              cx={pos.x}
              cy={pos.y}
              r={half + 8}
              fill="none"
              stroke={mood.color}
              strokeWidth={1.5}
              initial={{ opacity: 0, r: half }}
              animate={{ opacity: 0.5, r: half + 8 }}
              exit={{ opacity: 0, r: half }}
              transition={transition}
              pointerEvents="none"
            />
          )}
        </AnimatePresence>

        {/* Ambient glow behind the node */}
        <motion.circle
          cx={pos.x}
          cy={pos.y}
          fill={mood.color}
          initial={false}
          animate={{
            r: isSelected ? half + 3 : half - 2,
            opacity: isSelected ? 0.3 : 0.08,
          }}
          transition={transition}
          style={{ filter: "blur(8px)" }}
          pointerEvents="none"
        />

        {/* Node body — glassmorphic circle */}
        <motion.circle
          cx={pos.x}
          cy={pos.y}
          fill={isSelected ? hexToRgba(mood.color, 0.22) : "rgba(18,20,28,0.65)"}
          stroke={isSelected ? hexToRgba(mood.color, 0.55) : "rgba(216,212,235,0.10)"}
          strokeWidth={isSelected ? 2 : 1}
          initial={false}
          animate={{ r: half }}
          transition={transition}
          pointerEvents="none"
        />

        {/* Emoji */}
        <motion.text
          x={pos.x}
          y={pos.y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={isSelected ? 24 : 20}
          initial={false}
          animate={{
            fontSize: isSelected ? 24 : 20,
            y: pos.y,
          }}
          transition={transition}
          pointerEvents="none"
          style={{ userSelect: "none" }}
        >
          {MOOD_EMOJI[mood.id]}
        </motion.text>

        {/* Label below the node */}
        <motion.text
          x={pos.x}
          y={pos.y + half + 14}
          textAnchor="middle"
          fontFamily='"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif'
          fontSize={11}
          fontWeight={isSelected ? 700 : 500}
          letterSpacing="0.04em"
          initial={false}
          animate={{
            fill: isSelected ? mood.color : "rgba(216,212,235,0.45)",
            opacity: isSelected ? 1 : 0.7,
          }}
          transition={transition}
          pointerEvents="none"
        >
          {mood.label}
        </motion.text>
      </motion.g>
    );
  },
);
MoodNode.displayName = "MoodNode";

/* ── Centre logo ───────────────────────────────────────────────────── */
const MoodCenterLogo: React.FC<{ color: string; hasSelection: boolean }> = React.memo(
  ({ color, hasSelection }) => {
    const shouldReduceMotion = useReducedMotion();
    const t = shouldReduceMotion ? instantTransition : springGentle;

    const isRgb = color.startsWith("rgb");
    const displayColor = isRgb ? color : lightenHex(color, 0.35);
    const glowColor = isRgb ? color : hexToRgba(color, 0.6);
    const ambientColor = isRgb ? color : hexToRgba(color, 0.18);

    return (
      <div
        style={{
          position: "relative",
          width: LOGO_SIZE,
          height: LOGO_SIZE,
          display: "grid",
          placeItems: "center",
        }}
      >
        {/* Ambient ring behind logo */}
        <motion.div
          aria-hidden
          initial={false}
          animate={{
            boxShadow: hasSelection
              ? `0 0 40px 12px ${ambientColor}, 0 0 80px 24px ${hexToRgba(color.startsWith("rgb") ? "#bcc2ff" : color, 0.08)}`
              : "0 0 30px 8px rgba(188,194,255,0.06)",
          }}
          transition={t}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        />

        {/* Glassmorphic backdrop circle */}
        <motion.div
          aria-hidden
          initial={false}
          animate={{
            borderColor: hasSelection
              ? hexToRgba(color.startsWith("rgb") ? "#bcc2ff" : color, 0.18)
              : "rgba(188,194,255,0.08)",
            background: hasSelection
              ? `radial-gradient(circle at center, ${hexToRgba(color.startsWith("rgb") ? "#bcc2ff" : color, 0.06)}, rgba(18,20,28,0.45) 70%)`
              : "rgba(18,20,28,0.35)",
          }}
          transition={t}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "1px solid",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            pointerEvents: "none",
          }}
        />

        {/* Logo recoloured by the mood via CSS mask */}
        <motion.div
          aria-hidden
          initial={false}
          animate={{
            backgroundColor: displayColor,
            filter: `drop-shadow(0 0 6px ${glowColor}) drop-shadow(0 0 18px ${ambientColor})`,
          }}
          transition={t}
          style={{
            position: "relative",
            width: LOGO_SIZE * 0.62,
            height: LOGO_SIZE * 0.62,
            borderRadius: 12,
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
      </div>
    );
  },
);
MoodCenterLogo.displayName = "MoodCenterLogo";

/* ── Connecting lines from center to active node ───────────────────── */
const ConnectionBeam: React.FC<{
  selectedIdx: number;
  transition: Transition;
}> = React.memo(({ selectedIdx, transition }) => {
  const mood = MOODS[selectedIdx];
  const angle = START_DEG + selectedIdx * STEP_DEG;
  const nodePos = pointAt(ORBIT_RADIUS, angle);

  // Beam from logo edge to inner edge of node
  const logoEdge = pointAt(LOGO_SIZE / 2 + 4, angle);

  const gradId = "beam-grad";

  return (
    <>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={mood.color} stopOpacity={0} />
          <stop offset="40%" stopColor={mood.color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={mood.color} stopOpacity={0.08} />
        </linearGradient>
      </defs>
      <motion.line
        x1={logoEdge.x}
        y1={logoEdge.y}
        x2={nodePos.x}
        y2={nodePos.y}
        stroke={`url(#${gradId})`}
        strokeWidth={1.5}
        strokeLinecap="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={transition}
        pointerEvents="none"
      />
    </>
  );
});
ConnectionBeam.displayName = "ConnectionBeam";

/* ── Main component ────────────────────────────────────────────────── */
export const MoodArc: React.FC<MoodArcProps> = ({ selectedMood, onSelect }) => {
  const shouldReduceMotion = useReducedMotion();
  const selectedIdx = selectedMood ? MOODS.findIndex((m) => m.id === selectedMood) : -1;
  const selectedMoodMeta = selectedIdx >= 0 ? MOODS[selectedIdx] : null;

  const transition = shouldReduceMotion ? instantTransition : springSnappy;

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
    <div className="mood-ring-shell" style={{ position: "relative", width: "100%" }}>
      <svg
        viewBox={VIEWBOX}
        width="100%"
        style={{
          height: "auto",
          maxWidth: SVG_MAX_WIDTH,
          margin: "0 auto",
          display: "block",
          touchAction: "manipulation",
          overflow: "visible",
        }}
        role="radiogroup"
        aria-label="How are you feeling right now?"
      >
        {/* Orbital track (static gradient ring) */}
        <OrbitTrack />

        {/* Active arc highlight near the selected node */}
        {selectedIdx >= 0 && (
          <ActiveArc selectedIdx={selectedIdx} transition={transition} />
        )}

        {/* Connection beam from centre to active node */}
        <AnimatePresence>
          {selectedIdx >= 0 && (
            <ConnectionBeam
              key={`beam-${selectedIdx}`}
              selectedIdx={selectedIdx}
              transition={transition}
            />
          )}
        </AnimatePresence>

        {/* Mood nodes — rendered in sorted order so the selected node is on top */}
        {sortedIndices.map((i) => (
          <MoodNode
            key={MOODS[i].id}
            mood={MOODS[i]}
            index={i}
            isSelected={i === selectedIdx}
            transition={transition}
            onClick={handleClick}
          />
        ))}
      </svg>

      {/* Centre logo — absolute overlay to stay centred */}
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
        />
      </div>
    </div>
  );
};
