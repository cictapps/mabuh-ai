import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import styles from "../style/Airport.styles";
import { SectionTitle } from "./Airport.components";
import {
  FlightCheckpoint,
  normalizeCheckpointTime,
  sortCheckpoints,
} from "./flightSchedule";

export type HangarTheme = "midnight" | "sunrise" | "terminal";
export type HangarPlane = "trainer" | "jet" | "glider";
export type EmergencyContact = {
  id: string;
  name: string;
  phone: string;
};

type HangarProps = {
  checkpoints: FlightCheckpoint[];
  emergencyContacts: EmergencyContact[];
  selectedPlane: HangarPlane;
  selectedTheme: HangarTheme;
  onAddCheckpoint: (checkpoint: FlightCheckpoint) => void;
  onAddEmergencyContact: () => void;
  onEmergencyContactChange: (contactId: string, contact: EmergencyContact) => void;
  onRemoveEmergencyContact: (contactId: string) => void;
  onRemoveCheckpoint: (checkpointId: string) => void;
  onSelectPlane: (plane: HangarPlane) => void;
  onSelectTheme: (theme: HangarTheme) => void;
};

const themeOptions: { key: HangarTheme; label: string; accent: string }[] = [
  { key: "midnight", label: "Midnight", accent: "#ffb347" },
  { key: "sunrise", label: "Sunrise", accent: "#ffd166" },
  { key: "terminal", label: "Terminal", accent: "#7bd88f" },
];

const planeOptions: { key: HangarPlane; label: string; icon: string }[] = [
  { key: "trainer", label: "Trainer", icon: "🛩️" },
  { key: "jet", label: "Jet", icon: "✈️" },
  { key: "glider", label: "Glider", icon: "🪽" },
];

export default function Hangar({
  checkpoints,
  emergencyContacts,
  selectedPlane,
  selectedTheme,
  onAddCheckpoint,
  onAddEmergencyContact,
  onEmergencyContactChange,
  onRemoveEmergencyContact,
  onRemoveCheckpoint,
  onSelectPlane,
  onSelectTheme,
}: HangarProps) {
  const [label, setLabel] = useState("");
  const [time, setTime] = useState("");
  const [error, setError] = useState("");
  const sortedCheckpoints = useMemo(() => sortCheckpoints(checkpoints), [checkpoints]);

  const handleAddCheckpoint = () => {
    const normalizedTime = normalizeCheckpointTime(time);
    const checkpointLabel = label.trim();

    if (!checkpointLabel || !normalizedTime) {
      setError("Add a checkpoint name and time like 02:30 PM.");
      return;
    }

    onAddCheckpoint({
      id: `checkpoint-${Date.now()}`,
      label: checkpointLabel,
      time: normalizedTime,
    });
    setLabel("");
    setTime("");
    setError("");
  };

  return (
    <View style={styles.sectionCard}>
      <SectionTitle icon="🛩️" title="Hangar" />

      <Text style={styles.label}>Theme</Text>
      <View style={styles.optionGrid}>
        {themeOptions.map((theme) => {
          const selected = selectedTheme === theme.key;

          return (
            <Pressable
              key={theme.key}
              onPress={() => onSelectTheme(theme.key)}
              style={[styles.optionCard, selected && styles.optionCardActive]}
            >
              <View style={[styles.colorSwatch, { backgroundColor: theme.accent }]} />
              <Text style={styles.optionTitle}>{theme.label}</Text>
              <Text style={styles.optionHint}>{selected ? "Active theme" : "Tap to apply"}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Plane</Text>
      <View style={styles.optionGrid}>
        {planeOptions.map((plane) => {
          const selected = selectedPlane === plane.key;

          return (
            <Pressable
              key={plane.key}
              onPress={() => onSelectPlane(plane.key)}
              style={[styles.optionCard, selected && styles.optionCardActive]}
            >
              <Text style={styles.optionIcon}>{plane.icon}</Text>
              <Text style={styles.optionTitle}>{plane.label}</Text>
              <Text style={styles.optionHint}>{selected ? "Ready" : "Select plane"}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Emergency contacts</Text>
      {emergencyContacts.map((contact) => (
        <View key={contact.id} style={styles.manageCheckpointRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.inputRow}>
              <TextInput
                onChangeText={(name) => onEmergencyContactChange(contact.id, { ...contact, name })}
                placeholder="Name"
                placeholderTextColor="#ffb347"
                style={styles.input}
                value={contact.name}
              />
              <TextInput
                keyboardType="phone-pad"
                onChangeText={(phone) => onEmergencyContactChange(contact.id, { ...contact, phone })}
                placeholder="Phone"
                placeholderTextColor="#ffb347"
                style={styles.input}
                value={contact.phone}
              />
            </View>
          </View>
          <Pressable
            onPress={() => onRemoveEmergencyContact(contact.id)}
            style={styles.removeButton}
          >
            <Text style={styles.removeButtonText}>Remove</Text>
          </Pressable>
        </View>
      ))}
      <Pressable style={styles.secondaryButton} onPress={onAddEmergencyContact}>
        <Text style={styles.secondaryButtonText}>Add Emergency Contact</Text>
      </Pressable>

      <Text style={styles.label}>Add checkpoint</Text>
      <View style={styles.inputRow}>
        <TextInput
          onChangeText={setLabel}
          placeholder="Label"
          placeholderTextColor="#ffb347"
          style={styles.input}
          value={label}
        />
        <TextInput
          onChangeText={setTime}
          placeholder="HH:MM AM"
          placeholderTextColor="#ffb347"
          style={styles.input}
          value={time}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <Pressable style={styles.primaryButton} onPress={handleAddCheckpoint}>
        <Text style={styles.primaryButtonText}>Add Checkpoint</Text>
      </Pressable>

      <Text style={styles.label}>Flight checkpoints</Text>
      {sortedCheckpoints.map((checkpoint) => (
        <View key={checkpoint.id} style={styles.manageCheckpointRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hotlineName}>{checkpoint.label}</Text>
            <Text style={styles.hotlineNumber}>{checkpoint.time}</Text>
          </View>
          <Pressable
            onPress={() => onRemoveCheckpoint(checkpoint.id)}
            style={styles.removeButton}
          >
            <Text style={styles.removeButtonText}>Remove</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}
