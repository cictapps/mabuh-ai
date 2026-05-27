import type { ReactNode } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../context/theme';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const isDark = theme === 'dark';
  const isMaskOffRoute = location.pathname.startsWith('/maskoff') || location.pathname.startsWith('/new-maskoff');

  return (
    <div className={`min-h-screen pb-24 transition-colors duration-300 ${isMaskOffRoute ? '' : 'bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-950'}`}>
      {!isMaskOffRoute && <header className="sticky top-0 z-20 flex justify-end px-4 pt-4">
        <button
          type="button"
          role="switch"
          aria-checked={isDark}
          onClick={toggleTheme}
          className="smooth-press inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
          <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDark ? 'bg-purple-600' : 'bg-slate-200'}`}>
            <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm transition-transform ${isDark ? 'translate-x-5' : 'translate-x-1'}`}>
              {isDark ? (
                <Moon className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Sun className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </span>
          </span>
          <span>{isDark ? 'Dark mode' : 'Light mode'}</span>
        </button>
      </header>}

      {children}
    </div>
  );
}
