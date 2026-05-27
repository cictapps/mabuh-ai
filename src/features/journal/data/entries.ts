import {
  JOURNAL_ENTRIES_KEY,
  moodEmojis,
  type JournalEntry,
} from '../../../types/journal';
import { MASK_OFF_ENTRIES_KEY, maskOffMoods, type MaskOffEntry } from '../../maskoff/data/maskOffConfig';

export type UnifiedEntry = {
  id: string;
  title: string;
  content: string;
  moodLabel: string | null;
  moodEmoji: string | null;
  isMaskOff: boolean;
  blurContent?: boolean;
  createdAt: string;
  route: string;
};

const mockEntries: JournalEntry[] = [
  {
    id: '1',
    user_id: 'user1',
    title: 'Grateful for small things',
    content: 'My friend sent me a random text today saying they were thinking of me.',
    mood: 'grateful',
    voice_url: null,
    voice_duration: null,
    is_mask_off: false,
    created_at: '2026-05-06T08:50:00Z',
    updated_at: '2026-05-06T08:50:00Z',
  },
  {
    id: '2',
    user_id: 'user1',
    title: 'Feeling overwhelmed',
    content: 'Too many things coming up on my plate right now.',
    mood: 'anxious',
    voice_url: null,
    voice_duration: null,
    is_mask_off: false,
    created_at: '2026-05-06T08:50:00Z',
    updated_at: '2026-05-06T08:50:00Z',
  },
];

export function loadUnifiedEntries(): UnifiedEntry[] {
  const storedJournal = localStorage.getItem(JOURNAL_ENTRIES_KEY);
  const normalEntries = storedJournal ? [...(JSON.parse(storedJournal) as JournalEntry[]), ...mockEntries] : mockEntries;

  const storedMaskOff = localStorage.getItem(MASK_OFF_ENTRIES_KEY);
  const maskOffEntries = storedMaskOff ? (JSON.parse(storedMaskOff) as MaskOffEntry[]) : [];

  const journal = normalEntries.map((entry) => ({
    id: entry.id,
    title: entry.title || 'Untitled entry',
    content: entry.content || '',
    moodLabel: entry.mood,
    moodEmoji: entry.mood ? moodEmojis[entry.mood] : null,
    isMaskOff: false,
    createdAt: entry.created_at,
    route: `/entry/${entry.id}`,
  }));

  const maskOff = maskOffEntries.map((entry) => {
    const mood = maskOffMoods.find((item) => item.id === entry.mood);
    return {
      id: entry.id,
      title: entry.title || 'Untitled truth',
      content: entry.content || entry.summary || '',
      moodLabel: mood?.label ?? null,
      moodEmoji: mood?.emoji ?? null,
      isMaskOff: true,
      blurContent: entry.blurContent,
      createdAt: entry.createdAt,
      route: `/maskoff-detail/${entry.id}`,
    };
  });

  return [...maskOff, ...journal].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}
