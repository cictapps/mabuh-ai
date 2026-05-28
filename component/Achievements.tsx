import { Text, View } from "react-native";
import styles from "../style/Airport.styles";
import { ProgressBar, SectionTitle } from "./Airport.components";

type AchievementsProps = {
  emergencyUsedInFlight: boolean;
  level: number;
  streak: number;
  totalXp: number;
  unlockedLocations: string[];
};

const xpRules = [
  { label: "On-time pre-flight encoding", value: "+3 XP" },
  { label: "On-time checkpoint", value: "+0.5 XP" },
  { label: "Final landing without emergency", value: "+5 XP" },
];

export default function Achievements({
  emergencyUsedInFlight,
  level,
  streak,
  totalXp,
  unlockedLocations,
}: AchievementsProps) {
  const xpIntoLevel = totalXp % 50;
  const streakStatus = emergencyUsedInFlight
    ? "Emergency used on this flight"
    : "Current flight keeps the streak alive";

  return (
    <View style={styles.sectionCard}>
      <SectionTitle icon="🏆" title="Achievements" />

      <View style={styles.achievementGrid}>
        <View style={styles.achievementCard}>
          <Text style={styles.statNumber}>{streak}</Text>
          <Text style={styles.statLabel}>day streak</Text>
        </View>
        <View style={styles.achievementCard}>
          <Text style={styles.statNumber}>Lv.{level}</Text>
          <Text style={styles.statLabel}>50 XP each level</Text>
        </View>
      </View>

      <ProgressBar progress={(xpIntoLevel / 50) * 100} />
      <Text style={styles.bodyText}>{totalXp} total XP · {xpIntoLevel}/50 XP to next level</Text>
      <Text style={styles.statusText}>{streakStatus}</Text>

      <Text style={styles.label}>XP rewards</Text>
      {xpRules.map((rule) => (
        <View key={rule.label} style={styles.rewardRuleRow}>
          <Text style={styles.checkText}>{rule.label}</Text>
          <Text style={styles.rewardValue}>{rule.value}</Text>
        </View>
      ))}

      <Text style={styles.label}>Unlocked locations</Text>
      <View style={styles.locationGrid}>
        {unlockedLocations.map((location) => (
          <View key={location} style={styles.locationBadge}>
            <Text style={styles.locationBadgeText}>{location}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
