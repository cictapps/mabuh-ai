import { ArrowLeft } from "lucide-react";

interface TopBarBackButtonProps {
  onClick: () => void;
}

export function TopBarBackButton({ onClick }: TopBarBackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Go back"
      className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-card/70 text-foreground/80 backdrop-blur-md transition-colors duration-150 hover:bg-white/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <ArrowLeft className="size-[18px]" strokeWidth={1.8} />
    </button>
  );
}
