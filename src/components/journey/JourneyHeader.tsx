import { Flame, Send, Sparkles, Star } from "lucide-react";
import { StatBadge } from "./StatBadge";
import { ProgressBar } from "./ProgressBar";
import { levelFromXp, levelProgressPercent, xpIntoLevel, XP_PER_LEVEL } from "@/lib/journey/xp";

type JourneyHeaderProps = {
  totalXp: number;
  streak: number;
  flightsCompleted: number;
  onOpenAchievements?: () => void;
};

export function JourneyHeader({
  totalXp,
  streak,
  flightsCompleted,
  onOpenAchievements,
}: JourneyHeaderProps) {
  const level = levelFromXp(totalXp);
  const intoLevel = xpIntoLevel(totalXp);

  return (
    <div
      className="relative overflow-hidden rounded-[1.75rem] border border-[rgba(188,194,255,0.10)] bg-card p-5 shadow-[0_28px_80px_-40px_rgba(8,10,18,0.85)] backdrop-blur-xl"
      style={{
        paddingRight: 72,
        clipPath: `path('M 28 0 H calc(100% - 72px) A 52 52 0 0 1 calc(100% - 0px) 48 V calc(100% - 28px) A 28 28 0 0 1 calc(100% - 56px) calc(100% - 0px) H 28 A 28 28 0 0 1 0 calc(100% - 56px) V 28 A 28 28 0 0 1 28 0 Z')`,
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,185,84,0.18),transparent_60%)] blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-12 h-44 w-44 rounded-full bg-[radial-gradient(circle_at_center,rgba(188,194,255,0.18),transparent_60%)] blur-2xl"
      />
      <Star
        aria-hidden
        className="pointer-events-none absolute right-6 top-5 size-3 text-tertiary/60"
        fill="currentColor"
      />
      <Star
        aria-hidden
        className="pointer-events-none absolute right-14 top-12 size-2 text-primary/50"
        fill="currentColor"
      />
      <Star
        aria-hidden
        className="pointer-events-none absolute right-24 top-3 size-1.5 text-secondary/60"
        fill="currentColor"
      />

      <div className="relative">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d8d4eb]">
          <Sparkles className="size-3 text-tertiary" />
          Your journey
        </p>
        <h1 className="mt-1 font-serif text-3xl leading-tight tracking-[-0.03em] text-foreground">
          Level {level}
        </h1>
        <p className="mt-1 text-xs text-[#d8d4eb]">
          <span className="font-mono text-foreground">{intoLevel}</span>
          <span> / {XP_PER_LEVEL} XP</span>
          <span> toward level {level + 1}</span>
        </p>
      </div>

      <div className="relative mt-4 grid grid-cols-2 gap-2.5">
        <StatBadge
          tone="warm"
          icon={<Flame className="size-4" fill="currentColor" />}
          value={streak}
          label="Day streak"
          onPress={onOpenAchievements}
        />
        <StatBadge
          tone="calm"
          icon={<Send className="size-4" />}
          value={flightsCompleted}
          label="Flights done"
          onPress={onOpenAchievements}
        />
      </div>

      <div className="relative mt-4">
        <ProgressBar
          progress={levelProgressPercent(totalXp)}
          label={`${totalXp} XP earned`}
          tone="amber"
        />
      </div>
    </div>
  );
}
