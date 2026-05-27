export type MaskOffThemeId = 'nature-healing' | 'cozy-orange' | 'mystic-violet' | 'serene-blue' | 'soft-pink' | 'yellow-lemon';

export interface MaskOffTheme {
  id: MaskOffThemeId;
  name: string;
  description: string;
  icon: string;
  pageClass: string;
  panelClass: string;
  borderClass: string;
  textClass: string;
  mutedTextClass: string;
  accentClass: string;
}

export interface MaskOffMood {
  id: string;
  label: string;
  emoji: string;
}

export interface MaskOffEntry {
  id: string;
  title: string;
  content: string;
  blurContent?: boolean;
  mood: string | null;
  intensity: number;
  summary: string;
  cognitiveDistortion?: string;
  reframe?: string;
  voiceDuration: number | null;
  createdAt: string;
}

export const MASK_OFF_THEME_KEY = 'maskoff_theme';
export const MASK_OFF_THEME_CHANGE_EVENT = 'maskoff-theme-change';
export const MASK_OFF_ENTRIES_KEY = 'maskoff_entries';
export const MASK_OFF_PIN_KEY = 'maskoff_pin';

export const maskOffThemes: MaskOffTheme[] = [
  {
    id: 'nature-healing',
    name: 'Forest Green',
    description: 'Deep forest silhouettes and mossy calm',
    icon: 'Leaf',
    pageClass: 'font-maskoff maskoff-bg-nature text-emerald-950 dark:text-emerald-50',
    panelClass: 'bg-emerald-50/76 dark:bg-emerald-950/62 border-white/70 dark:border-white/12 shadow-sm dark:shadow-black/20 backdrop-blur-md',
    borderClass: 'border-white/70 dark:border-white/12',
    textClass: 'text-emerald-950 dark:text-emerald-50',
    mutedTextClass: 'text-emerald-800/75 dark:text-emerald-100/75',
    accentClass: 'bg-emerald-700 dark:bg-emerald-300 text-white dark:text-emerald-950',
  },
  {
    id: 'cozy-orange',
    name: 'Autumn Orange',
    description: 'Terracotta warmth with falling leaves',
    icon: 'Sun',
    pageClass: 'font-maskoff maskoff-bg-cozy text-stone-950 dark:text-orange-50',
    panelClass: 'bg-orange-50/78 dark:bg-stone-950/62 border-white/70 dark:border-white/12 shadow-sm dark:shadow-black/20 backdrop-blur-md',
    borderClass: 'border-white/70 dark:border-white/12',
    textClass: 'text-stone-950 dark:text-orange-50',
    mutedTextClass: 'text-stone-700 dark:text-orange-100/76',
    accentClass: 'bg-orange-600 dark:bg-orange-300 text-white dark:text-stone-950',
  },
  {
    id: 'mystic-violet',
    name: 'Violet Sky',
    description: 'Lavender clouds and twilight air',
    icon: 'Stars',
    pageClass: 'font-maskoff maskoff-bg-violet text-violet-950 dark:text-violet-50',
    panelClass: 'bg-violet-50/76 dark:bg-violet-950/58 border-white/70 dark:border-white/12 shadow-sm dark:shadow-black/20 backdrop-blur-md',
    borderClass: 'border-white/70 dark:border-white/12',
    textClass: 'text-violet-950 dark:text-violet-50',
    mutedTextClass: 'text-violet-800/74 dark:text-violet-100/78',
    accentClass: 'bg-violet-700 dark:bg-violet-300 text-white dark:text-violet-950',
  },
  {
    id: 'serene-blue',
    name: 'Cosmic Blue',
    description: 'Soft stars, planets, and tiny orbit lines',
    icon: 'Cloud',
    pageClass: 'font-maskoff maskoff-bg-blue text-slate-950 dark:text-sky-50',
    panelClass: 'bg-sky-50/76 dark:bg-slate-950/62 border-white/70 dark:border-white/12 shadow-sm dark:shadow-black/20 backdrop-blur-md',
    borderClass: 'border-white/70 dark:border-white/12',
    textClass: 'text-slate-950 dark:text-sky-50',
    mutedTextClass: 'text-sky-900/70 dark:text-sky-100/75',
    accentClass: 'bg-sky-700 dark:bg-sky-300 text-white dark:text-sky-950',
  },
  {
    id: 'soft-pink',
    name: 'Pink Bloom',
    description: 'Flowers, hearts, ribbons, and blush softness',
    icon: 'Heart',
    pageClass: 'font-maskoff maskoff-bg-pink text-rose-950 dark:text-rose-50',
    panelClass: 'bg-rose-50/78 dark:bg-rose-950/58 border-white/70 dark:border-white/12 shadow-sm dark:shadow-black/20 backdrop-blur-md',
    borderClass: 'border-white/70 dark:border-white/12',
    textClass: 'text-rose-950 dark:text-rose-50',
    mutedTextClass: 'text-rose-800/72 dark:text-rose-100/75',
    accentClass: 'bg-rose-600 dark:bg-rose-300 text-white dark:text-rose-950',
  },
  {
    id: 'yellow-lemon',
    name: 'Lemon Yellow',
    description: 'Sunny lemon slices and gentle citrus dots',
    icon: 'Lemon',
    pageClass: 'font-maskoff maskoff-bg-lemon text-yellow-950 dark:text-yellow-50',
    panelClass: 'bg-yellow-50/80 dark:bg-yellow-950/54 border-white/70 dark:border-white/12 shadow-sm dark:shadow-black/20 backdrop-blur-md',
    borderClass: 'border-white/70 dark:border-white/12',
    textClass: 'text-yellow-950 dark:text-yellow-50',
    mutedTextClass: 'text-yellow-800/75 dark:text-yellow-100/76',
    accentClass: 'bg-yellow-500 dark:bg-yellow-300 text-yellow-950',
  },
];

export const maskOffMoods: MaskOffMood[] = [
  { id: 'happy', label: 'Okay', emoji: '😊' },
  { id: 'sad', label: 'Heavy', emoji: '😔' },
  { id: 'angry', label: 'Angry', emoji: '🤬' },
  { id: 'tired', label: 'Drained', emoji: '🥱' },
  { id: 'overthinking', label: 'Overthinking', emoji: '🧠' },
  { id: 'anxious', label: 'Anxious', emoji: '😰' },
];

export const maskOffSummaries = [
  'Overthinking everything',
  'Anxious but trying',
  'Anxious about the future',
  'Grateful for a small win',
  'Just venting / no thoughts',
  'Processing a conflict',
  'Feeling misunderstood',
  'Need to be honest with myself',
];

export function getMaskOffTheme(themeId: string | null): MaskOffTheme {
  return maskOffThemes.find((theme) => theme.id === themeId) ?? maskOffThemes[0];
}
