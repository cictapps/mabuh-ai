import { useId } from "react";
import type { GardenPlant, MoodType } from "@/types";

type GardenSceneProps = {
  mood: MoodType | null;
  plant: GardenPlant;
  stage: number;
};

const WEATHER: Record<
  MoodType,
  { label: string; sky: string; glow: string; cloud: string; accent: string }
> = {
  stressed: {
    label: "Rain shelter",
    sky: "#121a24",
    glow: "#26384c",
    cloud: "#79859a",
    accent: "#bcc2ff",
  },
  worried: {
    label: "Cloudy breeze",
    sky: "#171b24",
    glow: "#303441",
    cloud: "#8b91a1",
    accent: "#d4bbff",
  },
  okay: {
    label: "Soft overcast",
    sky: "#19201f",
    glow: "#2b3935",
    cloud: "#899b96",
    accent: "#a8dfb8",
  },
  calm: {
    label: "Gentle sun",
    sky: "#1d2420",
    glow: "#4b4933",
    cloud: "#a8afa2",
    accent: "#ffd99a",
  },
  happy: {
    label: "Bright sun",
    sky: "#22251f",
    glow: "#5a4d2c",
    cloud: "#c0bda8",
    accent: "#ffb954",
  },
};

const PLANT_LABELS: Record<GardenPlant, string> = {
  sunflower: "Sunflower",
  fern: "Fern",
  lavender: "Lavender",
  monstera: "Monstera",
  "cherry-blossom": "Cherry blossom",
};

const CLOUD_SPEED: Record<MoodType, string> = {
  stressed: "18s",
  worried: "24s",
  okay: "34s",
  calm: "52s",
  happy: "42s",
};

function CloudTile({ offset }: { offset: number }) {
  return (
    <g transform={`translate(${offset} 0)`}>
      <path
        d="M28 47h54v4H28v-4zm7-8h5v8h-5v-8zm5-5h8v5h-8v-5zm8 3h15v4H48v-4zm15 4h10v6H63v-6zm150 18h68v4h-68v-4zm8-9h6v9h-6v-9zm6-6h12v6h-12v-6zm12 3h20v5h-20v-5zm20 5h12v7h-12v-7z"
        fill="currentColor"
      />
    </g>
  );
}

const RAIN_DROPS = Array.from({ length: 26 }, (_, index) => {
  const row = Math.floor(index / 13);
  const column = index % 13;
  const x = 14 + column * 27 + (row % 2) * 9;
  const y = 52 + row * 44 + (column % 4) * 9;
  const layer = index % 3;
  const baseDuration = layer === 0 ? 0.78 : layer === 1 ? 1.05 : 1.4;
  return {
    key: index,
    x,
    y,
    duration: baseDuration + ((index * 37) % 11) / 100,
    delay: -((index * 113) % 900) / 1000,
    opacity: layer === 0 ? 0.62 : layer === 1 ? 0.46 : 0.3,
  };
});

function RainTile({ offset }: { offset: number }) {
  return (
    <g transform={`translate(${offset} 0)`}>
      {RAIN_DROPS.map((drop) => (
        <path
          key={`${offset}-${drop.key}`}
          d={`M${drop.x} ${drop.y}h3l-6 13h-3z`}
          fill="currentColor"
          className="garden-pixel-rain-drop"
          opacity={drop.opacity}
          style={{
            animationDuration: `${drop.duration}s`,
            animationDelay: `${drop.delay}s`,
          }}
        />
      ))}
    </g>
  );
}

function PlantSprite({
  plant,
  stage,
  bright,
  leaf,
}: {
  plant: GardenPlant;
  stage: number;
  bright: string;
  leaf: string;
}) {
  const safeStage = Math.max(0, Math.min(7, stage));
  const stemHeight = safeStage < 2 ? 0 : 8 + safeStage * 6;
  const top = 132 - stemHeight;

  return (
    <g className="garden-pixel-plant">
      <path d="M154 142h52v5h-52zM160 147h40v7h-40z" fill="#85644f" />
      <path d="M166 154h28v5h-28z" fill="#493c3a" />
      {safeStage === 0 ? <path d="M176 137h8v5h-8z" fill="#cda46c" /> : null}
      {safeStage >= 1 ? <path d="M173 138h14v4h-14zm3-5h8v5h-8z" fill={leaf} /> : null}
      {safeStage >= 2 ? (
        <>
          <path d={`M177 ${top}h6v${stemHeight + 10}h-6z`} fill={leaf} />
          <path d={`M163 ${top + 19}h14v5h-14zm-5-5h12v5h-12z`} fill={leaf} />
        </>
      ) : null}
      {safeStage >= 3 ? (
        <path d={`M183 ${top + 29}h15v5h-15zm8-5h12v5h-12z`} fill={leaf} />
      ) : null}
      {safeStage >= 4 ? (
        <path d={`M161 ${top + 9}h16v5h-16zm-6-5h12v5h-12z`} fill={leaf} />
      ) : null}
      {safeStage >= 5 ? (
        <path d={`M183 ${top + 12}h17v5h-17zm9-5h13v5h-13z`} fill={leaf} />
      ) : null}
      {safeStage >= 6 ? (
        plant === "fern" || plant === "monstera" ? (
          <path d={`M157 ${top - 5}h46v7h-46zm7-7h32v7h-32z`} fill={leaf} />
        ) : (
          <path d={`M169 ${top - 4}h22v8h-22zm5-6h12v6h-12z`} fill={bright} />
        )
      ) : null}
      {safeStage >= 7 ? (
        plant === "cherry-blossom" ? (
          <path
            d={`M157 ${top - 13}h13v8h-13zm16-6h14v10h-14zm17 7h13v8h-13z`}
            fill="#e9b8ca"
          />
        ) : plant === "lavender" ? (
          <path
            d={`M167 ${top - 17}h6v17h-6zm10-5h6v22h-6zm10 4h6v18h-6z`}
            fill="#c8a8ef"
          />
        ) : (
          <path
            d={`M164 ${top - 14}h32v6h-32zm-6 6h44v12h-44zm8 12h28v6h-28z`}
            fill={bright}
          />
        )
      ) : null}
    </g>
  );
}

export function GardenScene({ mood, plant, stage }: GardenSceneProps) {
  const instanceId = useId().replace(/:/g, "");
  const weather = WEATHER[mood ?? "okay"];
  const isRainy = mood === "stressed";
  const isBright = mood === "calm" || mood === "happy";

  return (
    <figure>
      <div
        className="overflow-hidden rounded-[1.25rem] border border-[rgba(109,186,132,0.20)]"
        style={{
          boxShadow: `inset 0 0 42px -24px ${weather.accent}, 0 18px 48px -38px ${weather.accent}`,
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
            {PLANT_LABELS[plant]} growing in {weather.label.toLowerCase()}
          </title>
          <desc id={`${instanceId}-description`}>
            A seven-stage pixel-art plant in a seamless animated weather scene.
          </desc>
          <rect width="360" height="180" fill={weather.sky} />
          <circle cx="292" cy="35" r="38" fill={weather.glow} opacity="0.72" />
          {isBright ? (
            <g fill={weather.accent}>
              <rect x="286" y="28" width="14" height="14" />
              <rect x="292" y="17" width="3" height="7" />
              <rect x="292" y="46" width="3" height="7" />
              <rect x="275" y="34" width="7" height="3" />
              <rect x="304" y="34" width="7" height="3" />
            </g>
          ) : null}
          <g
            className="garden-pixel-cloud-track"
            style={{
              color: weather.cloud,
              animationDuration: CLOUD_SPEED[mood ?? "okay"],
            }}
            opacity="0.75"
          >
            <CloudTile offset={0} />
            <CloudTile offset={360} />
          </g>
          {isRainy ? (
            <g style={{ color: weather.accent }}>
              <RainTile offset={0} />
              <RainTile offset={360} />
            </g>
          ) : null}
          <g fill={weather.accent} opacity={mood === "happy" ? 0.8 : 0.35}>
            <rect x="44" y="83" width="3" height="3" />
            <rect x="101" y="69" width="2" height="2" />
            <rect x="249" y="88" width="3" height="3" />
            <rect x="321" y="75" width="2" height="2" />
          </g>
          <path d="M0 142h360v38H0z" fill="#18241f" />
          <path d="M0 142h360v5H0z" fill="#56755f" />
          <g className="garden-pixel-ground-track" fill="#78917e" opacity="0.55">
            <path d="M0 157h8v4H0zm26 10h6v4h-6zm43-14h5v4h-5zm38 16h8v4h-8zm56-11h5v4h-5zm47 13h7v4h-7zm54-16h5v4h-5zm42 13h8v4h-8zm39-12h5v4h-5z" />
            <path d="M360 157h8v4h-8zm26 10h6v4h-6zm43-14h5v4h-5zm38 16h8v4h-8zm56-11h5v4h-5zm47 13h7v4h-7zm54-16h5v4h-5zm42 13h8v4h-8zm39-12h5v4h-5z" />
          </g>
          <PlantSprite
            plant={plant}
            stage={stage}
            bright={weather.accent}
            leaf="#6dba84"
          />
          <g transform="translate(14 153)">
            <rect
              width="174"
              height="21"
              rx="8"
              fill={weather.sky}
              stroke={weather.cloud}
            />
            <rect x="10" y="8" width="5" height="5" fill={weather.accent} />
            <text
              x="23"
              y="13.5"
              fill="#eef1f6"
              fontFamily="ui-monospace, monospace"
              fontSize="6.5"
              fontWeight="700"
              letterSpacing="0.7"
            >
              {weather.label.toUpperCase()} · STAGE {stage}/7
            </text>
          </g>
        </svg>
      </div>
      <figcaption className="mt-2.5 text-center font-mono text-[10px] leading-relaxed tracking-[0.04em] text-[rgba(216,212,235,0.58)]">
        Every kind of weather can be part of growing.
      </figcaption>
    </figure>
  );
}
