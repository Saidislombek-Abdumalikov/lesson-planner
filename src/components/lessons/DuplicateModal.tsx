import React, { useState, useEffect } from 'react';
import { Copy, X, Calendar, Users } from 'lucide-react';
import { Group, Lesson } from '../../types';
import { getAllGroups } from '../../db/db';

interface DuplicateModalProps {
  isOpen: boolean;
  sourceLesson: Lesson | null;
  onDuplicate: (targetDate: string, targetGroupId: string) => Promise<void>;
  onClose: () => void;
}

export const DuplicateModal: React.FC<DuplicateModalProps> = ({
  isOpen,
  sourceLesson,
  onDuplicate,
  onClose,
}) => {
  const [targetDate, setTargetDate] = useState<string>('');
  const [targetGroupId, setTargetGroupId] = useState<string>('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && sourceLesson) {
      // Default to today's date
      const today = new Date().toISOString().split('T')[0];
      setTargetDate(today);
      setTargetGroupId(sourceLesson.groupId);

      getAllGroups().then(list => setGroups(list));
    }
  }, [isOpen, sourceLesson]);

  if (!isOpen || !sourceLesson) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDate) return;

    try {
      setIsSubmitting(true);
      await onDuplicate(targetDate, targetGroupId || sourceLesson.groupId);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <Copy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Duplicate Lesson
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Reuse lesson plan, homework, files & print list
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/70 dark:border-slate-700 text-xs space-y-1">
          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
            Source: {sourceLesson.title}
          </p>
          <p className="text-slate-500 dark:text-slate-400">
            Original Date: {sourceLesson.date}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              New Lesson Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Target Group
            </label>
            <select
              value={targetGroupId}
              onChange={e => setTargetGroupId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              {groups.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name} {g.id === sourceLesson.groupId ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Duplicating...' : 'Duplicate & Open'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
