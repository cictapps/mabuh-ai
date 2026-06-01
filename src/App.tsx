import { useState, useCallback } from "react";
import { ScreenId } from "./types";
import { NAV_ITEMS } from "./data";
import { useMoodStore } from "./hooks/useMoodStore";

import { BottomNav } from "./components/shared/BottomNav";
import { CheckInScreen }    from "./screens/CheckInScreen";
import { HistoryScreen }    from "./screens/HistoryScreen";
import { AnalyticsScreen }  from "./screens/AnalyticsScreen";
import { InsightsScreen }   from "./screens/InsightsScreen";
import { JournalScreen }    from "./screens/JournalScreen";
import { GISFeature } from "./screens/GISFeature";

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>("checkin");
  const [screenKey, setScreenKey] = useState(0);

  const {
    history,
    selectedMood,
    selectedTags,
    journal,
    schoolLoad,
    activityMinutes,
    dayNote,
    socialInteractions,
    activitiesBySection,
    lastSavedAt,
    selectMood,
    toggleTag,
    setJournal,
    setSchoolLoad,
    setActivityMinutes,
    setDayNote,
    addSocialInteraction,
    updateSocialInteraction,
    removeSocialInteraction,
    toggleActivity,
    addCustomActivity,
    addManualJournalEntry,
    saveEntry,
    dominantMood,
    trendData,
    distribution,
    journalEntries,
    socialStats,
    analyticsStats,
  } = useMoodStore();

  const handleNavSelect = useCallback((id: ScreenId) => {
    setActiveScreen(id);
    setScreenKey((k) => k + 1);
  }, []);

  return (
    <div
      style={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "#121416",
        maxWidth: 430,
        margin: "0 auto",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Scrollable content area */}
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {activeScreen === "checkin" && (
          <CheckInScreen
            key={screenKey}
            selectedMood={selectedMood}
            selectedTags={selectedTags}
            journal={journal}
            schoolLoad={schoolLoad}
            activityMinutes={activityMinutes}
            dayNote={dayNote}
            socialInteractions={socialInteractions}
            activitiesBySection={activitiesBySection}
            onSelectMood={selectMood}
            onToggleTag={toggleTag}
            onJournalChange={setJournal}
            onSchoolLoadChange={setSchoolLoad}
            onActivityMinutesChange={setActivityMinutes}
            onDayNoteChange={setDayNote}
            onAddSocialInteraction={addSocialInteraction}
            onRemoveSocialInteraction={removeSocialInteraction}
            onUpdateSocialInteraction={updateSocialInteraction}
            onToggleActivity={toggleActivity}
            onAddCustomActivity={addCustomActivity}
            onSave={saveEntry}
          />
        )}
        {activeScreen === "history" && (
          <HistoryScreen key={screenKey} history={history} />
        )}
        {activeScreen === "analytics" && (
          <AnalyticsScreen
            key={screenKey}
            history={history}
            trendData={trendData}
            distribution={distribution}
            dominantMood={dominantMood}
            socialStats={socialStats}
            analyticsStats={analyticsStats}
          />
        )}
        {activeScreen === "insights" && (
          <InsightsScreen
            key={screenKey}
            refreshToken={lastSavedAt}
            history={history}
          />
        )}
        {activeScreen === "journal" && (
          <JournalScreen
            key={screenKey}
            entries={journalEntries}
            onAddEntry={addManualJournalEntry}
          />
        )}

        {activeScreen === "gis" && (
  <GISFeature key={screenKey} />
)}
      </main>

      {/* Bottom navigation */}
      <BottomNav
        items={NAV_ITEMS}
        active={activeScreen}
        onSelect={handleNavSelect}
      />
    </div>
  );
}
