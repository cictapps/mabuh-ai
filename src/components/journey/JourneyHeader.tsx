import { useMemo } from "react";
import { ChevronRight, Compass, Flame, Gift, Sparkles } from "lucide-react";
import { StatBadge } from "./StatBadge";
import { ProgressBar } from "./ProgressBar";
import {
  levelFromXp,
  levelProgressPercent,
  xpIntoLevel,
  XP_PER_LEVEL,
  REWARDS,
  newRewardsAtLevel,
} from "@/lib/journey/xp";
import { useJourneyStore } from "@/lib/journey/useJourneyStore";

type JourneyHeaderProps = {
  totalXp: number;
  streak: number;
  journeysCompleted: number;
  onOpenAchievements?: () => void;
};

export function JourneyHeader({
  totalXp,
  streak,
  journeysCompleted,
  onOpenAchievements,
}: JourneyHeaderProps) {
  const unlockedRewards = useJourneyStore((s) => s.unlockedRewards);
  const level = levelFromXp(totalXp);
  const intoLevel = xpIntoLevel(totalXp);

  const nextLevelRewards = useMemo(() => {
    const already = new Set(unlockedRewards);
    return newRewardsAtLevel(level, level + 1, already);
  }, [level, unlockedRewards]);

  const rewardCount = useMemo(
    () => REWARDS.filter((r) => unlockedRewards.includes(r.id)).length,
    [unlockedRewards],
  );
  const xpRemaining = XP_PER_LEVEL - intoLevel;
  const nextReward = nextLevelRewards[0] ?? null;

  return (
    <div className="relative">
      <div className="relative">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--text-kicker)]">
          <Sparkles className="size-3 text-tertiary" />
          Your journey
        </p>
        <h1 className="mt-1.5 font-serif text-[32px] font-medium leading-none tracking-[-0.03em] text-foreground">
          Level {level}
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-[var(--text-on-surface-strong)]">
          <span className="font-mono text-foreground">{intoLevel}</span>
          <span> / {XP_PER_LEVEL} XP</span>
          <span> toward Level {level + 1}</span>
        </p>
      </div>

      {nextReward ? (
        <button
          type="button"
          onClick={onOpenAchievements}
          className="relative mt-4 flex w-full items-center gap-3 rounded-2xl px-1 py-3 text-left transition-all duration-200 hover:bg-[rgba(255,185,84,0.08)] active:scale-[0.985]"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl text-tertiary">
            <Gift className="size-4" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--tertiary)]">
              Next unlock
            </span>
            <span className="mt-0.5 block truncate text-sm font-semibold text-foreground">
              {nextReward.label}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-[var(--text-on-surface-strong)]">
            Level {level + 1}
            <ChevronRight className="size-3.5" aria-hidden />
          </span>
        </button>
      ) : null}

      <div className="relative mt-3 grid grid-cols-3 gap-2">
        <StatBadge
          tone="warm"
          layout="stacked"
          icon={<Flame className="size-4" fill="currentColor" />}
          value={streak}
          label="Day rhythm"
          onPress={onOpenAchievements}
        />
        <StatBadge
          tone="calm"
          layout="stacked"
          icon={<Compass className="size-4" />}
          value={journeysCompleted}
          label="Journeys"
          onPress={onOpenAchievements}
        />
        <StatBadge
          tone="soft"
          layout="stacked"
          icon={<Gift className="size-4" />}
          value={rewardCount}
          label="Rewards"
          onPress={onOpenAchievements}
        />
      </div>

      <div className="relative mt-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-kicker)]">
            Level progress
          </p>
          <p className="font-mono text-[11px] text-[var(--text-on-surface-strong)]">
            {xpRemaining} XP to go
          </p>
        </div>
        <ProgressBar progress={levelProgressPercent(totalXp)} tone="amber" hideLabel />
        <p className="mt-2 text-[11px] text-[var(--text-on-surface-strong)]">
          <span className="font-mono text-[color:var(--tertiary)]">{totalXp} XP</span>
          <span> earned across your journey</span>
        </p>
      </div>
    </div>
  );
}
