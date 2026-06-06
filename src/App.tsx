import { useState, useCallback, useEffect, useRef } from "react";
import { ScreenId } from "./types";
import { NAV_ITEMS } from "./data";
import { useMoodStore } from "./hooks/useMoodStore";

import { BottomNav } from "./components/shared/BottomNav";
import { CheckInScreen }    from "./screens/CheckInScreen";
import { ReviewHub } from "./screens/ReviewHub";
import { SupportHub } from "./screens/SupportHub";

type SupportView = "hub" | "chat";

interface AppProps {
  initialHub?: ScreenId;
  initialSupportView?: SupportView;
}

export default function App({
  initialHub = "checkin",
  initialSupportView = "hub",
}: AppProps) {
  const [activeHub, setActiveHub] = useState<ScreenId>(initialHub);
  const [supportView, setSupportView] = useState<SupportView>(initialSupportView);
  const mainRef = useRef<HTMLElement | null>(null);

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
    setActiveHub(id);
  }, []);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [activeHub, supportView]);

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
        ref={mainRef}
        style={{
          flex: 1,
          minHeight: 0,
          display: activeHub === "support" && supportView === "chat" ? "flex" : "block",
          flexDirection: "column",
          overflowY: activeHub === "support" && supportView === "chat" ? "hidden" : "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div style={{ display: activeHub === "checkin" ? "block" : "none" }}>
          <CheckInScreen
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
        </div>
        <div style={{ display: activeHub === "review" ? "block" : "none" }}>
          <ReviewHub
            history={history}
            trendData={trendData}
            distribution={distribution}
            dominantMood={dominantMood}
            socialStats={socialStats}
            analyticsStats={analyticsStats}
            refreshToken={lastSavedAt}
            journalEntries={journalEntries}
            onAddJournalEntry={addManualJournalEntry}
          />
        </div>
        <div
          style={{
            display: activeHub === "support" ? "flex" : "none",
            flexDirection: "column",
            flex: supportView === "chat" ? 1 : "initial",
            height: supportView === "chat" ? "100%" : "auto",
            minHeight: 0,
          }}
        >
          <SupportHub
            view={supportView}
            onOpenChat={() => setSupportView("chat")}
            onCloseChat={() => setSupportView("hub")}
          />
        </div>
      </main>

      {/* Bottom navigation */}
      {!(activeHub === "support" && supportView === "chat") && (
        <BottomNav
          items={NAV_ITEMS}
          active={activeHub}
          onSelect={handleNavSelect}
        />
      )}
    </div>
  );
}
