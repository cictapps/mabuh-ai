import React from "react";
import { MoodType } from "../../types";
import { getMoodMeta } from "../../data";

interface TrendPoint {
  date: string;
  score: number;
  mood: MoodType;
}

interface MoodTrendChartProps {
  data: TrendPoint[];
}

const W = 310;
const H = 100;
const PAD_X = 10;
const PAD_Y = 12;
const Y_MIN = 1;
const Y_MAX = 5;

function gx(i: number, total: number): number {
  return PAD_X + (i / Math.max(total - 1, 1)) * (W - 2 * PAD_X);
}

function gy(score: number): number {
  return H - PAD_Y - ((score - Y_MIN) / (Y_MAX - Y_MIN)) * (H - 2 * PAD_Y);
}

function cubicPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 1; i < pts.length; i++) {
    const cp1x = pts[i - 1].x + (pts[i].x - pts[i - 1].x) / 2;
    const cp2x = pts[i - 1].x + (pts[i].x - pts[i - 1].x) / 2;
    d += ` C ${cp1x.toFixed(2)} ${pts[i - 1].y.toFixed(2)}, ${cp2x.toFixed(2)} ${pts[i].y.toFixed(2)}, ${pts[i].x.toFixed(2)} ${pts[i].y.toFixed(2)}`;
  }
  return d;
}

export const MoodTrendChart: React.FC<MoodTrendChartProps> = ({ data }) => {
  if (!data.length) return null;

  const points = data.map((d, i) => ({
    x: gx(i, data.length),
    y: gy(d.score),
    mood: d.mood,
    score: d.score,
    date: d.date,
  }));

  // Build a polyline per segment so each segment can take the mood color
  // of the destination point — the line now visually transitions
  // stressed (red) -> calm (green) as the score moves.
  const segments = points.slice(1).map((p, i) => {
    const prev = points[i];
    return {
      d: `M ${prev.x.toFixed(2)} ${prev.y.toFixed(2)} L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`,
      color: getMoodMeta(p.mood).color,
    };
  });

  const linePath = cubicPath(points);
  const fillPath =
    linePath +
    ` L ${points[points.length - 1].x.toFixed(2)} ${(H + 4).toFixed(2)}` +
    ` L ${points[0].x.toFixed(2)} ${(H + 4).toFixed(2)} Z`;

  const yLabels = [
    { score: 5, label: "Happy" },
    { score: 3, label: "Okay" },
    { score: 1, label: "Stressed / sad" },
  ];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ height: 110, overflow: "visible" }}
      aria-label="Mood trend chart"
    >
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.14" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {yLabels.map(({ score, label }) => {
        const y = gy(score);
        return (
          <g key={score}>
            <line
              x1={PAD_X}
              y1={y}
              x2={W - PAD_X}
              y2={y}
              stroke="var(--border-violet-faint)"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            <text
              x={PAD_X}
              y={y - 4}
              fontSize={9}
              fill="var(--text-on-surface-muted)"
              fontFamily="Plus Jakarta Sans, sans-serif"
            >
              {label}
            </text>
          </g>
        );
      })}

      <path d={fillPath} fill="url(#trendFill)" />

      {/* Per-segment colored line. */}
      {segments.map((seg, i) => (
        <path
          key={`seg-${i}`}
          d={seg.d}
          fill="none"
          stroke={seg.color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.95}
        />
      ))}

      {points.map((p, i) => {
        const color = getMoodMeta(p.mood).color;
        return (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3.5}
            fill={color}
            stroke="var(--card)"
            strokeWidth={1.5}
          />
        );
      })}

      {data.length > 1 && (
        <>
          <text
            x={points[0].x}
            y={H + 14}
            fontSize={9}
            fill="var(--text-on-surface-muted)"
            fontFamily="Plus Jakarta Sans, sans-serif"
            textAnchor="middle"
          >
            {new Date(data[0].date + "T12:00:00").toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </text>
          <text
            x={points[points.length - 1].x}
            y={H + 14}
            fontSize={9}
            fill="var(--text-on-surface-muted)"
            fontFamily="Plus Jakarta Sans, sans-serif"
            textAnchor="middle"
          >
            {new Date(data[data.length - 1].date + "T12:00:00").toLocaleDateString(
              "en-US",
              { month: "short", day: "numeric" },
            )}
          </text>
        </>
      )}
    </svg>
  );
};
