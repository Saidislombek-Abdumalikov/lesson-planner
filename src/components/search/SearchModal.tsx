import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Calendar, FileText, CheckSquare, Paperclip, Sparkles, ArrowRight } from 'lucide-react';
import { SearchResult } from '../../types';
import { searchAll } from '../../db/db';
import { formatLessonDateShort } from '../../utils/formatters';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLesson: (lessonId: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectLesson,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        // Trigger is handled externally
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchAll(query);
        setResults(res);
      } finally {
        setIsSearching(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const renderBadge = (match: SearchResult['matchedIn']) => {
    switch (match) {
      case 'title':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
            Title
          </span>
        );
      case 'plan':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
            <FileText className="w-2.5 h-2.5" /> Plan
          </span>
        );
      case 'homework':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
            <CheckSquare className="w-2.5 h-2.5" /> Homework
          </span>
        );
      case 'notes':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
            <Sparkles className="w-2.5 h-2.5" /> Notes
          </span>
        );
      case 'file':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
            <Paperclip className="w-2.5 h-2.5" /> File
          </span>
        );
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 sm:pt-20 bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search lessons, plans, homework, notes, files..."
            className="flex-1 bg-transparent text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 rounded">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="overflow-y-auto p-2 flex-1 divide-y divide-slate-100 dark:divide-slate-800/80">
          {!query.trim() ? (
            <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500 space-y-1">
              <p>Type keywords to search across your entire lesson archive.</p>
              <p className="text-[11px] text-slate-400">e.g. "Present Simple", "Workbook page 24", "Animals", "Test"</p>
            </div>
          ) : isSearching ? (
            <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
              Searching lesson archive...
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
              No matching lessons found for "{query}"
            </div>
          ) : (
            results.map(res => (
              <div
                key={res.lesson.id}
                onClick={() => {
                  onSelectLesson(res.lesson.id);
                  onClose();
                }}
                className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl cursor-pointer transition-colors group flex items-start justify-between gap-3"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {res.groupName}
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span className="text-xs font-medium text-brand-600 dark:text-brand-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatLessonDateShort(res.lesson.date)}
                    </span>
                    {renderBadge(res.matchedIn)}
                  </div>

                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {res.lesson.title || 'Untitled Lesson'}
                  </h4>

                  {res.matchedIn !== 'title' && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 bg-slate-50 dark:bg-slate-800/40 p-1.5 rounded border border-slate-100 dark:border-slate-800 font-sans">
                      {res.snippet}
                    </p>
                  )}
                </div>

                <div className="flex items-center text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all self-center">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
