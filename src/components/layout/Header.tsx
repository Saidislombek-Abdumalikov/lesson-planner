import React from 'react';
import { BookOpen, Search, Settings, Sun, Moon, Laptop, ChevronRight, ArrowLeft } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface HeaderProps {
  breadcrumbs?: { label: string; onClick?: () => void }[];
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  breadcrumbs = [],
  onOpenSearch,
  onOpenSettings,
  onBack,
}) => {
  const { theme, setTheme, isDark } = useTheme();

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors no-print">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        {/* Left Side: Brand / Back / Breadcrumbs */}
        <div className="flex items-center min-w-0 gap-2 sm:gap-3">
          {onBack && (
            <button
              onClick={onBack}
              aria-label="Go back"
              className="p-1.5 -ml-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div
            onClick={breadcrumbs[0]?.onClick}
            className="flex items-center gap-2 font-bold text-base sm:text-lg text-slate-900 dark:text-white cursor-pointer hover:opacity-85 transition-opacity flex-shrink-0"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-600 dark:bg-brand-500 flex items-center justify-center text-white shadow-sm">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="hidden sm:inline tracking-tight">Lesson Planner</span>
          </div>

          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1 text-sm min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 flex-shrink-0" />
                  {crumb.onClick ? (
                    <button
                      onClick={crumb.onClick}
                      className="text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 font-medium truncate max-w-[140px] sm:max-w-[200px] transition-colors"
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span className="text-slate-900 dark:text-slate-100 font-semibold truncate max-w-[150px] sm:max-w-[240px]">
                      {crumb.label}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Quick Search Button */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-2.5 py-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-800 rounded-lg border border-slate-200/70 dark:border-slate-700/60 transition-colors"
            title="Search lessons (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden md:inline">Search</span>
            <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded shadow-2xs">
              ⌘K
            </kbd>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={cycleTheme}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title={`Theme: ${theme} (click to toggle)`}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : theme === 'dark' ? (
              <Moon className="w-4 h-4 text-brand-400" />
            ) : (
              <Laptop className="w-4 h-4" />
            )}
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Settings & Data Backup"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
