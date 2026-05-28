import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import styles from "../style/Airport.styles";
import { ChecklistChip, SectionTitle } from "./Airport.components";
import { FlightCheckpoint, formatDuration, getFlightStatus } from "./flightSchedule";

type ChecklistItem = {
  water: boolean;
  breath: boolean;
  mood: boolean;
  journal: boolean;
  sleep: boolean;
};

type CheckpointsProps = {
  checks: ChecklistItem;
  checkpoints: FlightCheckpoint[];
  mood: string | null;
  notes: string;
  moods: string[];
  onFinished: () => void;
  onOpenEmergency: () => void;
  onSetMood: Dispatch<SetStateAction<string | null>>;
  onSetNotes: Dispatch<SetStateAction<string>>;
  onToggleChecklist: (key: keyof ChecklistItem) => void;
  onContinue: () => void;
};

export default function Checkpoints({
  checks,
  checkpoints,
  mood,
  notes,
  moods,
  onFinished,
  onOpenEmergency,
  onSetMood,
  onSetNotes,
  onToggleChecklist,
  onContinue,
}: CheckpointsProps) {
  const [locationOpen, setLocationOpen] = useState(false);
  const [location, setLocation] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const locationOptions = ["Home","Cebu", "Manila", "Davao", "Iloilo", "Baguio", "Boracay"];
  const flightStatus = useMemo(() => getFlightStatus(checkpoints, now), [checkpoints, now]);
  const allCheckpointsFinished =
    checkpoints.length > 0 && !!flightStatus.currentCheckpoint && !flightStatus.nextCheckpoint;

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (allCheckpointsFinished) {
      onFinished();
    }
  }, [allCheckpointsFinished, onFinished]);

  return (
    <View style={styles.sectionCard}>
      <SectionTitle icon="🛬" title="Checkpoints" />
      <View style={styles.timerBox}>
        <Text style={styles.timerText}>
          {formatDuration(flightStatus.msUntilNext)}
        </Text>
        <Text style={styles.bodyText}>
          Current: {flightStatus.currentCheckpoint ? `${flightStatus.currentCheckpoint.label} at ${flightStatus.currentCheckpoint.time}` : "Waiting for first checkpoint"}
        </Text>
        <Text style={styles.bodyText}>
          Next: {flightStatus.nextCheckpoint ? `${flightStatus.nextCheckpoint.label} at ${flightStatus.nextCheckpoint.time}` : "Preparing landing final"}
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${flightStatus.progressPercent}%` }]} />
        </View>
      </View>

      <ChecklistChip
        emoji="💧"
        label="Drink water"
        done={checks.water}
        onPress={() => onToggleChecklist("water")}
      />
      <Text style={styles.label}>Mood check-in</Text>
      <View style={styles.moodRow}>
        {moods.map((item) => {
          const selected = mood === item;
          return (
            <Pressable
              key={item}
              onPress={() => onSetMood(item)}
              style={[styles.moodButton, selected && styles.moodButtonActive]}
            >
              <Text style={styles.moodText}>{item}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.label}>Optional notes</Text>
      <TextInput
        placeholder="How's the flight going? Any turbulence?"
        placeholderTextColor="#ffb347"
        value={notes}
        onChangeText={onSetNotes}
        multiline
        style={[styles.input, styles.textArea]}
      />
      <Text style={styles.label}>Location</Text>
      <Pressable
        onPress={() => {
          setLocationOpen((current) => !current);
        }}
        style={[styles.dropdownButton, locationOpen && styles.dropdownButtonActive]}
      >
        <Text style={styles.dropdownLabel}>Select location</Text>
        <Text style={styles.dropdownValue}>{location || "Choose one"}</Text>
      </Pressable>
      {locationOpen ? (
        <View style={styles.dropdownMenu}>
          {locationOptions.map((option) => (
            <Pressable
              key={option}
              onPress={() => {
                setLocation(option);
                setLocationOpen(false);
              }}
              style={[styles.dropdownItem, location === option && styles.dropdownItemActive]}
            >
              <Text style={[styles.dropdownItemText, location === option && styles.dropdownItemTextActive]}>
                {option}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      
      <Pressable style={styles.primaryButton} onPress={onContinue}>
        <Text style={styles.primaryButtonText}>
          {flightStatus.nextCheckpoint ? "Save checkpoint" : "Preparing landing final"}
        </Text>
      </Pressable>
      <Pressable style={styles.emergencyButton} onPress={onOpenEmergency}>
        <Text style={styles.emergencyButtonText}>Emergency Landing</Text>
      </Pressable>
    </View>
  );
}
