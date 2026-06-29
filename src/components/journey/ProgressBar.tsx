import { cn } from "@/lib/utils";

type ProgressBarProps = {
  progress: number;
  label?: string;
  hideLabel?: boolean;
  tone?: "indigo" | "amber";
  className?: string;
};

export function ProgressBar({
  progress,
  label,
  hideLabel = false,
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
        className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-violet-medium)]"
      >
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r transition-[width] duration-500",
            gradient,
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {label && !hideLabel ? (
        <p className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-[color:var(--text-kicker)]">
          {label}
        </p>
      ) : null}
    </div>
  );
}
