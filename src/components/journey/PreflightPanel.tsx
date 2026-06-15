import { useState } from "react";
import { Sunrise } from "lucide-react";
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

type PreflightPanelProps = {
  preflightChecks: { water: boolean; breath: boolean };
  preflightMood: MoodType | null;
  onToggleCheck: (key: "water" | "breath") => void;
  onSelectMood: (mood: MoodType) => void;
  onTakeoff: () => void;
  showHint: boolean;
};

const EXTRA_LANDING_ITEMS = [
  { id: "shoulders", emoji: "🫶", label: "Let your shoulders drop" },
  { id: "window", emoji: "🌤️", label: "Look outside for a quiet moment" },
  { id: "stretch", emoji: "🙆", label: "A gentle stretch" },
  { id: "feet", emoji: "🌱", label: "Feel both feet on the ground" },
  { id: "sound", emoji: "🎧", label: "Listen to one calming sound" },
  { id: "desk", emoji: "✨", label: "Clear one small space nearby" },
  { id: "kind-word", emoji: "💛", label: "Say one kind thing to yourself" },
  { id: "light", emoji: "☀️", label: "Step into a little natural light" },
  { id: "hands", emoji: "🤲", label: "Unclench your hands and jaw" },
  { id: "intention", emoji: "📝", label: "Choose one gentle intention" },
  { id: "face", emoji: "🧊", label: "Splash a little cool water on your face" },
  { id: "song", emoji: "🎵", label: "Play one song that feels steady" },
  { id: "snack", emoji: "🍌", label: "Have a small nourishing bite" },
  { id: "air", emoji: "🍃", label: "Let in a little fresh air" },
  { id: "phone", emoji: "📵", label: "Put your phone down for one minute" },
  { id: "name-three", emoji: "👀", label: "Name three things you can see" },
  { id: "posture", emoji: "🪑", label: "Settle into a comfortable posture" },
  { id: "pace", emoji: "🐢", label: "Choose a slower pace for the next task" },
  { id: "temperature", emoji: "🌡️", label: "Notice the temperature around you" },
  { id: "gratitude", emoji: "🌼", label: "Name one small thing you appreciate" },
  { id: "bag", emoji: "🎒", label: "Set down what you do not need right now" },
  { id: "eyes", emoji: "😌", label: "Rest your eyes for a quiet moment" },
  { id: "palms", emoji: "👐", label: "Press your palms together gently" },
  { id: "next-step", emoji: "👣", label: "Pick only your next small step" },
  { id: "quiet", emoji: "🔕", label: "Turn down one source of noise" },
  { id: "support", emoji: "💬", label: "Send a simple hello to someone safe" },
  { id: "back", emoji: "🧘", label: "Give your back a slow stretch" },
  { id: "affirm", emoji: "🌻", label: "Remind yourself: I can begin gently" },
] as const;

function pickLandingItems(count: number) {
  const shuffled = [...EXTRA_LANDING_ITEMS];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled.slice(0, count);
}

export function PreflightPanel({
  preflightChecks,
  preflightMood,
  onToggleCheck,
  onSelectMood,
  onTakeoff,
  showHint,
}: PreflightPanelProps) {
  const [extraItems] = useState(() => pickLandingItems(2));
  const [completedExtras, setCompletedExtras] = useState<Set<string>>(() => new Set());
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
        <CardDescription>A small moment to land before the day moves.</CardDescription>
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
            {extraItems.map((item) => (
              <ChecklistChip
                key={item.id}
                emoji={item.emoji}
                label={item.label}
                done={completedExtras.has(item.id)}
                onPress={() =>
                  setCompletedExtras((current) => {
                    const next = new Set(current);
                    if (next.has(item.id)) {
                      next.delete(item.id);
                    } else {
                      next.add(item.id);
                    }
                    return next;
                  })
                }
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d8d4eb]">
            One word for how you feel
          </p>
          <MoodPicker value={preflightMood} onChange={onSelectMood} />
        </div>

        <Button size="lg" className="w-full" onClick={onTakeoff}>
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
