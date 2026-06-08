import { Heart, Phone, Wind, X, LifeBuoy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useJourneyStore } from "@/lib/journey/useJourneyStore";

type PausePanelProps = {
  onClose: () => void;
  onOpenSupport: () => void;
};

export function PausePanel({ onClose, onOpenSupport }: PausePanelProps) {
  const deepBreaths = useJourneyStore((s) => s.deepBreaths);
  const addDeepBreath = useJourneyStore((s) => s.addDeepBreath);
  const emergencyContacts = useJourneyStore((s) => s.emergencyContacts);

  const namedContacts = emergencyContacts.filter(
    (contact) => contact.name.trim() && contact.phone.trim(),
  );

  return (
    <Card className="relative overflow-hidden border-[rgba(255,185,84,0.28)]">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,185,84,0.22),transparent_60%)] blur-2xl"
      />

      <CardHeader className="relative">
        <div className="flex items-center justify-between gap-3">
          <span className="grid size-9 place-items-center rounded-2xl border border-[rgba(255,185,84,0.32)] bg-[rgba(255,185,84,0.12)] text-tertiary">
            <Heart className="size-4" />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Pause
          </span>
        </div>
        <CardTitle className="mt-3 text-2xl">Need a moment?</CardTitle>
        <CardDescription>
          Pausing is welcome here. Your streak stays intact — rest is part of the journey.
        </CardDescription>
      </CardHeader>

      <CardContent className="relative space-y-5">
        <div className="rounded-2xl border border-[rgba(255,185,84,0.20)] bg-[rgba(255,185,84,0.06)] p-5 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-tertiary-foreground/80">
            Grounding breath
          </p>
          <div className="relative my-4 grid place-items-center">
            <div
              className="journey-breathe grid size-24 place-items-center rounded-full border border-[rgba(255,185,84,0.30)] bg-[radial-gradient(circle_at_center,rgba(255,185,84,0.30),rgba(255,185,84,0.05))] shadow-[0_24px_60px_-30px_rgba(255,185,84,0.5)]"
              aria-hidden
            >
              <span className="font-mono text-2xl font-semibold text-tertiary-foreground">
                {deepBreaths}
              </span>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Inhale slowly, then let it go. Tap each time you take an intentional breath.
          </p>
          <Button
            variant="secondary"
            className="mt-4 w-full"
            onClick={() => addDeepBreath()}
          >
            <Wind className="size-4" />
            I took a breath
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Reach out
          </p>
          {namedContacts.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[rgba(188,194,255,0.12)] bg-[rgba(188,194,255,0.02)] p-3 text-xs leading-relaxed text-muted-foreground">
              You can save a trusted person's number in the Hangar. They'll show up here for one-tap calling whenever you need them.
            </p>
          ) : (
            namedContacts.map((contact) => (
              <a
                key={contact.id}
                href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                className="flex items-center gap-3 rounded-2xl border border-[rgba(188,194,255,0.12)] bg-[rgba(188,194,255,0.04)] px-3.5 py-3 transition-colors hover:bg-[rgba(188,194,255,0.07)]"
              >
                <span className="grid size-9 place-items-center rounded-2xl border border-[rgba(188,194,255,0.18)] bg-[rgba(188,194,255,0.10)] text-foreground">
                  <Phone className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {contact.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {contact.phone}
                  </span>
                </span>
              </a>
            ))
          )}
        </div>

        <Button
          size="lg"
          className="w-full"
          onClick={onOpenSupport}
        >
          <LifeBuoy className="size-4" />
          Open support resources
        </Button>

        <Button
          variant="ghost"
          className="w-full text-muted-foreground hover:text-foreground"
          onClick={onClose}
        >
          <X className="size-4" />
          I'm okay — back to my day
        </Button>
      </CardContent>
    </Card>
  );
}
