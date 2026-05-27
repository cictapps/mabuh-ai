import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Eye, EyeOff, Trash2, ShieldCheck } from 'lucide-react';
import {
  getMaskOffTheme,
  MASK_OFF_ENTRIES_KEY,
  MASK_OFF_PIN_KEY,
  MASK_OFF_THEME_KEY,
  maskOffMoods,
  type MaskOffEntry,
} from '../data/maskOffConfig';

export function MaskOffDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const locationState = location.state as { themeId?: string } | null;
  const entry = useMemo<MaskOffEntry | null>(() => {
    const storedEntries = localStorage.getItem(MASK_OFF_ENTRIES_KEY);
    if (!storedEntries) return null;

    const entries = JSON.parse(storedEntries) as MaskOffEntry[];
    return entries.find((e) => e.id === id) ?? null;
  }, [id]);
  const themeId = locationState?.themeId || localStorage.getItem(MASK_OFF_THEME_KEY);
  const theme = getMaskOffTheme(themeId);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isContentRevealed, setIsContentRevealed] = useState(false);
  const [pin, setPin] = useState('');
  const [savedPin] = useState<string | null>(() => localStorage.getItem(MASK_OFF_PIN_KEY));

  const handleUnlock = () => {
    if (pin === savedPin) {
      setIsUnlocked(true);
      setPin('');
      return;
    }
    alert('Wrong PIN');
  };

  if (!entry) {
    return (
      <div className={`min-h-screen ${theme.pageClass}`}>
        <div className="flex items-center justify-center min-h-screen">
          <p className={`text-sm ${theme.mutedTextClass}`}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className={`min-h-screen ${theme.pageClass}`}>
        <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
          <div className={`smooth-card w-full max-w-sm rounded-3xl border p-6 text-center ${theme.panelClass}`}>
            <ShieldCheck className="mx-auto mb-4 h-14 w-14 opacity-80" aria-hidden="true" />
            <h1 className="font-cute-display text-2xl">Unlock Entry</h1>
            <p className={`mt-2 text-sm ${theme.mutedTextClass}`}>
              Enter your PIN to view this private entry.
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleUnlock();
                }
              }}
            />
            <button
              type="button"
              onClick={handleUnlock}
              className={`smooth-press mt-4 w-full rounded-2xl px-4 py-3 font-semibold transition hover:scale-[1.01] ${theme.accentClass}`}
            >
              Unlock
            </button>
          </div>
        </div>
      </div>
    );
  }

  const mood = maskOffMoods.find((item) => item.id === entry.mood);
  const shouldBlurContent = Boolean(entry.blurContent && !isContentRevealed);
  const formattedDate = new Date(entry.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this entry?')) {
      const storedEntries = localStorage.getItem(MASK_OFF_ENTRIES_KEY);
      if (storedEntries) {
        const entries = JSON.parse(storedEntries) as MaskOffEntry[];
        const filtered = entries.filter((e) => e.id !== id);
        localStorage.setItem(MASK_OFF_ENTRIES_KEY, JSON.stringify(filtered));
      }
      navigate('/maskoff');
    }
  };

  const handleEdit = () => {
    navigate(`/new-maskoff`, { state: { entryId: id, themeId: theme.id, fromMaskOff: true } });
  };

  return (
    <div className={`min-h-screen ${theme.pageClass}`}>
      <div className="relative z-10">
        {/* Header */}
        <nav className={`sticky top-0 z-10 border-b backdrop-blur ${theme.panelClass} ${theme.borderClass}`}>
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4">
            <button
              type="button"
              onClick={() => navigate('/maskoff')}
              className={`smooth-press rounded-full border p-2 transition hover:scale-[1.05] ${theme.panelClass}`}
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <h1 className="font-cute-display text-lg flex-1">Entry Detail</h1>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleEdit}
                className={`smooth-press rounded-full border p-2 transition hover:scale-[1.05] ${theme.panelClass}`}
                aria-label="Edit entry"
              >
                <Edit className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className={`smooth-press rounded-full border p-2 transition hover:scale-[1.05] ${theme.panelClass}`}
                aria-label="Delete entry"
              >
                <Trash2 className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </nav>

        {/* Content */}
        <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 pb-24">
          {/* Mood Badge */}
          {mood && (
            <div className="flex gap-2">
              <span className={`rounded-full px-3 py-1 text-sm ${theme.accentClass}`}>
                {mood.emoji} {mood.label}
              </span>
              <span className={`rounded-full border px-3 py-1 text-sm ${theme.borderClass}`}>
                Intensity {entry.intensity}/10
              </span>
            </div>
          )}

          {/* Title */}
          <div>
            <h2 className="font-cute-display text-3xl sm:text-4xl">{entry.title || 'Untitled truth'}</h2>
            <p className={`mt-2 text-sm ${theme.mutedTextClass}`}>{formattedDate}</p>
          </div>

          {/* Content */}
          <section className={`smooth-card rounded-2xl border p-6 ${theme.panelClass}`}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="font-cute-display text-lg">Your thoughts</h3>
              {entry.blurContent && (
                <button
                  type="button"
                  onClick={() => setIsContentRevealed((value) => !value)}
                  className={`smooth-press inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition hover:scale-[1.02] ${theme.borderClass}`}
                >
                  {isContentRevealed ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  {isContentRevealed ? 'Hide again' : 'Reveal'}
                </button>
              )}
            </div>
            {shouldBlurContent ? (
              <div className="relative overflow-hidden rounded-xl border border-white/30">
                <p className={`maskoff-entry-blur whitespace-pre-wrap p-4 leading-relaxed ${theme.textClass}`}>
                  {entry.content || 'No written content yet.'}
                </p>
                <button
                  type="button"
                  onClick={() => setIsContentRevealed(true)}
                  className="smooth-press absolute inset-0 flex items-center justify-center bg-slate-950/35 p-4 text-center text-sm font-semibold text-white backdrop-blur-sm"
                >
                  Blurred by choice. Tap to reveal when you feel ready.
                </button>
              </div>
            ) : (
              <p className={`whitespace-pre-wrap leading-relaxed ${theme.textClass}`}>{entry.content || 'No written content yet.'}</p>
            )}
          </section>

          {/* Summary */}
          {entry.summary && (
            <section className={`smooth-card rounded-2xl border p-6 ${theme.panelClass}`}>
              <h3 className="font-cute-display text-lg mb-4">Summary</h3>
              <p className={`${theme.textClass}`}>{entry.summary}</p>
            </section>
          )}

          {/* Cognitive Distortion & Reframe */}
          <div className="grid gap-6 sm:grid-cols-2">
            {entry.cognitiveDistortion && (
              <section className={`smooth-card rounded-2xl border p-6 ${theme.panelClass}`}>
                <h3 className="font-cute-display text-lg mb-4">Cognitive Distortion</h3>
                <p className={`${theme.textClass}`}>{entry.cognitiveDistortion}</p>
              </section>
            )}
            {entry.reframe && (
              <section className={`smooth-card rounded-2xl border p-6 ${theme.panelClass}`}>
                <h3 className="font-cute-display text-lg mb-4">Reframe</h3>
                <p className={`${theme.textClass}`}>{entry.reframe}</p>
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
