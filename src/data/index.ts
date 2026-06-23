import { MoodMeta, MoodType, Suggestion, NavItem } from "../types";

export const MOODS: MoodMeta[] = [
  {
    id: "stressed",
    label: "Stressed",
    color: "#e26680",
    definition: "Pressure, overload, and emotional strain.",
    tags: [
      "overwhelmed",
      "burned out",
      "pressured",
      "frustrated",
      "tense",
      "strained",
      "anxious",
    ],
  },
  {
    id: "worried",
    label: "Worried",
    color: "#d99055",
    definition: "Uncertainty, anxiety, and uneasiness.",
    tags: [
      "uneasy",
      "confused",
      "uncertain",
      "restless",
      "nervous",
      "concerned",
      "on edge",
    ],
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
    color: "#5dd3b0",
    definition: "Positive mood and motivation.",
    tags: ["energized", "motivated", "productive", "excited", "inspired", "confident"],
  },
  {
    id: "sad",
    label: "Sad",
    color: "#7b95b8",
    definition: "Low mood, heaviness, or quiet grief.",
    tags: ["down", "low", "heavy", "lonely", "tearful", "disappointed", "hurt"],
  },
  {
    id: "tired",
    label: "Tired",
    color: "#a99bb5",
    definition: "Drained, low energy, in need of rest.",
    tags: ["exhausted", "drained", "sleepy", "weary", "foggy", "low energy", "spent"],
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
    {
      id: "s1",
      icon: "💨",
      title: "Breathing exercise",
      description: "4-7-8 breathing to release tension and calm your nervous system.",
      mood: "stressed",
    },
    {
      id: "s2",
      icon: "⏸",
      title: "Take a short break",
      description: "Step away for 10 quiet minutes — rest is productive.",
      mood: "stressed",
    },
    {
      id: "s3",
      icon: "🤸",
      title: "Stretching reminder",
      description: "Gentle neck and shoulder rolls to release physical tension.",
      mood: "stressed",
    },
  ],
  worried: [
    {
      id: "w1",
      icon: "📓",
      title: "Journaling prompt",
      description: "Write about one thing you know for certain right now.",
      mood: "worried",
    },
    {
      id: "w2",
      icon: "🌿",
      title: "Grounding exercise",
      description: "Name 5 things you see, 4 you can touch, 3 you can hear.",
      mood: "worried",
    },
    {
      id: "w3",
      icon: "🚶",
      title: "Short walk",
      description: "A brief walk outside helps reset mental clarity.",
      mood: "worried",
    },
  ],
  okay: [
    {
      id: "o1",
      icon: "🪞",
      title: "Light reflection",
      description: "Take a moment to notice what is going well right now.",
      mood: "okay",
    },
    {
      id: "o2",
      icon: "✅",
      title: "Small task",
      description: "Finish one small, satisfying thing on your list.",
      mood: "okay",
    },
    {
      id: "o3",
      icon: "⏰",
      title: "Check-in reminder",
      description: "Ask yourself how you feel beneath the surface.",
      mood: "okay",
    },
  ],
  calm: [
    {
      id: "c1",
      icon: "📋",
      title: "Maintain your routine",
      description: "Consistency amplifies calm — keep the rhythm going.",
      mood: "calm",
    },
    {
      id: "c2",
      icon: "🌻",
      title: "Gratitude reflection",
      description: "Name three things that contributed to this peace.",
      mood: "calm",
    },
  ],
  happy: [
    {
      id: "h1",
      icon: "📔",
      title: "Gratitude journaling",
      description: "Capture what brought this brightness and carry it forward.",
      mood: "happy",
    },
    {
      id: "h2",
      icon: "🎯",
      title: "Set a meaningful goal",
      description: "Channel your clarity into something you've been putting off.",
      mood: "happy",
    },
  ],
  sad: [
    {
      id: "sa1",
      icon: "📓",
      title: "Write one sentence",
      description: "Even one honest line can lighten what you’re carrying.",
      mood: "sad",
    },
    {
      id: "sa2",
      icon: "☎",
      title: "Reach out",
      description: "A short text to someone you trust — connection softens heavy days.",
      mood: "sad",
    },
    {
      id: "sa3",
      icon: "🫖",
      title: "Comfort ritual",
      description:
        "Make tea, put on a familiar song, wrap up warm. Small comforts count.",
      mood: "sad",
    },
  ],
  tired: [
    {
      id: "t1",
      icon: "💧",
      title: "Hydrate first",
      description: "A glass of water often lifts the fog before anything else.",
      mood: "tired",
    },
    {
      id: "t2",
      icon: "😌",
      title: "Rest, not push",
      description: "Permission to do less tonight. Rest is part of the work.",
      mood: "tired",
    },
    {
      id: "t3",
      icon: "🌙",
      title: "Wind down early",
      description: "Dim the lights and put devices away 30 minutes sooner than usual.",
      mood: "tired",
    },
  ],
};

export const NAV_ITEMS: NavItem[] = [
  { id: "checkin", label: "Check in", icon: "checkin" },
  { id: "review", label: "Review", icon: "review" },
  { id: "journey", label: "Journey", icon: "journey" },
  { id: "support", label: "Support", icon: "support" },
  { id: "settings", label: "Settings", icon: "settings" },
];
