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
};

export function ViewTabs({ active, onChange }: ViewTabsProps) {
  return (
    <div
      className="flex items-stretch gap-1 rounded-2xl border border-[rgba(188,194,255,0.10)] bg-[rgba(188,194,255,0.03)] p-1"
      role="tablist"
      aria-label="Journey views"
    >
      {VIEW_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            aria-label={tab.label}
            className={cn(
              "relative flex min-w-0 items-center justify-center rounded-xl py-2.5 transition-all duration-300 ease-out",
              "active:scale-[0.97]",
              isActive
                ? "flex-[2.6] gap-1.5 px-2.5"
                : "flex-1 gap-0 px-1",
              isActive
                ? "bg-gradient-to-r from-primary via-secondary to-primary text-primary-foreground shadow-[0_14px_32px_-18px_rgba(188,194,255,0.85)]"
                : "text-[#d8d4eb]",
            )}
          >
            <Icon
              className={cn(
                "size-4 shrink-0 transition-colors",
                isActive ? "text-current" : "text-[#d8d4eb]",
              )}
            />
            <span
              aria-hidden={!isActive}
              className={cn(
                "overflow-hidden whitespace-nowrap text-[11px] font-semibold transition-all duration-300 ease-out",
                isActive
                  ? "max-w-[160px] opacity-100"
                  : "max-w-0 opacity-0",
                isActive ? "text-primary-foreground" : "",
              )}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export type { JourneyView };
