import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface SavedAffirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moodColor: string;
  personalization: string | null;
  checkInsToday: number;
  savedAt: number | null;
}

const TIME_FORMATTER = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

function formatSavedAt(ts: number | null): string {
  if (!ts) return "just now";
  const now = Date.now();
  const diffMs = now - ts;
  if (diffMs < 30_000) return "just now";
  if (diffMs < 60_000) return "a minute ago";
  if (diffMs < 5 * 60_000) return `${Math.round(diffMs / 60_000)} minutes ago`;
  return `at ${TIME_FORMATTER.format(ts)}`;
}

export function SavedAffirmationDialog({
  open,
  onOpenChange,
  moodColor,
  personalization,
  checkInsToday,
  savedAt,
}: SavedAffirmationDialogProps) {
  const [hydrated, setHydrated] = useState<number | null>(null);

  useEffect(() => {
    if (open) setHydrated(Date.now());
  }, [open]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        aria-describedby="saved-affirmation-description"
        style={{
          borderColor: `${moodColor}33`,
          boxShadow: `0 32px 80px -32px ${moodColor}55`,
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "1.75rem",
            background: `radial-gradient(120% 80% at 50% 0%, ${moodColor}1A, transparent 70%)`,
            pointerEvents: "none",
          }}
        />
        <AlertDialogHeader className="relative">
          <div
            aria-hidden
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: moodColor,
              boxShadow: `0 0 28px ${moodColor}88`,
              marginBottom: 4,
            }}
          />
          <AlertDialogTitle>
            Saved with care. <span style={{ color: moodColor }}>Thank you</span>{" "}
            for being here.
          </AlertDialogTitle>
          <AlertDialogDescription id="saved-affirmation-description">
            {personalization ??
              "Your check-in was kept. Take a breath — that small moment matters."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div
          className="relative flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
        >
          <div className="flex items-center justify-between">
            <span
              style={{
                fontSize: 11,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(188,194,255,0.45)",
              }}
            >
              When
            </span>
            <span
              style={{
                fontSize: 12,
                color: "rgba(238,241,246,0.85)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatSavedAt(savedAt ?? hydrated)}
            </span>
          </div>
          {checkInsToday > 1 ? (
            <div className="flex items-center justify-between">
              <span
                style={{
                  fontSize: 11,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(188,194,255,0.45)",
                }}
              >
                Today
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: "rgba(238,241,246,0.85)",
                }}
              >
                {checkInsToday} check-ins
              </span>
            </div>
          ) : null}
        </div>
        <AlertDialogAction autoFocus>Carry on</AlertDialogAction>
      </AlertDialogContent>
    </AlertDialog>
  );
}
