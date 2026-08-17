import React, { useState } from 'react';
import { 
  Printer, 
  Plus, 
  Trash2, 
  Check, 
  Minus, 
  ExternalLink, 
  Download, 
  BookOpen, 
  Home,
  Eye
} from 'lucide-react';
import { LessonFile, PrintItem } from '../../types';
import { downloadBlob, previewBlob } from '../../utils/formatters';
import { ConfirmModal } from '../layout/ConfirmModal';
import { FilePreviewModal } from '../files/FilePreviewModal';

interface PrintListManagerProps {
  printItems: PrintItem[];
  files: LessonFile[];
  onAddItem: (data: { fileId?: string; fileName: string; copies: number; notes?: string; category?: 'classwork' | 'homework' }) => Promise<void>;
  onUpdateItem: (id: string, updates: Partial<PrintItem>) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  onOpenPrintView: () => void;
}

export const PrintListManager: React.FC<PrintListManagerProps> = ({
  printItems,
  files,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onOpenPrintView,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [customFileName, setCustomFileName] = useState<string>('');
  const [category, setCategory] = useState<'classwork' | 'homework'>('classwork');
  const [copies, setCopies] = useState<number>(15);
  const [notes, setNotes] = useState<string>('One per student');

  // Confirmation state for deleting a print item
  const [itemToDelete, setItemToDelete] = useState<PrintItem | null>(null);

  // File preview modal state
  const [previewFile, setPreviewFile] = useState<LessonFile | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    let name = '';
    let fId: string | undefined = undefined;
    let finalCategory: 'classwork' | 'homework' = category;

    if (selectedFileId && selectedFileId !== 'custom') {
      const found = files.find(f => f.id === selectedFileId);
      name = found ? found.name : 'Worksheet';
      fId = found?.id;
      if (found?.category) {
        finalCategory = found.category;
      }
    } else {
      name = customFileName.trim() || 'Worksheet';
    }

    await onAddItem({
      fileId: fId,
      fileName: name,
      copies: Math.max(1, copies),
      notes: notes.trim() || undefined,
      category: finalCategory,
    });

    setShowAddForm(false);
    setSelectedFileId('');
    setCustomFileName('');
    setNotes('One per student');
  };

  const handleToggleCategory = async (item: PrintItem) => {
    const nextCategory = (item.category || 'classwork') === 'classwork' ? 'homework' : 'classwork';
    await onUpdateItem(item.id, { category: nextCategory });
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      await onDeleteItem(itemToDelete.id);
      setItemToDelete(null);
    }
  };

  const getMatchedFile = (item: PrintItem): LessonFile | undefined => {
    if (item.fileId) {
      const found = files.find(f => f.id === item.fileId);
      if (found) return found;
    }
    return files.find(f => f.name.toLowerCase() === item.fileName.toLowerCase());
  };

  const classworkPrints = printItems.filter(it => (it.category || 'classwork') === 'classwork');
  const homeworkPrints = printItems.filter(it => it.category === 'homework');

  const totalCopies = printItems.reduce((acc, item) => acc + (item.copies || 0), 0);

  const renderPrintRow = (item: PrintItem) => {
    const matched = getMatchedFile(item);
    const isHw = item.category === 'homework';

    return (
      <div
        key={item.id}
        className={`p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
          item.isPrinted
            ? 'bg-slate-50/70 dark:bg-slate-900/40 opacity-75'
            : 'hover:bg-slate-50/40 dark:hover:bg-slate-800/30'
        }`}
      >
        {/* Left: Checkbox & Name & Category Badge */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onUpdateItem(item.id, { isPrinted: !item.isPrinted })}
            className={`w-5 h-5 rounded flex items-center justify-center border transition-all flex-shrink-0 ${
              item.isPrinted
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500 bg-white dark:bg-slate-800'
            }`}
            title={item.isPrinted ? 'Mark as not printed' : 'Mark as printed'}
          >
            {item.isPrinted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {matched ? (
                <button
                  type="button"
                  onClick={() => setPreviewFile(matched)}
                  className={`text-sm font-semibold truncate hover:underline text-left text-brand-600 dark:text-brand-400 ${
                    item.isPrinted ? 'line-through text-slate-400' : ''
                  }`}
                  title="Click to preview file"
                >
                  {item.fileName}
                </button>
              ) : (
                <p className={`text-sm font-semibold truncate ${
                  item.isPrinted
                    ? 'text-slate-400 dark:text-slate-500 line-through'
                    : 'text-slate-800 dark:text-slate-200'
                }`}>
                  {item.fileName}
                </p>
              )}

              {/* Category Pill Switcher */}
              <button
                type="button"
                onClick={() => handleToggleCategory(item)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 ${
                  isHw
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800'
                }`}
                title={isHw ? 'Switch to In-Class Print' : 'Switch to Homework Print'}
              >
                {isHw ? <Home className="w-2.5 h-2.5" /> : <BookOpen className="w-2.5 h-2.5" />}
                <span>{isHw ? 'Homework' : 'In-Class'}</span>
              </button>
            </div>

            {item.notes && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="font-medium text-slate-600 dark:text-slate-400">Note: </span>
                {item.notes}
              </p>
            )}
          </div>
        </div>

        {/* Right: Open Preview / Download + Copies Stepper + Delete */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
          {matched && (
            <div className="flex items-center gap-1 mr-1">
              <button
                type="button"
                onClick={() => setPreviewFile(matched)}
                className="p-1.5 text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
                title="Preview file"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => downloadBlob(matched.data, matched.originalName || matched.name)}
                className="p-1.5 text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Download file"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Copies badge/stepper */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => onUpdateItem(item.id, { copies: Math.max(1, item.copies - 1) })}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300"
              title="Decrease copies"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="px-2 text-xs font-bold text-slate-800 dark:text-slate-200 min-w-[32px] text-center">
              {item.copies}
            </span>
            <button
              type="button"
              onClick={() => onUpdateItem(item.id, { copies: item.copies + 1 })}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300"
              title="Increase copies"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="text-xs text-slate-400">copies</span>

          {/* Delete with Confirmation */}
          <button
            type="button"
            onClick={() => setItemToDelete(item)}
            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors ml-1"
            title="Remove from print list"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Header Row with Total & Launch Print Sheet */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
          <Printer className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>
            {printItems.length === 0 ? (
              'No items marked for printing'
            ) : (
              <span>
                <strong className="font-semibold text-slate-800 dark:text-slate-200">{printItems.length}</strong> {printItems.length === 1 ? 'item' : 'items'} •{' '}
                <strong className="font-semibold text-purple-600 dark:text-purple-400">{totalCopies}</strong> total copies
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {printItems.length > 0 && (
            <button
              type="button"
              onClick={onOpenPrintView}
              className="px-3 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 rounded-lg flex items-center gap-1.5 border border-purple-200/80 dark:border-purple-800/60 transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Open Print View</span>
            </button>
          )}

          {!showAddForm && (
            <button
              type="button"
              onClick={() => {
                if (files.length > 0) setSelectedFileId(files[0].id);
                else setSelectedFileId('custom');
                setShowAddForm(true);
              }}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add to Print List</span>
            </button>
          )}
        </div>
      </div>

      {/* Add New Print Item Inline Form */}
      {showAddForm && (
        <form onSubmit={handleAdd} className="p-4 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/40 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300">
              Add Material to Print List
            </h4>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500">Purpose:</span>
              <button
                type="button"
                onClick={() => setCategory('classwork')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  category === 'classwork'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <BookOpen className="w-3 h-3" />
                <span>In-Class</span>
              </button>
              <button
                type="button"
                onClick={() => setCategory('homework')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  category === 'homework'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Home className="w-3 h-3" />
                <span>Homework</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* File Selector / Name */}
            <div className="sm:col-span-6">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Select File or Material
              </label>
              {files.length > 0 ? (
                <select
                  value={selectedFileId}
                  onChange={e => {
                    const val = e.target.value;
                    setSelectedFileId(val);
                    const found = files.find(f => f.id === val);
                    if (found?.category) {
                      setCategory(found.category);
                    }
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  {files.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.category === 'homework' ? '🏠' : '🏫'} {f.name}
                    </option>
                  ))}
                  <option value="custom">✏️ Other custom item name...</option>
                </select>
              ) : null}

              {(files.length === 0 || selectedFileId === 'custom') && (
                <input
                  type="text"
                  autoFocus={files.length === 0}
                  placeholder="e.g. Unit 4 Review Test"
                  value={customFileName}
                  onChange={e => setCustomFileName(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              )}
            </div>

            {/* Copies Counter */}
            <div className="sm:col-span-3">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Number of Copies
              </label>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setCopies(Math.max(1, copies - 1))}
                  className="px-2 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-l-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={copies}
                  onChange={e => setCopies(parseInt(e.target.value) || 1)}
                  className="w-full text-center py-2 bg-white dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setCopies(copies + 1)}
                  className="px-2 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-r-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Notes */}
            <div className="sm:col-span-3">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Printing Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Double-sided"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 rounded-lg shadow-2xs"
            >
              Add to List
            </button>
          </div>
        </form>
      )}

      {/* ORGANIZED PRINT ITEMS: IN-CLASS & HOMEWORK */}
      {printItems.length > 0 && (
        <div className="space-y-4">
          {/* In-Class Print Items */}
          {classworkPrints.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>In-Class Handouts ({classworkPrints.length})</span>
              </h4>
              <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs divide-y divide-slate-100 dark:divide-slate-800">
                {classworkPrints.map(renderPrintRow)}
              </div>
            </div>
          )}

          {/* Homework Print Items */}
          {homeworkPrints.length > 0 && (
            <div className="space-y-2 pt-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5" />
                <span>Homework Handouts ({homeworkPrints.length})</span>
              </h4>
              <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs divide-y divide-slate-100 dark:divide-slate-800">
                {homeworkPrints.map(renderPrintRow)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* In-App File Preview Modal */}
      <FilePreviewModal
        isOpen={!!previewFile}
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!itemToDelete}
        title="Remove Print Item?"
        message={itemToDelete ? `Are you sure you want to remove "${itemToDelete.fileName}" (${itemToDelete.copies} copies) from the print list?` : ''}
        confirmLabel="Remove Item"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
};
