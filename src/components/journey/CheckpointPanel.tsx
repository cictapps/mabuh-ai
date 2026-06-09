import { useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionTitle } from "./SectionTitle";
import { ChecklistChip } from "./ChecklistChip";
import { MoodPicker } from "./MoodPicker";
import { ContextualHint } from "./ContextualHint";
import { cn } from "@/lib/utils";
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
  const [showOptional, setShowOptional] = useState(false);
  const allChecked = checks.water && checks.breath && mood;
  const doneCount =
    (checks.water ? 1 : 0) + (checks.breath ? 1 : 0) + (mood ? 1 : 0);

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
        <CardDescription>{checkpointTime} · a small pause.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {showHint ? (
          <ContextualHint text="Recenter, name a feeling, and keep going. There's nothing to fix here." />
        ) : null}

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d8d4eb]">
            Recenter
          </p>
          <div className="space-y-2">
            <ChecklistChip
              emoji="💧"
              label="A sip of water"
              done={checks.water}
              onPress={() => onToggleCheck("water")}
            />
            <ChecklistChip
              emoji="🌬️"
              label="A few slow breaths"
              done={checks.breath}
              onPress={() => onToggleCheck("breath")}
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d8d4eb]">
            How does this moment feel?
          </p>
          <MoodPicker value={mood} onChange={onSelectMood} />
        </div>

        <button
          type="button"
          onClick={() => setShowOptional((v) => !v)}
          aria-expanded={showOptional}
          className="flex w-full items-center justify-between rounded-2xl border border-[rgba(188,194,255,0.10)] bg-[rgba(188,194,255,0.03)] px-3.5 py-2.5 text-left text-xs font-semibold text-[#d8d4eb] transition-colors hover:bg-[rgba(188,194,255,0.06)]"
        >
          <span>More (a note, where you are)</span>
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform",
              showOptional && "rotate-180",
            )}
            aria-hidden
          />
        </button>

        {showOptional ? (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="checkpoint-notes"
                className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d8d4eb]"
              >
                A line for yourself <span className="normal-case opacity-70">(optional)</span>
              </label>
              <textarea
                id="checkpoint-notes"
                value={notes}
                onChange={(event) => onNotesChange(event.target.value)}
                rows={3}
                placeholder="One thing you want to remember…"
                className="w-full resize-none rounded-2xl border border-[rgba(188,194,255,0.10)] bg-surface-highest px-4 py-3 text-sm leading-relaxed shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none placeholder:text-[#d8d4eb]/70 focus-visible:border-tertiary/40 focus-visible:ring-4 focus-visible:ring-tertiary/20"
              />
            </div>

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d8d4eb]">
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
                          : "border-[rgba(188,194,255,0.08)] bg-[rgba(188,194,255,0.03)] text-[#d8d4eb] hover:bg-[rgba(188,194,255,0.06)] hover:text-foreground")
                      }
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        <Button size="lg" className="w-full" onClick={onContinue}>
          {allChecked
            ? "Continue your day"
            : doneCount === 0
              ? "Continue — I'll do these later"
              : `Continue (${3 - doneCount} skipped)`}
        </Button>
      </CardContent>
    </Card>
  );
}
