import React, { useMemo, useState } from "react";
import { MoodTagChip } from "./MoodTagChip";
import { SectionLabel } from "../shared/SectionLabel";
import { SocialInteraction } from "../../types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

const RELATIONSHIP_OPTIONS = [
  { value: "friend", label: "Friend" },
  { value: "family", label: "Family" },
  { value: "partner", label: "Partner" },
  { value: "colleague", label: "Colleague" },
  { value: "other", label: "Other" },
] as const;

const INTERACTION_OPTIONS = [
  { value: "in_person", label: "In person" },
  { value: "call", label: "Call" },
  { value: "text", label: "Text" },
  { value: "video", label: "Video" },
  { value: "other", label: "Other" },
] as const;

const FEELING_OPTIONS = [
  "energized",
  "supported",
  "seen",
  "relaxed",
  "content",
  "stressed",
  "drained",
  "overwhelmed",
  "neutral",
  "grateful",
  "anxious",
];

interface SocialTrackingPanelProps {
  interactions: SocialInteraction[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, update: Partial<SocialInteraction>) => void;
  limit?: number;
}

export const SocialTrackingPanel: React.FC<SocialTrackingPanelProps> = ({
  interactions,
  onAdd,
  onRemove,
  onUpdate,
  limit = 6,
}) => {
  const [customFeelings, setCustomFeelings] = useState<Record<string, string>>({});

  const remaining = Math.max(limit - interactions.length, 0);

  const interactionHint = useMemo(() => {
    if (remaining === 0) return "Limit reached (6 people).";
    return `Add up to ${remaining} more ${remaining === 1 ? "person" : "people"} today.`;
  }, [remaining]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              background: "linear-gradient(135deg, rgba(255,185,84,0.25), rgba(188,194,255,0.15))",
              display: "grid",
              placeItems: "center",
              color: "#f5e5b1",
              fontSize: 16,
              boxShadow: "0 10px 24px -16px rgba(255,185,84,0.6)",
            }}
          >
            ✶
          </div>
          <div>
            <SectionLabel>Social tracking</SectionLabel>
            <p style={{ fontSize: 12, color: "rgba(216,220,230,0.5)" }}>
              Who energized your day?
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onAdd}
          disabled={remaining === 0}
        >
          Add person
        </Button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            padding: "4px 10px",
            borderRadius: 999,
            fontSize: 11,
            letterSpacing: "0.4px",
            textTransform: "uppercase",
            color: "rgba(255,185,84,0.8)",
            background: "rgba(255,185,84,0.12)",
          }}
        >
          {interactions.length} / {limit} tracked
        </span>
        <span style={{ fontSize: 12, color: "rgba(216,220,230,0.5)" }}>{interactionHint}</span>
      </div>

      {interactions.length === 0 && (
        <div
          style={{
            padding: "14px 16px",
            borderRadius: 14,
            background: "rgba(188,194,255,0.04)",
            color: "rgba(188,194,255,0.35)",
            fontSize: 13,
          }}
        >
          Track the people you connected with today to see how social energy shapes your mood.
        </div>
      )}

      {interactions.map((interaction, index) => (
        <div
          key={interaction.id}
          className="interaction-card"
          style={{
            borderRadius: 16,
            padding: 16,
            background: "rgba(188,194,255,0.05)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.6px",
                textTransform: "uppercase",
                color: "rgba(188,194,255,0.5)",
              }}
            >
              Person {index + 1}
            </span>
            {interaction.feelings.length > 0 && (
              <span
                style={{
                  padding: "3px 8px",
                  borderRadius: 999,
                  fontSize: 10,
                  color: "rgba(188,194,255,0.6)",
                  background: "rgba(188,194,255,0.08)",
                }}
              >
                {interaction.feelings.length} vibes
              </span>
            )}
            <button
              type="button"
              onClick={() => onRemove(interaction.id)}
              style={{
                marginLeft: "auto",
                border: "none",
                background: "transparent",
                color: "rgba(255,123,123,0.7)",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Remove
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
            <Input
              value={interaction.name}
              onChange={(event) => onUpdate(interaction.id, { name: event.target.value })}
              placeholder="Name"
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <select
                value={interaction.relationship}
                onChange={(event) =>
                  onUpdate(interaction.id, {
                    relationship: event.target.value as SocialInteraction["relationship"],
                  })
                }
                style={selectStyle}
              >
                {RELATIONSHIP_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={interaction.interactionType}
                onChange={(event) =>
                  onUpdate(interaction.id, {
                    interactionType: event.target.value as SocialInteraction["interactionType"],
                  })
                }
                style={selectStyle}
              >
                {INTERACTION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <Input
              type="number"
              min={0}
              placeholder="Duration (minutes)"
              value={interaction.durationMinutes ?? ""}
              onChange={(event) =>
                onUpdate(interaction.id, {
                  durationMinutes: event.target.value ? Number(event.target.value) : undefined,
                })
              }
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={labelStyle}>How did it feel?</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {FEELING_OPTIONS.map((feeling) => (
                <MoodTagChip
                  key={feeling}
                  label={feeling}
                  selected={interaction.feelings.includes(feeling)}
                  accentColor="#ffb954"
                  size="compact"
                  onToggle={() => {
                    const next = interaction.feelings.includes(feeling)
                      ? interaction.feelings.filter((item) => item !== feeling)
                      : [...interaction.feelings, feeling];
                    onUpdate(interaction.id, { feelings: next });
                  }}
                />
              ))}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <Input
                placeholder="Add a custom feeling"
                value={customFeelings[interaction.id] ?? ""}
                onChange={(event) =>
                  setCustomFeelings((prev) => ({
                    ...prev,
                    [interaction.id]: event.target.value,
                  }))
                }
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const trimmed = (customFeelings[interaction.id] ?? "").trim();
                  if (!trimmed) return;
                  if (interaction.feelings.includes(trimmed)) return;
                  onUpdate(interaction.id, {
                    feelings: [...interaction.feelings, trimmed],
                  });
                  setCustomFeelings((prev) => ({ ...prev, [interaction.id]: "" }));
                }}
              >
                Add
              </Button>
            </div>
          </div>

          <textarea
            value={interaction.notes ?? ""}
            onChange={(event) => onUpdate(interaction.id, { notes: event.target.value })}
            placeholder="What did you talk about or do?"
            rows={2}
            style={{
              width: "100%",
              background: "rgba(188,194,255,0.04)",
              border: "none",
              outline: "none",
              borderRadius: 12,
              padding: "12px 14px",
              color: "#e8eaf0",
              fontFamily: "Plus Jakarta Sans, sans-serif",
              fontSize: 13,
              lineHeight: 1.6,
              resize: "none",
            }}
            onFocus={(event) => {
              event.currentTarget.style.background = "rgba(188,194,255,0.07)";
            }}
            onBlur={(event) => {
              event.currentTarget.style.background = "rgba(188,194,255,0.04)";
            }}
          />
        </div>
      ))}
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: "1.1px",
  textTransform: "uppercase",
  color: "rgba(188,194,255,0.3)",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(22, 24, 32, 0.92)",
  border: "none",
  outline: "none",
  borderRadius: 14,
  padding: "12px 14px",
  color: "#e8eaf0",
  fontFamily: "Plus Jakarta Sans, sans-serif",
  fontSize: 13,
  appearance: "none",
  WebkitAppearance: "none",
  MozAppearance: "none",
};
