import React, { useEffect, useMemo, useState } from "react";
import styles from "../style/flightCheck.style";

type Period = "AM" | "PM";
type Phase =
  | "preFlight"
  | "airborne"
  | "checkpoints"
  | "emergencyLanding"
  | "emergencyCheckpoint"
  | "landingFinal"
  | "restNow";
type ChecklistKey = "water" | "breath";

type SleepTime = {
  hour: number;
  minute: number;
  period: Period;
};

type ChecklistState = Record<ChecklistKey, boolean>;
type LocationChecklistState = Record<string, boolean>;

const checklistItems: { key: ChecklistKey; label: string; emoji: string }[] = [
  { key: "water", label: "Drink a glass of water", emoji: "💧" },
  { key: "breath", label: "Take 5 deep breaths", emoji: "🌬️" },
];

const moods = ["😁", "😊", "😐", "😔", "😤", "😰", "😴"];

const locations = [
  "Home",
  "School",
  "Work",
  "Commute",
  "Airport lounge",
  "Friend's place",
  "Other",
];

const phaseLabels: Record<Phase, string> = {
  preFlight: "Pre Flight",
  airborne: "Airborne",
  checkpoints: "Checkpoints",
  emergencyLanding: "Emergency Landing",
  emergencyCheckpoint: "Emergency Checkpoint",
  landingFinal: "Landing Final",
  restNow: "Rest Now",
};

const initialChecks: ChecklistState = {
  water: false,
  breath: false,
};

const pad = (value: number) => String(value).padStart(2, "0");

const formatSleepTime = (time: SleepTime) => `${pad(time.hour)}:${pad(time.minute)} ${time.period}`;

const sleepTimeMatchesDate = (time: SleepTime, date: Date) => {
  let hour = time.hour;

  if (time.period === "PM" && hour !== 12) hour += 12;
  if (time.period === "AM" && hour === 12) hour = 0;

  return date.getHours() === hour && date.getMinutes() === time.minute;
};

const getNextCheckpoint = () => {
  const now = new Date();
  const next = new Date(now);
  next.setMinutes(now.getMinutes() + 30);
  next.setSeconds(0);
  next.setMilliseconds(0);
  return next;
};

function TimeScroller({
  label,
  value,
  onChange,
}: {
  label: string;
  value: SleepTime;
  onChange: (next: SleepTime) => void;
}) {
  return (
    <div className="flight-field">
      <label>{label}</label>
      <div className="time-scroller">
        <input
          type="number"
          min="1"
          max="12"
          value={value.hour}
          onChange={(event) =>
            onChange({ ...value, hour: Math.min(12, Math.max(1, Number(event.target.value) || 1)) })
          }
          aria-label={`${label} hour`}
        />
        <span>:</span>
        <input
          type="number"
          min="0"
          max="59"
          value={pad(value.minute)}
          onChange={(event) =>
            onChange({ ...value, minute: Math.min(59, Math.max(0, Number(event.target.value) || 0)) })
          }
          aria-label={`${label} minute`}
        />
        <select
          value={value.period}
          onChange={(event) => onChange({ ...value, period: event.target.value as Period })}
          aria-label={`${label} AM or PM`}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
      <p className="field-hint">{formatSleepTime(value)}</p>
    </div>
  );
}

function Checklist({
  title,
  checks,
  onToggle,
}: {
  title: string;
  checks: ChecklistState;
  onToggle: (key: ChecklistKey) => void;
}) {
  return (
    <section className="section">
      <h2>{title}</h2>
      <div className="checklist">
        {checklistItems.map((item) => (
          <button
            key={item.key}
            className={`check-item ${checks[item.key] ? "checked" : ""}`}
            type="button"
            onClick={() => onToggle(item.key)}
          >
            <span className="box">{checks[item.key] ? "✓" : ""}</span>
            <span>{item.label}</span>
            <span>{item.emoji}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function MoodPicker({
  mood,
  onSelect,
}: {
  mood: string;
  onSelect: (mood: string) => void;
}) {
  return (
    <section className="section">
      <h2>Enter current mood</h2>
      <div className="mood-grid">
        {moods.map((item) => (
          <button
            key={item}
            className={`mood-button ${mood === item ? "selected" : ""}`}
            type="button"
            onClick={() => onSelect(item)}
          >
            {item}
          </button>
        ))}
      </div>
    </section>
  );
}

function LocationSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (location: string) => void;
}) {
  return (
    <section className="section">
      <h2>Location</h2>
      <select className="location-select" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select location</option>
        {locations.map((location) => (
          <option key={location} value={location}>
            {location}
          </option>
        ))}
      </select>
    </section>
  );
}

function PreflightStatusDropdown({
  checkpointCount,
  selectedLocations,
  onSetCheckpointCount,
  onToggleLocation,
}: {
  checkpointCount: number;
  selectedLocations: LocationChecklistState;
  onSetCheckpointCount: (count: number) => void;
  onToggleLocation: (location: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const locationList = useMemo(
    () => Array.from({ length: checkpointCount }, (_, index) => `Location ${index + 1}`),
    [checkpointCount],
  );
  const selectedCount = locationList.filter((location) => selectedLocations[location]).length;

  return (
    <section className="section">
      <h2>Status Preflight</h2>
      <div className="flight-field">
        <label>Checkpoints</label>
        <input
          className="checkpoint-count"
          type="number"
          min="1"
          max="12"
          value={checkpointCount}
          onChange={(event) => onSetCheckpointCount(Math.min(12, Math.max(1, Number(event.target.value) || 1)))}
        />
        <p className="field-hint">
          {checkpointCount} checkpoints = {checkpointCount} locations
        </p>
      </div>
      <button
        className={`dropdown-toggle ${open ? "open" : ""}`}
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        <span>Location checklist</span>
        <strong>{selectedCount}/{checkpointCount}</strong>
      </button>
      {open ? (
        <div className="dropdown-checklist">
          {locationList.map((location) => (
            <button
              key={location}
              className={`check-item ${selectedLocations[location] ? "checked" : ""}`}
              type="button"
              onClick={() => onToggleLocation(location)}
            >
              <span className="box">{selectedLocations[location] ? "✓" : ""}</span>
              <span>{location}</span>
              <span>📍</span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default function FlightCheck() {
  const [phase, setPhase] = useState<Phase>("preFlight");
  const [streak, setStreak] = useState(7);
  const [phoneNow, setPhoneNow] = useState(new Date());
  const [nextCheckpoint, setNextCheckpoint] = useState(getNextCheckpoint);
  const [sleptAt, setSleptAt] = useState<SleepTime>({ hour: 10, minute: 0, period: "PM" });
  const [wokeAt, setWokeAt] = useState<SleepTime>({ hour: 6, minute: 30, period: "AM" });
  const [preChecks, setPreChecks] = useState<ChecklistState>(initialChecks);
  const [checkpointChecks, setCheckpointChecks] = useState<ChecklistState>(initialChecks);
  const [emergencyChecks, setEmergencyChecks] = useState<ChecklistState>(initialChecks);
  const [finalChecks, setFinalChecks] = useState<ChecklistState>(initialChecks);
  const [preMood, setPreMood] = useState("");
  const [checkpointMood, setCheckpointMood] = useState("");
  const [emergencyMood, setEmergencyMood] = useState("");
  const [finalMood, setFinalMood] = useState("");
  const [preLocation, setPreLocation] = useState("");
  const [checkpointLocation, setCheckpointLocation] = useState("");
  const [emergencyLocation, setEmergencyLocation] = useState("");
  const [preflightCheckpointCount, setPreflightCheckpointCount] = useState(3);
  const [preflightLocations, setPreflightLocations] = useState<LocationChecklistState>({});
  const [deepBreaths, setDeepBreaths] = useState(0);
  const [startFlightNotification, setStartFlightNotification] = useState(false);
  const [lastStartNotificationKey, setLastStartNotificationKey] = useState<string | null>(null);

  useEffect(() => {
    const interval = window.setInterval(() => setPhoneNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const countdown = useMemo(() => {
    const remaining = Math.max(0, nextCheckpoint.getTime() - phoneNow.getTime());
    const total = 30 * 60 * 1000;
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    return {
      label: `${pad(minutes)}:${pad(seconds)}`,
      progress: Math.min(100, Math.round(((total - remaining) / total) * 100)),
    };
  }, [nextCheckpoint, phoneNow]);

  useEffect(() => {
    if (phase === "airborne" && phoneNow >= nextCheckpoint) {
      setPhase("checkpoints");
      setNextCheckpoint(getNextCheckpoint());
    }
  }, [nextCheckpoint, phase, phoneNow]);

  useEffect(() => {
    const notificationKey = `${phoneNow.toISOString().slice(0, 10)}-${formatSleepTime(wokeAt)}`;

    if (sleepTimeMatchesDate(wokeAt, phoneNow) && lastStartNotificationKey !== notificationKey) {
      setStartFlightNotification(true);
      setLastStartNotificationKey(notificationKey);
    }
  }, [lastStartNotificationKey, phoneNow, wokeAt]);

  const toggleChecklist = (
    setter: React.Dispatch<React.SetStateAction<ChecklistState>>,
    key: ChecklistKey,
  ) => {
    setter((current) => ({ ...current, [key]: !current[key] }));
  };

  const enterPhase = (nextPhase: Phase) => {
    if (nextPhase === "emergencyLanding") {
      setStreak(0);
    }

    setPhase(nextPhase);
  };

  return (
    <main className="flight-check">
      <style>{styles}</style>

      <header className="topbar">
        <div>
          <p className="eyebrow">MabuhAI flight check</p>
          <h1>{phaseLabels[phase]}</h1>
        </div>
        <div className="phone-clock">
          <span>Streak: {streak}</span>
          <span>{phoneNow.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>
          <strong>{phoneNow.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</strong>
        </div>
      </header>

      <nav className="phase-nav" aria-label="Flight phases">
        {(Object.keys(phaseLabels) as Phase[]).map((item) => (
          <button
            key={item}
            className={phase === item ? "active" : ""}
            type="button"
            onClick={() => enterPhase(item)}
          >
            {phaseLabels[item]}
          </button>
        ))}
      </nav>

      {startFlightNotification ? (
        <div className="panel notice-panel">
          <section className="section">
            <h2>Time to start your flight</h2>
            <p>It is time for you to start your flight.</p>
            <button className="secondary" type="button" onClick={() => setStartFlightNotification(false)}>
              Dismiss
            </button>
          </section>
        </div>
      ) : null}

      {phase === "preFlight" ? (
        <div className="panel">
          <section className="section">
            <h2>Enter sleep log</h2>
            <TimeScroller label="Slept at" value={sleptAt} onChange={setSleptAt} />
            <TimeScroller label="Woke at" value={wokeAt} onChange={setWokeAt} />
          </section>
          <Checklist
            title="Boarding to do list"
            checks={preChecks}
            onToggle={(key) => toggleChecklist(setPreChecks, key)}
          />
          <PreflightStatusDropdown
            checkpointCount={preflightCheckpointCount}
            selectedLocations={preflightLocations}
            onSetCheckpointCount={setPreflightCheckpointCount}
            onToggleLocation={(location) =>
              setPreflightLocations((current) => ({
                ...current,
                [location]: !current[location],
              }))
            }
          />
          <MoodPicker mood={preMood} onSelect={setPreMood} />
          <LocationSelect value={preLocation} onChange={setPreLocation} />
          <button className="primary" type="button" onClick={() => setPhase("airborne")}>
            Take off
          </button>
        </div>
      ) : null}

      {phase === "airborne" ? (
        <div className="panel">
          <section className="section">
            <h2>Next checkpoint</h2>
            <p className="countdown">{countdown.label}</p>
            <div className="progress-track" aria-label="Time before next checkpoint">
              <div className="progress-fill" style={{ width: `${countdown.progress}%` }} />
            </div>
            <p className="field-hint">{countdown.progress}% complete before the next checkpoint</p>
          </section>
          <button className="danger" type="button" onClick={() => enterPhase("emergencyLanding")}>
            Emergency landing
          </button>
        </div>
      ) : null}

      {phase === "checkpoints" ? (
        <div className="panel">
          <Checklist
            title="Boarding to do list"
            checks={checkpointChecks}
            onToggle={(key) => toggleChecklist(setCheckpointChecks, key)}
          />
          <MoodPicker mood={checkpointMood} onSelect={setCheckpointMood} />
          <LocationSelect value={checkpointLocation} onChange={setCheckpointLocation} />
          <button className="primary" type="button" onClick={() => setPhase("airborne")}>
            Continue airborne
          </button>
          <button className="secondary" type="button" onClick={() => setPhase("landingFinal")}>
            Prepare landing final
          </button>
        </div>
      ) : null}

      {phase === "emergencyLanding" ? (
        <div className="panel emergency-panel">
          <section className="section">
            <h2>Deep breath counter</h2>
            <p className="breath-count">{deepBreaths}</p>
            <button className="primary" type="button" onClick={() => setDeepBreaths((count) => count + 1)}>
              I took one deep breath
            </button>
          </section>
          <section className="section contact-card">
            <h2>Emergency contact</h2>
            <p>Mom</p>
            <a href="tel:09090909009">0909 090 9009</a>
          </section>
          <button className="primary" type="button" onClick={() => setPhase("emergencyCheckpoint")}>
            Create emergency checkpoint
          </button>
        </div>
      ) : null}

      {phase === "emergencyCheckpoint" ? (
        <div className="panel emergency-panel">
          <Checklist
            title="Emergency checkpoint status"
            checks={emergencyChecks}
            onToggle={(key) => toggleChecklist(setEmergencyChecks, key)}
          />
          <MoodPicker mood={emergencyMood} onSelect={setEmergencyMood} />
          <LocationSelect value={emergencyLocation} onChange={setEmergencyLocation} />
          <button className="primary" type="button" onClick={() => setPhase("airborne")}>
            Continue airborne
          </button>
        </div>
      ) : null}

      {phase === "landingFinal" ? (
        <div className="panel">
          <Checklist
            title="Disembark to do list"
            checks={finalChecks}
            onToggle={(key) => toggleChecklist(setFinalChecks, key)}
          />
          <MoodPicker mood={finalMood} onSelect={setFinalMood} />
          <button className="primary" type="button" onClick={() => setPhase("restNow")}>
            Finish flight
          </button>
        </div>
      ) : null}

      {phase === "restNow" ? (
        <div className="panel">
          <section className="section">
            <h2>Rest now</h2>
            <p>See you on the next flight.</p>
            <button className="primary" type="button" onClick={() => setPhase("preFlight")}>
              Prepare next flight
            </button>
          </section>
        </div>
      ) : null}
    </main>
  );
}
