import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckSquare, 
  Paperclip, 
  Printer, 
  Copy, 
  Trash2, 
  FileEdit, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Download, 
  ExternalLink,
  Music,
  Video,
  BookOpen,
  Home,
  Eye
} from 'lucide-react';
import { Lesson, LessonFile, PrintItem } from '../../types';
import { db } from '../../db/db';
import { formatFullDayDate, getRelativeDateBadge, formatBytes, downloadBlob, previewBlob, getFileTypeCategory } from '../../utils/formatters';
import { FilePreviewModal } from '../files/FilePreviewModal';

interface LessonTimelineItemProps {
  lesson: Lesson;
  onOpenLesson: (lessonId: string) => void;
  onDuplicateLesson: (lesson: Lesson) => void;
  onOpenPrintView: (lessonId: string) => void;
  onDeleteLesson: (lesson: Lesson) => void;
  isInitiallyExpanded?: boolean;
}

export const LessonTimelineItem: React.FC<LessonTimelineItemProps> = ({
  lesson,
  onOpenLesson,
  onDuplicateLesson,
  onOpenPrintView,
  onDeleteLesson,
  isInitiallyExpanded = false,
}) => {
  const [files, setFiles] = useState<LessonFile[]>([]);
  const [printItems, setPrintItems] = useState<PrintItem[]>([]);
  const [isExpanded, setIsExpanded] = useState(isInitiallyExpanded);
  const [previewFile, setPreviewFile] = useState<LessonFile | null>(null);

  useEffect(() => {
    setIsExpanded(isInitiallyExpanded);
  }, [isInitiallyExpanded]);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      db.files.where('lessonId').equals(lesson.id).toArray(),
      db.printItems.where('lessonId').equals(lesson.id).toArray(),
    ]).then(([fList, pList]) => {
      if (mounted) {
        setFiles(fList);
        setPrintItems(pList);
      }
    });
    return () => { mounted = false; };
  }, [lesson.id]);

  const relativeDate = getRelativeDateBadge(lesson.date);

  // Group files by In-Class vs Homework
  const classworkFiles = files.filter(f => (f.category || 'classwork') === 'classwork');
  const homeworkFiles = files.filter(f => f.category === 'homework');

  const classworkPrints = printItems.filter(it => (it.category || 'classwork') === 'classwork');
  const homeworkPrints = printItems.filter(it => it.category === 'homework');

  const totalPrintCopies = printItems.reduce((acc, item) => acc + (item.copies || 0), 0);

  // Parse plan into clean lines
  const planLines = (lesson.lessonPlan || '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  const renderFilePill = (f: LessonFile) => {
    const typeInfo = getFileTypeCategory(f.name, f.type);
    const isAudio = typeInfo.category === 'audio';
    const isVideo = typeInfo.category === 'video';
    const isHw = f.category === 'homework';

    return (
      <div
        key={f.id}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border max-w-full ${
          isAudio
            ? 'bg-fuchsia-50 dark:bg-fuchsia-950/50 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-800/60'
            : isVideo
            ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
            : isHw
            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
            : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-900/50'
        }`}
      >
        <button
          type="button"
          onClick={() => setPreviewFile(f)}
          className="font-semibold hover:underline truncate max-w-[160px] sm:max-w-[240px] text-left"
          title={`Click to preview ${f.name}`}
        >
          {f.name}
        </button>

        <span className="text-[10px] opacity-75 font-normal">({formatBytes(f.size)})</span>

        {/* Open in preview */}
        <button
          type="button"
          onClick={() => setPreviewFile(f)}
          className="hover:opacity-100 opacity-75 p-0.5 rounded transition-colors"
          title="Preview file"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>

        {/* Download */}
        <button
          type="button"
          onClick={() => downloadBlob(f.data, f.originalName || f.name)}
          className="hover:opacity-100 opacity-75 p-0.5 rounded transition-colors"
          title="Download file"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  return (
    <div className="relative pl-6 sm:pl-8 pb-4 sm:pb-5 group last:pb-2">
      {/* Vertical Timeline Line */}
      <div className="absolute left-2.5 sm:left-3 top-5 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800 group-last:hidden" />

      {/* Timeline Node Dot */}
      <div className={`absolute left-1 sm:left-1.5 top-3.5 w-3.5 h-3.5 rounded-full border-2 transition-all ${
        isExpanded 
          ? 'border-brand-600 bg-brand-600 dark:border-brand-400 dark:bg-brand-400 ring-4 ring-brand-100 dark:ring-brand-950 scale-110' 
          : 'border-brand-500 bg-white dark:bg-slate-900 ring-4 ring-slate-50 dark:ring-slate-950 group-hover:scale-110'
      }`} />

      {/* Main Lesson Card Container */}
      <div 
        className={`bg-white dark:bg-slate-900 rounded-xl border transition-all shadow-xs hover:shadow-md ${
          isExpanded
            ? 'border-brand-300 dark:border-slate-700 ring-1 ring-brand-500/20'
            : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
        }`}
      >
        {/* COMPACT SUMMARY HEADER (Always visible, click to toggle expand) */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-3.5 sm:p-4 cursor-pointer select-none flex flex-col gap-2.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors rounded-xl"
        >
          {/* Top Line: Date, Relative Tag & Action Buttons */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                {formatFullDayDate(lesson.date)}
              </span>

              {relativeDate && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  relativeDate.isRecent
                    ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200/80 dark:border-brand-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {relativeDate.label}
                </span>
              )}
            </div>

            {/* Quick Action Icons */}
            <div 
              className="flex items-center gap-1 flex-shrink-0"
              onClick={e => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => onDuplicateLesson(lesson)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Duplicate / Reuse lesson"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>

              {printItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => onOpenPrintView(lesson.id)}
                  className="p-1.5 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded-lg transition-colors"
                  title="Open Print View"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => onDeleteLesson(lesson)}
                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                title="Delete lesson"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onOpenLesson(lesson.id)}
                className="ml-1 px-2.5 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-lg flex items-center gap-1 transition-all shadow-2xs"
              >
                <FileEdit className="w-3 h-3" />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg transition-colors ml-0.5"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Middle Line: Lesson Title */}
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-tight">
              {lesson.title || 'Untitled Lesson'}
            </h3>
          </div>

          {/* Bottom Line: Clean Compact Metadata Summary Pills */}
          <div className="flex items-center gap-2 flex-wrap pt-0.5">
            {planLines.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <FileText className="w-3 h-3 text-slate-400" />
                <span>Plan: {planLines.length} {planLines.length === 1 ? 'item' : 'items'}</span>
              </span>
            )}

            {lesson.homework && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/40">
                <CheckSquare className="w-3 h-3 text-emerald-600" />
                <span>Homework ✓</span>
              </span>
            )}

            {classworkFiles.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/40">
                <BookOpen className="w-3 h-3 text-blue-600" />
                <span>Classwork: {classworkFiles.length}</span>
              </span>
            )}

            {homeworkFiles.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/40">
                <Home className="w-3 h-3 text-emerald-600" />
                <span>HW Files: {homeworkFiles.length}</span>
              </span>
            )}

            {printItems.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-900/40">
                <Printer className="w-3 h-3 text-purple-600" />
                <span>Print: {totalPrintCopies} copies</span>
              </span>
            )}

            {lesson.notes && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-900/40">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>Notes</span>
              </span>
            )}

            <span className="text-[11px] text-slate-400 dark:text-slate-500 ml-auto flex items-center gap-0.5">
              <span>{isExpanded ? 'Click to collapse' : 'Click to view'}</span>
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </span>
          </div>
        </div>

        {/* EXPANDED DETAILED VIEW */}
        {isExpanded && (
          <div className="p-4 sm:p-5 pt-0 space-y-3.5 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-150">
            {/* 1. Full Lesson Plan */}
            {planLines.length > 0 ? (
              <div className="bg-slate-50/80 dark:bg-slate-800/40 rounded-xl p-3.5 border border-slate-100 dark:border-slate-800 space-y-2 mt-3.5">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Lesson Plan</span>
                </div>
                <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {planLines.map((line, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-slate-400 dark:text-slate-500 select-none flex-shrink-0 mt-0.5">•</span>
                      <span className="break-words flex-1">{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-xs text-slate-400 dark:text-slate-500 italic pt-3">
                No lesson plan text recorded.
              </div>
            )}

            {/* 2. Full Homework */}
            {lesson.homework && (
              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl p-3.5 border border-emerald-100/80 dark:border-emerald-900/40 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  <CheckSquare className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Homework</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed pl-5">
                  {lesson.homework}
                </p>
              </div>
            )}

            {/* 3. Teacher Notes */}
            {lesson.notes && (
              <div className="bg-amber-50/50 dark:bg-amber-950/20 rounded-xl p-3.5 border border-amber-100/80 dark:border-amber-900/40 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Teacher Notes</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed pl-5">
                  {lesson.notes}
                </p>
              </div>
            )}

            {/* 4. Materials & Print Sections */}
            {(files.length > 0 || printItems.length > 0) && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                {/* In-Class Files */}
                {classworkFiles.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      In-Class Lesson Materials ({classworkFiles.length})
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {classworkFiles.map(renderFilePill)}
                    </div>
                  </div>
                )}

                {/* Homework Files */}
                {homeworkFiles.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <Home className="w-3 h-3" />
                      Homework Materials ({homeworkFiles.length})
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {homeworkFiles.map(renderFilePill)}
                    </div>
                  </div>
                )}

                {/* Print Items */}
                {printItems.length > 0 && (
                  <div className="pt-2 flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-xs text-purple-700 dark:text-purple-300 font-semibold flex items-center gap-1.5">
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Checklist: {printItems.length} {printItems.length === 1 ? 'file' : 'files'} ({totalPrintCopies} copies)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenPrintView(lesson.id)}
                      className="px-3 py-1 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-2xs flex items-center gap-1"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Open Print Sheet</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Actions Bar inside expanded card */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Collapse</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenLesson(lesson.id)}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <FileEdit className="w-3.5 h-3.5" />
                <span>Open Full Lesson Editor</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* File Preview Modal */}
      <FilePreviewModal
        isOpen={!!previewFile}
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  );
};
