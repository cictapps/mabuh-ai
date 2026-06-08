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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <SectionTitle icon={<Sunrise className="size-4" />} title="Preflight" />
          <span className="rounded-full border border-[rgba(255,185,84,0.28)] bg-[rgba(255,185,84,0.08)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-tertiary-foreground">
            +3 XP
          </span>
        </div>
        <CardTitle className="mt-3 text-2xl">A gentle start to your day</CardTitle>
        <CardDescription>
          Set the tone for the hours ahead. Take your time — there is no rush.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {showHint ? (
          <ContextualHint text="This is your soft start. Pick a way to arrive and a feeling to name — the rest of the day can unfold from here." />
        ) : null}

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Soft start
          </p>
          <div className="space-y-2">
            <ChecklistChip
              emoji="💧"
              label="Sip some water"
              done={preflightChecks.water}
              onPress={() => onToggleCheck("water")}
            />
            <ChecklistChip
              emoji="🌬️"
              label="Take five slow breaths"
              done={preflightChecks.breath}
              onPress={() => onToggleCheck("breath")}
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            How are you arriving?
          </p>
          <MoodPicker value={preflightMood} onChange={onSelectMood} />
        </div>

        <Button
          size="lg"
          className="w-full"
          disabled={!allChecked}
          onClick={onTakeoff}
        >
          Set off
        </Button>
      </CardContent>
    </Card>
  );
}
