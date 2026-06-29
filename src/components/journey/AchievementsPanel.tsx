import { useMemo } from "react";
import { Award, Gift, Lock, MapPin, Sparkles, Star } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Pill } from "./Pill";
import { ProgressBar } from "./ProgressBar";
import { ContextualHint } from "./ContextualHint";
import { AchievementShareCard } from "./AchievementShareCard";
import { useJourneyStore } from "@/lib/journey/useJourneyStore";
import {
  levelFromXp,
  xpIntoLevel,
  XP_PER_LEVEL,
  XP_REWARDS,
  REWARDS,
  reachedMilestones,
  nextMilestone,
  tierForLevel,
} from "@/lib/journey/xp";

const XP_RULES: { label: string; value: string }[] = [
  { label: "Begin Flight or Garden", value: `+${XP_REWARDS.preflight} XP` },
  { label: "Checkpoint or care moment (×3)", value: `+${XP_REWARDS.checkpoint} XP` },
  { label: "Close out Flight or Garden", value: `+${XP_REWARDS.final} XP` },
  { label: "Mood check-in (×2 daily)", value: `+${XP_REWARDS.mood_checkin} XP` },
  { label: "Journal entry", value: `+${XP_REWARDS.journal_entry} XP` },
];

const CATEGORY_LABELS: Record<string, string> = {
  theme: "Sky tone",
  plane: "Companion",
  affirmation: "Affirmation pack",
  accent: "Card accent",
  background: "Background",
  title: "Custom title",
  plant: "Plant variety",
};

const SHOW_ACHIEVEMENT_SHARE_CARD = false;

type AchievementsPanelProps = {
  showHint: boolean;
};

export function AchievementsPanel({ showHint }: AchievementsPanelProps) {
  const totalXp = useJourneyStore((s) => s.totalXp);
  const streak = useJourneyStore((s) => s.streak);
  const flightsCompleted = useJourneyStore((s) => s.flightsCompleted);
  const gardenDaysCompleted = useJourneyStore((s) => s.gardenDaysCompleted);
  const unlockedRewards = useJourneyStore((s) => s.unlockedRewards);
  const pauseCount = useJourneyStore((s) => s.pauseCount);
  const journalEntryCount = useJourneyStore((s) => s.journalEntryCount);
  const bestRhythm = useJourneyStore((s) => s.bestRhythm);
  const level = levelFromXp(totalXp);
  const intoLevel = xpIntoLevel(totalXp);

  const milestones = reachedMilestones(
    flightsCompleted,
    gardenDaysCompleted,
    journalEntryCount,
    pauseCount,
    bestRhythm,
  );
  const latestMilestone = milestones[milestones.length - 1];
  const upcomingMilestone = useMemo(
    () =>
      nextMilestone(
        flightsCompleted,
        gardenDaysCompleted,
        journalEntryCount,
        pauseCount,
        bestRhythm,
      ),
    [bestRhythm, flightsCompleted, gardenDaysCompleted, journalEntryCount, pauseCount],
  );
  const tier = tierForLevel(level);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <span className="grid size-9 place-items-center rounded-2xl border border-[rgba(255,185,84,0.28)] bg-[rgba(255,185,84,0.10)] text-tertiary">
            <Award className="size-4" />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-kicker)]">
            Achievements
          </span>
        </div>
        <CardTitle className="mt-3 text-2xl">Quiet wins</CardTitle>
        <CardDescription>
          Small XP for small steps. There are no penalties for pausing.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {showHint ? (
          <ContextualHint text="XP grows from gentle moments — there are no streaks to break. Use the milestones as a soft map, not a scoreboard." />
        ) : null}

        <div className="grid grid-cols-3 gap-2">
          <Pill label="Streak" value={`${streak} 🔥`} tone="warm" />
          <Pill label="Level" value={`Lv.${level}`} tone="calm" />
          <Pill
            label="Journeys"
            value={flightsCompleted + gardenDaysCompleted}
            tone="soft"
          />
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-kicker)]">
            Progress to level {level + 1}
          </p>
          <ProgressBar
            progress={(intoLevel / XP_PER_LEVEL) * 100}
            label={`${intoLevel}/${XP_PER_LEVEL} XP`}
            tone="amber"
          />
        </div>

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-kicker)]">
            <Sparkles className="size-3" />
            How XP grows
          </p>
          <ul className="space-y-2">
            {XP_RULES.map((rule) => (
              <li
                key={rule.label}
                className="flex items-center justify-between rounded-xl border border-[rgba(188,194,255,0.06)] bg-[rgba(188,194,255,0.02)] px-3 py-2 text-xs"
              >
                <span className="text-[color:var(--text-on-surface-muted)]">
                  {rule.label}
                </span>
                <span className="font-mono text-foreground">{rule.value}</span>
              </li>
            ))}
          </ul>
        </div>

        {SHOW_ACHIEVEMENT_SHARE_CARD ? (
          <AchievementShareCard
            level={level}
            totalXp={totalXp}
            streak={streak}
            journeysCompleted={flightsCompleted + gardenDaysCompleted}
            milestoneLabel={latestMilestone?.label}
            tierLabel={tier}
            nextMilestone={upcomingMilestone}
          />
        ) : null}

        {/* Rewards */}
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-kicker)]">
            <Gift className="size-3" />
            Level rewards
          </p>
          <ul className="space-y-2">
            {REWARDS.map((reward) => {
              const unlocked = unlockedRewards.includes(reward.id);
              const locked = reward.level > level;
              return (
                <li
                  key={reward.id}
                  className={
                    "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-xs " +
                    (unlocked
                      ? "border-[rgba(255,185,84,0.28)] bg-[rgba(255,185,84,0.08)] text-foreground"
                      : locked
                        ? "border-[rgba(188,194,255,0.06)] bg-[rgba(188,194,255,0.02)] text-[color:var(--text-on-surface-softest)]"
                        : "border-[rgba(188,194,255,0.06)] bg-[rgba(188,194,255,0.02)] text-[color:var(--text-on-surface-muted)]")
                  }
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[rgba(188,194,255,0.08)]">
                    {unlocked ? (
                      <Gift className="size-3.5 text-tertiary" />
                    ) : (
                      <Lock className="size-3.5" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">
                      {reward.label}
                      {unlocked ? (
                        <span className="ml-1.5 text-[10px] font-medium text-tertiary">
                          Unlocked
                        </span>
                      ) : locked ? (
                        <span className="ml-1.5 text-[10px] text-[color:var(--text-on-surface-softest)]">
                          Level {reward.level}
                        </span>
                      ) : null}
                    </span>
                    <span className="block text-[11px] opacity-80">
                      {reward.description}
                    </span>
                  </span>
                  <span className="shrink-0 text-right text-[10px] capitalize text-[color:var(--text-on-surface-softest)]">
                    {CATEGORY_LABELS[reward.category] ?? reward.category}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Milestones */}
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-kicker)]">
            <MapPin className="size-3" />
            Milestones
          </p>
          <ul className="space-y-2">
            {milestones.length === 0 ? (
              <li className="rounded-xl border border-dashed border-[rgba(188,194,255,0.10)] bg-[rgba(188,194,255,0.02)] px-3 py-3 text-xs text-[color:var(--text-on-surface-muted)]">
                Complete your first Flight, Garden day, journal entry, or pause to earn a
                milestone.
              </li>
            ) : (
              milestones.map((ms) => (
                <li
                  key={ms.id}
                  className="flex items-center gap-3 rounded-xl border border-[rgba(255,185,84,0.28)] bg-[rgba(255,185,84,0.08)] px-3 py-2.5 text-xs text-foreground"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[rgba(255,185,84,0.16)] text-tertiary">
                    <Star className="size-3.5" fill="currentColor" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{ms.label}</span>
                    <span className="block text-[11px] opacity-80">{ms.body}</span>
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-tertiary">
                    Reached
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
