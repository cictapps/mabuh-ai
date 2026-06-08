import React, { useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MoodType } from "../../types";
import { MOODS } from "../../data";

interface MoodArcProps {
  selectedMood: MoodType | null;
  onSelect: (mood: MoodType) => void;
}

const CX = 175;
const CY = 175;
const R = 124;
const STROKE_W = 8;
const START_DEG = -180;
const SWEEP_DEG = 180;
const NODE_SEG = SWEEP_DEG / (MOODS.length - 1);

function toRad(deg: number) { return (deg * Math.PI) / 180; }

function segmentPath(index: number, gapDeg = 2): string {
  const a1 = toRad(START_DEG + index * NODE_SEG + gapDeg);
  const a2 = toRad(START_DEG + (index + 1) * NODE_SEG - gapDeg);
  const x1 = CX + R * Math.cos(a1);
  const y1 = CY + R * Math.sin(a1);
  const x2 = CX + R * Math.cos(a2);
  const y2 = CY + R * Math.sin(a2);
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

function labelPos(index: number) {
  const aMid = toRad(START_DEG + index * NODE_SEG);
  const offset = 30;
  return {
    x: CX + (R + offset) * Math.cos(aMid),
    y: CY + (R + offset) * Math.sin(aMid),
  };
}

function nodePos(index: number) {
  const aMid = toRad(START_DEG + index * NODE_SEG);
  return {
    x: CX + R * Math.cos(aMid),
    y: CY + R * Math.sin(aMid),
  };
}

export const MoodArc: React.FC<MoodArcProps> = ({ selectedMood, onSelect }) => {
  const shouldReduceMotion = useReducedMotion();
  const selectedIdx = selectedMood ? MOODS.findIndex((m) => m.id === selectedMood) : -1;
  const transition = shouldReduceMotion
    ? { duration: 0 }
    : {
        type: "spring" as const,
        stiffness: 260,
        damping: 28,
        mass: 0.7,
      };
  const fadeTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.24, ease: "easeOut" as const };

  const handleClick = useCallback(
    (id: MoodType) => { onSelect(id); },
    [onSelect]
  );

  const selectedNode = selectedIdx >= 0 ? nodePos(selectedIdx) : null;
  const selectedColor = selectedIdx >= 0 ? MOODS[selectedIdx].color : "#bcc2ff";
  const gradientCenter = selectedNode ?? { x: CX, y: CY };

  return (
    <svg
      viewBox="0 0 350 190"
      width="100%"
      style={{ height: 210, overflow: "visible" }}
      aria-label="Mood selector arc"
    >
      <defs>
        <motion.radialGradient
          id="mood-arc-active-gradient"
          gradientUnits="userSpaceOnUse"
          animate={{
            cx: gradientCenter.x,
            cy: gradientCenter.y,
            fx: gradientCenter.x,
            fy: gradientCenter.y,
            r: selectedNode ? 58 : 38,
          }}
          initial={false}
          transition={transition}
        >
          <motion.stop
            offset="0%"
            animate={{ stopColor: selectedColor, stopOpacity: 1 }}
            initial={false}
            transition={fadeTransition}
          />
          <motion.stop
            offset="62%"
            animate={{ stopColor: selectedColor, stopOpacity: 0.55 }}
            initial={false}
            transition={fadeTransition}
          />
          <motion.stop
            offset="100%"
            animate={{ stopColor: selectedColor, stopOpacity: 0 }}
            initial={false}
            transition={fadeTransition}
          />
        </motion.radialGradient>
      </defs>

      {/* Arc segments */}
      {MOODS.slice(0, -1).map((mood, i) => {
        const hasSelection = selectedIdx >= 0;
        const isActive = selectedIdx === i || selectedIdx === i + 1;
        const baseOpacity = hasSelection ? (isActive ? 0.9 : 0.22) : 0.5;

        return (
          <g key={`${mood.id}-seg`}>
            <motion.path
              d={segmentPath(i)}
              fill="none"
              stroke={mood.color}
              strokeWidth={STROKE_W + 10}
              strokeLinecap="round"
              animate={{ opacity: baseOpacity * 0.35 }}
              initial={false}
              transition={fadeTransition}
              style={{ filter: "blur(3px)" }}
            />
            <motion.path
              d={segmentPath(i)}
              fill="none"
              stroke={mood.color}
              strokeWidth={STROKE_W + 4}
              strokeLinecap="round"
              animate={{ opacity: baseOpacity * 0.45 }}
              initial={false}
              transition={fadeTransition}
            />
            <motion.path
              d={segmentPath(i)}
              fill="none"
              stroke={mood.color}
              strokeWidth={STROKE_W}
              strokeLinecap="round"
              animate={{ opacity: baseOpacity }}
              initial={false}
              transition={fadeTransition}
            />
          </g>
        );
      })}

      {/* Nodes + labels */}
      {MOODS.map((mood, i) => {
        const isSelected = i === selectedIdx;
        const hasSelection = selectedIdx >= 0;
        const pos = nodePos(i);
        const lbl = labelPos(i);

        return (
          <g key={mood.id} onClick={() => handleClick(mood.id)} style={{ cursor: "pointer" }}>
            <motion.circle
              cx={pos.x}
              cy={pos.y}
              animate={{
                opacity: hasSelection ? (isSelected ? 0.6 : 0.18) : 0.35,
                r: isSelected ? 16 : 14,
              }}
              initial={false}
              transition={fadeTransition}
              fill={mood.color}
              style={{ filter: "blur(2px)" }}
            />
            <motion.circle
              cx={pos.x}
              cy={pos.y}
              animate={{
                opacity: hasSelection ? (isSelected ? 0.95 : 0.35) : 0.6,
                r: isSelected ? 12 : 11,
              }}
              initial={false}
              transition={fadeTransition}
              fill="none"
              stroke={mood.color}
              strokeWidth={2}
            />
            <motion.circle
              cx={pos.x}
              cy={pos.y}
              animate={{
                opacity: hasSelection ? (isSelected ? 1 : 0.65) : 0.8,
                r: isSelected ? 8 : 7,
              }}
              initial={false}
              transition={fadeTransition}
              fill={mood.color}
            />
            <motion.text
              x={lbl.x}
              y={lbl.y + 4}
              textAnchor="middle"
              fontSize={11}
              fontFamily="Plus Jakarta Sans, sans-serif"
              fontWeight="500"
              fill={mood.color}
              animate={{ opacity: hasSelection ? (isSelected ? 0.95 : 0.45) : 0.6 }}
              initial={false}
              transition={fadeTransition}
            >
              {mood.label}
            </motion.text>
          </g>
        );
      })}

      {/* Cursor dot */}
      {selectedNode && (
        <motion.g
          animate={{ x: selectedNode.x, y: selectedNode.y }}
          initial={false}
          transition={transition}
        >
          <circle
            cx={0}
            cy={0}
            r={42}
            fill="url(#mood-arc-active-gradient)"
            opacity={0.5}
          />
          {/* Selected node halo rings */}
          <motion.circle
            cx={0}
            cy={0}
            r={26}
            fill="none"
            animate={{ stroke: selectedColor }}
            initial={false}
            transition={fadeTransition}
            strokeWidth={2}
            opacity={0.22}
          />
          <motion.circle
            cx={0}
            cy={0}
            r={20}
            fill="none"
            animate={{ stroke: selectedColor }}
            initial={false}
            transition={fadeTransition}
            strokeWidth={2}
            opacity={0.32}
          />
          <motion.circle
            cx={0}
            cy={0}
            r={14}
            animate={{ fill: "url(#mood-arc-active-gradient)" }}
            initial={false}
            transition={fadeTransition}
            opacity={0.95}
            style={{ filter: "drop-shadow(0 0 8px rgb(188 194 255 / 35%))" }}
          />
          <circle cx={0} cy={0} r={6} fill="#121416" />
        </motion.g>
      )}
    </svg>
  );
};
