import { Award, Settings2, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type JourneyView = "main" | "hangar" | "achievements";

const VIEW_TABS: { key: JourneyView; label: string; icon: typeof Sun }[] = [
  { key: "main", label: "Today", icon: Sun },
  { key: "hangar", label: "Hangar", icon: Settings2 },
  { key: "achievements", label: "Wins", icon: Award },
];

type ViewTabsProps = {
  active: JourneyView;
  onChange: (view: JourneyView) => void;
  workshopLabel?: string;
};

export function ViewTabs({ active, onChange, workshopLabel = "Hangar" }: ViewTabsProps) {
  return (
    <div
      className="flex items-stretch gap-1 rounded-2xl border border-[var(--border-violet-soft)] bg-[var(--surface-violet-low)] p-1"
      role="tablist"
      aria-label="Journey views"
    >
      {VIEW_TABS.map((tab) => {
        const label = tab.key === "hangar" ? workshopLabel : tab.label;
        const Icon = tab.icon;
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            aria-label={label}
            className={cn(
              "relative flex min-w-0 items-center justify-center rounded-xl py-2.5 transition-all duration-300 ease-out",
              "active:scale-[0.97]",
              isActive ? "flex-[2.6] gap-1.5 px-2.5" : "flex-1 gap-0 px-1",
              isActive
                ? "bg-gradient-to-r from-primary via-secondary to-primary text-primary-foreground shadow-[0_14px_32px_-18px_var(--surface-violet-icon-hover)]"
                : "text-[color:var(--text-kicker)]",
            )}
          >
            <Icon
              className={cn(
                "size-4 shrink-0 transition-colors",
                isActive ? "text-current" : "text-[color:var(--text-kicker)]",
              )}
            />
            <span
              aria-hidden={!isActive}
              className={cn(
                "overflow-hidden whitespace-nowrap text-[11px] font-semibold transition-all duration-300 ease-out",
                isActive ? "max-w-[160px] opacity-100" : "max-w-0 opacity-0",
                isActive ? "text-primary-foreground" : "",
              )}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export type { JourneyView };
