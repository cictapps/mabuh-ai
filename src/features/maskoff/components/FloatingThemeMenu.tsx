import { AnimatePresence, motion } from 'framer-motion';
import { Check, Palette } from 'lucide-react';
import { maskOffThemes, type MaskOffTheme, type MaskOffThemeId } from '../data/maskOffConfig';

interface FloatingThemeMenuProps {
  selectedTheme: MaskOffTheme;
  isOpen: boolean;
  onToggle: () => void;
  onChange: (theme: MaskOffTheme) => void;
}

export function FloatingThemeMenu({ selectedTheme, isOpen, onToggle, onChange }: FloatingThemeMenuProps) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={`smooth-press inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition hover:scale-[1.02] ${selectedTheme.panelClass}`}
      >
        <Palette className="h-4 w-4" aria-hidden="true" />
        <span>{selectedTheme.name}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 8, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={`smooth-card absolute right-0 top-full z-30 w-72 rounded-3xl border p-3 ${selectedTheme.panelClass}`}
          >
            <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.18em] opacity-70">Choose atmosphere</p>
            <div className="space-y-2" role="radiogroup" aria-label="Mask-Off background theme">
              {maskOffThemes.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  role="radio"
                  aria-checked={selectedTheme.id === theme.id}
                  onClick={() => onChange(theme)}
                  className="smooth-press flex w-full items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-white/20"
                >
                  <span className={`h-12 w-12 shrink-0 rounded-2xl border ${themePreviewClass[theme.id]}`} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{theme.name}</span>
                    <span className={`block text-xs ${selectedTheme.mutedTextClass}`}>{theme.description}</span>
                  </span>
                  {selectedTheme.id === theme.id && <Check className="h-4 w-4" aria-hidden="true" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const themePreviewClass: Record<MaskOffThemeId, string> = {
  'nature-healing': 'maskoff-bg-nature border-white/70',
  'cozy-orange': 'maskoff-bg-cozy border-white/70',
  'mystic-violet': 'maskoff-bg-violet border-white/20',
  'serene-blue': 'maskoff-bg-blue border-white/70',
  'soft-pink': 'maskoff-bg-pink border-white/70',
  'yellow-lemon': 'maskoff-bg-lemon border-white/70',
};
