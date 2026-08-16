import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  ArrowLeft, 
  Search, 
  Calendar, 
  ArrowUpDown, 
  Sparkles, 
  BookOpen, 
  Edit3, 
  Trash2,
  Filter
} from 'lucide-react';
import { Group, Lesson } from '../types';
import { 
  getGroup, 
  getLessonsByGroup, 
  deleteLesson, 
  duplicateLesson, 
  updateGroup,
  deleteGroup 
} from '../db/db';
import { LessonTimelineItem } from '../components/lessons/LessonTimelineItem';
import { DuplicateModal } from '../components/lessons/DuplicateModal';
import { PrintViewModal } from '../components/print/PrintViewModal';
import { ConfirmModal } from '../components/layout/ConfirmModal';
import { GroupModal } from '../components/groups/GroupModal';

interface GroupPageProps {
  groupId: string;
  onBack: () => void;
  onOpenLesson: (lessonId: string) => void;
  onNewLesson: (groupId: string) => void;
}

export const GroupPage: React.FC<GroupPageProps> = ({
  groupId,
  onBack,
  onOpenLesson,
  onNewLesson,
}) => {
  const [group, setGroup] = useState<Group | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(false); // default false: newest first
  const [dateFilter, setDateFilter] = useState<'all' | '30days' | 'thisMonth' | 'future'>('all');
  const [allExpanded, setAllExpanded] = useState(false);

  // Modals state
  const [lessonToDuplicate, setLessonToDuplicate] = useState<Lesson | null>(null);
  const [printLessonId, setPrintLessonId] = useState<string | null>(null);
  const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null);
  const [isEditGroupOpen, setIsEditGroupOpen] = useState(false);
  const [isDeleteGroupOpen, setIsDeleteGroupOpen] = useState(false);

  const loadData = async () => {
    try {
      const g = await getGroup(groupId);
      if (g) setGroup(g);
      const lList = await getLessonsByGroup(groupId, sortAsc);
      setLessons(lList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [groupId, sortAsc]);

  const handleDuplicate = async (targetDate: string, targetGroupId: string) => {
    if (!lessonToDuplicate) return;
    const duplicated = await duplicateLesson(lessonToDuplicate.id, targetDate, targetGroupId);
    setLessonToDuplicate(null);
    onOpenLesson(duplicated.id);
  };

  const handleConfirmDeleteLesson = async () => {
    if (lessonToDelete) {
      await deleteLesson(lessonToDelete.id);
      setLessonToDelete(null);
      await loadData();
    }
  };

  const handleConfirmDeleteGroup = async () => {
    if (group) {
      await deleteGroup(group.id);
      onBack();
    }
  };

  // Filter lessons
  const filteredLessons = lessons.filter(lesson => {
    // Search query filter
    const matchesSearch = 
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.lessonPlan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.homework.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lesson.notes && lesson.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Date range filter
    if (dateFilter === 'all') return true;

    const todayStr = new Date().toISOString().split('T')[0];
    if (dateFilter === 'future') {
      return lesson.date >= todayStr;
    }

    if (dateFilter === '30days') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      const thirtyDaysAgo = d.toISOString().split('T')[0];
      return lesson.date >= thirtyDaysAgo;
    }

    if (dateFilter === 'thisMonth') {
      const currentMonth = todayStr.substring(0, 7);
      return lesson.date.startsWith(currentMonth);
    }

    return true;
  });

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-sm text-slate-400">
        Loading group lessons...
      </div>
    );
  }

  if (!group) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-3">
        <p className="text-sm text-slate-500">Group not found.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 rounded-lg"
        >
          Return to Groups
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Group Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {group.name}
              </h1>
              <button
                onClick={() => setIsEditGroupOpen(true)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Edit group details"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
            {group.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {group.description}
              </p>
            )}
            <p className="text-xs text-slate-400 dark:text-slate-500 pt-1">
              {lessons.length} total lessons archived
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
            <button
              onClick={() => onNewLesson(group.id)}
              className="px-4 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Lesson</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        {/* Search within group */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search lessons in this group..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Filters and Sort */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-1 text-xs">
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">All Dates</option>
              <option value="thisMonth">This Month</option>
              <option value="30days">Last 30 Days</option>
              <option value="future">Upcoming / Today</option>
            </select>
          </div>

          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap"
            title={sortAsc ? 'Sorting Oldest First' : 'Sorting Newest First'}
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span>{sortAsc ? 'Oldest First' : 'Newest First'}</span>
          </button>

          <button
            onClick={() => setAllExpanded(!allExpanded)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap"
            title={allExpanded ? 'Collapse all lesson cards' : 'Expand all lesson cards'}
          >
            <span>{allExpanded ? 'Collapse All' : 'Expand All'}</span>
          </button>
        </div>
      </div>

      {/* Chronological Lesson Timeline */}
      {filteredLessons.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
          <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {lessons.length === 0 ? 'No lessons created yet' : 'No lessons match your search filter'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {lessons.length === 0 
              ? 'Click "+ New Lesson" to write your lesson plan, homework, and upload materials for this group.'
              : 'Try clearing your search query or adjusting the date filter.'}
          </p>
          {lessons.length === 0 && (
            <button
              onClick={() => onNewLesson(group.id)}
              className="mt-2 px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 rounded-lg inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Lesson</span>
            </button>
          )}
        </div>
      ) : (
        <div className="pt-2">
          {filteredLessons.map(lesson => (
            <LessonTimelineItem
              key={lesson.id}
              lesson={lesson}
              isInitiallyExpanded={allExpanded}
              onOpenLesson={onOpenLesson}
              onDuplicateLesson={l => setLessonToDuplicate(l)}
              onOpenPrintView={lId => setPrintLessonId(lId)}
              onDeleteLesson={l => setLessonToDelete(l)}
            />
          ))}
        </div>
      )}

      {/* Duplicate Modal */}
      <DuplicateModal
        isOpen={!!lessonToDuplicate}
        sourceLesson={lessonToDuplicate}
        onDuplicate={handleDuplicate}
        onClose={() => setLessonToDuplicate(null)}
      />

      {/* Dedicated Print View Modal */}
      <PrintViewModal
        isOpen={!!printLessonId}
        lessonId={printLessonId}
        onClose={() => setPrintLessonId(null)}
      />

      {/* Delete Lesson Confirmation */}
      <ConfirmModal
        isOpen={!!lessonToDelete}
        title="Delete Lesson?"
        message={`Are you sure you want to delete the lesson "${lessonToDelete?.title}" on ${lessonToDelete?.date}? All attached files and print items for this lesson will be permanently removed.`}
        confirmLabel="Delete Lesson"
        isDestructive={true}
        onConfirm={handleConfirmDeleteLesson}
        onCancel={() => setLessonToDelete(null)}
      />

      {/* Edit Group Modal */}
      <GroupModal
        isOpen={isEditGroupOpen}
        groupToEdit={group}
        onSave={async (name, desc) => {
          await updateGroup(group.id, name, desc);
          await loadData();
        }}
        onClose={() => setIsEditGroupOpen(false)}
      />
    </div>
  );
};
