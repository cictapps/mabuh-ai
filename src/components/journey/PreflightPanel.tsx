import { Sunrise } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionTitle } from "./SectionTitle";
import { ChecklistChip } from "./ChecklistChip";
import { MoodPicker } from "./MoodPicker";
import { ContextualHint } from "./ContextualHint";
import type { MoodType } from "@/types";

type PreflightPanelProps = {
  preflightChecks: { water: boolean; breath: boolean };
  preflightMood: MoodType | null;
  onToggleCheck: (key: "water" | "breath") => void;
  onSelectMood: (mood: MoodType) => void;
  onTakeoff: () => void;
  showHint: boolean;
};

export function PreflightPanel({
  preflightChecks,
  preflightMood,
  onToggleCheck,
  onSelectMood,
  onTakeoff,
  showHint,
}: PreflightPanelProps) {
  const allChecked = preflightChecks.water && preflightChecks.breath && preflightMood;
  const doneCount =
    (preflightChecks.water ? 1 : 0) +
    (preflightChecks.breath ? 1 : 0) +
    (preflightMood ? 1 : 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <SectionTitle icon={<Sunrise className="size-4" />} title="Preflight" />
          <span className="rounded-full border border-[rgba(255,185,84,0.28)] bg-[rgba(255,185,84,0.08)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#ffd99a]">
            +3 XP
          </span>
        </div>
        <CardTitle className="mt-3 text-2xl">A gentle start</CardTitle>
        <CardDescription>
          A small moment to land before the day moves.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {showHint ? (
          <ContextualHint text="Three soft things, in any order. Skip what doesn't fit — the button is always ready." />
        ) : null}

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d8d4eb]">
            Land softly
          </p>
          <div className="space-y-2">
            <ChecklistChip
              emoji="💧"
              label="A sip of water"
              done={preflightChecks.water}
              onPress={() => onToggleCheck("water")}
            />
            <ChecklistChip
              emoji="🌬️"
              label="A few slow breaths"
              done={preflightChecks.breath}
              onPress={() => onToggleCheck("breath")}
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d8d4eb]">
            One word for how you feel
          </p>
          <MoodPicker value={preflightMood} onChange={onSelectMood} />
        </div>

        <Button
          size="lg"
          className="w-full"
          onClick={onTakeoff}
        >
          {allChecked
            ? "Set off"
            : doneCount === 0
              ? "I'll do these later — set off"
              : `Set off (${3 - doneCount} skipped)`}
        </Button>
      </CardContent>
    </Card>
  );
}
