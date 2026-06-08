import { Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useDailyAffirmation } from "@/lib/journey/useDailyAffirmation";

type AffirmationCardProps = {
  enabled?: boolean;
};

export function AffirmationCard({ enabled = true }: AffirmationCardProps) {
  const { text, loading } = useDailyAffirmation(enabled);

  return (
    <Card className="relative overflow-hidden border-[rgba(255,185,84,0.18)] bg-card">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,185,84,0.16),transparent_60%)] blur-2xl"
      />
      <CardContent className="relative flex items-start gap-3 p-5">
        <span className="grid size-9 shrink-0 place-items-center rounded-2xl border border-[rgba(255,185,84,0.30)] bg-[rgba(255,185,84,0.10)] text-tertiary">
          <Quote className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#d8d4eb]">
            A kind thought
          </p>
          <p className="mt-1 font-serif text-base italic leading-snug tracking-[-0.01em] text-foreground">
            {loading ? "Gathering a kind thought for you…" : `“${text}”`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
