import { useEffect, useMemo, useState } from "react";
import { Compass } from "lucide-react";
import { JourneyHeader } from "@/components/journey/JourneyHeader";
import { PhaseSwitcher } from "@/components/journey/PhaseSwitcher";
import { ViewTabs, type JourneyView } from "@/components/journey/ViewTabs";
import { PreflightPanel } from "@/components/journey/PreflightPanel";
import { AirbornePanel } from "@/components/journey/AirbornePanel";
import { CheckpointPanel } from "@/components/journey/CheckpointPanel";
import { PausePanel } from "@/components/journey/PausePanel";
import { FinalPanel } from "@/components/journey/FinalPanel";
import { RestPanel } from "@/components/journey/RestPanel";
import { HangarPanel } from "@/components/journey/HangarPanel";
import { AchievementsPanel } from "@/components/journey/AchievementsPanel";
import { AffirmationCard } from "@/components/journey/AffirmationCard";
import { RewardToast } from "@/components/journey/RewardToast";
import { IntroOverlay } from "@/components/journey/IntroOverlay";
import { GardenPanel } from "@/components/journey/GardenPanel";
import { JourneyModeSelector } from "@/components/journey/JourneyModeSelector";
import { useJourneyStore } from "@/lib/journey/useJourneyStore";
import { getJourneyStatus } from "@/lib/journey/schedule";
import { todayKey } from "@/lib/journey/xp";
import type { JourneyPhase } from "@/types";

type JourneyScreenProps = {
  onOpenSupport: () => void;
};

export function JourneyScreen({ onOpenSupport }: JourneyScreenProps) {
  const phase = useJourneyStore((s) => s.phase);
  const mode = useJourneyStore((s) => s.mode);
  const modeDate = useJourneyStore((s) => s.modeDate);
  const selectMode = useJourneyStore((s) => s.selectMode);
  const setPhase = useJourneyStore((s) => s.setPhase);
  const totalXp = useJourneyStore((s) => s.totalXp);
  const streak = useJourneyStore((s) => s.streak);
  const flightsCompleted = useJourneyStore((s) => s.flightsCompleted);
  const gardenDaysCompleted = useJourneyStore((s) => s.gardenDaysCompleted);
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

  const status = useMemo(() => getJourneyStatus(checkpoints, now), [checkpoints, now]);

  const activeCheckpoint = status.currentCheckpoint ?? status.nextCheckpoint;
  const modeLocked = modeDate === todayKey(now);
  const activeFlightPhase = modeLocked ? phase : "preflight";

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
    <div className="relative" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
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
          journeysCompleted={flightsCompleted + gardenDaysCompleted}
          onOpenAchievements={openAchievements}
        />

        <ViewTabs
          active={view}
          onChange={setView}
          workshopLabel={mode === "garden" ? "Garden Shed" : "Hangar"}
        />

        {view !== "main" ? null : (
          <>
            <JourneyModeSelector mode={mode} locked={modeLocked} onSelect={selectMode} />

            {mode === "flight" && modeLocked && phase !== "pause" ? (
              <PhaseSwitcher active={phase} onSelect={handlePhaseSelect} />
            ) : null}

            {mode === "flight" && phase === "pause" && modeLocked ? (
              <div
                className="flex items-center gap-2 rounded-2xl border border-[rgba(255,185,84,0.28)] bg-[rgba(255,185,84,0.06)] px-3.5 py-2.5 text-xs text-[#ffd99a]"
                role="status"
                aria-live="polite"
              >
                <Compass className="size-3.5" aria-hidden />
                <span className="font-semibold">Paused</span>
                <span className="text-[#d8d4eb]">· take all the time you need</span>
              </div>
            ) : null}

            <AffirmationCard />

            {mode === "garden" ? (
              <GardenPanel onOpenSupport={onOpenSupport} locked={modeLocked} />
            ) : null}

            {mode === "flight" && activeFlightPhase === "preflight" ? (
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

            {mode === "flight" && activeFlightPhase === "airborne" ? (
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

            {mode === "flight" && activeFlightPhase === "checkpoint" ? (
              <CheckpointPanel
                checkpointLabel={activeCheckpoint?.label ?? "A soft check-in"}
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

            {mode === "flight" && activeFlightPhase === "pause" ? (
              <PausePanel
                onClose={() => {
                  setPhase("airborne");
                  markHintSeen("pause");
                }}
                onOpenSupport={onOpenSupport}
              />
            ) : null}

            {mode === "flight" && activeFlightPhase === "final" ? (
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

            {mode === "flight" && activeFlightPhase === "rest" ? (
              <RestPanel
                onPrepareNext={() => {
                  prepareNextFlight();
                  markHintSeen("rest");
                }}
              />
            ) : null}
          </>
        )}

        {view === "hangar" ? <HangarPanel mode={mode} /> : null}

        {view === "achievements" ? (
          <AchievementsPanel showHint={flightsCompleted + gardenDaysCompleted === 0} />
        ) : null}
      </div>

      <RewardToast />
      <IntroOverlay open={!hasSeenIntro} onChoose={handleIntroChoice} />
    </div>
  );
}
