import { Flag } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  const ready = finalChecks.water && finalChecks.breath && finalMood;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <SectionTitle icon={<Flag className="size-4" />} title="Final approach" />
          <span className="rounded-full border border-[rgba(255,185,84,0.32)] bg-[rgba(255,185,84,0.10)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#ffd99a]">
            +5 XP
          </span>
        </div>
        <CardTitle className="mt-3 text-2xl">Time to land gently</CardTitle>
        <CardDescription>
          A small close-out for your day — name a feeling and rest.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {showHint ? (
          <ContextualHint text="This is your evening close-out. You can add a sleep reminder, reflect briefly, and rest. Tomorrow's flight is always a new one." />
        ) : null}

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d8d4eb]">
            Wind down
          </p>
          <div className="space-y-2">
            <ChecklistChip
              emoji="💧"
              label="Sip some water"
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
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d8d4eb]">
            Closing mood
          </p>
          <MoodPicker value={finalMood} onChange={onSelectMood} />
        </div>

        <Button size="lg" className="w-full" onClick={onFinish} disabled={!ready}>
          Finish today's flight
        </Button>
      </CardContent>
    </Card>
  );
}
