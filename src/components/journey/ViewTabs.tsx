import { Award, Settings2, Sun } from "lucide-react";
import { SegmentedTabs, type SegmentedTabsItem } from "@/components/shared/SegmentedTabs";

type JourneyView = "main" | "hangar" | "achievements";

type ViewTabsProps = {
  active: JourneyView;
  onChange: (view: JourneyView) => void;
  workshopLabel?: string;
};

export function ViewTabs({ active, onChange, workshopLabel = "Hangar" }: ViewTabsProps) {
  const items: SegmentedTabsItem<JourneyView>[] = [
    { key: "main", label: "Today", icon: () => <Sun className="size-4" /> },
    {
      key: "hangar",
      label: workshopLabel,
      icon: () => <Settings2 className="size-4" />,
    },
    {
      key: "achievements",
      label: "Wins",
      icon: () => <Award className="size-4" />,
    },
  ];

  return (
    <SegmentedTabs
      items={items}
      activeKey={active}
      onChange={onChange}
      ariaLabel="Journey views"
    />
  );
}

export type { JourneyView };
