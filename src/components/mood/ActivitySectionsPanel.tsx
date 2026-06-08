import React, { useMemo, useState } from "react";
import { ActivitySectionId, ActivitySelections } from "../../types";
import { MoodTagChip } from "./MoodTagChip";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

const SECTION_CONFIG: {
  id: ActivitySectionId;
  label: string;
  options: string[];
  accent: string;
}[] = [
  {
    id: "work",
    label: "Work",
    options: ["deep focus", "meetings", "planning", "email", "creative"],
    accent: "#bcc2ff",
  },
  {
    id: "health",
    label: "Health",
    options: ["hydrated", "meditation", "checkup", "stretching", "therapy"],
    accent: "#6dba84",
  },
  {
    id: "sleep",
    label: "Sleep",
    options: ["7-9 hours", "nap", "restless", "early bedtime", "late night"],
    accent: "#8c9bff",
  },
  {
    id: "food",
    label: "Food",
    options: ["home cooked", "balanced", "snack", "hydration", "treat"],
    accent: "#ffb954",
  },
  {
    id: "hobbies",
    label: "Hobbies",
    options: ["music", "reading", "art", "gaming", "outdoor"],
    accent: "#d4bbff",
  },
  {
    id: "weather",
    label: "Weather",
    options: ["sunny", "rainy", "windy", "cloudy", "cool"],
    accent: "#8bd3ff",
  },
  {
    id: "sports",
    label: "Sports",
    options: ["gym", "yoga", "running", "team sport", "recovery"],
    accent: "#ff8c9a",
  },
];

interface ActivitySectionsPanelProps {
  selections: ActivitySelections;
  onToggle: (section: ActivitySectionId, label: string) => void;
  onAddCustom: (section: ActivitySectionId, label: string) => void;
  collapsed?: boolean;
}

export const ActivitySectionsPanel: React.FC<ActivitySectionsPanelProps> = ({
  selections,
  onToggle,
  onAddCustom,
  collapsed = false,
}) => {
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const availableOptions = useMemo(() => {
    const map: Record<ActivitySectionId, string[]> = {
      work: [],
      health: [],
      sleep: [],
      food: [],
      hobbies: [],
      weather: [],
      sports: [],
    };
    SECTION_CONFIG.forEach((section) => {
      const selected = selections[section.id] ?? [];
      const combined = Array.from(new Set([...section.options, ...selected]));
      map[section.id] = combined;
    });
    return map;
  }, [selections]);

  const selectedBySection = useMemo(
    () =>
      SECTION_CONFIG.map((section) => ({
        ...section,
        items: selections[section.id] ?? [],
      })).filter((s) => s.items.length > 0),
    [selections],
  );

  if (collapsed) {
    if (selectedBySection.length === 0) {
      return (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            background: "rgba(188,194,255,0.04)",
            color: "rgba(220,224,255,0.7)",
            fontSize: 12,
            lineHeight: 1.55,
          }}
        >
          Nothing logged yet. Open this card to add what filled your day.
        </div>
      );
    }
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {selectedBySection.map((section) => (
          <div
            key={section.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.6px",
                textTransform: "uppercase",
                color: section.accent,
                opacity: 0.8,
                minWidth: 56,
              }}
            >
              {section.label}
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {section.items.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => onToggle(section.id, item)}
                  aria-label={`Remove ${item}`}
                  className="tag-chip"
                  style={{
                    fontSize: 11,
                    padding: "3px 9px",
                    borderRadius: 999,
                    border: "none",
                    cursor: "pointer",
                    background: `${section.accent}1f`,
                    color: "rgba(220,224,255,0.85)",
                    fontFamily: "Plus Jakarta Sans, sans-serif",
                    fontWeight: 500,
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {SECTION_CONFIG.map((section) => {
        const selected = selections[section.id] ?? [];
        const options = availableOptions[section.id];
        const draftKey = section.id;
        return (
          <div
            key={section.id}
            style={{
              padding: "14px 16px",
              borderRadius: 16,
              background: "rgba(188,194,255,0.04)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontSize: 12,
                  letterSpacing: "0.6px",
                  textTransform: "uppercase",
                  color: "rgba(188,194,255,0.5)",
                }}
              >
                {section.label}
              </span>
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: 999,
                  fontSize: 10,
                  color: section.accent,
                  background: `${section.accent}22`,
                }}
              >
                {selected.length} selected
              </span>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {options.map((option) => (
                <MoodTagChip
                  key={option}
                  label={option}
                  selected={selected.includes(option)}
                  accentColor={section.accent}
                  size="compact"
                  onToggle={() => onToggle(section.id, option)}
                />
              ))}
            </div>

            <div className="activity-add-row" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 160px", minWidth: 0 }}>
                <Input
                  placeholder={`Add custom ${section.label.toLowerCase()} activity`}
                  value={drafts[draftKey] ?? ""}
                  onChange={(event) =>
                    setDrafts((prev) => ({ ...prev, [draftKey]: event.target.value }))
                  }
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const value = (drafts[draftKey] ?? "").trim();
                  if (!value) return;
                  onAddCustom(section.id, value);
                  setDrafts((prev) => ({ ...prev, [draftKey]: "" }));
                }}
              >
                Add
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
