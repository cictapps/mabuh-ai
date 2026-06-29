import { useEffect, useMemo, useState } from "react";
import { Heart, Plane, MapPin, Moon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "./ProgressBar";
import { ContextualHint } from "./ContextualHint";
import { AirborneFlightScene } from "./AirborneFlightScene";
import { useJourneyStore } from "@/lib/journey/useJourneyStore";
import { formatDuration, getJourneyStatus } from "@/lib/journey/schedule";

type AirbornePanelProps = {
  onOpenCheckpoint: () => void;
  onEnterFinal: () => void;
  onEnterPause: () => void;
  showHint: boolean;
};

function timeOfDayGreeting(hour: number): string {
  if (hour < 5) return "A late night";
  if (hour < 12) return "A fresh morning";
  if (hour < 17) return "Midday";
  if (hour < 21) return "Evening";
  return "Late night";
}

export function AirbornePanel({
  onOpenCheckpoint,
  onEnterFinal,
  onEnterPause,
  showHint,
}: AirbornePanelProps) {
  const checkpoints = useJourneyStore((s) => s.checkpoints);
  const theme = useJourneyStore((s) => s.theme);
  const plane = useJourneyStore((s) => s.plane);
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const status = useMemo(() => getJourneyStatus(checkpoints, now), [checkpoints, now]);

  const hasCheckpoints = checkpoints.length > 0;
  const greeting = timeOfDayGreeting(now.getHours());
  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const timeLabel = now.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <span className="grid size-9 place-items-center rounded-2xl border border-[rgba(188,194,255,0.10)] bg-[rgba(188,194,255,0.04)] text-foreground">
            <Plane className="size-4" />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d8d4eb]">
            Airborne
          </span>
        </div>
        <CardTitle className="mt-3 text-2xl">{greeting}</CardTitle>
        <CardDescription>
          <span className="block">{dateLabel}</span>
          <span className="mt-0.5 block font-mono text-xs">{timeLabel}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {showHint ? (
          <ContextualHint text="This is your between-time view. The countdown tells you when your next waypoint is near — no alarms, just a soft nudge." />
        ) : null}

        <AirborneFlightScene theme={theme} plane={plane} />

        {hasCheckpoints ? (
          <div className="rounded-2xl border border-[rgba(188,194,255,0.10)] bg-[rgba(188,194,255,0.03)] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d8d4eb]">
              {status.currentCheckpoint ? "Where you are" : "Up next"}
            </p>
            <p className="mt-1 font-serif text-lg tracking-[-0.02em] text-foreground">
              {status.currentCheckpoint
                ? `${status.currentCheckpoint.label} · ${status.currentCheckpoint.time}`
                : status.nextCheckpoint
                  ? `${status.nextCheckpoint.label} · ${status.nextCheckpoint.time}`
                  : "All waypoints complete"}
            </p>

            {status.nextCheckpoint ? (
              <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d8d4eb]">
                    Next waypoint in
                  </p>
                  <p className="mt-0.5 font-mono text-xl tracking-tight text-foreground">
                    {formatDuration(status.msUntilNext)}
                  </p>
                </div>
                <p className="pb-1 font-mono text-[11px] text-[#d8d4eb]">
                  {status.progressPercent}% of stretch
                </p>
              </div>
            ) : null}

            <div className="mt-3">
              <ProgressBar progress={status.progressPercent} hideLabel />
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[rgba(188,194,255,0.10)] bg-[rgba(188,194,255,0.02)] p-4">
            <p className="text-sm text-foreground">No waypoints yet.</p>
            <p className="mt-1 text-xs leading-relaxed text-[#d8d4eb]">
              Add a few gentle moments in the Hangar — a morning pause, an evening
              reflection, anything that helps.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full"
            onClick={onOpenCheckpoint}
            disabled={!hasCheckpoints}
          >
            <MapPin className="size-4" />
            Pause for a checkpoint
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="ghost"
              onClick={onEnterFinal}
              className="text-[#d8d4eb] hover:text-foreground"
            >
              <Moon className="size-4" />
              Wind down
            </Button>
            <Button
              variant="ghost"
              onClick={onEnterPause}
              className="text-[#ffd99a] hover:bg-[rgba(255,185,84,0.08)] hover:text-[#ffd99a]"
            >
              <Heart className="size-4" />
              Need a pause
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
