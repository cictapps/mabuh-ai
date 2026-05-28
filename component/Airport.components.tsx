import { Pressable, Text, View } from "react-native";
import styles from "../style/Airport.styles";

export function ChecklistChip({
  emoji,
  label,
  done,
  onPress,
}: {
  emoji: string;
  label: string;
  done: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.checkItem,
        done && styles.checkItemDone,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.checkBox, done && styles.checkBoxDone]}>
        {done ? <Text style={styles.checkTick}>✓</Text> : null}
      </View>
      <Text style={styles.checkText}>{label}</Text>
      <Text style={styles.checkEmoji}>{emoji}</Text>
    </Pressable>
  );
}

export function Pill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillValue}>{value}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

export function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitleIcon}>{icon}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

export function ProgressBar({ progress }: { progress: number }) {
  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.progressLabel}>{progress}% flight complete</Text>
    </View>
  );
}
