import { EyeOff, Eye } from 'lucide-react';
import type { MaskOffTheme } from '../data/maskOffConfig';

interface QuickHideToggleProps {
  isHidden: boolean;
  onToggle: () => void;
  theme: MaskOffTheme;
}

export function QuickHideToggle({ isHidden, onToggle, theme }: QuickHideToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isHidden}
      onClick={onToggle}
      className={`smooth-press inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition hover:scale-[1.01] ${
        isHidden
          ? `${theme.panelClass} ${theme.textClass}`
          : 'border-red-400/70 bg-red-600 text-white shadow-lg shadow-red-500/20 hover:bg-red-700'
      }`}
    >
      {isHidden ? <Eye className="h-4 w-4" aria-hidden="true" /> : <EyeOff className="h-4 w-4" aria-hidden="true" />}
      <span>{isHidden ? 'Reveal' : 'Panic hide'}</span>
    </button>
  );
}
