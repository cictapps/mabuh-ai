import { useState, useCallback, useEffect, useMemo, useRef, lazy, Suspense } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { ScreenId } from "./types";
import { NAV_ITEMS } from "./data";
import { useMoodStore } from "./hooks/useMoodStore";
import { useOnboarding } from "./hooks/useOnboarding";
import { useAuthActions } from "./lib/auth";
import {
  scheduleReminder,
  cancelReminder,
  type ReminderStatus,
} from "./lib/reminders";
import { useJourneyStore } from "./lib/journey/useJourneyStore";

import { BottomNav } from "./components/shared/BottomNav";
import { CheckInScreen } from "./screens/CheckInScreen";
import { ReviewHub } from "./screens/ReviewHub";
import { SupportHub } from "./screens/SupportHub";
import { SettingsScreen } from "./screens/SettingsScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";

const JourneyScreen = lazy(async () => {
  const mod = await import("./screens/JourneyScreen");
  return { default: mod.JourneyScreen };
});

function InlineFallback() {
  return (
    <div
      className="flex w-full items-center justify-center py-10 text-xs text-muted-foreground"
      aria-live="polite"
    >
      Loading…
    </div>
  );
}

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
    // Settings is a transient screen reached only via the top-right
    // button — it is not a valid bottom-nav tab and must never be
    // restored as the landing hub after sign-in.
    const restoredHub =
      parsed.activeHub && parsed.activeHub !== "settings"
        ? parsed.activeHub
        : fallback.activeHub;
    return {
      activeHub: restoredHub,
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
  const [reminderStatus, setReminderStatus] = useState<ReminderStatus | null>(null);
  const previousHubRef = useRef<ScreenId>(initialState.activeHub);
  const mainRef = useRef<HTMLElement | null>(null);
  const {
    hasCompleted,
    complete: completeOnboarding,
    reset: resetOnboarding,
  } = useOnboarding();

  // Persist nav state so the back button from /help or /chatbot returns
  // the user to the same tab they were on before leaving /.
  useEffect(() => {
    if (location.pathname !== "/") return;
    // Settings is a transient top-bar screen; never persist it as the
    // active hub or the next session would land on settings instead of
    // the bottom-nav home (checkin).
    if (activeHub === "settings") return;
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
    dailySeries,
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
    removeEntry,
    updateEntry,
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

  const wrappedSaveEntry = useCallback(async () => {
    const ok = await saveEntry();
    if (ok) {
      useJourneyStore.getState().awardXp("mood_checkin");
    }
    return ok;
  }, [saveEntry]);

  const wrappedAddManualJournalEntry = useCallback(
    async (content: string) => {
      await addManualJournalEntry(content);
      if (content.trim()) {
        useJourneyStore.getState().awardXp("journal_entry");
        useJourneyStore.getState().incrementJournalCount();
      }
    },
    [addManualJournalEntry],
  );

  const wrappedUpdateEntry = useCallback(
    async (id: string, input: Parameters<typeof updateEntry>[1]) => {
      return updateEntry(id, input);
    },
    [updateEntry],
  );

  const wrappedDeleteEntry = useCallback(
    async (id: string) => {
      return removeEntry(id);
    },
    [removeEntry],
  );

  const { deleteAllData } = useAuthActions();
  const handleDeleteAllData = useCallback(async () => {
    await deleteAllData();
    // The account is preserved; only user-scoped data is gone. Wipe the
    // local cache so the UI stops showing the entries the server just
    // deleted, and reset the journey progression and reminder prefs.
    clearAllLocalData();
    useJourneyStore.getState().resetAll();
  }, [deleteAllData, clearAllLocalData]);

  const todaysCount = useMemo(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return (dailySeries[`${y}-${m}-${d}`] ?? []).length;
  }, [dailySeries, lastSavedAt]);

  const handleNavSelect = useCallback((id: ScreenId) => {
    setActiveHub((prev) => {
      previousHubRef.current = prev;
      return id;
    });
  }, []);

  const handleCloseSettings = useCallback(() => {
    setActiveHub(previousHubRef.current);
  }, []);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [activeHub, supportView]);

  useEffect(() => {
    if (!reminder.enabled) {
      void cancelReminder();
      setReminderStatus(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const status = await scheduleReminder(reminder);
      if (cancelled) return;
      setReminderStatus(status);
    })();
    return () => {
      cancelled = true;
    };
  }, [reminder]);

  return (
    <div
      style={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "transparent",
        maxWidth: 430,
        margin: "0 auto",
        position: "relative",
        overflow: "hidden",
        paddingTop: "env(safe-area-inset-top, 0px)",
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
              display:
                activeHub === "support" && supportView === "chat" ? "flex" : "block",
              flexDirection: "column",
              overflowY:
                activeHub === "support" && supportView === "chat" ? "hidden" : "auto",
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
                todaysCount={todaysCount}
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
                onSave={wrappedSaveEntry}
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
                onAddJournalEntry={wrappedAddManualJournalEntry}
                onUpdateEntry={wrappedUpdateEntry}
                onDeleteEntry={wrappedDeleteEntry}
                loading={loading}
                error={error}
              />
            </div>
            <div style={{ display: activeHub === "journey" ? "block" : "none" }}>
              <Suspense fallback={<InlineFallback />}>
                <JourneyScreen onOpenSupport={() => navigate("/help")} />
              </Suspense>
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
                reminderStatus={reminderStatus}
                onSetReminder={setReminder}
                onExportData={exportData}
                onClearAllLocalData={clearAllLocalData}
                onDeleteAllData={handleDeleteAllData}
                onReplayOnboarding={resetOnboarding}
                onBack={handleCloseSettings}
              />
            </div>
          </main>

          {/* Bottom navigation */}
          {!(activeHub === "support" && supportView === "chat") && (
            <BottomNav items={NAV_ITEMS} active={activeHub} onSelect={handleNavSelect} />
          )}
        </>
      )}
    </div>
  );
}
