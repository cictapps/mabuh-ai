import { useState } from "react";
import { MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionTitle } from "./SectionTitle";
import { ChecklistChip } from "./ChecklistChip";
import { MoodPicker } from "./MoodPicker";
import { ContextualHint } from "./ContextualHint";
import type { MoodType } from "@/types";

const LOCATION_OPTIONS = [
  "Home",
  "Dorm",
  "Classroom",
  "Library",
  "Commute",
  "Cafe",
  "Friend's place",
];

type CheckpointPanelProps = {
  checkpointLabel: string;
  checkpointTime: string;
  checks: { water: boolean; breath: boolean };
  mood: MoodType | null;
  notes: string;
  onToggleCheck: (key: "water" | "breath") => void;
  onSelectMood: (mood: MoodType) => void;
  onNotesChange: (notes: string) => void;
  onContinue: () => void;
  showHint: boolean;
};

export function CheckpointPanel({
  checkpointLabel,
  checkpointTime,
  checks,
  mood,
  notes,
  onToggleCheck,
  onSelectMood,
  onNotesChange,
  onContinue,
  showHint,
}: CheckpointPanelProps) {
  const [location, setLocation] = useState<string | null>(null);
  const ready = checks.water && checks.breath && mood;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <SectionTitle icon={<MapPin className="size-4" />} title="Checkpoint" />
          <span className="rounded-full border border-[rgba(188,194,255,0.28)] bg-[rgba(188,194,255,0.08)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground">
            +½ XP
          </span>
        </div>
        <CardTitle className="mt-3 text-2xl">{checkpointLabel}</CardTitle>
        <CardDescription>
          Scheduled for {checkpointTime}. A small pause to notice where you are.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {showHint ? (
          <ContextualHint text="A checkpoint is a soft waypoint. Recenter, name a feeling, and keep going — there's nothing to fix here." />
        ) : null}

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Recenter
          </p>
          <div className="space-y-2">
            <ChecklistChip
              emoji="💧"
              label="Sip some water"
              done={checks.water}
              onPress={() => onToggleCheck("water")}
            />
            <ChecklistChip
              emoji="🌬️"
              label="Take a few slow breaths"
              done={checks.breath}
              onPress={() => onToggleCheck("breath")}
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            How does this moment feel?
          </p>
          <MoodPicker value={mood} onChange={onSelectMood} />
        </div>

        <div>
          <label
            htmlFor="checkpoint-notes"
            className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
          >
            A line for yourself <span className="text-muted-foreground/80 normal-case">(optional)</span>
          </label>
          <textarea
            id="checkpoint-notes"
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            rows={3}
            placeholder="One thing you want to remember about this stretch…"
            className="w-full resize-none rounded-2xl border border-[rgba(188,194,255,0.10)] bg-surface-highest px-4 py-3 text-sm leading-relaxed shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none placeholder:text-muted-foreground/70 focus-visible:border-tertiary/40 focus-visible:ring-4 focus-visible:ring-tertiary/20"
          />
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Where are you?
          </p>
          <div className="flex flex-wrap gap-1.5">
            {LOCATION_OPTIONS.map((option) => {
              const selected = location === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setLocation(selected ? null : option)}
                  aria-pressed={selected}
                  className={
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors " +
                    (selected
                      ? "border-[rgba(188,194,255,0.30)] bg-[rgba(188,194,255,0.10)] text-foreground"
                      : "border-[rgba(188,194,255,0.08)] bg-[rgba(188,194,255,0.03)] text-muted-foreground hover:bg-[rgba(188,194,255,0.06)] hover:text-foreground")
                  }
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        <Button size="lg" className="w-full" onClick={onContinue} disabled={!ready}>
          Continue your day
        </Button>
      </CardContent>
    </Card>
  );
}
