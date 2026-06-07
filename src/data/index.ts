import { MoodMeta, MoodType, Suggestion, NavItem } from "../types";

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

export const NAV_ITEMS: NavItem[] = [
  { id: "checkin", label: "Check in", icon: "checkin" },
  { id: "review", label: "Review", icon: "review" },
  { id: "support", label: "Support", icon: "support" },
  { id: "settings", label: "Settings", icon: "settings" },
];
