import { Award, MapPin, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Pill } from "./Pill";
import { ProgressBar } from "./ProgressBar";
import { ContextualHint } from "./ContextualHint";
import { useJourneyStore } from "@/lib/journey/useJourneyStore";
import { levelFromXp, xpIntoLevel, XP_PER_LEVEL, XP_REWARDS } from "@/lib/journey/xp";

const XP_RULES: { label: string; value: string }[] = [
  { label: "Begin your day (preflight)", value: `+${XP_REWARDS.preflight} XP` },
  { label: "Pause for a checkpoint", value: `+${XP_REWARDS.checkpoint} XP` },
  { label: "Close out your day", value: `+${XP_REWARDS.final} XP` },
];

const FLIGHT_MILESTONES = [
  { count: 1, label: "First flight", body: "Welcome aboard." },
  { count: 3, label: "Steady skies", body: "Three flights complete." },
  { count: 5, label: "City hops", body: "You're finding your rhythm." },
  { count: 10, label: "Wide horizons", body: "Ten days of gentle practice." },
  { count: 25, label: "Sanctuary pilot", body: "This is becoming yours." },
];

type AchievementsPanelProps = {
  showHint: boolean;
};

export function AchievementsPanel({ showHint }: AchievementsPanelProps) {
  const totalXp = useJourneyStore((s) => s.totalXp);
  const streak = useJourneyStore((s) => s.streak);
  const flightsCompleted = useJourneyStore((s) => s.flightsCompleted);
  const level = levelFromXp(totalXp);
  const intoLevel = xpIntoLevel(totalXp);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <span className="grid size-9 place-items-center rounded-2xl border border-[rgba(255,185,84,0.28)] bg-[rgba(255,185,84,0.10)] text-tertiary">
            <Award className="size-4" />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Achievements
          </span>
        </div>
        <CardTitle className="mt-3 text-2xl">Quiet wins</CardTitle>
        <CardDescription>
          Small XP for small steps. There are no penalties for pausing.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {showHint ? (
          <ContextualHint text="XP grows from gentle moments — there are no streaks to break. Use the milestones as a soft map, not a scoreboard." />
        ) : null}

        <div className="grid grid-cols-3 gap-2">
          <Pill
            label="Streak"
            value={`${streak} 🔥`}
            tone="warm"
          />
          <Pill label="Level" value={`Lv.${level}`} tone="calm" />
          <Pill label="Flights" value={flightsCompleted} tone="soft" />
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Progress to level {level + 1}
          </p>
          <ProgressBar
            progress={(intoLevel / XP_PER_LEVEL) * 100}
            label={`${intoLevel}/${XP_PER_LEVEL} XP`}
            tone="amber"
          />
        </div>

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <Sparkles className="size-3" />
            How XP grows
          </p>
          <ul className="space-y-1.5">
            {XP_RULES.map((rule) => (
              <li
                key={rule.label}
                className="flex items-center justify-between rounded-xl border border-[rgba(188,194,255,0.06)] bg-[rgba(188,194,255,0.02)] px-3 py-2 text-xs"
              >
                <span className="text-muted-foreground">{rule.label}</span>
                <span className="font-mono text-foreground/90">{rule.value}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <MapPin className="size-3" />
            Flight milestones
          </p>
          <ul className="space-y-1.5">
            {FLIGHT_MILESTONES.map((milestone) => {
              const reached = flightsCompleted >= milestone.count;
              return (
                <li
                  key={milestone.label}
                  className={
                    "flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-xs " +
                    (reached
                      ? "border-[rgba(255,185,84,0.28)] bg-[rgba(255,185,84,0.08)] text-foreground"
                      : "border-[rgba(188,194,255,0.06)] bg-[rgba(188,194,255,0.02)] text-muted-foreground")
                  }
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{milestone.label}</span>
                    <span className="block text-[11px] opacity-80">{milestone.body}</span>
                  </span>
                  <span className="shrink-0 font-mono text-[11px]">
                    {reached ? "Reached" : `${milestone.count} flights`}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
