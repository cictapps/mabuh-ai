import { Settings } from "lucide-react";

interface TopBarSettingsButtonProps {
  onClick: () => void;
}

export function TopBarSettingsButton({ onClick }: TopBarSettingsButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open settings"
      className="absolute right-4 top-[calc(env(safe-area-inset-top,0px)+14px)] z-20 flex size-10 items-center justify-center rounded-full border border-white/10 bg-card/70 text-foreground/80 backdrop-blur-md transition-colors duration-150 hover:bg-white/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Settings className="size-[18px]" strokeWidth={1.8} />
    </button>
  );
}
