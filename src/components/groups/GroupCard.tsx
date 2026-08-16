import React, { useState, useEffect } from 'react';
import { Users, Calendar, BookOpen, Plus, MoreVertical, Edit2, Trash2, ArrowRight } from 'lucide-react';
import { Group, Lesson } from '../../types';
import { db } from '../../db/db';
import { formatLessonDateShort, getRelativeDateBadge } from '../../utils/formatters';

interface GroupCardProps {
  group: Group;
  onOpenGroup: (groupId: string) => void;
  onNewLesson: (groupId: string) => void;
  onEditGroup: (group: Group) => void;
  onDeleteGroup: (group: Group) => void;
}

export const GroupCard: React.FC<GroupCardProps> = ({
  group,
  onOpenGroup,
  onNewLesson,
  onEditGroup,
  onDeleteGroup,
}) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    let mounted = true;
    db.lessons.where('groupId').equals(group.id).toArray().then(items => {
      if (mounted) setLessons(items);
    });
    return () => { mounted = false; };
  }, [group.id]);

  // Find latest lesson
  const sortedLessons = [...lessons].sort((a, b) => b.date.localeCompare(a.date));
  const latestLesson = sortedLessons[0];
  const relativeBadge = latestLesson ? getRelativeDateBadge(latestLesson.date) : null;

  return (
    <div className="group relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-brand-200 dark:hover:border-slate-700 transition-all flex flex-col justify-between p-5">
      {/* Top Bar with Title & Menu */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div 
            onClick={() => onOpenGroup(group.id)}
            className="flex-1 cursor-pointer min-w-0"
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
              {group.name}
            </h3>
            {group.description ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                {group.description}
              </p>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-600 mt-1 italic">
                No description
              </p>
            )}
          </div>

          {/* Action Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Group options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => setShowMenu(false)} 
                />
                <div className="absolute right-0 mt-1 w-36 z-30 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 text-xs">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onEditGroup(group);
                    }}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                    Edit Group
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDeleteGroup(group);
                    }}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            <span>
              <strong className="font-semibold text-slate-800 dark:text-slate-200">{lessons.length}</strong> {lessons.length === 1 ? 'lesson' : 'lessons'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {latestLesson ? (
              <span className="flex items-center gap-1 truncate">
                <span>{formatLessonDateShort(latestLesson.date)}</span>
                {relativeBadge && (
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                    relativeBadge.isRecent 
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200/80 dark:border-brand-800' 
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {relativeBadge.label}
                  </span>
                )}
              </span>
            ) : (
              <span className="text-slate-400 dark:text-slate-500 italic">No lessons yet</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mt-4 pt-2">
        <button
          onClick={() => onNewLesson(group.id)}
          className="flex-1 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Lesson</span>
        </button>

        <button
          onClick={() => onOpenGroup(group.id)}
          className="px-3.5 py-2 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
        >
          <span>Open</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
