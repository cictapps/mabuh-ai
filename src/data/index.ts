import { MoodMeta, MoodType, InsightCard, Suggestion, MoodEntry, NavItem } from "../types";

export const MOODS: MoodMeta[] = [
  {
    id: "stressed",
    label: "Stressed",
    color: "#e05c6e",
    definition: "Pressure, overload, and emotional strain.",
    tags: ["overwhelmed", "tired", "burned out", "pressured", "frustrated", "drained", "anxious", "tense"],
  },
  {
    id: "worried",
    label: "Worried",
    color: "#e0853c",
    definition: "Uncertainty, anxiety, and uneasiness.",
    tags: ["uneasy", "confused", "uncertain", "distracted", "restless", "nervous", "concerned"],
  },
  {
    id: "okay",
    label: "Okay",
    color: "#d4b84e",
    definition: "A neutral, steady emotional state.",
    tags: ["neutral", "fine", "steady", "normal", "quiet", "reflective", "balanced"],
  },
  {
    id: "calm",
    label: "Calm",
    color: "#6dba84",
    definition: "Balance and relaxation.",
    tags: ["relaxed", "peaceful", "content", "comfortable", "rested", "stable"],
  },
  {
    id: "happy",
    label: "Happy",
    color: "#5bb89e",
    definition: "Positive mood and motivation.",
    tags: ["energized", "motivated", "productive", "excited", "inspired", "confident"],
  },
];

export const getMoodMeta = (id: MoodType): MoodMeta => {
  const mood = MOODS.find((m) => m.id === id);

  if (!mood) {
    throw new Error(`Invalid mood ID: ${id}`);
  }

  return mood;
};

export const INSIGHTS: InsightCard[] = [
  {
    id: "1",
    title: "You feel calmer on weekends",
    body: "Saturday and Sunday check-ins consistently show Calm — a reset that carries into Monday.",
    color: "#6dba84",
  },
  {
    id: "2",
    title: "Stress rises during busy periods",
    body: "On high-workload days, emotional pressure tends to peak. Short breaks may shift this pattern.",
    color: "#e05c6e",
  },
  {
    id: "3",
    title: "Journaling lifts your mood",
    body: "Check-ins with journal entries correlate with higher Calm and Happy moods the next morning.",
    color: "#ffb954",
  },
  {
    id: "4",
    title: "Okay moods are transitional",
    body: "Your Okay states rarely persist beyond two days — they often lead into your most Calm check-ins.",
    color: "#d4b84e",
  },
];

export const SUGGESTIONS: Record<MoodType, Suggestion[]> = {
  stressed: [
    { id: "s1", icon: "💨", title: "Breathing exercise", description: "4-7-8 breathing to release tension and calm your nervous system.", mood: "stressed" },
    { id: "s2", icon: "⏸", title: "Take a short break", description: "Step away for 10 quiet minutes — rest is productive.", mood: "stressed" },
    { id: "s3", icon: "🤸", title: "Stretching reminder", description: "Gentle neck and shoulder rolls to release physical tension.", mood: "stressed" },
  ],
  worried: [
    { id: "w1", icon: "📓", title: "Journaling prompt", description: "Write about one thing you know for certain right now.", mood: "worried" },
    { id: "w2", icon: "🌿", title: "Grounding exercise", description: "Name 5 things you see, 4 you can touch, 3 you can hear.", mood: "worried" },
    { id: "w3", icon: "🚶", title: "Short walk", description: "A brief walk outside helps reset mental clarity.", mood: "worried" },
  ],
  okay: [
    { id: "o1", icon: "🪞", title: "Light reflection", description: "Take a moment to notice what is going well right now.", mood: "okay" },
    { id: "o2", icon: "✅", title: "Small task", description: "Finish one small, satisfying thing on your list.", mood: "okay" },
    { id: "o3", icon: "⏰", title: "Check-in reminder", description: "Ask yourself how you feel beneath the surface.", mood: "okay" },
  ],
  calm: [
    { id: "c1", icon: "📋", title: "Maintain your routine", description: "Consistency amplifies calm — keep the rhythm going.", mood: "calm" },
    { id: "c2", icon: "🌻", title: "Gratitude reflection", description: "Name three things that contributed to this peace.", mood: "calm" },
  ],
  happy: [
    { id: "h1", icon: "📔", title: "Gratitude journaling", description: "Capture what brought this brightness and carry it forward.", mood: "happy" },
    { id: "h2", icon: "🎯", title: "Set a meaningful goal", description: "Channel your clarity into something you've been putting off.", mood: "happy" },
  ],
};

// Seed history for demo — past 30 days
function seedDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

const moodSeq: MoodType[] = [
  "calm","happy","happy","calm","okay","worried","stressed",
  "okay","calm","calm","happy","calm","okay","stressed","worried",
  "okay","calm","happy","calm","calm","okay","worried","calm",
  "happy","happy","calm","okay","calm","stressed","calm",
];

export const SEED_HISTORY: MoodEntry[] = moodSeq.map((mood, i) => ({
  id: `entry-${i}`,
  date: seedDate(29 - i),
  mood,
  tags: getMoodMeta(mood).tags.slice(0, 2),
  journal: i % 4 === 0 ? "Had a reflective day. Taking it one step at a time." : "",
  socialInteractions: [],
  activities: {
    work: [],
    health: [],
    sleep: [],
    food: [],
    hobbies: [],
    weather: [],
    sports: [],
  },
  timestamp: Date.now() - (29 - i) * 86400000,
}));

export const NAV_ITEMS: NavItem[] = [
  { id: "checkin", label: "Check in", icon: "checkin" },
  { id: "review", label: "Review", icon: "review" },
  { id: "support", label: "Support", icon: "support" },
  { id: "settings", label: "Settings", icon: "settings" },
];
