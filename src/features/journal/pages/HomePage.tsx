import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BookOpen, CalendarDays, Clock, LockKeyhole, Mic, Plus, Quote, Search, Sparkles } from 'lucide-react';
import { loadUnifiedEntries, type UnifiedEntry } from '../data/entries';

const hourlyQuotes = [
  'Start with one honest sentence.',
  'Small progress is still proof that you are moving.',
  'You can be gentle and still be serious about growth.',
  'Write what is true now. Clarity can come later.',
  'A calm mind is built one pause at a time.',
  'Today does not need to be perfect to be meaningful.',
  'Your feelings are information, not instructions.',
  'Make space for the version of you that is trying.',
  'One brave note can change the shape of the day.',
  'Breathe first, then choose the next small step.',
  'You are allowed to begin again in the middle of things.',
  'Name the feeling, then give yourself room.',
];

function getHourlyQuote(date: Date) {
  return hourlyQuotes[(date.getDate() + date.getHours()) % hourlyQuotes.length];
}

export function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [unifiedEntries] = useState<UnifiedEntry[]>(loadUnifiedEntries);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 30000);

    return () => window.clearInterval(intervalId);
  }, []);

  const todayLabel = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const hourlyQuote = getHourlyQuote(now);

  const filtered = unifiedEntries.filter((entry) => {
    const query = searchQuery.toLowerCase();
    return (
      entry.title.toLowerCase().includes(query) ||
      entry.content.toLowerCase().includes(query) ||
      entry.moodLabel?.toLowerCase().includes(query)
    );
  });

  const thisWeekCount = unifiedEntries.filter((entry) => {
    const created = new Date(entry.createdAt);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return created >= sevenDaysAgo;
  }).length;

  const privateCount = unifiedEntries.filter((entry) => entry.isMaskOff).length;

  return (
    <div className="font-maskoff px-4 pb-6">
      <section className="pt-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="font-cute-display bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-4xl text-transparent">
              MabuhAi
            </h1>
            <p className="mt-1 text-sm text-gray-400 dark:text-slate-400">Your thoughts are safe here</p>
          </div>
        </div>

        <div className="mt-6">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-purple-500 dark:text-purple-300">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            Today
          </p>
          <h2 className="font-cute-display mt-2 text-3xl leading-tight text-gray-950 dark:text-slate-50">
            {todayLabel}
          </h2>
          <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-2 text-base font-bold text-sky-700 shadow-sm dark:bg-sky-950/40 dark:text-sky-200">
            <Clock className="h-4 w-4" aria-hidden="true" />
            {timeLabel}
          </p>
          <div className="smooth-card mt-4 flex gap-3 rounded-3xl border border-purple-100 bg-gradient-to-r from-purple-50 via-pink-50 to-amber-50 p-4 text-gray-800 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 dark:text-slate-100">
            <Quote className="mt-0.5 h-4 w-4 shrink-0 text-purple-500" aria-hidden="true" />
            <p className="text-sm font-semibold leading-6">{hourlyQuote}</p>
          </div>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-3 gap-3">
        <DashboardStat label="Total" value={unifiedEntries.length} />
        <DashboardStat label="This week" value={thisWeekCount} />
        <DashboardStat label="Private" value={privateCount} />
      </section>

      <motion.button
        type="button"
        onClick={() => navigate('/new')}
        whileHover={{ y: -2, scale: 1.01 }}
        whileTap={{ scale: 0.985 }}
        transition={{ type: 'spring', stiffness: 420, damping: 26 }}
        className="smooth-press mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-4 text-sm font-bold text-white shadow-lg shadow-purple-500/20 transition hover:shadow-purple-500/30"
      >
        <Plus className="h-5 w-5" aria-hidden="true" />
        Record new thought
      </motion.button>

      <div className="relative mt-5">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
        <input
          type="text"
          placeholder="Search normal and Mask-Off entries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="smooth-field w-full rounded-2xl bg-white px-9 py-3 text-sm shadow-sm border border-gray-100 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-purple-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </div>

      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-cute-display text-lg text-gray-800 dark:text-slate-100">Entries</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">{filtered.length} shown</p>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-dashed border-gray-200 py-16 text-center dark:border-slate-700"
            >
              <BookOpen className="mx-auto mb-4 h-16 w-16 text-gray-300 dark:text-slate-500" />
              <p className="text-gray-400 dark:text-slate-400">No entries found</p>
            </motion.div>
          ) : (
            filtered.map((entry) => (
              <motion.button
                type="button"
                key={`${entry.isMaskOff ? 'maskoff' : 'journal'}-${entry.id}`}
                layout
                initial={{ opacity: 0, y: 10, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                whileHover={{ y: -3, scale: 1.01 }}
                whileTap={{ scale: 0.985, y: 0 }}
                transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                onClick={() => navigate(entry.route)}
                className="smooth-card w-full rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h3 className={`font-cute-display text-base ${entry.isMaskOff ? 'blur-sm text-gray-400 dark:text-slate-500' : 'text-gray-800 dark:text-slate-100'}`}>{entry.title}</h3>
                  <div className="flex shrink-0 items-center gap-2">
                    {entry.isMaskOff && (
                      <span className="rounded-full bg-slate-900 px-2 py-1 text-xs text-white dark:bg-slate-100 dark:text-slate-950">
                        <LockKeyhole className="mr-1 inline h-3 w-3" aria-hidden="true" />
                        Private
                      </span>
                    )}
                    {entry.moodEmoji && (
                      <span className="rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-700 dark:bg-purple-900 dark:text-purple-200">
                        {entry.moodEmoji} {entry.moodLabel}
                      </span>
                    )}
                  </div>
                </div>
                <p className={`line-clamp-2 text-sm ${entry.isMaskOff ? 'text-gray-400 dark:text-slate-500' : 'text-gray-600 dark:text-slate-300'} ${entry.blurContent ? 'select-none blur-sm' : entry.isMaskOff ? 'blur-sm' : ''}`}>
                  {entry.content || 'No written content yet.'}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-gray-400 dark:text-slate-400">
                    {new Date(entry.createdAt).toLocaleDateString()} · {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {!entry.isMaskOff && <Mic className="h-3 w-3 text-gray-400" />}
                </div>
              </motion.button>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function DashboardStat({ label, value }: { label: string; value: number }) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      className="smooth-card rounded-2xl border border-purple-100 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800"
    >
      <Sparkles className="mb-2 h-4 w-4 text-purple-500" aria-hidden="true" />
      <p className="font-cute-display text-2xl text-gray-900 dark:text-slate-50">{value}</p>
      <p className="text-xs text-gray-500 dark:text-slate-400">{label}</p>
    </motion.div>
  );
}
