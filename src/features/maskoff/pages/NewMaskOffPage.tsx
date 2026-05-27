import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, EyeOff, Mic, Moon, Square, Sun, Trash2 } from 'lucide-react';
import { useTheme } from '../../../context/theme';
import { cognitiveDistortions } from '../../../types/journal';
import { ComfortCompanion } from '../components/ComfortCompanion';
import { MoodTracker } from '../components/MoodTracker';
import { PrivacyBadge } from '../components/PrivacyBadge';
import { QuickHideToggle } from '../components/QuickHideToggle';
import { SummarySelect } from '../components/SummarySelect';
import {
  getMaskOffTheme,
  MASK_OFF_ENTRIES_KEY,
  MASK_OFF_THEME_KEY,
  type MaskOffEntry,
} from '../data/maskOffConfig';

export function NewMaskOffPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme: appTheme, toggleTheme } = useTheme();
  const isDark = appTheme === 'dark';
  const theme = getMaskOffTheme(location.state?.themeId ?? localStorage.getItem(MASK_OFF_THEME_KEY));
  const editingEntryId = location.state?.entryId as string | undefined;
  const editingEntry = (() => {
    if (!editingEntryId) return undefined;

    const stored = localStorage.getItem(MASK_OFF_ENTRIES_KEY);
    const existingEntries = stored ? (JSON.parse(stored) as MaskOffEntry[]) : [];

    return existingEntries.find((entry) => entry.id === editingEntryId);
  })();

  const [title, setTitle] = useState(editingEntry?.title ?? '');
  const [content, setContent] = useState(editingEntry?.content ?? '');
  const [selectedMood, setSelectedMood] = useState<string | null>(editingEntry?.mood ?? null);
  const [moodIntensity, setMoodIntensity] = useState(editingEntry?.intensity ?? 5);
  const [selectedSummary, setSelectedSummary] = useState(editingEntry?.summary ?? '');
  const [cognitiveDistortion, setCognitiveDistortion] = useState(editingEntry?.cognitiveDistortion ?? '');
  const [reframe, setReframe] = useState(editingEntry?.reframe ?? '');
  const [blurContent, setBlurContent] = useState(Boolean(editingEntry?.blurContent));
  const [isHidden, setIsHidden] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(editingEntry?.voiceDuration ?? 0);
  const durationIntervalRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => chunks.push(event.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);

      let duration = 0;
      durationIntervalRef.current = window.setInterval(() => {
        duration += 1;
        setRecordingDuration(duration);
      }, 1000);
    } catch {
      alert('Please allow microphone access');
    }
  };

  const stopRecording = () => {
    if (!mediaRecorder || !isRecording) return;

    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach((track) => track.stop());
    setIsRecording(false);

    if (durationIntervalRef.current !== null) {
      clearInterval(durationIntervalRef.current);
    }
  };

  const deleteRecording = () => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }

    setAudioURL(null);
    setRecordingDuration(0);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSummaryChange = (summary: string) => {
    setSelectedSummary(summary);
    if (summary && content.trim().length === 0) {
      setContent(`${summary}.\n\n`);
    }
  };

  const handleSave = () => {
    const stored = localStorage.getItem(MASK_OFF_ENTRIES_KEY);
    const existingEntries = stored ? (JSON.parse(stored) as MaskOffEntry[]) : [];
    const existingEntry = editingEntryId
      ? existingEntries.find((entry) => entry.id === editingEntryId)
      : undefined;
    const entry: MaskOffEntry = {
      id: existingEntry?.id ?? crypto.randomUUID?.() ?? `${Date.now()}`,
      title: title.trim(),
      content: content.trim(),
      blurContent,
      mood: selectedMood,
      intensity: moodIntensity,
      summary: selectedSummary,
      cognitiveDistortion,
      reframe: reframe.trim(),
      voiceDuration: audioURL ? recordingDuration : existingEntry?.voiceDuration ?? null,
      createdAt: existingEntry?.createdAt ?? new Date().toISOString(),
    };

    const nextEntries = existingEntry
      ? existingEntries.map((existing) => existing.id === existingEntry.id ? entry : existing)
      : [entry, ...existingEntries];

    localStorage.setItem(MASK_OFF_ENTRIES_KEY, JSON.stringify(nextEntries));
    navigate('/maskoff', { state: { fromEntry: true } });
  };

  return (
    <div className={`min-h-screen ${theme.pageClass}`}>
      <div className={`relative z-10 transition duration-300 ${isHidden ? 'maskoff-private-blur' : ''}`}>
        <header className="sticky top-0 z-20 px-4 py-4 backdrop-blur-xl">
          <div className="mx-auto mb-3 flex max-w-3xl items-center justify-end gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={isDark}
              onClick={toggleTheme}
              className={`smooth-press inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition hover:scale-[1.02] ${theme.panelClass} ${theme.textClass}`}
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              {isDark ? <Moon className="h-4 w-4" aria-hidden="true" /> : <Sun className="h-4 w-4" aria-hidden="true" />}
              {isDark ? 'Dark' : 'Light'}
            </button>
          </div>

          <div className={`smooth-card mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-3xl border p-2 ${theme.panelClass}`}>
            <button
              type="button"
              onClick={() => navigate('/maskoff', { state: { fromEntry: true } })}
              className="smooth-press rounded-full p-2 transition hover:bg-white/20"
              aria-label="Back to Mask-Off Journal"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="text-center">
              <h1 className="font-cute-display text-xl">
                {isHidden ? 'Notes' : editingEntryId ? 'Edit Mask-Off Entry' : 'New Mask-Off Entry'}
              </h1>
              <p className={`text-xs ${theme.mutedTextClass}`}>{isHidden ? 'Unsaved note' : 'Private draft, local to this device'}</p>
            </div>
            <button
              type="button"
              onClick={handleSave}
              className={`smooth-press rounded-full px-5 py-2 text-sm font-semibold transition hover:scale-[1.02] ${theme.accentClass}`}
            >
              Save
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-3xl space-y-5 px-4 py-6 pb-24">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <PrivacyBadge theme={theme} />
            <QuickHideToggle isHidden={isHidden} onToggle={() => setIsHidden((value) => !value)} theme={theme} />
          </div>

          <section className={`smooth-card rounded-2xl border p-4 ${theme.panelClass}`}>
            <label htmlFor="maskoff-title" className="sr-only">Title</label>
            <input
              id="maskoff-title"
              type="text"
              placeholder="Title (optional)"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={`smooth-field font-cute-display maskoff-breathe-caret w-full border-b bg-transparent py-3 text-2xl outline-none placeholder:opacity-60 focus:border-current ${theme.borderClass}`}
            />
          </section>

          <section className={`smooth-card rounded-2xl border p-3 ${theme.panelClass}`}>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`smooth-press relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full shadow-lg ${isRecording ? 'bg-red-500 text-white shadow-red-500/20' : theme.accentClass}`}
                aria-label={isRecording ? 'Stop recording voice note' : 'Record optional voice note'}
              >
                {isRecording && <span className="absolute inset-0 rounded-full bg-red-300/40 animate-ping" aria-hidden="true" />}
                {isRecording ? <Square className="relative h-5 w-5 fill-current" aria-hidden="true" /> : <Mic className="relative h-6 w-6" aria-hidden="true" />}
              </button>
              <div className="min-w-0 flex-1 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">Voice note</p>
                  <span className={`rounded-full border px-2 py-0.5 text-[0.68rem] font-semibold uppercase ${theme.borderClass}`}>
                    Optional
                  </span>
                </div>
                <p className={`mt-1 text-xs ${theme.mutedTextClass}`}>
                  {isRecording ? `${formatDuration(recordingDuration)} - tap to stop` : audioURL ? `Captured ${formatDuration(recordingDuration)}` : 'Say the thing before you edit it.'}
                </p>
                {audioURL && <audio src={audioURL} controls className="mt-3 w-full" />}
              </div>
              {audioURL && (
                <button
                  type="button"
                  onClick={deleteRecording}
                  className="smooth-press rounded-full border border-red-300/60 p-2 text-red-500 hover:bg-red-500/10"
                  aria-label="Delete voice note"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </section>

          <MoodTracker
            selectedMood={selectedMood}
            intensity={moodIntensity}
            onMoodChange={setSelectedMood}
            onIntensityChange={setMoodIntensity}
            theme={theme}
          />

          <SummarySelect value={selectedSummary} onChange={handleSummaryChange} theme={theme} />

          <section className={`smooth-card rounded-2xl border p-4 ${theme.panelClass}`}>
            <button
              type="button"
              role="switch"
              aria-checked={blurContent}
              onClick={() => setBlurContent((value) => !value)}
              className="smooth-press flex w-full items-center justify-between gap-4 text-left"
            >
              <span className="flex min-w-0 items-start gap-3">
                <span className={`mt-0.5 rounded-full p-2 ${theme.accentClass}`}>
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">Blur this entry after saving</span>
                  <span className={`mt-1 block text-xs leading-5 ${theme.mutedTextClass}`}>
                    Keep the raw words hidden in your Mask-Off list and detail view until you choose to reveal them.
                  </span>
                </span>
              </span>
              <span className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${blurContent ? 'bg-slate-950/80 dark:bg-white/80' : 'bg-white/70 dark:bg-slate-950/70'}`}>
                <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform dark:bg-slate-900 ${blurContent ? 'translate-x-6' : 'translate-x-1'}`} />
              </span>
            </button>
          </section>

          <section className={`smooth-card rounded-2xl border p-4 ${theme.panelClass}`}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Cognitive distortion</span>
                <select
                  value={cognitiveDistortion}
                  onChange={(event) => setCognitiveDistortion(event.target.value)}
                  className={`smooth-field w-full rounded-xl border bg-white/72 p-3 text-sm text-slate-950 outline-none focus:ring-2 focus:ring-current ${theme.borderClass}`}
                >
                  <option value="">Optional...</option>
                  {cognitiveDistortions.map((distortion) => (
                    <option key={distortion} value={distortion}>{distortion}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Reframe this thought</span>
                <textarea
                  value={reframe}
                  onChange={(event) => setReframe(event.target.value)}
                  rows={3}
                  placeholder="Optional gentler perspective..."
                  className={`smooth-field w-full resize-none rounded-xl border bg-white/72 p-3 text-sm text-slate-950 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-current ${theme.borderClass}`}
                />
              </label>
            </div>
          </section>

          <section className={`smooth-card rounded-2xl border p-4 ${theme.panelClass}`}>
            <label htmlFor="maskoff-content" className="mb-2 block text-sm font-semibold">
              Raw thoughts
            </label>
            <textarea
              id="maskoff-content"
              placeholder={selectedSummary || 'Write the unfiltered version here...'}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={9}
              className="smooth-field maskoff-breathe-caret min-h-56 w-full resize-none rounded-xl border border-white/40 bg-white/72 p-4 text-base leading-7 text-slate-950 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-current"
            />
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
            Quick-hide is on. Tap anywhere to reveal.
          </span>
        </button>
      )}
      <ComfortCompanion theme={theme} />
    </div>
  );
}
