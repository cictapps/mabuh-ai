import React from "react";
import { ActivitySelections, ActivitySectionId, MoodType, SocialInteraction } from "../types";
import { getMoodMeta, SUGGESTIONS } from "../data";
import { MoodArc } from "../components/mood/MoodArc";
import { MoodSelector } from "../components/mood/MoodSelector";
import { MoodTagGroup } from "../components/mood/MoodTagGroup";
import { JournalInput } from "../components/mood/JournalInput";
import { SaveMoodButton } from "../components/mood/SaveMoodButton";
import { SocialTrackingPanel } from "../components/mood/SocialTrackingPanel";
import { ActivitySectionsPanel } from "../components/mood/ActivitySectionsPanel";
import { SectionLabel } from "../components/shared/SectionLabel";
import { SuggestionCard } from "../components/suggestions/SuggestionCard";

interface CheckInScreenProps {
  selectedMood: MoodType | null;
  selectedTags: string[];
  journal: string;
  schoolLoad: number;
  activityMinutes: number;
  dayNote: string;
  socialInteractions: SocialInteraction[];
  activitiesBySection: ActivitySelections;
  onSelectMood: (mood: MoodType) => void;
  onToggleTag: (tag: string) => void;
  onJournalChange: (val: string) => void;
  onSchoolLoadChange: (val: number) => void;
  onActivityMinutesChange: (val: number) => void;
  onDayNoteChange: (val: string) => void;
  onAddSocialInteraction: () => void;
  onRemoveSocialInteraction: (id: string) => void;
  onUpdateSocialInteraction: (id: string, update: Partial<SocialInteraction>) => void;
  onToggleActivity: (section: ActivitySectionId, label: string) => void;
  onAddCustomActivity: (section: ActivitySectionId, label: string) => void;
  onSave: () => Promise<boolean>;
}

export const CheckInScreen: React.FC<CheckInScreenProps> = ({
  selectedMood,
  selectedTags,
  journal,
  schoolLoad,
  activityMinutes,
  dayNote,
  socialInteractions,
  activitiesBySection,
  onSelectMood,
  onToggleTag,
  onJournalChange,
  onSchoolLoadChange,
  onActivityMinutesChange,
  onDayNoteChange,
  onAddSocialInteraction,
  onRemoveSocialInteraction,
  onUpdateSocialInteraction,
  onToggleActivity,
  onAddCustomActivity,
  onSave,
}) => {
  const displayMood = selectedMood ?? "okay";
  const meta = getMoodMeta(displayMood);
  const suggestions = (SUGGESTIONS[displayMood] ?? []).slice(0, 3);
  const showDetails = Boolean(selectedMood);

  // Keep these handlers ready for future detail fields.
  void [
    schoolLoad,
    activityMinutes,
    dayNote,
    onSchoolLoadChange,
    onActivityMinutesChange,
    onDayNoteChange,
  ];

  // Edit the greeting text and time buckets here.
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // Edit the date format and locale here.
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
    .format(new Date())
    .toUpperCase();

  return (
    <div
      className="screen-enter"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        padding: "26px 20px 92px",
        position: "relative",
      }}
    >
      {/* Background glow: edit colors or remove for a flatter look. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -120,
          left: -80,
          right: -80,
          height: 220,
          background:
            "radial-gradient(circle at 50% 30%, rgba(255, 204, 102, 0.18), transparent 60%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Header block: edit date + greeting copy here. */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "1.3px",
            textTransform: "uppercase",
            color: "rgba(216,220,230,0.42)",
            marginBottom: 6,
          }}
        >
          {dateLabel}
        </p>
        <h1
          className="font-serif"
          style={{
            fontSize: 28,
            fontWeight: 500,
            lineHeight: 1.2,
            color: "#eef1f6",
            marginBottom: 10,
          }}
        >
          {greeting}
        </h1>
        <p
          className="font-serif"
          style={{
            fontSize: 18,
            color: "#f3d27b",
            letterSpacing: "0.2px",
          }}
        >
          How are you feeling today?
        </p>
      </div>

      {/* Mood arc: edit mood colors or arc sizing in MoodArc. */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <MoodArc selectedMood={selectedMood} onSelect={onSelectMood} />
      </div>

      {/* Selected mood label + definition */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <MoodSelector selectedMood={selectedMood ?? "okay"} />
      </div>

      {showDetails && (
        <>
          {/* Tags: edit label text or chip styling in MoodTagChip. */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <SectionLabel>What resonates?</SectionLabel>
            <MoodTagGroup
              tags={meta.tags}
              selectedTags={selectedTags}
              accentColor={meta.color}
              onToggle={onToggleTag}
            />
          </div>

          {/* Journal: edit label + placeholder here. */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <JournalInput
              value={journal}
              onChange={onJournalChange}
              label="Anything on your mind?"
              placeholder="Write freely... this is your safe space."
              rows={3}
            />
          </div>

          <div style={{ position: "relative", zIndex: 1 }}>
            <ActivitySectionsPanel
              selections={activitiesBySection}
              onToggle={onToggleActivity}
              onAddCustom={onAddCustomActivity}
            />
          </div>
          {/* Save button: edit label text here. */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <SaveMoodButton
              disabled={!selectedMood}
              onSave={onSave}
              label="Update mood"
              savedLabel="✓  Mood updated"
            />
          </div>

          <div style={{ position: "relative", zIndex: 1 }}>
            <SocialTrackingPanel
              interactions={socialInteractions}
              onAdd={onAddSocialInteraction}
              onRemove={onRemoveSocialInteraction}
              onUpdate={onUpdateSocialInteraction}
            />
          </div>

          {/* Suggestions: edit copy or source data in data/index.ts. */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <SectionLabel>Suggestions for you</SectionLabel>
            <p
              style={{
                fontSize: 12,
                color: "rgba(216,220,230,0.5)",
                marginBottom: 10,
              }}
            >
              Based on your {meta.label.toLowerCase()} mood trend
            </p>
            {suggestions.map((suggestion) => (
              <SuggestionCard key={suggestion.id} suggestion={suggestion} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
