import { Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useDailyAffirmation } from "@/lib/journey/useDailyAffirmation";

type AffirmationCardProps = {
  enabled?: boolean;
};

export function AffirmationCard({ enabled = true }: AffirmationCardProps) {
  const { text, loading } = useDailyAffirmation(enabled);

  return (
    <Card className="relative">
      <CardContent className="relative flex items-start gap-3 p-0">
        <span className="grid size-9 shrink-0 place-items-center rounded-2xl text-tertiary">
          <Quote className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--text-kicker)]">
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
