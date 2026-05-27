import { LockKeyhole } from 'lucide-react';
import type { MaskOffTheme } from '../data/maskOffConfig';

interface PrivacyBadgeProps {
  theme: MaskOffTheme;
  label?: string;
}

export function PrivacyBadge({ theme, label = 'Your thoughts are locked & local 🔒' }: PrivacyBadgeProps) {
  return (
    <div className={`smooth-card inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${theme.panelClass} ${theme.textClass}`}>
      <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
