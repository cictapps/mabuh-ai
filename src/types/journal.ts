export type Mood = 
  | 'happy' | 'calm' | 'grateful' | 'anxious' | 'sad'
  | 'angry' | 'confused' | 'hopeful' | 'tired' | 'neutral';

export interface JournalEntry {
  id: string;
  user_id: string;
  title: string | null;
  content: string | null;
  mood: Mood | null;
  voice_url: string | null;
  voice_duration: number | null;
  is_mask_off: boolean;
  feeling_summary?: string;
  cognitive_distortion?: string;
  reframe?: string;
  created_at: string;
  updated_at: string;
}

export const JOURNAL_ENTRIES_KEY = 'journal_entries';

export const feelingSummaries = [
  'Overthinking everything',
  'Anxious but trying',
  'Grateful for a small win',
  'Feeling overwhelmed',
  'Processing a conflict',
  'Just getting this out',
];

export const cognitiveDistortions = [
  'All-or-nothing thinking',
  'Catastrophizing',
  'Mind reading',
  'Fortune telling',
  'Personalization',
  'Should statements',
  'Emotional reasoning',
  'Not sure yet',
];

export const moodEmojis: Record<Mood, string> = {
  happy: '😊',
  calm: '😌',
  grateful: '🙏',
  anxious: '😰',
  sad: '😢',
  angry: '😠',
  confused: '😕',
  hopeful: '🌟',
  tired: '😴',
  neutral: '😐',
};

export const moodColors: Record<Mood, string> = {
  happy: 'bg-yellow-100 text-yellow-800',
  calm: 'bg-blue-100 text-blue-800',
  grateful: 'bg-green-100 text-green-800',
  anxious: 'bg-purple-100 text-purple-800',
  sad: 'bg-indigo-100 text-indigo-800',
  angry: 'bg-red-100 text-red-800',
  confused: 'bg-orange-100 text-orange-800',
  hopeful: 'bg-teal-100 text-teal-800',
  tired: 'bg-gray-100 text-gray-800',
  neutral: 'bg-slate-100 text-slate-800',
};
