import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import styles from "../style/Airport.styles";
import Achievements from "./Achievements";
import Hangar, { EmergencyContact, HangarPlane, HangarTheme } from "./Hangar";
import {
  ChecklistChip,
  Pill,
  ProgressBar,
  SectionTitle,
} from "./Airport.components";
import {
  FlightCheckpoint,
  formatDuration,
  getFlightStatus,
  normalizeCheckpointTime,
} from "./flightSchedule";

type Phase = "preFlight" | "airborne" | "checkpoints" | "emergencyLanding" | "landingFinal" | "restNow";
type IncomingPhase = Phase | "preflight";
type HeaderMenu = "cockpit" | "hangar" | "achievements";
type ChecklistKey = "water" | "breath";
type ChecklistState = Record<ChecklistKey, boolean>;
type Period = "AM" | "PM";
type AffirmationStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

type AirportPageProps = {
  checkpoints: FlightCheckpoint[];
  incomingPhase?: IncomingPhase;
  incomingOpenEmergency?: boolean;
  onAddCheckpoint: (checkpoint: FlightCheckpoint) => void;
  onRemoveCheckpoint: (checkpointId: string) => void;
  onTakeoff?: () => void;
};

const moods = ["😄", "😊", "😐", "😔", "😤", "😰", "😴"];
const locationOptions = ["Home", "Cebu", "Manila", "Davao", "Iloilo", "Baguio", "Boracay"];
const baseUnlockedLocations = ["Home", "Cebu", "Manila"];
const initialChecks: ChecklistState = { water: false, breath: false };
const fallbackAffirmation = "You are cleared for calm skies today.";
const affirmationStorageKey = "mabuhai-daily-affirmation";
const affirmationApiUrl = "https://www.affirmations.dev/";
const headerMenuItems: { key: HeaderMenu; label: string }[] = [
  { key: "hangar", label: "Hangar" },
  { key: "cockpit", label: "Cockpit" },
  { key: "achievements", label: "Achievements" },
];

const phaseMeta: Record<Phase, { label: string; icon: string }> = {
  preFlight: { label: "PRE-FLIGHT", icon: "🛫" },
  airborne: { label: "AIRBORNE", icon: "✈️" },
  checkpoints: { label: "CHECKPOINTS", icon: "🛬" },
  emergencyLanding: { label: "EMERGENCY LANDING", icon: "🆘" },
  landingFinal: { label: "LANDING FINAL", icon: "🏁" },
  restNow: { label: "REST NOW", icon: "🌙" },
};

const toPhase = (phase?: IncomingPhase): Phase | undefined => {
  if (!phase) {
    return undefined;
  }

  return phase === "preflight" ? "preFlight" : phase;
};

const getTodayKey = () => new Date().toISOString().slice(0, 10);

const timeMatchesStartOfDay = (
  date: Date,
  hourValue: string,
  minuteValue: string,
  period: Period,
) => {
  const normalized = normalizeCheckpointTime(`${hourValue}:${minuteValue} ${period}`);

  if (!normalized) {
    return false;
  }

  const [time, normalizedPeriod] = normalized.split(" ");
  const [hourText, minuteText] = time.split(":");
  let hour = Number(hourText);
  const minute = Number(minuteText);

  if (normalizedPeriod === "PM" && hour !== 12) hour += 12;
  if (normalizedPeriod === "AM" && hour === 12) hour = 0;

  return date.getHours() === hour && date.getMinutes() === minute;
};

const getAffirmationStorage = () => {
  const runtimeGlobal = globalThis as typeof globalThis & {
    localStorage?: AffirmationStorage;
  };

  return runtimeGlobal.localStorage ?? null;
};

const requestAffirmation = async (url: string) => {
  const response = await fetch(url);
  const data = await response.json() as { affirmation?: string; quote?: string; content?: string };

  return data.affirmation || data.quote || data.content || fallbackAffirmation;
};

export default function AirportPage({
  checkpoints,
  incomingPhase,
  incomingOpenEmergency,
  onAddCheckpoint,
  onRemoveCheckpoint,
  onTakeoff,
}: AirportPageProps) {
  const [phase, setPhase] = useState<Phase>("preFlight");
  const [activeSection, setActiveSection] = useState<HeaderMenu>("cockpit");
  const [menuOpen, setMenuOpen] = useState(false);
  const [streak, setStreak] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [, setLastStreakDate] = useState<string | null>(null);
  const [emergencyUsedInFlight, setEmergencyUsedInFlight] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<HangarTheme>("midnight");
  const [selectedPlane, setSelectedPlane] = useState<HangarPlane>("trainer");
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    {
      id: "default-contact",
      name: "Mom",
      phone: "0909 090 9009",
    },
  ]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastCheckpointStatusId, setLastCheckpointStatusId] = useState<string | null>(null);
  const [flightsDone, setFlightsDone] = useState(0);
  const [dailyAffirmation, setDailyAffirmation] = useState(fallbackAffirmation);
  const [affirmationLoading, setAffirmationLoading] = useState(true);
  const [startFlightNotification, setStartFlightNotification] = useState(false);
  const [lastStartNotificationKey, setLastStartNotificationKey] = useState<string | null>(null);

  const [sleptHour, setSleptHour] = useState("10");
  const [sleptMinute, setSleptMinute] = useState("00");
  const [sleptPeriod, setSleptPeriod] = useState<Period>("PM");
  const [wokeHour, setWokeHour] = useState("06");
  const [wokeMinute, setWokeMinute] = useState("30");
  const [wokePeriod, setWokePeriod] = useState<Period>("AM");

  const [preChecks, setPreChecks] = useState<ChecklistState>(initialChecks);
  const [checkpointChecks, setCheckpointChecks] = useState<ChecklistState>(initialChecks);
  const [emergencyChecks, setEmergencyChecks] = useState<ChecklistState>(initialChecks);
  const [finalChecks, setFinalChecks] = useState<ChecklistState>(initialChecks);
  const [preMood, setPreMood] = useState<string | null>(null);
  const [checkpointMood, setCheckpointMood] = useState<string | null>(null);
  const [finalMood, setFinalMood] = useState<string | null>(null);
  const [preLocation, setPreLocation] = useState("");
  const [checkpointLocation, setCheckpointLocation] = useState("");
  const [deepBreaths, setDeepBreaths] = useState(0);

  const flightStatus = useMemo(
    () => getFlightStatus(checkpoints, currentTime),
    [checkpoints, currentTime],
  );

  const level = Math.floor(totalXp / 50) + 1;
  const xpProgress = totalXp % 50;
  const unlockedLocationCount = Math.min(
    locationOptions.length,
    Math.max(baseUnlockedLocations.length, baseUnlockedLocations.length + streak),
  );
  const unlockedLocations = locationOptions.slice(0, unlockedLocationCount);
  const cockpitLocations = locationOptions.slice(0, Math.max(1, checkpoints.length));
  const themeStyle = selectedTheme === "sunrise"
    ? styles.themeSunrise
    : selectedTheme === "terminal"
      ? styles.themeTerminal
      : null;

  useEffect(() => {
    const intervalId = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const notificationKey = `${getTodayKey()}-${wokeHour}:${wokeMinute}-${wokePeriod}`;

    if (
      timeMatchesStartOfDay(currentTime, wokeHour, wokeMinute, wokePeriod) &&
      lastStartNotificationKey !== notificationKey
    ) {
      setStartFlightNotification(true);
      setLastStartNotificationKey(notificationKey);
    }
  }, [currentTime, lastStartNotificationKey, wokeHour, wokeMinute, wokePeriod]);

  useEffect(() => {
    let mounted = true;
    const today = getTodayKey();

    const loadAffirmation = async () => {
      try {
        const cached = getAffirmationStorage()?.getItem(affirmationStorageKey);
        const parsed = cached ? JSON.parse(cached) as { date?: string; text?: string } : null;

        if (parsed?.date === today && parsed.text) {
          if (mounted) {
            setDailyAffirmation(parsed.text);
            setAffirmationLoading(false);
          }
          return;
        }
      } catch {
        // Ignore storage failures and fetch a fresh affirmation.
      }

      try {
        let text = fallbackAffirmation;

        try {
          text = await requestAffirmation(affirmationApiUrl);
        } catch {
          text = await requestAffirmation(
            `https://api.allorigins.win/raw?url=${encodeURIComponent(affirmationApiUrl)}`,
          );
        }

        if (mounted) {
          setDailyAffirmation(text);
          setAffirmationLoading(false);
        }

        try {
          getAffirmationStorage()?.setItem(
            affirmationStorageKey,
            JSON.stringify({ date: today, text }),
          );
        } catch {
          // The affirmation still works when storage is unavailable.
        }
      } catch {
        if (mounted) {
          setDailyAffirmation(fallbackAffirmation);
          setAffirmationLoading(false);
        }
      }
    };

    loadAffirmation();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const nextPhase = toPhase(incomingPhase);

    if (nextPhase) {
      setActiveSection("cockpit");
      setPhase(nextPhase);
    }
  }, [incomingPhase]);

  useEffect(() => {
    if (incomingOpenEmergency) {
      setActiveSection("cockpit");
      enterEmergencyLanding();
    }
  }, [incomingOpenEmergency]);

  useEffect(() => {
    if (
      phase === "airborne" &&
      flightStatus.currentCheckpoint &&
      flightStatus.currentCheckpoint.id !== lastCheckpointStatusId
    ) {
      setLastCheckpointStatusId(flightStatus.currentCheckpoint.id);
      setPhase(flightStatus.nextCheckpoint ? "checkpoints" : "landingFinal");
    }
  }, [flightStatus.currentCheckpoint, flightStatus.nextCheckpoint, lastCheckpointStatusId, phase]);

  const toggleChecklist = (
    setter: React.Dispatch<React.SetStateAction<ChecklistState>>,
    key: ChecklistKey,
  ) => {
    setter((current) => ({ ...current, [key]: !current[key] }));
  };

  const handleTakeoff = () => {
    const startTime = normalizeCheckpointTime(`${wokeHour}:${wokeMinute} ${wokePeriod}`);

    if (startTime) {
      onAddCheckpoint({
        id: `start-${Date.now()}`,
        label: "Start of day",
        time: startTime,
      });
    }

    setLastCheckpointStatusId(flightStatus.currentCheckpoint?.id ?? null);
    setPhase("airborne");
    setActiveSection("cockpit");
    setTotalXp((current) => current + 3);
    onTakeoff?.();
  };

  const handleCheckpointContinue = () => {
    setTotalXp((current) => current + 0.5);
    setPhase("airborne");
  };

  const enterEmergencyLanding = () => {
    setEmergencyUsedInFlight(true);
    setStreak(0);
    setPhase("emergencyLanding");
  };

  const handleEmergencyLanding = () => {
    enterEmergencyLanding();
  };

  const handleEmergencyCheckpointContinue = () => {
    setLastCheckpointStatusId(flightStatus.currentCheckpoint?.id ?? null);
    setEmergencyChecks(initialChecks);
    setDeepBreaths(0);
    setPhase("airborne");
  };

  const addEmergencyContact = () => {
    setEmergencyContacts((current) => [
      ...current,
      {
        id: `contact-${Date.now()}`,
        name: "",
        phone: "",
      },
    ]);
  };

  const updateEmergencyContact = (contactId: string, contact: EmergencyContact) => {
    setEmergencyContacts((current) =>
      current.map((item) => (item.id === contactId ? contact : item)),
    );
  };

  const removeEmergencyContact = (contactId: string) => {
    setEmergencyContacts((current) => current.filter((contact) => contact.id !== contactId));
  };

  const resetFlight = () => {
    const today = new Date().toISOString().slice(0, 10);

    if (!emergencyUsedInFlight) {
      setTotalXp((current) => current + 5);
      setLastStreakDate((currentDate) => {
        if (currentDate === today) {
          return currentDate;
        }

        setStreak((current) => current + 1);
        return today;
      });
    }

    setPhase("restNow");
    setPreChecks(initialChecks);
    setCheckpointChecks(initialChecks);
    setEmergencyChecks(initialChecks);
    setFinalChecks(initialChecks);
    setPreMood(null);
    setCheckpointMood(null);
    setFinalMood(null);
    setPreLocation("");
    setCheckpointLocation("");
    setDeepBreaths(0);
    setEmergencyUsedInFlight(false);
    setFlightsDone((current) => current + 1);
  };

  const handleMenuPress = (section: HeaderMenu) => {
    setActiveSection(section);
    setMenuOpen(false);
  };

  const renderMoodPicker = (mood: string | null, setMood: (mood: string) => void) => (
    <>
      <Text style={styles.label}>Enter current mood</Text>
      <View style={styles.moodRow}>
        {moods.map((item) => {
          const selected = mood === item;

          return (
            <Pressable
              key={item}
              onPress={() => setMood(item)}
              style={[styles.moodButton, selected && styles.moodButtonActive]}
            >
              <Text style={styles.moodText}>{item}</Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );

  const renderLocationSelect = (
    value: string,
    setValue: (location: string) => void,
    options = unlockedLocations,
  ) => (
    <>
      <Text style={styles.label}>Location</Text>
      <View style={styles.dropdownMenu}>
        {options.map((option) => (
          <Pressable
            key={option}
            onPress={() => setValue(option)}
            style={[styles.dropdownItem, value === option && styles.dropdownItemActive]}
          >
            <Text style={[styles.dropdownItemText, value === option && styles.dropdownItemTextActive]}>
              {option}
            </Text>
          </Pressable>
        ))}
      </View>
    </>
  );

  const renderChecklist = (
    title: string,
    checks: ChecklistState,
    setter: React.Dispatch<React.SetStateAction<ChecklistState>>,
  ) => (
    <>
      <Text style={styles.label}>{title}</Text>
      <ChecklistChip
        emoji="💧"
        label="Drink a Glass of water"
        done={checks.water}
        onPress={() => toggleChecklist(setter, "water")}
      />
      <ChecklistChip
        emoji="🌬️"
        label="Take 5 deep breaths"
        done={checks.breath}
        onPress={() => toggleChecklist(setter, "breath")}
      />
    </>
  );

  const renderTimeInput = (
    label: string,
    hour: string,
    setHour: (value: string) => void,
    minute: string,
    setMinute: (value: string) => void,
    period: Period,
    setPeriod: (value: Period) => void,
  ) => (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          keyboardType="number-pad"
          maxLength={2}
          onChangeText={setHour}
          placeholder="HH"
          placeholderTextColor="#ffb347"
          style={styles.input}
          value={hour}
        />
        <TextInput
          keyboardType="number-pad"
          maxLength={2}
          onChangeText={setMinute}
          placeholder="MM"
          placeholderTextColor="#ffb347"
          style={styles.input}
          value={minute}
        />
        <Pressable
          onPress={() => setPeriod(period === "AM" ? "PM" : "AM")}
          style={styles.periodButton}
        >
          <Text style={styles.periodButtonText}>{period}</Text>
        </Pressable>
      </View>
    </>
  );

  return (
    <SafeAreaView style={[styles.screen, themeStyle]}>
      <StatusBar style="light" />

      <View style={styles.skyGlowTop} />
      <View style={styles.skyGlowBottom} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <View style={styles.brandRow}>
              <View style={styles.brandMenuWrap}>
                <Pressable
                  onPress={() => setMenuOpen((current) => !current)}
                  style={styles.menuButton}
                  accessibilityRole="button"
                  accessibilityLabel="Open menu"
                >
                  <View style={styles.hamburgerLine} />
                  <View style={styles.hamburgerLine} />
                  <View style={styles.hamburgerLine} />
                </Pressable>
                {menuOpen ? (
                  <View style={styles.brandDropdown}>
                    {headerMenuItems.map((item) => (
                      <Pressable
                        key={item.key}
                        onPress={() => handleMenuPress(item.key)}
                        style={[
                          styles.brandDropdownItem,
                          activeSection === item.key && styles.brandDropdownItemActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.brandDropdownText,
                            activeSection === item.key && styles.brandDropdownTextActive,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
              <Text style={styles.brand}>
                Mabuh<Text style={styles.brandAccent}>Ai</Text>
              </Text>
            </View>
            <Text style={styles.subtitle}>safe skies para hindi mamatay`</Text>
          </View>
          <View style={styles.headerRight}>
            <Pill label="streak" value={`${streak} 🔥`} />
            <Pill label="xp" value={`${totalXp}`} />
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>Lv.{level}</Text>
            </View>
          </View>
        </View>

        <SectionTitle icon={phaseMeta[phase].icon} title={phaseMeta[phase].label} />
        <View style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <View>
              <Text style={styles.greeting}>
                {currentTime.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </Text>
              <Text style={styles.sectionLead}>
                {currentTime.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </Text>
            </View>
            <View style={[styles.phaseBadge, styles.phaseAirborne]}>
              <Text style={styles.phaseEmoji}>{phaseMeta[phase].icon}</Text>
              <Text style={styles.phaseBadgeText}>{phaseMeta[phase].label}</Text>
            </View>
          </View>
        </View>

        <ProgressBar progress={Math.round((xpProgress / 50) * 100)} />

        {startFlightNotification ? (
          <View style={styles.sectionCard}>
            <Text style={styles.titleLabel}>Time to start your flight</Text>
            <Text style={styles.bodyText}>Your start of day time is now. Prepare for takeoff.</Text>
            <Pressable style={styles.secondaryButton} onPress={() => setStartFlightNotification(false)}>
              <Text style={styles.secondaryButtonText}>Dismiss</Text>
            </Pressable>
          </View>
        ) : null}

        {activeSection === "hangar" ? (
          <Hangar
            checkpoints={checkpoints}
            emergencyContacts={emergencyContacts}
            selectedPlane={selectedPlane}
            selectedTheme={selectedTheme}
            onAddCheckpoint={onAddCheckpoint}
            onAddEmergencyContact={addEmergencyContact}
            onEmergencyContactChange={updateEmergencyContact}
            onRemoveEmergencyContact={removeEmergencyContact}
            onRemoveCheckpoint={onRemoveCheckpoint}
            onSelectPlane={setSelectedPlane}
            onSelectTheme={setSelectedTheme}
          />
        ) : null}

        {activeSection === "achievements" ? (
          <Achievements
            emergencyUsedInFlight={emergencyUsedInFlight}
            level={level}
            streak={streak}
            totalXp={totalXp}
            unlockedLocations={unlockedLocations}
          />
        ) : null}

        {activeSection === "cockpit" ? (
          <>
            <View style={styles.sectionCard}>
              <Text style={styles.statTitleLabel}>Cockpit Stats</Text>
              <View style={styles.quickStats}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{unlockedLocations.length}</Text>
                  <Text style={styles.statLabel}>locations unlocked</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{flightsDone}</Text>
                  <Text style={styles.statLabel}>flights done</Text>
                </View>
              </View>
            </View>
            <View style={[styles.sectionCard, styles.affirmationCard]}>
              <Text style={styles.affirmationLabel}>Daily affirmation</Text>
              <Text style={styles.affirmationText}>
                {affirmationLoading ? "Loading today's affirmation..." : dailyAffirmation}
              </Text>
            </View>
          </>
        ) : null}

        {activeSection === "cockpit" && phase === "preFlight" ? (
          <View style={styles.sectionCard}>
            <Text style={styles.titleLabel}>Enter sleep log</Text>
            {renderTimeInput(
              "Slept at",
              sleptHour,
              setSleptHour,
              sleptMinute,
              setSleptMinute,
              sleptPeriod,
              setSleptPeriod,
            )}
            {renderTimeInput(
              "Woke at",
              wokeHour,
              setWokeHour,
              wokeMinute,
              setWokeMinute,
              wokePeriod,
              setWokePeriod,
            )}
            {renderChecklist("Boarding to do list", preChecks, setPreChecks)}
            {renderMoodPicker(preMood, setPreMood)}
            {renderLocationSelect(preLocation, setPreLocation, cockpitLocations)}
            <Pressable style={styles.takeoffBtn} onPress={handleTakeoff}>
              <Text style={styles.takeoffText}>Take Off {selectedPlane === "jet" ? "✈️" : selectedPlane === "glider" ? "🪽" : "🛩️"}</Text>
            </Pressable>
          </View>
        ) : null}

        {activeSection === "cockpit" && phase === "airborne" ? (
          <View style={styles.sectionCard}>
            <Text style={styles.titleLabel}>Next checkpoint</Text>
            <View style={styles.timerBox}>
              <Text style={styles.timerText}>{formatDuration(flightStatus.msUntilNext)}</Text>
              <Text style={styles.bodyText}>
                Next:{" "}
                {flightStatus.nextCheckpoint
                  ? `${flightStatus.nextCheckpoint.label} at ${flightStatus.nextCheckpoint.time}`
                  : "All checkpoints complete"}
              </Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${flightStatus.progressPercent}%` }]} />
              </View>
            </View>
            <Pressable style={styles.emergencyButton} onPress={handleEmergencyLanding}>
              <Text style={styles.emergencyButtonText}>Emergency Landing</Text>
            </Pressable>
          </View>
        ) : null}

        {activeSection === "cockpit" && phase === "emergencyLanding" ? (
          <View style={styles.sectionCard}>
            <Text style={styles.titleLabel}>Emergency Landing</Text>
            <Text style={styles.bodyText}>Deep breath counter</Text>
            <Text style={styles.landingFinalEmoji}>{deepBreaths}</Text>
            <Pressable style={styles.primaryButton} onPress={() => setDeepBreaths((count) => count + 1)}>
              <Text style={styles.primaryButtonText}>I took one deep breath</Text>
            </Pressable>
            {renderChecklist("Emergency landing checkpoint", emergencyChecks, setEmergencyChecks)}

            <Text style={styles.label}>Emergency contact</Text>
            {emergencyContacts.length > 0 ? (
              emergencyContacts.map((contact) => (
                <View key={contact.id} style={styles.hotlineRow}>
                  <Text style={styles.hotlineIcon}>📞</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.hotlineName}>{contact.name || "Emergency contact"}</Text>
                    <Text style={styles.hotlineNumber}>{contact.phone || "No phone set"}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.hotlineRow}>
                <Text style={styles.hotlineIcon}>📞</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.hotlineName}>No emergency contacts</Text>
                  <Text style={styles.hotlineNumber}>Add one from the Hangar</Text>
                </View>
              </View>
            )}

            <Pressable
              style={[
                styles.primaryButton,
                (!emergencyChecks.water || !emergencyChecks.breath) && styles.primaryButtonDisabled,
              ]}
              disabled={!emergencyChecks.water || !emergencyChecks.breath}
              onPress={handleEmergencyCheckpointContinue}
            >
              <Text style={styles.primaryButtonText}>Complete Emergency Checkpoint</Text>
            </Pressable>
          </View>
        ) : null}

        {activeSection === "cockpit" && phase === "checkpoints" ? (
          <View style={styles.sectionCard}>
            {renderChecklist("Boarding to do list", checkpointChecks, setCheckpointChecks)}
            {renderMoodPicker(checkpointMood, setCheckpointMood)}
            {renderLocationSelect(checkpointLocation, setCheckpointLocation)}
            <Pressable style={styles.primaryButton} onPress={handleCheckpointContinue}>
              <Text style={styles.primaryButtonText}>Continue Airborne</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={() => setPhase("landingFinal")}>
              <Text style={styles.secondaryButtonText}>Landing Final</Text>
            </Pressable>
          </View>
        ) : null}

        {activeSection === "cockpit" && phase === "landingFinal" ? (
          <View style={styles.sectionCard}>
            {renderChecklist("Disembark to do list", finalChecks, setFinalChecks)}
            {renderMoodPicker(finalMood, setFinalMood)}
            <Pressable style={styles.primaryButton} onPress={resetFlight}>
              <Text style={styles.primaryButtonText}>Finish Flight</Text>
            </Pressable>
          </View>
        ) : null}

        {activeSection === "cockpit" && phase === "restNow" ? (
          <View style={styles.sectionCard}>
            <Text style={styles.titleLabel}>Rest Now</Text>
            <Text style={styles.bodyText}>See you on the next flight.</Text>
            <Pressable style={styles.primaryButton} onPress={() => setPhase("preFlight")}>
              <Text style={styles.primaryButtonText}>Prepare Next Flight</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
