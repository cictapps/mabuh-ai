import { useId } from "react";
import type { JourneyPlane, JourneyTheme } from "@/types";

type AirborneFlightSceneProps = {
  theme: JourneyTheme;
  plane: JourneyPlane;
};

const THEME_STYLES: Record<
  JourneyTheme,
  {
    label: string;
    skyTop: string;
    skyBottom: string;
    bright: string;
    mid: string;
    dim: string;
    accent: string;
  }
> = {
  dusk: {
    label: "Dusk",
    skyTop: "#181b26",
    skyBottom: "#11141d",
    bright: "var(--text-on-surface)",
    mid: "#9ca1b6",
    dim: "#555b70",
    accent: "var(--primary)",
  },
  dawn: {
    label: "Dawn",
    skyTop: "#28202a",
    skyBottom: "#18151e",
    bright: "#fff2dc",
    mid: "#bd9b98",
    dim: "#705967",
    accent: "#ffb954",
  },
  meadow: {
    label: "Meadow",
    skyTop: "#182725",
    skyBottom: "#101a1a",
    bright: "#edf7f0",
    mid: "#86a79f",
    dim: "#496c67",
    accent: "#6dba84",
  },
};

const PLANE_LABELS: Record<JourneyPlane, string> = {
  trainer: "Trainer",
  cruiser: "Cruiser",
  glider: "Glider",
};

function PixelCloud({ x, y, large = false }: { x: number; y: number; large?: boolean }) {
  const scale = large ? 1.2 : 0.85;

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path
        d="M0 22h52v4H0zm6-8h4v8H6zm4-6h4v6h-4zm4-4h8v4h-8zm8 4h10v4H22zm10 4h8v4h-8zm8 4h6v6h-6"
        fill="currentColor"
      />
      <path d="M4 26h46v3H4z" fill="currentColor" opacity="0.45" />
    </g>
  );
}

function PixelTerrainTile({ offset }: { offset: number }) {
  return (
    <g transform={`translate(${offset} 0)`}>
      <path
        d="M0 142h68v4H0zm68-8h4v8h-4zm4-14h5v22h-5zm5-10h5v32h-5zm5 17h4v15h-4zm4-10h4v29h-4zm4 16h7v9h-7zm7 9h46v4H97zm46-4h8v4h-8zm8-7h6v7h-6zm6-7h6v7h-6zm6-7h6v7h-6zm6 7h6v7h-6zm6 7h7v7h-7zm7 7h17v4h-17zm17-6h5v6h-5zm5-7h5v7h-5zm5-8h5v8h-5zm5 8h5v7h-5zm5 7h5v6h-5zm5 6h42v4h-42zm42-9h4v9h-4zm4-8h5v17h-5zm5 9h5v8h-5zm5-14h5v22h-5zm5 13h5v9h-5zm5 9h12v4h-12zm12 0h65v4h-65"
        fill="currentColor"
      />
      <path
        d="M0 151h5v4H0zm18 7h5v4h-5zm25-4h4v4h-4zm31 7h6v4h-6zm39-8h4v4h-4zm29 6h6v4h-6zm35-5h4v4h-4zm37 8h5v4h-5zm42-7h6v4h-6zm31 6h4v4h-4zm35-8h5v4h-5zm30 7h6v4h-6"
        fill="currentColor"
        opacity="0.55"
      />
    </g>
  );
}

function PixelSkyTile({ offset }: { offset: number }) {
  return (
    <g transform={`translate(${offset} 0)`}>
      <rect x="25" y="24" width="3" height="3" fill="currentColor" />
      <rect x="91" y="17" width="2" height="2" fill="currentColor" />
      <rect x="151" y="35" width="3" height="3" fill="currentColor" />
      <rect x="219" y="21" width="2" height="2" fill="currentColor" />
      <rect x="285" y="42" width="3" height="3" fill="currentColor" />
      <rect x="333" y="28" width="2" height="2" fill="currentColor" />
      <PixelCloud x={42} y={52} />
      <PixelCloud x={250} y={67} large />
    </g>
  );
}

function PixelPlane({
  plane,
  bright,
  mid,
  dark,
}: {
  plane: JourneyPlane;
  bright: string;
  mid: string;
  dark: string;
}) {
  if (plane === "glider") {
    return (
      <g>
        <path d="M4 27h18v-4h22V10h8v4h5v9h22v4h-9v4H48v13h-9V31H22v4H4z" fill={bright} />
        <path d="M17 23h27v4H17zm31 4h22v4H48z" fill={mid} />
        <rect x="53" y="20" width="4" height="4" fill={dark} />
      </g>
    );
  }

  if (plane === "cruiser") {
    return (
      <g>
        <path
          d="M2 27h19v-4h17L49 7h9l-4 16h22v4h8v7h-8v4H54l4 14h-9L38 38H21v-4H2z"
          fill={bright}
        />
        <path d="M21 23h33v4H21zm33 11h22v4H54z" fill={mid} />
        <rect x="43" y="25" width="4" height="4" fill={dark} />
        <rect x="50" y="25" width="4" height="4" fill={dark} />
        <rect x="57" y="25" width="4" height="4" fill={dark} />
        <rect x="64" y="25" width="4" height="4" fill={dark} />
      </g>
    );
  }

  return (
    <g>
      <path
        d="M7 27h15v-4h16L47 9h8l-3 14h20v4h8v7h-8v4H52l3 12h-8l-9-12H22v-4H7z"
        fill={bright}
      />
      <path d="M22 23h30v4H22zm30 11h20v4H52z" fill={mid} />
      <rect x="42" y="25" width="4" height="4" fill={dark} />
      <rect x="49" y="25" width="4" height="4" fill={dark} />
      <rect x="56" y="25" width="4" height="4" fill={dark} />
      <path
        className="airborne-pixel-propeller"
        d="M3 21h4v19H3zM0 28h10v4H0z"
        fill={mid}
      />
    </g>
  );
}

function PixelMoon({ color, sky }: { color: string; sky: string }) {
  return (
    <g transform="translate(302 20)">
      <path d="M8 0h12v4h-8v4H8v12h4v4h8v4H8v-4H4v-4H0V8h4V4h4z" fill={color} />
      <rect x="12" y="4" width="9" height="20" fill={sky} />
      <rect x="17" y="20" width="8" height="4" fill={color} />
    </g>
  );
}

export function AirborneFlightScene({ theme, plane }: AirborneFlightSceneProps) {
  const instanceId = useId().replace(/:/g, "");
  const gradientId = `${instanceId}-pixel-sky`;
  const colors = THEME_STYLES[theme];
  const planeLabel = PLANE_LABELS[plane];

  return (
    <figure className="mb-2">
      <div
        className="relative overflow-hidden rounded-[1.25rem] border border-[var(--border-violet-medium)]"
        style={{
          background: colors.skyBottom,
          boxShadow: `inset 0 0 36px -22px ${colors.accent}, 0 18px 48px -36px ${colors.accent}`,
        }}
      >
        <svg
          viewBox="0 0 360 180"
          className="block h-auto w-full"
          role="img"
          aria-labelledby={`${instanceId}-title ${instanceId}-description`}
          shapeRendering="crispEdges"
        >
          <title id={`${instanceId}-title`}>
            Pixel-art {planeLabel} flying through a {colors.label.toLowerCase()} sky
          </title>
          <desc id={`${instanceId}-description`}>
            A seamless side-scrolling scene with clouds, stars, a moon, and distant
            terrain.
          </desc>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.skyTop} />
              <stop offset="100%" stopColor={colors.skyBottom} />
            </linearGradient>
          </defs>

          <rect width="360" height="180" fill={`url(#${gradientId})`} />

          <g
            className="airborne-pixel-sky-track"
            style={{ color: colors.mid }}
            opacity="0.78"
          >
            <PixelSkyTile offset={0} />
            <PixelSkyTile offset={360} />
          </g>

          <g fill={colors.bright} opacity="0.9">
            <rect x="31" y="32" width="3" height="3" />
            <rect x="117" y="21" width="2" height="2" />
            <rect x="185" y="39" width="3" height="3" />
            <rect x="245" y="25" width="2" height="2" />
            <rect x="329" y="48" width="3" height="3" />
          </g>
          <PixelMoon color={colors.bright} sky={colors.skyTop} />

          <g className="airborne-pixel-speed-lines" fill={colors.mid}>
            <rect x="72" y="84" width="8" height="3" />
            <rect x="84" y="84" width="4" height="3" />
            <rect x="61" y="97" width="12" height="3" />
            <rect x="78" y="97" width="5" height="3" />
          </g>

          <g className="airborne-pixel-plane" transform="translate(125 63)">
            <PixelPlane
              plane={plane}
              bright={colors.bright}
              mid={colors.mid}
              dark={colors.skyBottom}
            />
          </g>

          <g className="airborne-pixel-terrain-track" style={{ color: colors.dim }}>
            <PixelTerrainTile offset={0} />
            <PixelTerrainTile offset={360} />
          </g>
          <path d="M0 145h360v3H0z" fill={colors.mid} opacity="0.72" />

          <g transform="translate(14 153)">
            <rect
              width="146"
              height="21"
              rx="8"
              fill={colors.skyBottom}
              stroke={colors.mid}
              strokeWidth="1"
            />
            <rect x="10" y="8" width="5" height="5" fill={colors.accent} />
            <text
              x="23"
              y="13.5"
              fill={colors.bright}
              fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
              fontSize="7"
              fontWeight="700"
              letterSpacing="1.1"
            >
              {colors.label.toUpperCase()} · {planeLabel.toUpperCase()}
            </text>
          </g>
        </svg>
      </div>
      <figcaption className="mt-2.5 text-center font-mono text-[10px] leading-relaxed tracking-[0.04em] text-[var(--text-on-surface-strong)]">
        Keep your own pace. The next waypoint will be here when you are ready.
      </figcaption>
    </figure>
  );
}
