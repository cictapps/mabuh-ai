import { type ReactNode, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BarChart3, BookOpen, CalendarDays, ChevronLeft, ChevronRight, HeartPulse, LockKeyhole, PieChart, Sparkles } from 'lucide-react';
import { getDateKey, loadUnifiedEntries, type UnifiedEntry } from '../data/entries';

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const emotionPalette = [
  { chip: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200', bar: 'bg-rose-500' },
  { chip: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200', bar: 'bg-amber-500' },
  { chip: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200', bar: 'bg-emerald-500' },
  { chip: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-200', bar: 'bg-sky-500' },
  { chip: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-200', bar: 'bg-violet-500' },
  { chip: 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200', bar: 'bg-slate-500' },
];

export function MoodCalendarPage() {
  const navigate = useNavigate();
  const [entries] = useState<UnifiedEntry[]>(loadUnifiedEntries);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(() => getDateKey(new Date()));
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const todayKey = getDateKey(new Date());

  const entriesByDate = useMemo(() => {
    return entries.reduce<Record<string, UnifiedEntry[]>>((acc, entry) => {
      const key = getDateKey(new Date(entry.createdAt));
      acc[key] = [...(acc[key] ?? []), entry];
      return acc;
    }, {});
  }, [entries]);

  const calendarCells = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const blanks = Array.from({ length: firstDay }, () => null);
    const days = Array.from({ length: daysInMonth }, (_, index) => new Date(year, month, index + 1));

    return [...blanks, ...days];
  }, [month, year]);

  const emotionBreakdown = useMemo(() => {
    const counts = entries.reduce<Record<string, { count: number; emoji: string | null; label: string }>>((acc, entry) => {
      if (!entry.moodLabel) return acc;

      const key = entry.moodLabel;
      acc[key] = {
        count: (acc[key]?.count ?? 0) + 1,
        emoji: entry.moodEmoji,
        label: entry.moodLabel,
      };
      return acc;
    }, {});

    const total = Object.values(counts).reduce((sum, item) => sum + item.count, 0);

    return Object.values(counts)
      .map((item) => ({
        ...item,
        percent: total > 0 ? Math.round((item.count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [entries]);

  const selectedEntries = entriesByDate[selectedDateKey] ?? [];
  const monthLabel = visibleMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const selectedDateLabel = new Date(`${selectedDateKey}T00:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const journalCount = entries.filter((entry) => !entry.isMaskOff).length;
  const maskOffCount = entries.filter((entry) => entry.isMaskOff).length;
  const activeDays = Object.keys(entriesByDate).length;
  const thisWeekCount = entries.filter((entry) => {
    const created = new Date(entry.createdAt);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return created >= sevenDaysAgo;
  }).length;
  const monthEntryCount = entries.filter((entry) => {
    const created = new Date(entry.createdAt);
    return created.getFullYear() === year && created.getMonth() === month;
  }).length;
  const topEmotion = emotionBreakdown[0];

  const changeMonth = (amount: number) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  };

  return (
    <main className="font-maskoff mx-auto max-w-6xl px-4 pb-28 pt-6">
      <section className="rounded-3xl border border-purple-100 bg-white/92 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/92">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-500 dark:text-purple-300">Dashboard</p>
            <h1 className="font-cute-display mt-2 text-4xl text-gray-950 dark:text-slate-50">My Journal</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500 dark:text-slate-400">
              A complete view of your entries, calendar rhythm, and emotional patterns.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {monthEntryCount} this month
          </span>
        </div>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <DashboardTile
          icon={<BookOpen className="h-4 w-4" aria-hidden="true" />}
          label="Total entries"
          value={entries.length}
          detail={`${journalCount} journal, ${maskOffCount} private`}
        />
        <DashboardTile
          icon={<CalendarDays className="h-4 w-4" aria-hidden="true" />}
          label="Tracked days"
          value={activeDays}
          detail="Days with at least one entry"
        />
        <DashboardTile
          icon={<HeartPulse className="h-4 w-4" aria-hidden="true" />}
          label="Top emotion"
          value={topEmotion ? `${topEmotion.emoji ?? ''} ${topEmotion.label}` : 'None'}
          detail={topEmotion ? `${topEmotion.percent}% of tagged entries` : 'Add moods to see patterns'}
        />
        <DashboardTile
          icon={<BarChart3 className="h-4 w-4" aria-hidden="true" />}
          label="This week"
          value={thisWeekCount}
          detail="Entries in the last 7 days"
        />
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-5">
        <section className="smooth-card rounded-3xl border border-purple-100 bg-white/92 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/92 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-900/70 dark:text-purple-200">
                <CalendarDays className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-cute-display text-2xl text-gray-900 dark:text-slate-50">Calendar</h2>
                <p className="text-sm text-gray-500 dark:text-slate-400">{monthLabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                className="smooth-press rounded-full border border-purple-100 bg-white p-2 text-gray-500 shadow-sm hover:bg-purple-50 hover:text-purple-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => changeMonth(1)}
                className="smooth-press rounded-full border border-purple-100 bg-white p-2 text-gray-500 shadow-sm hover:bg-purple-50 hover:text-purple-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[0.68rem] font-semibold uppercase text-gray-400 dark:text-slate-500">
            {weekDays.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1.5">
            {calendarCells.map((date, index) => {
              if (!date) {
                return <div key={`blank-${index}`} className="aspect-square" />;
              }

              const dateKey = getDateKey(date);
              const dayEntries = entriesByDate[dateKey] ?? [];
              const dayEmojis = Array.from(
                new Set(dayEntries.map((entry) => entry.moodEmoji).filter((emoji): emoji is string => Boolean(emoji)))
              ).slice(0, 3);
              const isToday = dateKey === todayKey;
              const isSelected = dateKey === selectedDateKey;

              return (
                <motion.button
                  key={dateKey}
                  type="button"
                  whileHover={{ y: -2, scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  onClick={() => setSelectedDateKey(dateKey)}
                  className={`smooth-card flex aspect-square min-h-11 flex-col items-center justify-between rounded-2xl border p-1.5 text-center ${
                    dayEntries.length > 0
                      ? 'border-purple-200 bg-purple-50 text-purple-900 shadow-sm dark:border-purple-700 dark:bg-purple-950/50 dark:text-purple-100'
                      : 'border-gray-100 bg-gray-50/70 text-gray-400 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-500'
                  } ${isToday ? 'ring-2 ring-rose-400/50' : ''} ${isSelected ? 'scale-[1.03] border-purple-400 shadow-md shadow-purple-500/10' : ''}`}
                  aria-label={`${date.toLocaleDateString()} ${dayEntries.length} entries`}
                >
                  <span className="self-start text-[0.68rem] font-bold">{date.getDate()}</span>
                  <span className="flex min-h-5 items-center justify-center gap-0.5 text-sm leading-none sm:text-base">
                    {dayEmojis.map((emoji) => <span key={emoji}>{emoji}</span>)}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </section>

        <section className="smooth-card rounded-3xl border border-purple-100 bg-white/92 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/92 lg:col-span-2">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-200">
              <PieChart className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-cute-display text-2xl text-gray-900 dark:text-slate-50">Emotion Mix</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                {emotionBreakdown.length > 0 ? 'Percent of mood-tagged entries' : 'No mood data yet'}
              </p>
            </div>
          </div>

          {emotionBreakdown.length > 0 ? (
            <div className="space-y-4">
              <div className="rounded-3xl bg-gradient-to-r from-rose-50 via-amber-50 to-sky-50 p-4 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-slate-400">Most frequent</p>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <p className="font-cute-display text-3xl text-gray-950 dark:text-slate-50">
                    {topEmotion?.emoji} {topEmotion?.label}
                  </p>
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-rose-700 shadow-sm dark:bg-slate-950 dark:text-rose-200">
                    {topEmotion?.percent}%
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {emotionBreakdown.map((emotion, index) => {
                  const palette = emotionPalette[index % emotionPalette.length];

                  return (
                    <div key={emotion.label}>
                      <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                        <span className={`inline-flex min-w-0 items-center gap-2 rounded-full px-2.5 py-1 font-semibold ${palette.chip}`}>
                          <span>{emotion.emoji}</span>
                          <span className="truncate">{emotion.label}</span>
                        </span>
                        <span className="shrink-0 text-xs font-bold text-gray-500 dark:text-slate-400">
                          {emotion.percent}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-900">
                        <div className={`h-full rounded-full ${palette.bar}`} style={{ width: `${emotion.percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400 dark:border-slate-700 dark:text-slate-500">
              Add moods to your entries and this dashboard will show the percentage for each emotion.
            </p>
          )}
        </section>
      </section>

      <section className="smooth-card mt-4 rounded-3xl border border-purple-100 bg-white/92 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/92">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-cute-display text-xl text-gray-900 dark:text-slate-50">{selectedDateLabel}</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">Selected day entries</p>
          </div>
          <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-950/70 dark:text-purple-200">
            {selectedEntries.length} entries
          </span>
        </div>

        {selectedEntries.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {selectedEntries.map((entry) => (
              <button
                key={`${entry.isMaskOff ? 'maskoff' : 'journal'}-${entry.id}`}
                type="button"
                onClick={() => navigate(entry.route)}
                className="smooth-card flex w-full items-center gap-3 rounded-2xl border border-purple-100 bg-purple-50/70 p-3 text-left dark:border-slate-700 dark:bg-slate-900/70"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-xl shadow-sm dark:bg-slate-800">
                  {entry.moodEmoji ?? '-'}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-sm font-semibold ${entry.isMaskOff ? 'blur-sm text-gray-400 dark:text-slate-500' : 'text-gray-900 dark:text-slate-100'}`}>
                    {entry.title}
                  </span>
                  <span className="block truncate text-xs text-gray-500 dark:text-slate-400">
                    {entry.moodLabel ?? 'No mood'} {entry.isMaskOff ? '- Mask-Off' : ''}
                  </span>
                </span>
                {entry.isMaskOff && <LockKeyhole className="h-4 w-4 text-gray-400" aria-hidden="true" />}
              </button>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400 dark:border-slate-700 dark:text-slate-500">
            No entries for this day yet.
          </p>
        )}
      </section>
    </main>
  );
}

function DashboardTile({ icon, label, value, detail }: { icon: ReactNode; label: string; value: ReactNode; detail: string }) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      className="smooth-card rounded-2xl border border-purple-100 bg-white/92 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800/92"
    >
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-200">
        {icon}
      </div>
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-gray-400 dark:text-slate-500">{label}</p>
      <p className="font-cute-display mt-1 truncate text-lg leading-tight text-gray-950 dark:text-slate-50">{value}</p>
      <p className="mt-1 line-clamp-2 text-[0.68rem] leading-4 text-gray-500 dark:text-slate-400">{detail}</p>
    </motion.div>
  );
}
