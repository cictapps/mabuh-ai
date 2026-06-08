import { cn } from "@/lib/utils";

type ProgressBarProps = {
  progress: number;
  label?: string;
  tone?: "indigo" | "amber";
  className?: string;
};

export function ProgressBar({
  progress,
  label,
  tone = "indigo",
  className,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(progress)));
  const gradient =
    tone === "amber"
      ? "from-tertiary/80 via-tertiary to-tertiary/70"
      : "from-primary via-secondary to-primary";
  return (
    <div className={cn("w-full", className)}>
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 w-full overflow-hidden rounded-full bg-[rgba(188,194,255,0.08)]"
      >
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r transition-[width] duration-500",
            gradient,
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {label ? (
        <p className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
      ) : null}
    </div>
  );
}
