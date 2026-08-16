import React, { useRef, useState } from 'react';
import { 
  Upload, 
  File, 
  FileText, 
  Image as ImageIcon, 
  Music, 
  Video, 
  Download, 
  Trash2, 
  Printer, 
  ExternalLink, 
  Edit2, 
  Check, 
  X,
  BookOpen,
  Home
} from 'lucide-react';
import { LessonFile } from '../../types';
import { 
  formatBytes, 
  getFileTypeCategory, 
  downloadBlob, 
  previewBlob 
} from '../../utils/formatters';
import { ConfirmModal } from '../layout/ConfirmModal';

interface FileUploaderProps {
  files: LessonFile[];
  onUpload: (files: FileList, customName?: string, category?: 'classwork' | 'homework') => Promise<void>;
  onUpdateFile: (fileId: string, updates: Partial<Pick<LessonFile, 'name' | 'category'>>) => Promise<void>;
  onDelete: (fileId: string) => Promise<void>;
  onAddToPrint: (file: LessonFile) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  files,
  onUpload,
  onUpdateFile,
  onDelete,
  onAddToPrint,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [customUploadName, setCustomUploadName] = useState('');
  const [selectedUploadCategory, setSelectedUploadCategory] = useState<'classwork' | 'homework'>('classwork');

  // Rename Inline State
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Delete confirmation state
  const [fileToDelete, setFileToDelete] = useState<LessonFile | null>(null);

  // Audio playing state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(e.target.files);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const processFiles = async (fileList: FileList) => {
    try {
      setIsUploading(true);
      await onUpload(fileList, customUploadName.trim() || undefined, selectedUploadCategory);
      setCustomUploadName('');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveRename = async (fileId: string) => {
    if (editingName.trim()) {
      await onUpdateFile(fileId, { name: editingName.trim() });
    }
    setEditingFileId(null);
  };

  const handleToggleCategory = async (file: LessonFile) => {
    const nextCategory = (file.category || 'classwork') === 'classwork' ? 'homework' : 'classwork';
    await onUpdateFile(file.id, { category: nextCategory });
  };

  const handleConfirmDeleteFile = async () => {
    if (fileToDelete) {
      await onDelete(fileToDelete.id);
      setFileToDelete(null);
    }
  };

  const renderFileIcon = (file: LessonFile) => {
    const info = getFileTypeCategory(file.name, file.type);
    if (info.category === 'audio') return <Music className={`w-4 h-4 ${info.color}`} />;
    if (info.category === 'video') return <Video className={`w-4 h-4 ${info.color}`} />;
    if (info.category === 'image') return <ImageIcon className={`w-4 h-4 ${info.color}`} />;
    if (info.category === 'pdf' || info.category === 'doc') return <FileText className={`w-4 h-4 ${info.color}`} />;
    return <File className={`w-4 h-4 ${info.color}`} />;
  };

  // Split into in-class vs homework
  const classworkFiles = files.filter(f => (f.category || 'classwork') === 'classwork');
  const homeworkFiles = files.filter(f => f.category === 'homework');

  const renderFileCard = (file: LessonFile) => {
    const typeInfo = getFileTypeCategory(file.name, file.type);
    const isAudio = typeInfo.category === 'audio';
    const isVideo = typeInfo.category === 'video';
    const isPrintable = !isAudio && !isVideo;
    const isHw = file.category === 'homework';

    return (
      <div
        key={file.id}
        className="p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
      >
        {/* Left Side: Icon & Name / Audio Player / Edit Name */}
        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
          <div className={`w-9 h-9 rounded-lg ${typeInfo.bgLight} ${typeInfo.bgDark} flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0`}>
            {renderFileIcon(file)}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            {editingFileId === file.id ? (
              <div className="flex items-center gap-1.5 max-w-md">
                <input
                  type="text"
                  autoFocus
                  value={editingName}
                  onChange={e => setEditingName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveRename(file.id);
                    if (e.key === 'Escape') setEditingFileId(null);
                  }}
                  className="flex-1 px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="button"
                  onClick={() => handleSaveRename(file.id)}
                  className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingFileId(null)}
                  className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => previewBlob(file.data)}
                  className="text-sm font-semibold text-slate-800 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 transition-colors truncate text-left"
                  title="Open file in new tab"
                >
                  {file.name}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingFileId(file.id);
                    setEditingName(file.name);
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5 rounded"
                  title="Rename file"
                >
                  <Edit2 className="w-3 h-3" />
                </button>

                {/* 1-Click Category Switcher Badge */}
                <button
                  type="button"
                  onClick={() => handleToggleCategory(file)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase transition-colors flex items-center gap-1 ${
                    isHw
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800'
                  }`}
                  title={isHw ? 'Click to move to In-Class Materials' : 'Click to move to Homework Materials'}
                >
                  {isHw ? <Home className="w-2.5 h-2.5" /> : <BookOpen className="w-2.5 h-2.5" />}
                  <span>{isHw ? 'Homework' : 'In-Class'}</span>
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 flex-wrap">
              <span>
                {formatBytes(file.size)} • Stored locally
                {file.originalName && file.originalName !== file.name && (
                  <span className="ml-1 text-slate-400 dark:text-slate-500 italic">({file.originalName})</span>
                )}
              </span>
            </div>

            {/* Inline HTML5 Audio Player */}
            {isAudio && (
              <div className="pt-1.5 flex items-center gap-2">
                <audio
                  ref={el => { audioRefs.current[file.id] = el; }}
                  src={URL.createObjectURL(file.data)}
                  controls
                  className="h-8 max-w-full sm:max-w-xs"
                  onPlay={() => setPlayingAudioId(file.id)}
                  onPause={() => setPlayingAudioId(null)}
                  onEnded={() => setPlayingAudioId(null)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto flex-shrink-0">
          {/* Add to Print list (only for printable documents) */}
          {isPrintable && (
            <button
              type="button"
              onClick={() => onAddToPrint(file)}
              className="px-2.5 py-1 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 rounded-md flex items-center gap-1 transition-colors"
              title={`Add to ${isHw ? 'Homework' : 'In-Class'} print list`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add to Print</span>
            </button>
          )}

          {/* Open File in New Tab */}
          <button
            type="button"
            onClick={() => previewBlob(file.data)}
            className="p-1.5 text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Open file in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </button>

          {/* Download */}
          <button
            type="button"
            onClick={() => downloadBlob(file.data, file.originalName || file.name)}
            className="p-1.5 text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 rounded-lg transition-colors"
            title="Download file"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Delete with Confirmation Modal */}
          <button
            type="button"
            onClick={() => setFileToDelete(file)}
            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
            title="Delete file"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Upload Controls Bar */}
      <div className="space-y-3 p-4 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Target Category Selector: In-Class vs Homework */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Upload For:
            </span>
            <div className="inline-flex rounded-xl bg-slate-200/80 dark:bg-slate-700/60 p-0.5">
              <button
                type="button"
                onClick={() => setSelectedUploadCategory('classwork')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  selectedUploadCategory === 'classwork'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>🏫 In-Class Lesson</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedUploadCategory('homework')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  selectedUploadCategory === 'homework'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>🏠 Homework</span>
              </button>
            </div>
          </div>

          {/* Optional Custom File Name Input */}
          <div className="flex-1 max-w-md">
            <input
              type="text"
              value={customUploadName}
              onChange={e => setCustomUploadName(e.target.value)}
              placeholder="Optional: custom display name (e.g. Unit 4 Reading)..."
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 scale-[0.99]'
              : 'border-slate-300 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-500 bg-white dark:bg-slate-800/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="*/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center gap-1.5 py-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              selectedUploadCategory === 'homework'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
            }`}>
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {isUploading ? 'Saving materials to offline storage...' : `Click or drag files here to add as ${selectedUploadCategory === 'homework' ? '🏠 Homework' : '🏫 In-Class'} materials`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ORGANIZED MATERIALS: IN-CLASS VS HOMEWORK */}
      <div className="space-y-4">
        {/* 1. In-Class Lesson Materials Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>In-Class Lesson Materials ({classworkFiles.length})</span>
            </h3>
          </div>

          {classworkFiles.length === 0 ? (
            <div className="p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center text-xs text-slate-400 dark:text-slate-500">
              No in-class materials uploaded yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
              {classworkFiles.map(renderFileCard)}
            </div>
          )}
        </div>

        {/* 2. Homework Materials Section */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5" />
              <span>Homework Materials ({homeworkFiles.length})</span>
            </h3>
          </div>

          {homeworkFiles.length === 0 ? (
            <div className="p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center text-xs text-slate-400 dark:text-slate-500">
              No homework materials uploaded yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
              {homeworkFiles.map(renderFileCard)}
            </div>
          )}
        </div>
      </div>

      {/* Delete File Confirmation Modal */}
      <ConfirmModal
        isOpen={!!fileToDelete}
        title="Delete File Material?"
        message={fileToDelete ? `Are you sure you want to delete "${fileToDelete.name}"? This file and any associated print items will be removed.` : ''}
        confirmLabel="Delete File"
        isDestructive={true}
        onConfirm={handleConfirmDeleteFile}
        onCancel={() => setFileToDelete(null)}
      />
    </div>
  );
};
