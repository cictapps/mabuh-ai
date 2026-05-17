import { MoodEntry, MoodType, Suggestion } from "../types";

const MOOD_SCORE: Record<MoodType, number> = {
  stressed: 1,
  worried: 2,
  okay: 3,
  calm: 4,
  happy: 5,
};

type TrendKey = "improving" | "declining" | "steady" | "volatile" | "insufficient";

const TREND_SUGGESTIONS: Record<TrendKey, Suggestion[]> = {
  improving: [
    {
      id: "t1",
      icon: "",
      title: "Keep the momentum",
      description: "Name one habit that helped and repeat it tomorrow.",
      mood: "calm",
    },
    {
      id: "t2",
      icon: "",
      title: "Celebrate progress",
      description: "Write a quick note about what changed for the better.",
      mood: "happy",
    },
    {
      id: "t10",
      icon: "",
      title: "Protect your peak",
      description: "Block 15 minutes today to keep the gains going.",
      mood: "happy",
    },
    {
      id: "t11",
      icon: "",
      title: "Share the win",
      description: "Tell someone what went well to reinforce the lift.",
      mood: "calm",
    },
    {
      id: "t12",
      icon: "",
      title: "Stretch the calm",
      description: "End the day with a slow wind-down routine.",
      mood: "calm",
    },
  ],
  declining: [
    {
      id: "t3",
      icon: "",
      title: "Lower the load",
      description: "Pick one task to delay so today feels lighter.",
      mood: "worried",
    },
    {
      id: "t4",
      icon: "",
      title: "Reset your body",
      description: "Try 2 minutes of slow breathing to settle your nervous system.",
      mood: "stressed",
    },
    {
      id: "t13",
      icon: "",
      title: "Simplify the day",
      description: "Choose three priorities and ignore the rest.",
      mood: "worried",
    },
    {
      id: "t14",
      icon: "",
      title: "Create a pause",
      description: "Step away from screens for a short reset.",
      mood: "stressed",
    },
  ],
  steady: [
    {
      id: "t5",
      icon: "",
      title: "Stay consistent",
      description: "Small routines keep steady moods stable and safe.",
      mood: "okay",
    },
    {
      id: "t6",
      icon: "",
      title: "Gentle reflection",
      description: "Notice one thing that is working and keep it close.",
      mood: "calm",
    },
    {
      id: "t15",
      icon: "",
      title: "Add a spark",
      description: "Try a tiny change to see what improves the day.",
      mood: "happy",
    },
    {
      id: "t16",
      icon: "",
      title: "Support your baseline",
      description: "Hydrate, stretch, and keep your energy steady.",
      mood: "okay",
    },
  ],
  volatile: [
    {
      id: "t7",
      icon: "",
      title: "Find an anchor",
      description: "Choose one grounding activity you can repeat daily.",
      mood: "worried",
    },
    {
      id: "t8",
      icon: "",
      title: "Name the swings",
      description: "Track what triggers the highs and lows this week.",
      mood: "okay",
    },
    {
      id: "t17",
      icon: "",
      title: "Create a rhythm",
      description: "Pick a fixed wake or sleep time for stability.",
      mood: "calm",
    },
    {
      id: "t18",
      icon: "",
      title: "Check your inputs",
      description: "Notice how caffeine, news, or social media shift mood.",
      mood: "worried",
    },
  ],
  insufficient: [
    {
      id: "t9",
      icon: "",
      title: "Collect more check-ins",
      description: "Log a few more days to uncover your mood pattern.",
      mood: "okay",
    },
    {
      id: "t19",
      icon: "",
      title: "Start small",
      description: "A short note each day makes trends clearer.",
      mood: "okay",
    },
    {
      id: "t20",
      icon: "",
      title: "Set a reminder",
      description: "Choose a time to check in so the data stays consistent.",
      mood: "calm",
    },
  ],
};

function getTrendKey(entries: MoodEntry[]): TrendKey {
  const recent = entries.slice(-6);
  if (recent.length < 3) return "insufficient";

  const deltas = recent.slice(1).map((e, i) => {
    const prev = recent[i];
    return MOOD_SCORE[e.mood] - MOOD_SCORE[prev.mood];
  });

  const avg = deltas.reduce((sum, v) => sum + v, 0) / deltas.length;
  const hasUp = deltas.some((d) => d > 0);
  const hasDown = deltas.some((d) => d < 0);
  const volatility = deltas.reduce((sum, v) => sum + Math.abs(v), 0) / deltas.length;

  if (hasUp && hasDown && volatility >= 1) return "volatile";
  if (avg >= 0.3) return "improving";
  if (avg <= -0.3) return "declining";
  return "steady";
}

export function getTrendSuggestions(entries: MoodEntry[]): Suggestion[] {
  const key = getTrendKey(entries);
  return TREND_SUGGESTIONS[key];
}
