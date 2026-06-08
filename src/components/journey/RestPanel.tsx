import { Moon, RotateCcw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type RestPanelProps = {
  onPrepareNext: () => void;
};

export function RestPanel({ onPrepareNext }: RestPanelProps) {
  return (
    <Card className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[radial-gradient(circle_at_center,rgba(188,194,255,0.20),transparent_60%)] blur-2xl"
      />
      <CardHeader className="relative">
        <div className="flex items-center justify-between gap-3">
          <span className="grid size-9 place-items-center rounded-2xl border border-[rgba(188,194,255,0.18)] bg-[rgba(188,194,255,0.06)] text-foreground">
            <Moon className="size-4" />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
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
