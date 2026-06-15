import { useState, useEffect } from "react";
import { Settings } from "lucide-react";

interface TopBarSettingsButtonProps {
  onClick: () => void;
}

const SPIN_DURATION_MS = 320;

export function TopBarSettingsButton({ onClick }: TopBarSettingsButtonProps) {
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    if (!spinning) return;
    const timer = window.setTimeout(() => {
      setSpinning(false);
    }, SPIN_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [spinning]);

  const handleClick = () => {
    if (spinning) return;
    setSpinning(true);
    window.setTimeout(onClick, SPIN_DURATION_MS);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Open settings"
      className="absolute right-4 top-[var(--app-screen-top)] z-20 flex size-10 items-center justify-center rounded-full border border-white/10 bg-card/70 text-foreground/80 backdrop-blur-md transition-colors duration-150 hover:bg-white/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Settings
        className={`size-[18px] ${spinning ? "settings-spin" : ""}`}
        strokeWidth={1.8}
      />
    </button>
  );
}
