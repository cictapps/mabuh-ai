import { ChevronDown } from 'lucide-react';
import { maskOffSummaries, type MaskOffTheme } from '../data/maskOffConfig';

interface SummarySelectProps {
  value: string;
  onChange: (value: string) => void;
  theme: MaskOffTheme;
}

export function SummarySelect({ value, onChange, theme }: SummarySelectProps) {
  return (
    <section className={`smooth-card rounded-2xl border p-4 ${theme.panelClass}`}>
      <label htmlFor="maskoff-summary" className="block text-sm font-semibold">
        How I feel
      </label>
      <p className={`mt-1 text-xs ${theme.mutedTextClass}`}>Pick a starting point, or leave it open.</p>
      <div className="relative mt-3">
        <select
          id="maskoff-summary"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`smooth-field w-full appearance-none rounded-xl border bg-white/70 px-3 py-3 pr-10 text-sm text-slate-950 outline-none transition focus:ring-2 focus:ring-current ${theme.borderClass}`}
        >
          <option value="">Choose a quick summary...</option>
          {maskOffSummaries.map((summary) => (
            <option key={summary} value={summary}>{summary}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" aria-hidden="true" />
      </div>
    </section>
  );
}
