import { Moon, RotateCcw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type RestPanelProps = {
  onPrepareNext: () => void;
};

export function RestPanel({ onPrepareNext }: RestPanelProps) {
  return (
    <Card className="relative">
      <CardHeader className="relative">
        <div className="flex items-center justify-between gap-3">
          <span className="grid size-9 place-items-center rounded-2xl text-foreground">
            <Moon className="size-4" />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-kicker)]">
            Rest
          </span>
        </div>
        <CardTitle className="mt-3 text-2xl">You are cleared for calm skies</CardTitle>
        <CardDescription>
          Tomorrow is a new flight. No pressure to fly again right away.
        </CardDescription>
      </CardHeader>
      <CardContent className="relative">
        <Button variant="secondary" className="w-full" onClick={onPrepareNext}>
          <RotateCcw className="size-4" />
          Prepare next flight
        </Button>
      </CardContent>
    </Card>
  );
}
