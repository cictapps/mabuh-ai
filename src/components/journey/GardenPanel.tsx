import { CloudRain, Heart, Leaf, Moon, Shield, Sparkles, Sun, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SegmentedTabs, type SegmentedTabsItem } from "@/components/shared/SegmentedTabs";
import { cn } from "@/lib/utils";
import { useJourneyStore } from "@/lib/journey/useJourneyStore";
import type { GardenPhase, MoodType } from "@/types";
import { MoodPicker } from "./MoodPicker";
import { GardenScene } from "./GardenScene";
import { GardenTabIcon } from "./GardenTabIcon";

const PHASES: Array<{ id: GardenPhase; label: string; icon: GardenPhase }> = [
  { id: "prepare", label: "Prepare", icon: "prepare" },
  { id: "growing", label: "Grow", icon: "growing" },
  { id: "care", label: "Care", icon: "care" },
  { id: "reflect", label: "Reflect", icon: "reflect" },
  { id: "rest", label: "Rest", icon: "rest" },
];

function buildPhaseItems(
  locked: boolean,
  activeIndex: number,
): SegmentedTabsItem<GardenPhase>[] {
  return PHASES.map((phase, index) => {
    const reached = index <= activeIndex;
    return {
      key: phase.id,
      label: phase.label,
      icon: ({ active }) => (
        <GardenTabIcon
          phase={phase.icon}
          className={cn(
            "size-[18px] shrink-0 transition-colors duration-300",
            active
              ? "text-[#132019]"
              : reached
                ? "text-[color:var(--icon-success)]"
                : "text-[color:var(--text-on-surface-softest)]",
          )}
        />
      ),
      disabled: !locked && phase.id !== "prepare",
    };
  });
}

const CARE: Record<
  MoodType,
  { weather: string; action: string; detail: string; icon: typeof Sun }
> = {
  stressed: {
    weather: "Rain and stronger wind",
    action: "Add shelter",
    detail: "Give the plant and yourself a little cover while the rain passes.",
    icon: Shield,
  },
  sad: {
    weather: "Soft drizzle and a long quiet",
    action: "Sit with it",
    detail: "Some days are simply heavy. The garden waits patiently with you.",
    icon: CloudRain,
  },
  worried: {
    weather: "Clouds and a steady breeze",
    action: "Support the stem",
    detail: "A small support can make movement feel more manageable.",
    icon: Waves,
  },
  tired: {
    weather: "Dusk, low light",
    action: "Rest a while",
    detail: "Water and step away. The plant grows even when you’re not watching.",
    icon: Moon,
  },
  okay: {
    weather: "Soft overcast",
    action: "Check the soil",
    detail: "Notice what is present. Nothing needs to be forced today.",
    icon: Leaf,
  },
  calm: {
    weather: "Gentle sunlight",
    action: "Turn toward the light",
    detail: "Let a quiet moment of warmth reach the new leaves.",
    icon: Sun,
  },
  happy: {
    weather: "Bright sun",
    action: "Water and notice",
    detail: "Take in what has changed, even if the growth is small.",
    icon: Sparkles,
  },
};

type GardenPanelProps = {
  onOpenSupport: () => void;
  locked: boolean;
};

export function GardenPanel({ onOpenSupport, locked }: GardenPanelProps) {
  const storedPhase = useJourneyStore((state) => state.gardenPhase);
  const phase = locked ? storedPhase : "prepare";
  const mood = useJourneyStore((state) => state.gardenMood);
  const plant = useJourneyStore((state) => state.gardenPlant);
  const stage = useJourneyStore((state) => state.gardenStage);
  const setMood = useJourneyStore((state) => state.setGardenMood);
  const setPhase = useJourneyStore((state) => state.setGardenPhase);
  const start = useJourneyStore((state) => state.completeGardenStart);
  const completeCare = useJourneyStore((state) => state.completeGardenCare);
  const finish = useJourneyStore((state) => state.completeGardenDay);
  const prepareNext = useJourneyStore((state) => state.prepareNextGarden);
  const care = CARE[mood ?? "okay"];
  const CareIcon = care.icon;

  return (
    <>
      <SegmentedTabs
        items={buildPhaseItems(
          locked,
          PHASES.findIndex((p) => p.id === phase),
        )}
        activeKey={phase}
        onChange={setPhase}
        ariaLabel="Garden phases"
        tone="sage"
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <span className="grid size-9 place-items-center rounded-2xl border border-[rgba(109,186,132,0.22)] bg-[rgba(109,186,132,0.10)] text-[color:var(--icon-success)]">
              <Leaf className="size-4" />
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-success-strong)]">
              Garden · Stage {stage}/7
            </span>
          </div>
          <CardTitle className="mt-3 text-2xl">
            {phase === "prepare" && "Prepare the soil"}
            {phase === "growing" && "Growing through today"}
            {phase === "care" && care.action}
            {phase === "reflect" && "An evening note"}
            {phase === "rest" &&
              (stage >= 7 ? "Your plant is in bloom" : "Today’s growth is enough")}
          </CardTitle>
          <CardDescription>
            {phase === "prepare" && "Choose the weather that feels closest to you."}
            {phase === "growing" &&
              `${care.weather}. Your plant keeps growing without penalties.`}
            {phase === "care" && care.detail}
            {phase === "reflect" &&
              "Notice how the weather feels now, then let the plant rest."}
            {phase === "rest" &&
              (stage >= 7
                ? "Seven days of care made this bloom possible."
                : "The next stage can wait for another Garden day.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {phase === "prepare" ? (
            <>
              <MoodPicker value={mood} onChange={setMood} />
              <Button className="w-full" size="lg" onClick={start}>
                <Leaf className="size-4" />
                Begin growing · +3 XP
              </Button>
            </>
          ) : null}

          {phase === "growing" ? (
            <>
              <GardenScene mood={mood} plant={plant} stage={stage} />
              <div className="rounded-2xl border border-[rgba(109,186,132,0.16)] bg-[rgba(109,186,132,0.06)] p-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[rgba(109,186,132,0.14)] text-[color:var(--icon-success)]">
                    <CareIcon className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{care.action}</p>
                    <p className="mt-1 text-xs leading-relaxed text-[color:var(--text-on-surface-muted)]">
                      {care.detail}
                    </p>
                  </div>
                </div>
              </div>
              <Button className="w-full" size="lg" onClick={() => setPhase("care")}>
                Care for the plant
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="ghost" onClick={() => setPhase("reflect")}>
                  <Moon className="size-4" />
                  Evening note
                </Button>
                <Button
                  variant="ghost"
                  className="text-[color:var(--text-on-warm-strong)]"
                  onClick={onOpenSupport}
                >
                  <Heart className="size-4" />
                  Need support
                </Button>
              </div>
            </>
          ) : null}

          {phase === "care" ? (
            <>
              <GardenScene mood={mood} plant={plant} stage={stage} />
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-kicker)]">
                  Has the weather shifted?
                </p>
                <MoodPicker value={mood} onChange={setMood} />
              </div>
              <Button className="w-full" size="lg" onClick={completeCare}>
                <CareIcon className="size-4" />
                {care.action} · +1 XP
              </Button>
            </>
          ) : null}

          {phase === "reflect" ? (
            <>
              <GardenScene mood={mood} plant={plant} stage={stage} />
              <MoodPicker value={mood} onChange={setMood} />
              <Button className="w-full" size="lg" onClick={finish}>
                Finish today&apos;s growth · +5 XP
              </Button>
            </>
          ) : null}

          {phase === "rest" ? (
            <>
              <GardenScene mood={mood} plant={plant} stage={stage} />
              <Button variant="secondary" className="w-full" onClick={prepareNext}>
                Prepare the next Garden day
              </Button>
            </>
          ) : null}
        </CardContent>
      </Card>
    </>
  );
}
