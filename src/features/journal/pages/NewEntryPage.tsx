import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mic, Square, Trash2 } from 'lucide-react';
import {
  cognitiveDistortions,
  feelingSummaries,
  JOURNAL_ENTRIES_KEY,
  moodEmojis,
  type JournalEntry,
  type Mood,
} from '../../../types/journal';

const moods: Mood[] = ['happy', 'calm', 'grateful', 'anxious', 'sad', 'angry', 'confused', 'hopeful', 'tired', 'neutral'];

export function NewEntryPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [feelingSummary, setFeelingSummary] = useState('');
  const [cognitiveDistortion, setCognitiveDistortion] = useState('');
  const [reframe, setReframe] = useState('');
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const durationIntervalRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
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
        duration++;
        setRecordingDuration(duration);
      }, 1000);
    } catch {
      alert('Please allow microphone access');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (durationIntervalRef.current !== null) {
        clearInterval(durationIntervalRef.current);
      }
    }
  };

  const deleteRecording = () => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
      setAudioURL(null);
      setRecordingDuration(0);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSave = () => {
    const stored = localStorage.getItem(JOURNAL_ENTRIES_KEY);
    const existingEntries = stored ? (JSON.parse(stored) as JournalEntry[]) : [];
    const now = new Date().toISOString();
    const entry: JournalEntry = {
      id: crypto.randomUUID?.() ?? `${Date.now()}`,
      user_id: 'local',
      title: title.trim() || 'Untitled entry',
      content: content.trim(),
      mood: selectedMood,
      voice_url: audioURL,
      voice_duration: audioURL ? recordingDuration : null,
      is_mask_off: false,
      feeling_summary: feelingSummary,
      cognitive_distortion: cognitiveDistortion,
      reframe: reframe.trim(),
      created_at: now,
      updated_at: now,
    };

    localStorage.setItem(JOURNAL_ENTRIES_KEY, JSON.stringify([entry, ...existingEntries]));
    navigate('/');
  };

  return (
    <div className="font-maskoff">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md dark:border-slate-700 border-b border-gray-100 sticky top-0 z-10">
        <div className="px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="smooth-press p-2 hover:bg-purple-50 dark:hover:bg-purple-900/50 rounded-full">
            <ArrowLeft className="w-5 h-5 text-purple-600" />
          </button>
          <h2 className="font-cute-display text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            New Entry
          </h2>
          <button onClick={handleSave} className="smooth-press px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-sm font-medium shadow-md hover:shadow-lg hover:shadow-purple-500/25">
            Save
          </button>
        </div>
      </div>

      <div className="p-6 space-y-8 max-w-2xl mx-auto">
        <input
          type="text"
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="smooth-field font-cute-display w-full text-xl bg-transparent border-b-2 border-purple-200 py-2 focus:outline-none focus:border-purple-500 dark:text-slate-100"
        />

        <section className="smooth-card rounded-2xl border border-purple-100 bg-white p-3 shadow-sm dark:border-purple-700 dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className="smooth-press relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/20"
              aria-label={isRecording ? 'Stop recording voice note' : 'Record optional voice note'}
            >
              {isRecording && <span className="absolute inset-0 rounded-full bg-red-300/40 animate-ping" aria-hidden="true" />}
              {isRecording ? <Square className="relative h-5 w-5 fill-current" aria-hidden="true" /> : <Mic className="relative h-6 w-6" aria-hidden="true" />}
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">Voice note</p>
                <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[0.68rem] font-semibold uppercase text-purple-600 dark:bg-purple-950/60 dark:text-purple-200">Optional</span>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                {isRecording ? `${formatDuration(recordingDuration)} - tap to stop` : audioURL ? `Captured ${formatDuration(recordingDuration)}` : 'Tap to record a quick thought.'}
              </p>
              {audioURL && <audio src={audioURL} controls className="mt-3 w-full" />}
            </div>
            {audioURL && (
              <button
                type="button"
                onClick={deleteRecording}
                className="smooth-press rounded-full p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                aria-label="Delete voice note"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </section>

        <div>
          <button
            onClick={() => setShowMoodPicker(!showMoodPicker)}
            className="smooth-card w-full p-3 bg-white dark:bg-slate-800 rounded-xl border border-purple-100 dark:border-purple-700 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedMood ? moodEmojis[selectedMood] : '😊'}</span>
                <span className="text-sm text-gray-600">
                  {selectedMood ? `Feeling ${selectedMood}` : 'How are you feeling?'}
                </span>
              </div>
              <span className="text-purple-400 text-xs">{showMoodPicker ? '▲' : '▼'}</span>
            </div>
          </button>

          <AnimatePresence>
            {showMoodPicker && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-2 p-3 bg-white dark:bg-slate-800 rounded-xl shadow-lg dark:border-purple-700 border border-purple-100 grid grid-cols-5 gap-1"
              >
                {moods.map((mood) => (
                  <button
                    key={mood}
                    onClick={() => { setSelectedMood(mood); setShowMoodPicker(false); }}
                    className={`smooth-press p-2 rounded-lg text-center transition-all ${
                      selectedMood === mood ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm' : 'hover:bg-purple-50 hover:shadow-sm'
                    }`}
                  >
                    <div className="text-xl">{moodEmojis[mood]}</div>
                    <div className="text-xs capitalize">{mood}</div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-gray-700 dark:text-slate-200">How are you feeling?</span>
            <select
              value={feelingSummary}
              onChange={(event) => setFeelingSummary(event.target.value)}
              className="smooth-field w-full rounded-xl border border-purple-100 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-purple-400 dark:border-purple-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="">Choose a prompt...</option>
              {feelingSummaries.map((summary) => (
                <option key={summary} value={summary}>{summary}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-gray-700 dark:text-slate-200">Cognitive distortion</span>
            <select
              value={cognitiveDistortion}
              onChange={(event) => setCognitiveDistortion(event.target.value)}
              className="smooth-field w-full rounded-xl border border-purple-100 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-purple-400 dark:border-purple-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="">Optional...</option>
              {cognitiveDistortions.map((distortion) => (
                <option key={distortion} value={distortion}>{distortion}</option>
              ))}
            </select>
          </label>
        </div>

        <textarea
          placeholder="Reframe this thought (optional)..."
          value={reframe}
          onChange={(e) => setReframe(e.target.value)}
          rows={3}
          className="smooth-field w-full resize-none rounded-xl border border-purple-100 bg-white p-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400 dark:border-purple-700 dark:bg-slate-800 dark:text-slate-100"
        />

        <textarea
          placeholder="Write your thoughts here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className="smooth-field w-full p-4 bg-white dark:bg-slate-800 dark:text-slate-100 rounded-xl border border-purple-100 dark:border-purple-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
        />

        <div className="text-center py-4">
          <p className="text-xs text-gray-400 italic">"Your thoughts are safe here. No judgment, just reflection."</p>
        </div>
      </div>
    </div>
  );
}
