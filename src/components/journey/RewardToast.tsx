import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useJourneyStore } from "@/lib/journey/useJourneyStore";
import { REWARDS } from "@/lib/journey/xp";

export function RewardToast() {
  const lastRewardNotification = useJourneyStore((s) => s.lastRewardNotification);
  const clearRewardNotification = useJourneyStore((s) => s.clearRewardNotification);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (lastRewardNotification.length > 0) {
      setDismissed(false);
      const timer = setTimeout(() => {
        setDismissed(true);
        setTimeout(clearRewardNotification, 300);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [lastRewardNotification, clearRewardNotification]);

  if (lastRewardNotification.length === 0 || dismissed) return null;

  const rewards = REWARDS.filter((r) => lastRewardNotification.includes(r.id));

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-24 left-1/2 z-50 w-[calc(100%-32px)] max-w-[398px] -translate-x-1/2 transition-all duration-300"
      style={{
        animation: dismissed ? "fadeOut 0.3s ease-out forwards" : "slideUp 0.4s ease-out",
      }}
    >
      <div className="relative rounded-2xl p-4">
        <div className="relative flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[rgba(255,185,84,0.15)] text-tertiary">
            <img
              src="/app-logo-light.svg"
              alt=""
              aria-hidden="true"
              className="size-6 object-contain"
            />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground">
              {rewards.length > 1 ? "Rewards unlocked!" : "Reward unlocked!"}
            </p>
            <ul className="mt-1 space-y-0.5">
              {rewards.map((r) => (
                <li key={r.id} className="text-xs text-[color:var(--text-kicker)]">
                  {r.label}
                  <span className="ml-1.5 text-[10px] text-tertiary">New!</span>
                </li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            onClick={() => {
              setDismissed(true);
              setTimeout(clearRewardNotification, 300);
            }}
            aria-label="Dismiss"
            className="shrink-0 rounded-full p-1 text-[color:var(--text-kicker)] transition-colors hover:bg-[var(--surface-violet-medium)] hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
