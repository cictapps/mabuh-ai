import { Flag } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionTitle } from "./SectionTitle";
import { ChecklistChip } from "./ChecklistChip";
import { MoodPicker } from "./MoodPicker";
import { ContextualHint } from "./ContextualHint";
import type { MoodType } from "@/types";

type FinalPanelProps = {
  finalChecks: { water: boolean; breath: boolean };
  finalMood: MoodType | null;
  onToggleCheck: (key: "water" | "breath") => void;
  onSelectMood: (mood: MoodType) => void;
  onFinish: () => void;
  showHint: boolean;
};

export function FinalPanel({
  finalChecks,
  finalMood,
  onToggleCheck,
  onSelectMood,
  onFinish,
  showHint,
}: FinalPanelProps) {
  const allChecked = finalChecks.water && finalChecks.breath && finalMood;
  const doneCount =
    (finalChecks.water ? 1 : 0) + (finalChecks.breath ? 1 : 0) + (finalMood ? 1 : 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <SectionTitle icon={<Flag className="size-4" />} title="Final approach" />
          <span className="rounded-full border border-[rgba(255,185,84,0.32)] bg-[rgba(255,185,84,0.10)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-on-warm-strong)]">
            +5 XP
          </span>
        </div>
        <CardTitle className="mt-3 text-2xl">Time to land</CardTitle>
        <CardDescription>A small close-out, then rest.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {showHint ? (
          <ContextualHint text="Three soft things, in any order. Tomorrow is always a new flight." />
        ) : null}

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-kicker)]">
            Wind down
          </p>
          <div className="space-y-3">
            <ChecklistChip
              emoji="💧"
              label="A sip of water"
              done={finalChecks.water}
              onPress={() => onToggleCheck("water")}
            />
            <ChecklistChip
              emoji="🌬️"
              label="Soften your shoulders"
              done={finalChecks.breath}
              onPress={() => onToggleCheck("breath")}
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-kicker)]">
            One word for the day
          </p>
          <MoodPicker value={finalMood} onChange={onSelectMood} />
        </div>

        <Button size="lg" className="w-full" onClick={onFinish}>
          {allChecked
            ? "Finish today's flight"
            : doneCount === 0
              ? "I'll do these later — finish"
              : `Finish (${3 - doneCount} skipped)`}
        </Button>
      </CardContent>
    </Card>
  );
}
