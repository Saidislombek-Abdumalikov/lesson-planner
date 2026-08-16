import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Save, 
  Copy, 
  Printer, 
  Trash2, 
  FileText, 
  CheckSquare, 
  Paperclip, 
  Sparkles, 
  Check, 
  Loader2,
  Clock,
  Plus,
  CheckCircle2
} from 'lucide-react';
import { Group, Lesson, LessonFile, PrintItem } from '../types';
import { 
  getLesson, 
  getGroup, 
  updateLesson, 
  deleteLesson, 
  duplicateLesson, 
  getFilesForLesson, 
  addLessonFile, 
  updateLessonFile, 
  deleteLessonFile, 
  getPrintItemsForLesson, 
  addPrintItem, 
  updatePrintItem, 
  deletePrintItem 
} from '../db/db';
import { FileUploader } from '../components/lessons/FileUploader';
import { PrintListManager } from '../components/lessons/PrintListManager';
import { DuplicateModal } from '../components/lessons/DuplicateModal';
import { PrintViewModal } from '../components/print/PrintViewModal';
import { ConfirmModal } from '../components/layout/ConfirmModal';
import { formatFullDayDate } from '../utils/formatters';

interface LessonPageProps {
  lessonId: string;
  onBack: () => void;
  onOpenLesson: (newLessonId: string) => void;
}

export const LessonPage: React.FC<LessonPageProps> = ({
  lessonId,
  onBack,
  onOpenLesson,
}) => {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [files, setFiles] = useState<LessonFile[]>([]);
  const [printItems, setPrintItems] = useState<PrintItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [lessonPlan, setLessonPlan] = useState('');
  const [homework, setHomework] = useState('');
  const [notes, setNotes] = useState('');

  // Autosave Status: 'idle' | 'saving' | 'saved' | 'error'
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('saved');
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [manualSaveSuccess, setManualSaveSuccess] = useState(false);
  const isInitialMount = useRef(true);
  const debounceTimer = useRef<number | null>(null);
  const toastTimer = useRef<number | null>(null);

  // Modals
  const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);
  const [isPrintViewOpen, setIsPrintViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Active section tab for mobile navigation or quick jump
  const [activeTab, setActiveTab] = useState<'all' | 'plan' | 'homework' | 'files' | 'print' | 'notes'>('all');

  const loadLessonData = async () => {
    try {
      const l = await getLesson(lessonId);
      if (l) {
        setLesson(l);
        setTitle(l.title);
        setDate(l.date);
        setLessonPlan(l.lessonPlan);
        setHomework(l.homework);
        setNotes(l.notes || '');

        const [g, fList, pList] = await Promise.all([
          getGroup(l.groupId),
          getFilesForLesson(l.id),
          getPrintItemsForLesson(l.id),
        ]);
        setGroup(g || null);
        setFiles(fList);
        setPrintItems(pList);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    isInitialMount.current = true;
    loadLessonData();
  }, [lessonId]);

  // Trigger Save Toast
  const triggerSaveNotification = () => {
    setShowSaveToast(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => {
      setShowSaveToast(false);
    }, 2200);
  };

  // Debounced Autosave effect
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!lesson) return;

    setSaveStatus('saving');

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = window.setTimeout(async () => {
      try {
        await updateLesson(lesson.id, {
          title: title.trim() || 'Untitled Lesson',
          date,
          lessonPlan,
          homework,
          notes,
        });
        setSaveStatus('saved');
      } catch (err) {
        console.error('Autosave failed:', err);
        setSaveStatus('error');
      }
    }, 600);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [title, date, lessonPlan, homework, notes]);

  const handleManualSave = async () => {
    if (!lesson) return;
    setSaveStatus('saving');
    try {
      await updateLesson(lesson.id, {
        title: title.trim() || 'Untitled Lesson',
        date,
        lessonPlan,
        homework,
        notes,
      });
      setSaveStatus('saved');
      setManualSaveSuccess(true);
      triggerSaveNotification();
      setTimeout(() => setManualSaveSuccess(false), 1600);
    } catch (err) {
      setSaveStatus('error');
    }
  };

  // Keyboard shortcut: Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleManualSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [title, date, lessonPlan, homework, notes, lesson]);

  const handleDuplicate = async (targetDate: string, targetGroupId: string) => {
    if (!lesson) return;
    const dup = await duplicateLesson(lesson.id, targetDate, targetGroupId);
    setIsDuplicateOpen(false);
    onOpenLesson(dup.id);
  };

  const handleConfirmDelete = async () => {
    if (lesson) {
      await deleteLesson(lesson.id);
      setIsDeleteOpen(false);
      onBack();
    }
  };

  // Files Handlers
  const handleUploadFiles = async (
    fileList: FileList, 
    customName?: string,
    category: 'classwork' | 'homework' = 'classwork'
  ) => {
    if (!lesson) return;
    for (let i = 0; i < fileList.length; i++) {
      const cName = i === 0 ? customName : undefined;
      await addLessonFile(lesson.id, fileList[i], cName, category);
    }
    const updated = await getFilesForLesson(lesson.id);
    setFiles(updated);
    triggerSaveNotification();
  };

  const handleUpdateFile = async (fileId: string, updates: Partial<Pick<LessonFile, 'name' | 'category'>>) => {
    if (!lesson) return;
    await updateLessonFile(fileId, updates);
    const updated = await getFilesForLesson(lesson.id);
    setFiles(updated);
    triggerSaveNotification();
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!lesson) return;
    await deleteLessonFile(fileId);
    const [updatedFiles, updatedPrints] = await Promise.all([
      getFilesForLesson(lesson.id),
      getPrintItemsForLesson(lesson.id),
    ]);
    setFiles(updatedFiles);
    setPrintItems(updatedPrints);
    triggerSaveNotification();
  };

  const handleAddFileToPrint = async (file: LessonFile) => {
    if (!lesson) return;
    await addPrintItem({
      lessonId: lesson.id,
      fileId: file.id,
      fileName: file.name,
      copies: 15,
      notes: file.category === 'homework' ? 'Homework handout' : 'Classwork worksheet',
      category: file.category || 'classwork',
    });
    const updated = await getPrintItemsForLesson(lesson.id);
    setPrintItems(updated);
    triggerSaveNotification();
  };

  // Print Items Handlers
  const handleAddPrintItem = async (data: { 
    fileId?: string; 
    fileName: string; 
    copies: number; 
    notes?: string;
    category?: 'classwork' | 'homework';
  }) => {
    if (!lesson) return;
    await addPrintItem({
      lessonId: lesson.id,
      ...data,
    });
    const updated = await getPrintItemsForLesson(lesson.id);
    setPrintItems(updated);
    triggerSaveNotification();
  };

  const handleUpdatePrintItem = async (id: string, updates: Partial<PrintItem>) => {
    await updatePrintItem(id, updates);
    if (lesson) {
      const updated = await getPrintItemsForLesson(lesson.id);
      setPrintItems(updated);
    }
  };

  const handleDeletePrintItem = async (id: string) => {
    await deletePrintItem(id);
    if (lesson) {
      const updated = await getPrintItemsForLesson(lesson.id);
      setPrintItems(updated);
      triggerSaveNotification();
    }
  };

  // Insert standard template snippets into the lesson plan
  const handleInsertTemplate = (snippet: string) => {
    const divider = lessonPlan.trim() ? '\n' : '';
    setLessonPlan(prev => prev + divider + snippet);
  };

  if (loading || !lesson) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        <p className="text-sm text-slate-500">Loading lesson plan...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 pb-20">
      {/* FLOATING SAVE NOTIFICATION TOAST */}
      {showSaveToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in zoom-in-95 duration-200 pointer-events-none">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/90 dark:bg-slate-100/95 text-white dark:text-slate-900 rounded-xl shadow-xl backdrop-blur-xs text-xs font-semibold border border-slate-700 dark:border-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 flex-shrink-0 animate-in zoom-in-75" />
            <span>Saved to device</span>
          </div>
        </div>
      )}

      {/* TOP HEADER & CONTROLS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
        {/* Row 1: Back Button, Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all active:scale-95"
              title="Back to Group Lessons"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {group?.name || 'Class Group'}
              </span>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                {title.trim() || 'Untitled Lesson'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
            {/* Autosave Status Pill with Smooth Micro-Animation */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
              saveStatus === 'saving'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-2xs animate-pulse'
                : saveStatus === 'saved'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 animate-in zoom-in-95'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}>
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 dark:text-blue-400" />
                  <span>Saving...</span>
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3] animate-in zoom-in-50 duration-200" />
                  <span>Saved</span>
                </>
              ) : (
                <span className="font-semibold">Error saving</span>
              )}
            </div>

            {/* Duplicate Button */}
            <button
              type="button"
              onClick={() => setIsDuplicateOpen(true)}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg flex items-center gap-1.5 transition-all active:scale-95"
              title="Duplicate this lesson to another date"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Duplicate</span>
            </button>

            {/* Print Prep Sheet Button */}
            <button
              type="button"
              onClick={() => setIsPrintViewOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 rounded-lg flex items-center gap-1.5 border border-purple-200/80 dark:border-purple-800/60 transition-all active:scale-95"
              title="Open Print Checklist"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print View</span>
            </button>

            {/* Delete Lesson Button */}
            <button
              type="button"
              onClick={() => setIsDeleteOpen(true)}
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all active:scale-95"
              title="Delete lesson"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Row 2: Date Picker + Lesson Title Input */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-start">
          {/* Date Picker */}
          <div className="sm:col-span-4">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Lesson Date
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Title */}
          <div className="sm:col-span-8">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Lesson Title / Topic
            </label>
            <input
              type="text"
              placeholder="e.g. Present Simple + Daily Routines"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-sm sm:text-base font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Section Quick Jump Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'all'
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          All Sections
        </button>
        <button
          onClick={() => setActiveTab('plan')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'plan'
              ? 'bg-brand-600 dark:bg-brand-500 text-white shadow-2xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Lesson Plan</span>
        </button>
        <button
          onClick={() => setActiveTab('homework')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'homework'
              ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-2xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Homework</span>
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'files'
              ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-2xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <Paperclip className="w-3.5 h-3.5" />
          <span>Files ({files.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('print')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'print'
              ? 'bg-purple-600 dark:bg-purple-500 text-white shadow-2xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print ({printItems.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'notes'
              ? 'bg-amber-600 dark:bg-amber-500 text-white shadow-2xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Notes</span>
        </button>
      </div>

      {/* SECTION 1: LESSON PLAN */}
      {(activeTab === 'all' || activeTab === 'plan') && (
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Lesson Plan
              </h2>
            </div>

            {/* Quick-Insert Outline Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
              <span className="text-slate-400 text-[11px] font-medium hidden sm:inline">Quick Insert:</span>
              <button
                type="button"
                onClick={() => handleInsertTemplate('• Warm-up (5m): ')}
                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-950/50 hover:text-brand-600 dark:hover:text-brand-400 rounded-md text-slate-600 dark:text-slate-300 transition-colors"
              >
                + Warm-up
              </button>
              <button
                type="button"
                onClick={() => handleInsertTemplate('• Review & Check HW (10m): ')}
                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-950/50 hover:text-brand-600 dark:hover:text-brand-400 rounded-md text-slate-600 dark:text-slate-300 transition-colors"
              >
                + Review
              </button>
              <button
                type="button"
                onClick={() => handleInsertTemplate('• Presentation & Concept (15m): ')}
                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-950/50 hover:text-brand-600 dark:hover:text-brand-400 rounded-md text-slate-600 dark:text-slate-300 transition-colors"
              >
                + Grammar
              </button>
              <button
                type="button"
                onClick={() => handleInsertTemplate('• Practice Activity (15m): ')}
                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-950/50 hover:text-brand-600 dark:hover:text-brand-400 rounded-md text-slate-600 dark:text-slate-300 transition-colors"
              >
                + Practice
              </button>
              <button
                type="button"
                onClick={() => handleInsertTemplate('• Speaking & Wrap-up (10m): ')}
                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-950/50 hover:text-brand-600 dark:hover:text-brand-400 rounded-md text-slate-600 dark:text-slate-300 transition-colors"
              >
                + Speaking
              </button>
            </div>
          </div>

          <textarea
            rows={7}
            value={lessonPlan}
            onChange={e => setLessonPlan(e.target.value)}
            placeholder="Write your outline or key teaching steps here...&#10;• Warm-up: Flashcards game&#10;• Grammar: Unit 4 Present Continuous&#10;• Reading: Page 32 dialog&#10;• Speaking: Pair interview task"
            className="w-full p-4 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-sm leading-relaxed text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 font-sans resize-y"
          />
        </section>
      )}

      {/* SECTION 2: HOMEWORK */}
      {(activeTab === 'all' || activeTab === 'homework') && (
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Homework
            </h2>
          </div>

          <textarea
            rows={3}
            value={homework}
            onChange={e => setHomework(e.target.value)}
            placeholder="e.g. Workbook pages 24–25, exercises 1–5. Learn new vocabulary for quick test next time."
            className="w-full p-4 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-sm leading-relaxed text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans resize-y"
          />
        </section>
      )}

      {/* SECTION 3: FILES & MATERIALS */}
      {(activeTab === 'all' || activeTab === 'files') && (
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Paperclip className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Files & Teaching Materials
              </h2>
            </div>
          </div>

          <FileUploader
            files={files}
            onUpload={handleUploadFiles}
            onUpdateFile={handleUpdateFile}
            onDelete={handleDeleteFile}
            onAddToPrint={handleAddFileToPrint}
          />
        </section>
      )}

      {/* SECTION 4: PRINT LIST */}
      {(activeTab === 'all' || activeTab === 'print') && (
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Printer className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Print List
              </h2>
            </div>
          </div>

          <PrintListManager
            printItems={printItems}
            files={files}
            onAddItem={handleAddPrintItem}
            onUpdateItem={handleUpdatePrintItem}
            onDeleteItem={handleDeletePrintItem}
            onOpenPrintView={() => setIsPrintViewOpen(true)}
          />
        </section>
      )}

      {/* SECTION 5: TEACHER NOTES */}
      {(activeTab === 'all' || activeTab === 'notes') && (
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Teacher Notes & Reflections
            </h2>
          </div>

          <textarea
            rows={3}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Bring animal stickers for rewards next lesson. Need to review question forms again."
            className="w-full p-4 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-sm leading-relaxed text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans resize-y"
          />
        </section>
      )}

      {/* Footer Navigation Bar */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={onBack}
          className="px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2 transition-all active:scale-95 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Group Lessons</span>
        </button>

        {/* Animated Manual Save Button */}
        <button
          onClick={handleManualSave}
          className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-sm flex items-center gap-2 transition-all active:scale-95 ${
            manualSaveSuccess
              ? 'bg-emerald-600 hover:bg-emerald-700 ring-4 ring-emerald-100 dark:ring-emerald-950 scale-105'
              : saveStatus === 'saving'
              ? 'bg-blue-600 animate-pulse'
              : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white'
          }`}
        >
          {manualSaveSuccess ? (
            <>
              <Check className="w-4 h-4 text-white stroke-[3] animate-in zoom-in-75" />
              <span>Saved!</span>
            </>
          ) : saveStatus === 'saving' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Lesson (Ctrl+S)</span>
            </>
          )}
        </button>
      </div>

      {/* Duplicate Modal */}
      <DuplicateModal
        isOpen={isDuplicateOpen}
        sourceLesson={lesson}
        onDuplicate={handleDuplicate}
        onClose={() => setIsDuplicateOpen(false)}
      />

      {/* Dedicated Print View Modal */}
      <PrintViewModal
        isOpen={isPrintViewOpen}
        lessonId={lesson.id}
        onClose={() => setIsPrintViewOpen(false)}
      />

      {/* Delete Lesson Modal with Animation */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        title="Delete Lesson?"
        message={`Are you sure you want to permanently delete "${lesson.title}" and its ${files.length} attached files? This action cannot be undone.`}
        confirmLabel="Delete Lesson"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  );
};
