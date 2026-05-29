import React, { useCallback } from "react";
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
  const selectedIdx = selectedMood ? MOODS.findIndex((m) => m.id === selectedMood) : -1;

  const handleClick = useCallback(
    (id: MoodType) => { onSelect(id); },
    [onSelect]
  );

  const selectedNode = selectedIdx >= 0 ? nodePos(selectedIdx) : null;
  const selectedColor = selectedIdx >= 0 ? MOODS[selectedIdx].color : "#bcc2ff";

  return (
    <svg
      viewBox="0 0 350 190"
      width="100%"
      style={{ height: 210, overflow: "visible" }}
      aria-label="Mood selector arc"
    >
      {/* Arc segments */}
      {MOODS.slice(0, -1).map((mood, i) => {
        const hasSelection = selectedIdx >= 0;
        const isActive = selectedIdx === i || selectedIdx === i + 1;
        const baseOpacity = hasSelection ? (isActive ? 0.9 : 0.22) : 0.5;

        return (
          <g key={`${mood.id}-seg`}>
            <path
              d={segmentPath(i)}
              fill="none"
              stroke={mood.color}
              strokeWidth={STROKE_W + 10}
              strokeLinecap="round"
              opacity={baseOpacity * 0.35}
              style={{ filter: "blur(3px)" }}
            />
            <path
              d={segmentPath(i)}
              fill="none"
              stroke={mood.color}
              strokeWidth={STROKE_W + 4}
              strokeLinecap="round"
              opacity={baseOpacity * 0.45}
            />
            <path
              d={segmentPath(i)}
              fill="none"
              stroke={mood.color}
              strokeWidth={STROKE_W}
              strokeLinecap="round"
              opacity={baseOpacity}
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
            <circle
              cx={pos.x}
              cy={pos.y}
              r={14}
              fill={mood.color}
              opacity={hasSelection ? (isSelected ? 0.6 : 0.18) : 0.35}
              style={{ filter: "blur(2px)" }}
            />
            <circle
              cx={pos.x}
              cy={pos.y}
              r={11}
              fill="none"
              stroke={mood.color}
              strokeWidth={2}
              opacity={hasSelection ? (isSelected ? 0.95 : 0.35) : 0.6}
            />
            <circle
              cx={pos.x}
              cy={pos.y}
              r={7}
              fill={mood.color}
              opacity={hasSelection ? (isSelected ? 1 : 0.65) : 0.8}
            />
            <text
              x={lbl.x}
              y={lbl.y + 4}
              textAnchor="middle"
              fontSize={11}
              fontFamily="Plus Jakarta Sans, sans-serif"
              fontWeight="500"
              fill={mood.color}
              opacity={hasSelection ? (isSelected ? 0.95 : 0.45) : 0.6}
            >
              {mood.label}
            </text>
          </g>
        );
      })}

      {/* Cursor dot */}
      {selectedNode && (
        <g style={{ transition: "all 0.32s cubic-bezier(0.34,1.4,0.64,1)" }}>
          {/* Selected node halo rings */}
          <circle
            cx={selectedNode.x}
            cy={selectedNode.y}
            r={26}
            fill="none"
            stroke={selectedColor}
            strokeWidth={2}
            opacity={0.22}
          />
          <circle
            cx={selectedNode.x}
            cy={selectedNode.y}
            r={20}
            fill="none"
            stroke={selectedColor}
            strokeWidth={2}
            opacity={0.32}
          />
          <circle
            cx={selectedNode.x}
            cy={selectedNode.y}
            r={14}
            fill={selectedColor}
            opacity={0.95}
            style={{ filter: `drop-shadow(0 0 8px ${selectedColor}60)` }}
          />
          <circle cx={selectedNode.x} cy={selectedNode.y} r={6} fill="#121416" />
        </g>
      )}
    </svg>
  );
};
