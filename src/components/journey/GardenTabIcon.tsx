import type { GardenPhase } from "@/types";

type GardenTabIconProps = {
  phase: GardenPhase;
  className?: string;
};

export function GardenTabIcon({ phase, className }: GardenTabIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
      shapeRendering="crispEdges"
    >
      {phase === "prepare" ? (
        <>
          <path d="M4 16h16v3H4zM6 13h12v3H6z" opacity=".45" />
          <path d="M10 8h4v5h-4zM8 6h4v3H8zm4-2h4v4h-4z" />
          <path d="M11 19h2v2h-2z" opacity=".7" />
        </>
      ) : null}

      {phase === "growing" ? (
        <>
          <path d="M11 8h3v13h-3z" />
          <path d="M13 5h6v3h-3v3h-3zM5 9h6v5H8v-2H5z" opacity=".82" />
          <path d="M4 20h16v2H4z" opacity=".45" />
        </>
      ) : null}

      {phase === "care" ? (
        <>
          <path d="M4 9h11v9H4zM7 6h8v3H7zM15 11h4v3h-4zM2 12h2v4H2z" />
          <path d="M18 16h3v3h-3zm-2 3h3v3h-3z" opacity=".72" />
          <path d="M7 18h3v3H7zm6 0h3v3h-3z" opacity=".45" />
        </>
      ) : null}

      {phase === "reflect" ? (
        <>
          <path d="M4 4h14v17H4z" opacity=".45" />
          <path d="M7 7h8v2H7zm0 4h8v2H7zm0 4h5v2H7z" />
          <path d="M17 3h3v3h-3zm2 4h2v2h-2z" opacity=".8" />
        </>
      ) : null}

      {phase === "rest" ? (
        <>
          <path d="M5 14h14v3H5zM7 11h10v3H7zM9 8h6v3H9z" opacity=".45" />
          <path d="M11 4h3v4h-3zM8 5h3v3H8zm6 1h3v3h-3z" />
          <path d="M4 19h16v2H4z" opacity=".7" />
        </>
      ) : null}
    </svg>
  );
}
