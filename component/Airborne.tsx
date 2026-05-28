import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "../style/Airborne.styles";
import { Pill, ProgressBar, SectionTitle } from "./Airport.components";
import { FlightCheckpoint, formatDuration, getFlightStatus } from "./flightSchedule";

type AirborneProps = {
  checkpoints: FlightCheckpoint[];
  onOpenCheckpoints: () => void;
  onOpenLandingFinal: () => void;
  onOpenEmergency: () => void;
};

const streak = 7;
const xp = 64;

export default function Airborne({
  checkpoints,
  onOpenCheckpoints,
  onOpenLandingFinal,
  onOpenEmergency,
}: AirborneProps) {
  const [now, setNow] = useState(new Date());
  const flightStatus = useMemo(() => getFlightStatus(checkpoints, now), [checkpoints, now]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.skyGlowTop} />
      <View style={styles.skyGlowBottom} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>
              Mabuh<Text style={styles.brandAccent}>Ai</Text>
            </Text>
            <Text style={styles.subtitle}>safe skies para hindi mamatay`</Text>
          </View>
          <View style={styles.headerRight}>
            <Pill label="streak" value={`${streak} 🔥`} />
            <Pill label="pts" value={`${xp}`} />
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>Lv.2</Text>
            </View>
          </View>
        </View>

        <SectionTitle icon="✈️" title="Airborne" />
        <View style={styles.quickStats}>
          <View style={[styles.statCard, styles.statCardAmber]}>
            <Text style={styles.statNumber}>2/6</Text>
            <Text style={styles.statLabel}>badges earned</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>45</Text>
            <Text style={styles.statLabel}>total points</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>2</Text>
            <Text style={styles.statLabel}>activities done</Text>
          </View>
          <View style={[styles.statCard, styles.statCardGreen]}>
            <Text style={styles.statNumber}>2</Text>
            <Text style={styles.statLabel}>tips read</Text>
          </View>
        </View>

        <ProgressBar progress={xp} />

        <View style={styles.container}>
          <View style={styles.banner}>
            <Text style={styles.bannerText}>✈️ Airborne</Text>
          </View>

          <Text style={styles.lead}>You're in flight. Keep cruising toward your next checkpoint.</Text>
          <View style={styles.flightPanel}>
            <Text style={styles.panelLabel}>Current fly</Text>
            <Text style={styles.currentCheckpoint}>
              {flightStatus.currentCheckpoint
                ? `${flightStatus.currentCheckpoint.label} · ${flightStatus.currentCheckpoint.time}`
                : "Waiting for first checkpoint"}
            </Text>
            <Text style={styles.nextCheckpoint}>
              Next: {flightStatus.nextCheckpoint ? `${flightStatus.nextCheckpoint.label} · ${flightStatus.nextCheckpoint.time}` : "All checkpoints complete"}
            </Text>
            <Text style={styles.timerText}>{formatDuration(flightStatus.msUntilNext)}</Text>
            <View style={styles.flightTrack}>
              <View style={[styles.flightProgress, { width: `${flightStatus.progressPercent}%` }]} />
            </View>
          </View>

          <View style={styles.controls}>
            <Pressable style={styles.button} onPress={onOpenCheckpoints}>
              <Text style={styles.buttonText}>Checkpoints</Text>
            </Pressable>

            <Pressable style={[styles.button, styles.buttonAlt]} onPress={onOpenLandingFinal}>
              <Text style={styles.buttonText}>Landing Final</Text>
            </Pressable>

            <Pressable style={[styles.button, styles.emergencyBtn]} onPress={onOpenEmergency}>
              <Text style={styles.buttonText}>Emergency</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
