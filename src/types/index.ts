export type MoodType = "stressed" | "worried" | "okay" | "calm" | "happy";

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

export interface InsightCard {
  id: string;
  title: string;
  body: string;
  color: string;
}

export interface Suggestion {
  id: string;
  icon: string;
  title: string;
  description: string;
  mood: MoodType;
}

export type ScreenId = "checkin" | "history" | "analytics" | "insights" | "journal";

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
