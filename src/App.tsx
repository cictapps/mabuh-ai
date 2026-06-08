import { useState, useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ScreenId } from "./types";
import { NAV_ITEMS } from "./data";
import { useMoodStore } from "./hooks/useMoodStore";
import { useOnboarding } from "./hooks/useOnboarding";

import { BottomNav } from "./components/shared/BottomNav";
import { CheckInScreen }    from "./screens/CheckInScreen";
import { ReviewHub } from "./screens/ReviewHub";
import { JourneyScreen } from "./screens/JourneyScreen";
import { SupportHub } from "./screens/SupportHub";
import { SettingsScreen } from "./screens/SettingsScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";

type SupportView = "hub" | "chat";

interface AppProps {
  initialHub?: ScreenId;
  initialSupportView?: SupportView;
  showOnboarding?: boolean;
}

const NAV_STATE_KEY = "mabuh-nav-state";

interface PersistedNavState {
  activeHub: ScreenId;
  supportView: SupportView;
}

function readPersistedNav(
  pathname: string,
  fallback: PersistedNavState,
): PersistedNavState {
  if (typeof window === "undefined") return fallback;
  // Only restore on the main / route. Standalone routes like /chatbot
  // should always honour their initial props.
  if (pathname !== "/") return fallback;
  try {
    const raw = window.sessionStorage.getItem(NAV_STATE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<PersistedNavState>;
    return {
      activeHub: parsed.activeHub ?? fallback.activeHub,
      supportView: parsed.supportView ?? fallback.supportView,
    };
  } catch {
    return fallback;
  }
}

export default function App({
  initialHub = "checkin",
  initialSupportView = "hub",
  showOnboarding = true,
}: AppProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const initialState = readPersistedNav(
    typeof window !== "undefined" ? window.location.pathname : "/",
    { activeHub: initialHub, supportView: initialSupportView },
  );
  const [activeHub, setActiveHub] = useState<ScreenId>(initialState.activeHub);
  const [supportView, setSupportView] = useState<SupportView>(initialState.supportView);
  const mainRef = useRef<HTMLElement | null>(null);
  const { hasCompleted, complete: completeOnboarding, reset: resetOnboarding } = useOnboarding();

  // Persist nav state so the back button from /help or /chatbot returns
  // the user to the same tab they were on before leaving /.
  useEffect(() => {
    if (location.pathname !== "/") return;
    try {
      window.sessionStorage.setItem(
        NAV_STATE_KEY,
        JSON.stringify({ activeHub, supportView } satisfies PersistedNavState),
      );
    } catch {
      // sessionStorage may be unavailable (private mode, quota); fail silently.
    }
  }, [activeHub, supportView, location.pathname]);

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
    reminder,
    loading,
    error,
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
    setReminder,
    exportData,
    clearAllLocalData,
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
      {showOnboarding && !hasCompleted ? (
        <OnboardingScreen onComplete={completeOnboarding} />
      ) : (
        <>
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
                loading={loading}
                error={error}
              />
            </div>
            <div style={{ display: activeHub === "journey" ? "block" : "none" }}>
              <JourneyScreen onOpenSupport={() => navigate("/help")} />
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
            <div
              style={{
                display: activeHub === "settings" ? "block" : "none",
              }}
            >
              <SettingsScreen
                reminder={reminder}
                onSetReminder={setReminder}
                onExportData={exportData}
                onClearAllLocalData={clearAllLocalData}
                onReplayOnboarding={resetOnboarding}
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
        </>
      )}
    </div>
  );
}
