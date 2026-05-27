import { Palette } from 'lucide-react';
import { maskOffThemes, type MaskOffTheme, type MaskOffThemeId } from '../data/maskOffConfig';

interface ThemePickerProps {
  selectedTheme: MaskOffTheme;
  onChange: (theme: MaskOffTheme) => void;
}

export function ThemePicker({ selectedTheme, onChange }: ThemePickerProps) {
  return (
    <section className={`smooth-card rounded-2xl border p-4 ${selectedTheme.panelClass}`}>
      <div className="mb-3 flex items-center gap-2">
        <Palette className="h-4 w-4" aria-hidden="true" />
        <h2 className="text-sm font-semibold">Background theme</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Mask-Off background theme">
        {maskOffThemes.map((theme) => (
          <button
            key={theme.id}
            type="button"
            role="radio"
            aria-checked={selectedTheme.id === theme.id}
            onClick={() => onChange(theme)}
            className={`smooth-card rounded-xl border p-3 text-left transition ${
              selectedTheme.id === theme.id ? 'border-current ring-2 ring-current/30' : selectedTheme.borderClass
            }`}
          >
            <span className={`mb-3 block h-14 rounded-lg border ${themePreviewClass[theme.id]}`} aria-hidden="true" />
            <span className="block text-sm font-semibold">{theme.icon} {theme.name}</span>
            <span className={`mt-1 block text-xs ${selectedTheme.mutedTextClass}`}>{theme.description}</span>
          </button>
        ))}
      </div>
    </section>
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
