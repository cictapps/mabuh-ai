export type MoodType =
  | "stressed"
  | "worried"
  | "okay"
  | "calm"
  | "happy"
  | "sad"
  | "tired";

/**
 * Display order for mood selectors and analytics. Most positive first.
 * Adding a new mood only requires appending it here and to {@link MoodType}.
 */
export const MOOD_ORDER: ReadonlyArray<MoodType> = [
  "happy",
  "calm",
  "okay",
  "tired",
  "worried",
  "sad",
  "stressed",
];

export type RelationshipType = "friend" | "family" | "partner" | "colleague" | "other";

export type InteractionType = "in_person" | "call" | "text" | "video" | "other";

export type ActivitySectionId =
  | "work"
  | "health"
  | "sleep"
  | "food"
  | "hobbies"
  | "weather"
  | "sports";

export type ActivitySelections = Record<ActivitySectionId, string[]>;

export interface SocialInteraction {
  id: string;
  name: string;
  relationship: RelationshipType;
  interactionType: InteractionType;
  durationMinutes?: number;
  feelings: string[];
  notes?: string;
}

export interface MoodEntry {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  mood: MoodType;
  tags: string[];
  journal: string;
  schoolLoad?: number;
  activityMinutes?: number;
  dayNote?: string;
  socialInteractions?: SocialInteraction[];
  activities?: ActivitySelections;
  timestamp: number;
}

export interface MoodMeta {
  id: MoodType;
  label: string;
  color: string;
  definition: string;
  tags: string[];
}

export type InsightTone = "calm" | "success" | "warm" | "danger";

export interface InsightCard {
  id: string;
  title: string;
  body: string;
  tone: InsightTone;
}

export interface Suggestion {
  id: string;
  icon: string;
  title: string;
  description: string;
  mood: MoodType;
}

export type ScreenId = "checkin" | "review" | "journey" | "support" | "settings";

export type JourneyPhase =
  | "preflight"
  | "airborne"
  | "checkpoint"
  | "pause"
  | "final"
  | "rest";

export type JourneyMode = "flight" | "garden";
export type GardenPhase = "prepare" | "growing" | "care" | "reflect" | "rest";
export type GardenPlant =
  | "sunflower"
  | "fern"
  | "lavender"
  | "monstera"
  | "cherry-blossom";
export type JourneyTheme = "dusk" | "dawn" | "meadow";
export type JourneyPlane = "trainer" | "cruiser" | "glider";

export type JourneyActivityType =
  | "preflight"
  | "checkpoint"
  | "final"
  | "garden_start"
  | "garden_care"
  | "garden_finish"
  | "mood_checkin"
  | "journal_entry";

export interface JourneyReward {
  id: string;
  level: number;
  label: string;
  description: string;
  category:
    | "theme"
    | "plane"
    | "plant"
    | "affirmation"
    | "accent"
    | "background"
    | "title";
  preview?: string;
}

export interface JourneyMilestone {
  id: string;
  type: "flight" | "plant" | "journal" | "pause" | "rhythm";
  threshold: number;
  label: string;
  body: string;
}

export interface JourneyProgress {
  mode: JourneyMode;
  modeDate: string | null;
  totalXp: number;
  level: number;
  flightsCompleted: number;
  streak: number;
  bestRhythm: number;
  lastFlightDate: string | null;
  lastJourneyDate: string | null;
  gardenPhase: GardenPhase;
  gardenPlant: GardenPlant;
  gardenStage: number;
  gardenMood: MoodType | null;
  lastGrowthDate: string | null;
  gardenDaysCompleted: number;
  plantsCompleted: number;
  unlockedRewards: string[];
  selectedTheme: JourneyTheme | null;
  selectedPlane: JourneyPlane | null;
  selectedTitle: string | null;
  migrationComplete: boolean;
}

export interface DailyLedgerEntry {
  action: JourneyActivityType;
  sourceId: string;
  occurredAt: string;
}

export interface JourneyCheckpoint {
  id: string;
  label: string;
  time: string;
}

export interface JourneyEmergencyContact {
  id: string;
  name: string;
  phone: string;
}

export type ReviewTabId = "history" | "analytics" | "insights" | "journal";

export interface JournalEntry {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  timestamp: number;
  content: string;
  source: "checkin" | "manual";
  mood?: MoodType;
  tags?: string[];
}

export interface NavItem {
  id: ScreenId;
  label: string;
  icon: string;
}
