import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import type { MaskOffTheme } from '../data/maskOffConfig';

const comfortMessages = [
  'Take your time.',
  'Your feelings are valid here.',
  'Breathe in, breathe out.',
  'No performance needed.',
  'You are allowed to tell the truth softly.',
];

interface ComfortCompanionProps {
  theme: MaskOffTheme;
}

export function ComfortCompanion({ theme }: ComfortCompanionProps) {
  const [messageIndex, setMessageIndex] = useState<number | null>(null);
  const message = useMemo(() => (messageIndex === null ? null : comfortMessages[messageIndex]), [messageIndex]);

  const showRandomMessage = () => {
    setMessageIndex(Math.floor(Math.random() * comfortMessages.length));
  };

  return (
    <div className="fixed bottom-24 right-4 z-30 flex flex-col items-end gap-2">
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            className={`smooth-card max-w-52 rounded-2xl border px-4 py-3 text-sm ${theme.panelClass}`}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        type="button"
        whileTap={{ scale: 0.92, rotate: -4 }}
        animate={{ y: [0, -4, 0] }}
        transition={{ y: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }}
        onClick={showRandomMessage}
        className={`smooth-press relative h-16 w-16 rounded-full border shadow-lg ${theme.panelClass}`}
        aria-label="Show a comforting message"
      >
        <span className="absolute left-1/2 top-6 h-7 w-10 -translate-x-1/2 rounded-full bg-white/90 shadow-inner" aria-hidden="true" />
        <span className="absolute left-[1.35rem] top-[2.15rem] h-1.5 w-1.5 rounded-full bg-slate-700" aria-hidden="true" />
        <span className="absolute right-[1.35rem] top-[2.15rem] h-1.5 w-1.5 rounded-full bg-slate-700" aria-hidden="true" />
        <span className="absolute left-1/2 top-[2.55rem] h-1 w-3 -translate-x-1/2 rounded-full bg-slate-400" aria-hidden="true" />
        <span className="sr-only">Comfort companion</span>
      </motion.button>
    </div>
  );
}
