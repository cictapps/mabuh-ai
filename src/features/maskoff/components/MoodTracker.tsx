import { motion } from 'framer-motion';
import { maskOffMoods, type MaskOffTheme } from '../data/maskOffConfig';

interface MoodTrackerProps {
  selectedMood: string | null;
  intensity: number;
  onMoodChange: (mood: string) => void;
  onIntensityChange: (intensity: number) => void;
  theme: MaskOffTheme;
}

export function MoodTracker({ selectedMood, intensity, onMoodChange, onIntensityChange, theme }: MoodTrackerProps) {
  return (
    <section className={`smooth-card rounded-2xl border p-4 ${theme.panelClass}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Feelings & mood</h2>
          <p className={`text-xs ${theme.mutedTextClass}`}>Name it without cleaning it up first.</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${theme.accentClass}`}>{intensity}/10</span>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6" role="radiogroup" aria-label="Current mood">
        {maskOffMoods.map((mood) => {
          const isSelected = selectedMood === mood.id;
          const emojiScale = 1 + intensity * 0.035;

          return (
          <motion.button
            key={mood.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            whileTap={{ scale: 0.9 }}
            animate={{ scale: isSelected ? 1.04 : 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 22 }}
            onClick={() => onMoodChange(mood.id)}
            className={`smooth-press rounded-xl border px-2 py-3 text-center transition ${
              isSelected ? `${theme.accentClass} border-transparent` : `${theme.borderClass} hover:bg-white/20`
            }`}
            style={{ opacity: isSelected ? 1 : 0.72 + intensity * 0.025 }}
          >
            <motion.span
              className="block text-2xl"
              aria-hidden="true"
              animate={{ scale: isSelected ? emojiScale : 1 }}
              transition={{ type: 'spring', stiffness: 360, damping: 18 }}
            >
              {mood.emoji}
            </motion.span>
            <span className="mt-1 block text-xs font-medium">{mood.label}</span>
          </motion.button>
          );
        })}
      </div>

      <label htmlFor="maskoff-intensity" className="mt-5 block text-sm font-medium">
        Mood intensity
      </label>
      <input
        id="maskoff-intensity"
        type="range"
        min="1"
        max="10"
        value={intensity}
        onChange={(event) => onIntensityChange(Number(event.target.value))}
        className="smooth-field mt-3 w-full accent-current"
      />
      <div className={`mt-1 flex justify-between text-xs ${theme.mutedTextClass}`} aria-hidden="true">
        <span>Low</span>
        <span>Overwhelming</span>
      </div>
    </section>
  );
}
