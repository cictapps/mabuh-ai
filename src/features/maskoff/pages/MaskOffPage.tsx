import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileText, Lock, Moon, Plus, Search, ShieldCheck, Sun } from 'lucide-react';
import { useTheme } from '../../../context/theme';
import { ComfortCompanion } from '../components/ComfortCompanion';
import { FloatingThemeMenu } from '../components/FloatingThemeMenu';
import { PrivacyBadge } from '../components/PrivacyBadge';
import { QuickHideToggle } from '../components/QuickHideToggle';
import {
  getMaskOffTheme,
  MASK_OFF_ENTRIES_KEY,
  MASK_OFF_PIN_KEY,
  MASK_OFF_THEME_CHANGE_EVENT,
  MASK_OFF_THEME_KEY,
  maskOffMoods,
  type MaskOffEntry,
  type MaskOffTheme,
} from '../data/maskOffConfig';

export function MaskOffPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { fromEntry?: boolean } | null;
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const [isUnlocked, setIsUnlocked] = useState(Boolean(locationState?.fromEntry));
  const [pin, setPin] = useState('');
  const [savedPin, setSavedPin] = useState<string | null>(() => localStorage.getItem(MASK_OFF_PIN_KEY));
  const [selectedTheme, setSelectedTheme] = useState<MaskOffTheme>(() => getMaskOffTheme(localStorage.getItem(MASK_OFF_THEME_KEY)));
  const [entries] = useState<MaskOffEntry[]>(() => {
    const storedEntries = localStorage.getItem(MASK_OFF_ENTRIES_KEY);
    return storedEntries ? (JSON.parse(storedEntries) as MaskOffEntry[]) : [];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isHidden, setIsHidden] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  const filteredEntries = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return entries.filter((entry) =>
      entry.title.toLowerCase().includes(query) ||
      entry.content.toLowerCase().includes(query) ||
      entry.summary.toLowerCase().includes(query) ||
      entry.cognitiveDistortion?.toLowerCase().includes(query) ||
      entry.reframe?.toLowerCase().includes(query)
    );
  }, [entries, searchQuery]);

  const handleSetPin = () => {
    if (pin.trim().length < 4) {
      alert('Use at least 4 digits for your PIN.');
      return;
    }

    localStorage.setItem(MASK_OFF_PIN_KEY, pin);
    setSavedPin(pin);
    setIsUnlocked(true);
    setPin('');
  };

  const handleUnlock = () => {
    if (pin === savedPin) {
      setIsUnlocked(true);
      setPin('');
      return;
    }

    alert('Wrong PIN');
  };

  const handleThemeChange = (theme: MaskOffTheme) => {
    setSelectedTheme(theme);
    localStorage.setItem(MASK_OFF_THEME_KEY, theme.id);
    window.dispatchEvent(new CustomEvent(MASK_OFF_THEME_CHANGE_EVENT, { detail: theme.id }));
    setIsThemeMenuOpen(false);
  };

  if (!isUnlocked) {
    return (
      <div className={`min-h-screen ${selectedTheme.pageClass}`}>
        <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
          <div className={`smooth-card w-full max-w-sm rounded-3xl border p-6 text-center ${selectedTheme.panelClass}`}>
            <ShieldCheck className="mx-auto mb-4 h-14 w-14 opacity-80" aria-hidden="true" />
            <h1 className="font-cute-display text-2xl">{savedPin ? 'Unlock Mask-Off' : 'Create Your PIN'}</h1>
            <p className={`mt-2 text-sm ${selectedTheme.mutedTextClass}`}>
              This is your private room for the things you do not want others to see.
            </p>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              placeholder="Enter PIN"
              className="smooth-field mt-6 w-full rounded-2xl border border-white/40 bg-white/70 p-3 text-center text-2xl tracking-[0.35em] text-slate-950 outline-none focus:ring-2 focus:ring-current"
              aria-label="Mask-Off PIN"
            />
            <button
              type="button"
              onClick={savedPin ? handleUnlock : handleSetPin}
              className={`smooth-press mt-4 w-full rounded-2xl px-4 py-3 font-semibold transition hover:scale-[1.01] ${selectedTheme.accentClass}`}
            >
              {savedPin ? 'Unlock' : 'Set PIN'}
            </button>
            <div className="mt-5">
              <PrivacyBadge theme={selectedTheme} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${selectedTheme.pageClass}`}>
      <div className={`relative z-10 transition duration-300 ${isHidden ? 'maskoff-private-blur' : ''}`}>
        <nav className="mx-auto flex max-w-3xl flex-wrap items-center justify-end gap-3 px-4 pt-5">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={isDark}
              onClick={toggleTheme}
              className={`smooth-press inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition hover:scale-[1.02] ${selectedTheme.panelClass} ${selectedTheme.textClass}`}
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDark ? 'bg-slate-950/80' : 'bg-white/70'}`}>
                <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm transition-transform ${isDark ? 'translate-x-5' : 'translate-x-1'}`}>
                  {isDark ? <Moon className="h-3.5 w-3.5" aria-hidden="true" /> : <Sun className="h-3.5 w-3.5" aria-hidden="true" />}
                </span>
              </span>
              <span>{isDark ? 'Dark' : 'Light'}</span>
            </button>
            <FloatingThemeMenu
              selectedTheme={selectedTheme}
              isOpen={isThemeMenuOpen}
              onToggle={() => setIsThemeMenuOpen((value) => !value)}
              onChange={handleThemeChange}
            />
            <button
              type="button"
              onClick={() => setIsUnlocked(false)}
              className={`smooth-press rounded-full border p-3 transition hover:scale-[1.03] ${selectedTheme.panelClass}`}
              aria-label="Lock Mask-Off Journal"
            >
              <Lock className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </nav>

        <header className="mx-auto flex max-w-3xl items-start justify-between gap-4 px-4 pb-8 pt-7">
          <div>
            <PrivacyBadge theme={selectedTheme} />
            <h1 className="font-cute-display mt-7 text-4xl sm:text-5xl">{isHidden ? 'Notes' : 'Mask-Off Journal'}</h1>
            <p className={`mt-2 max-w-xl text-sm ${selectedTheme.mutedTextClass}`}>
              {isHidden ? 'A quiet place for quick notes.' : 'A raw, private place to put down the version of the truth that does not need to be polished.'}
            </p>
          </div>
        </header>

        <main className="mx-auto max-w-3xl space-y-8 px-4 pb-24">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <QuickHideToggle isHidden={isHidden} onToggle={() => setIsHidden((value) => !value)} theme={selectedTheme} />
            <button
              type="button"
              onClick={() => navigate('/new-maskoff', { state: { themeId: selectedTheme.id, fromMaskOff: true } })}
              className={`smooth-press inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold shadow-sm transition hover:scale-[1.01] ${selectedTheme.accentClass}`}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              New Mask-Off Entry
            </button>
          </div>

          <div className="relative">
            <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${selectedTheme.mutedTextClass}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search private entries..."
              className={`smooth-field w-full rounded-2xl border py-3 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-current ${selectedTheme.panelClass} ${selectedTheme.textClass}`}
            />
          </div>

          <section className={`smooth-card rounded-3xl border p-5 ${selectedTheme.panelClass}`}>
            <div className="mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" aria-hidden="true" />
              <h2 className="text-sm font-semibold">Recent private entries</h2>
            </div>
            {filteredEntries.length > 0 ? (
              <div className="space-y-3">
                {filteredEntries.map((entry) => {
                  const mood = maskOffMoods.find((item) => item.id === entry.mood);
                  const previewText = entry.content || entry.summary || 'No written content yet.';
                  return (
                    <motion.button
                      key={entry.id}
                      type="button"
                      layout
                      initial={{ opacity: 0, y: 10, scale: 0.985 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      whileHover={{ y: -3, scale: 1.01 }}
                      whileTap={{ scale: 0.985, y: 0 }}
                      transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                      onClick={() => navigate(`/maskoff-detail/${entry.id}`, { state: { themeId: selectedTheme.id } })}
                      className={`smooth-card w-full text-left rounded-xl border p-3 transition ${selectedTheme.borderClass}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-cute-display text-lg">{entry.title || 'Untitled truth'}</h3>
                        <span className={`text-xs ${selectedTheme.mutedTextClass}`}>
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className={`mt-1 line-clamp-2 text-sm ${selectedTheme.mutedTextClass} ${entry.blurContent ? 'maskoff-entry-blur' : ''}`}>
                        {previewText}
                      </p>
                      {entry.blurContent && (
                        <p className={`mt-1 text-xs font-semibold ${selectedTheme.mutedTextClass}`}>
                          Blurred after save
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        {mood && <span className={`rounded-full px-2 py-1 ${selectedTheme.accentClass}`}>{mood.emoji} {mood.label}</span>}
                        <span className={`rounded-full border px-2 py-1 ${selectedTheme.borderClass}`}>Intensity {entry.intensity}/10</span>
                        {entry.summary && <span className={`rounded-full border px-2 py-1 ${selectedTheme.borderClass}`}>{entry.summary}</span>}
                        {entry.cognitiveDistortion && <span className={`rounded-full border px-2 py-1 ${selectedTheme.borderClass}`}>{entry.cognitiveDistortion}</span>}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            ) : (
              <p className={`rounded-2xl border border-dashed p-10 text-center text-sm ${selectedTheme.borderClass} ${selectedTheme.mutedTextClass}`}>
                No pressure. Your first private entry can be one sentence.
              </p>
            )}
          </section>
        </main>
      </div>

      {isHidden && (
        <button
          type="button"
          onClick={() => setIsHidden(false)}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 p-6 text-center text-white backdrop-blur-xl"
        >
          <span className="rounded-3xl border border-white/15 bg-white/10 px-6 py-5 text-sm font-medium">
            Privacy screen is on. Tap anywhere to reveal.
          </span>
        </button>
      )}
      <ComfortCompanion theme={selectedTheme} />
    </div>
  );
}
