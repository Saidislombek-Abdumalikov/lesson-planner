import React, { useState, useEffect } from 'react';
import { Printer, X, Check, FileText, Download, ExternalLink, BookOpen, Home } from 'lucide-react';
import { Group, Lesson, PrintItem, LessonFile } from '../../types';
import { db } from '../../db/db';
import { formatFullDayDate, downloadBlob, previewBlob } from '../../utils/formatters';

interface PrintViewModalProps {
  isOpen: boolean;
  lessonId: string | null;
  onClose: () => void;
}

export const PrintViewModal: React.FC<PrintViewModalProps> = ({
  isOpen,
  lessonId,
  onClose,
}) => {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [items, setItems] = useState<PrintItem[]>([]);
  const [files, setFiles] = useState<LessonFile[]>([]);

  useEffect(() => {
    if (isOpen && lessonId) {
      db.lessons.get(lessonId).then(l => {
        if (l) {
          setLesson(l);
          db.groups.get(l.groupId).then(g => setGroup(g || null));
        }
      });
      Promise.all([
        db.printItems.where('lessonId').equals(lessonId).toArray(),
        db.files.where('lessonId').equals(lessonId).toArray(),
      ]).then(([pList, fList]) => {
        setItems(pList);
        setFiles(fList);
      });
    }
  }, [isOpen, lessonId]);

  if (!isOpen || !lesson) return null;

  const handlePrint = () => {
    window.print();
  };

  const togglePrinted = async (id: string, current: boolean) => {
    await db.printItems.update(id, { isPrinted: !current });
    setItems(items.map(it => it.id === id ? { ...it, isPrinted: !current } : it));
  };

  const getMatchedFile = (item: PrintItem): LessonFile | undefined => {
    if (item.fileId) {
      const found = files.find(f => f.id === item.fileId);
      if (found) return found;
    }
    return files.find(f => f.name.toLowerCase() === item.fileName.toLowerCase());
  };

  const classworkItems = items.filter(it => (it.category || 'classwork') === 'classwork');
  const homeworkItems = items.filter(it => it.category === 'homework');

  const classworkCopies = classworkItems.reduce((acc, it) => acc + (it.copies || 0), 0);
  const homeworkCopies = homeworkItems.reduce((acc, it) => acc + (it.copies || 0), 0);
  const totalCopies = classworkCopies + homeworkCopies;

  const renderTableSection = (sectionItems: PrintItem[], title: string, badgeIcon: React.ReactNode, countCopies: number, colorClass: string) => {
    if (sectionItems.length === 0) return null;

    return (
      <div className="space-y-2">
        <div className={`flex items-center justify-between pb-1 border-b-2 ${colorClass}`}>
          <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider">
            {badgeIcon}
            <span>{title}</span>
          </div>
          <span className="text-xs font-semibold">
            {sectionItems.length} {sectionItems.length === 1 ? 'file' : 'files'} • <strong>{countCopies}</strong> copies
          </span>
        </div>

        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400">
              <th className="py-2 px-2 w-10 text-center">Done</th>
              <th className="py-2 px-3">File / Handout</th>
              <th className="py-2 px-3 text-right w-24">Copies</th>
              <th className="py-2 px-3">Printing Notes</th>
              <th className="py-2 px-3 text-right w-24 no-print">Open File</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {sectionItems.map(item => {
              const matched = getMatchedFile(item);

              return (
                <tr 
                  key={item.id}
                  className={`transition-colors ${
                    item.isPrinted ? 'bg-slate-50/50 dark:bg-slate-800/30' : ''
                  }`}
                >
                  <td className="py-2.5 px-2 text-center align-top">
                    <button
                      type="button"
                      onClick={() => togglePrinted(item.id, !!item.isPrinted)}
                      className={`w-5 h-5 rounded border mx-auto flex items-center justify-center transition-colors ${
                        item.isPrinted 
                          ? 'bg-slate-900 dark:bg-slate-100 border-slate-900 dark:border-slate-100 text-white dark:text-slate-900' 
                          : 'border-slate-400 bg-white dark:bg-slate-800'
                      }`}
                    >
                      {item.isPrinted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                  </td>
                  <td className="py-2.5 px-3 align-top font-semibold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      {matched ? (
                        <button
                          type="button"
                          onClick={() => previewBlob(matched.data)}
                          className="text-left font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                          title="Click to open file in new tab"
                        >
                          <span>{item.fileName}</span>
                        </button>
                      ) : (
                        <span>{item.fileName}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 align-top text-right font-mono font-bold text-slate-900 dark:text-white text-base">
                    {item.copies}
                  </td>
                  <td className="py-2.5 px-3 align-top text-xs text-slate-600 dark:text-slate-300">
                    {item.notes || '—'}
                  </td>
                  <td className="py-2.5 px-3 align-top text-right no-print">
                    {matched ? (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => previewBlob(matched.data)}
                          className="p-1 text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                          title="Open in new tab"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadBlob(matched.data, matched.originalName || matched.name)}
                          className="p-1 text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                          title="Download file"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div 
        className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 print-page"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Dialog Bar - Hidden in print */}
        <div className="flex items-center justify-between no-print border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
            <Printer className="w-5 h-5" />
            <span className="font-bold text-sm tracking-wide uppercase">Print Prep Sheet & Materials</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Checklist (Ctrl+P)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Content Header */}
        <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {group?.name || 'Group'} — Print Checklist
            </h1>
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              {formatFullDayDate(lesson.date)}
            </span>
          </div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1">
            Lesson: <span className="font-semibold text-slate-900 dark:text-white">{lesson.title}</span>
          </p>
        </div>

        {/* Printable Grouped Tables */}
        <div className="space-y-6 overflow-hidden">
          {items.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center italic">
              No print items added for this lesson.
            </p>
          ) : (
            <>
              {/* 1. In-Class Section */}
              {renderTableSection(
                classworkItems, 
                'In-Class Handouts', 
                <BookOpen className="w-4 h-4 text-blue-600" />, 
                classworkCopies, 
                'border-blue-600 dark:border-blue-500 text-blue-800 dark:text-blue-300'
              )}

              {/* 2. Homework Section */}
              {renderTableSection(
                homeworkItems, 
                'Homework Handouts', 
                <Home className="w-4 h-4 text-emerald-600" />, 
                homeworkCopies, 
                'border-emerald-600 dark:border-emerald-500 text-emerald-800 dark:text-emerald-300'
              )}

              {/* Total Summary Footer Box */}
              <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl flex items-center justify-between font-bold text-sm text-slate-900 dark:text-white">
                <span>Total To Print:</span>
                <span className="font-mono text-base">
                  {totalCopies} copies
                </span>
              </div>
            </>
          )}
        </div>

        {/* Footer Notes for the Teacher */}
        {lesson.notes && (
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300">Teacher Notes: </span>
            <span className="text-slate-600 dark:text-slate-400">{lesson.notes}</span>
          </div>
        )}

        {/* Dialog footer - Hidden in print */}
        <div className="flex items-center justify-end gap-3 pt-2 no-print border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Checklist</span>
          </button>
        </div>
      </div>
    </div>
  );
};
