import { useEffect, useMemo, useState } from "react";
import { Award, Settings2, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { JourneyHeader } from "@/components/journey/JourneyHeader";
import { PhaseSwitcher } from "@/components/journey/PhaseSwitcher";
import { PreflightPanel } from "@/components/journey/PreflightPanel";
import { AirbornePanel } from "@/components/journey/AirbornePanel";
import { CheckpointPanel } from "@/components/journey/CheckpointPanel";
import { PausePanel } from "@/components/journey/PausePanel";
import { FinalPanel } from "@/components/journey/FinalPanel";
import { RestPanel } from "@/components/journey/RestPanel";
import { HangarPanel } from "@/components/journey/HangarPanel";
import { AchievementsPanel } from "@/components/journey/AchievementsPanel";
import { AffirmationCard } from "@/components/journey/AffirmationCard";
import { IntroOverlay } from "@/components/journey/IntroOverlay";
import { useJourneyStore } from "@/lib/journey/useJourneyStore";
import { getJourneyStatus } from "@/lib/journey/schedule";
import type { JourneyPhase } from "@/types";

type JourneyView = "main" | "hangar" | "achievements";

const VIEW_TABS: { key: JourneyView; label: string; icon: typeof Sun }[] = [
  { key: "main", label: "Today", icon: Sun },
  { key: "hangar", label: "Hangar", icon: Settings2 },
  { key: "achievements", label: "Wins", icon: Award },
];

type JourneyScreenProps = {
  onOpenSupport: () => void;
};

export function JourneyScreen({ onOpenSupport }: JourneyScreenProps) {
  const phase = useJourneyStore((s) => s.phase);
  const setPhase = useJourneyStore((s) => s.setPhase);
  const totalXp = useJourneyStore((s) => s.totalXp);
  const streak = useJourneyStore((s) => s.streak);
  const flightsCompleted = useJourneyStore((s) => s.flightsCompleted);
  const checkpoints = useJourneyStore((s) => s.checkpoints);
  const hasSeenIntro = useJourneyStore((s) => s.hasSeenIntro);
  const dismissIntro = useJourneyStore((s) => s.dismissIntro);

  const preflightMood = useJourneyStore((s) => s.preflightMood);
  const checkpointMood = useJourneyStore((s) => s.checkpointMood);
  const finalMood = useJourneyStore((s) => s.finalMood);
  const preflightChecks = useJourneyStore((s) => s.preflightChecks);
  const checkpointChecks = useJourneyStore((s) => s.checkpointChecks);
  const finalChecks = useJourneyStore((s) => s.finalChecks);

  const setPreflightMood = useJourneyStore((s) => s.setPreflightMood);
  const setCheckpointMood = useJourneyStore((s) => s.setCheckpointMood);
  const setFinalMood = useJourneyStore((s) => s.setFinalMood);
  const togglePreflightCheck = useJourneyStore((s) => s.togglePreflightCheck);
  const toggleCheckpointCheck = useJourneyStore((s) => s.toggleCheckpointCheck);
  const toggleFinalCheck = useJourneyStore((s) => s.toggleFinalCheck);

  const completePreflight = useJourneyStore((s) => s.completePreflight);
  const completeCheckpoint = useJourneyStore((s) => s.completeCheckpoint);
  const completeFinal = useJourneyStore((s) => s.completeFinal);
  const enterPause = useJourneyStore((s) => s.enterPause);
  const prepareNextFlight = useJourneyStore((s) => s.prepareNextFlight);

  const [view, setView] = useState<JourneyView>("main");
  const [checkpointNotes, setCheckpointNotes] = useState("");
  const [now, setNow] = useState<Date>(() => new Date());
  const [hintSeen, setHintSeen] = useState<Record<JourneyPhase, boolean>>({
    preflight: false,
    airborne: false,
    checkpoint: false,
    pause: false,
    final: false,
    rest: false,
  });

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const status = useMemo(
    () => getJourneyStatus(checkpoints, now),
    [checkpoints, now],
  );

  const activeCheckpoint = status.currentCheckpoint ?? status.nextCheckpoint;

  const handleIntroChoice = (option: "setup" | "start") => {
    dismissIntro();
    if (option === "setup") {
      setView("hangar");
    }
  };

  const handlePhaseSelect = (next: JourneyPhase) => {
    if (next === "pause") {
      enterPause();
      return;
    }
    setPhase(next);
  };

  const markHintSeen = (phase: JourneyPhase) => {
    setHintSeen((current) => (current[phase] ? current : { ...current, [phase]: true }));
  };

  const openAchievements = () => {
    setView("achievements");
  };

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,185,84,0.10),transparent_60%)] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 top-40 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(188,194,255,0.10),transparent_60%)] blur-3xl"
      />

      <div className="relative space-y-4 px-4 pb-12 pt-5">
        <JourneyHeader
          totalXp={totalXp}
          streak={streak}
          flightsCompleted={flightsCompleted}
          onOpenAchievements={openAchievements}
        />

        <ViewTabs active={view} onChange={setView} />

        {view !== "main" ? null : (
          <>
            <PhaseSwitcher active={phase} onSelect={handlePhaseSelect} />

            <AffirmationCard />

            {phase === "preflight" ? (
              <PreflightPanel
                preflightChecks={preflightChecks}
                preflightMood={preflightMood}
                onToggleCheck={togglePreflightCheck}
                onSelectMood={setPreflightMood}
                onTakeoff={() => {
                  completePreflight();
                  markHintSeen("preflight");
                }}
                showHint={flightsCompleted === 0 && !hintSeen.preflight}
              />
            ) : null}

            {phase === "airborne" ? (
              <AirbornePanel
                onOpenCheckpoint={() => {
                  setPhase("checkpoint");
                  markHintSeen("airborne");
                }}
                onEnterFinal={() => setPhase("final")}
                onEnterPause={() => {
                  enterPause();
                  markHintSeen("airborne");
                }}
                showHint={flightsCompleted === 0 && !hintSeen.airborne}
              />
            ) : null}

            {phase === "checkpoint" ? (
              <CheckpointPanel
                checkpointLabel={
                  activeCheckpoint?.label ?? "A soft check-in"
                }
                checkpointTime={activeCheckpoint?.time ?? "—"}
                checks={checkpointChecks}
                mood={checkpointMood}
                notes={checkpointNotes}
                onToggleCheck={toggleCheckpointCheck}
                onSelectMood={setCheckpointMood}
                onNotesChange={setCheckpointNotes}
                onContinue={() => {
                  setCheckpointNotes("");
                  completeCheckpoint();
                  markHintSeen("checkpoint");
                }}
                showHint={flightsCompleted === 0 && !hintSeen.checkpoint}
              />
            ) : null}

            {phase === "pause" ? (
              <PausePanel
                onClose={() => {
                  setPhase("airborne");
                  markHintSeen("pause");
                }}
                onOpenSupport={onOpenSupport}
              />
            ) : null}

            {phase === "final" ? (
              <FinalPanel
                finalChecks={finalChecks}
                finalMood={finalMood}
                onToggleCheck={toggleFinalCheck}
                onSelectMood={setFinalMood}
                onFinish={() => {
                  completeFinal();
                  markHintSeen("final");
                }}
                showHint={flightsCompleted === 0 && !hintSeen.final}
              />
            ) : null}

            {phase === "rest" ? (
              <RestPanel
                onPrepareNext={() => {
                  prepareNextFlight();
                  markHintSeen("rest");
                }}
              />
            ) : null}
          </>
        )}

        {view === "hangar" ? <HangarPanel /> : null}

        {view === "achievements" ? (
          <AchievementsPanel showHint={flightsCompleted === 0} />
        ) : null}
      </div>

      <IntroOverlay open={!hasSeenIntro} onChoose={handleIntroChoice} />
    </div>
  );
}

type ViewTabsProps = {
  active: JourneyView;
  onChange: (view: JourneyView) => void;
};

function ViewTabs({ active, onChange }: ViewTabsProps) {
  return (
    <div
      className="flex items-stretch gap-1 rounded-2xl border border-[rgba(188,194,255,0.10)] bg-[rgba(188,194,255,0.03)] p-1"
      role="tablist"
      aria-label="Journey views"
    >
      {VIEW_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-semibold transition-colors",
              "active:scale-[0.97]",
              isActive
                ? "bg-gradient-to-r from-primary via-secondary to-primary text-primary-foreground shadow-[0_10px_28px_-18px_rgba(188,194,255,0.7)]"
                : "text-[#d8d4eb]",
            )}
          >
            <Icon className="size-3.5" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
