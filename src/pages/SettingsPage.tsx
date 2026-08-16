import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, 
  Upload, 
  Trash2, 
  Sun, 
  Moon, 
  Laptop, 
  HardDrive, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles,
  ArrowLeft,
  Info
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { exportDatabase, importDatabase, getStorageEstimate } from '../utils/backup';
import { clearAllDatabase } from '../db/db';
import { seedSampleData } from '../db/seed';
import { ConfirmModal } from '../components/layout/ConfirmModal';

interface SettingsPageProps {
  onBack: () => void;
  onRefreshData: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onBack, onRefreshData }) => {
  const { theme, setTheme } = useTheme();
  const [storageInfo, setStorageInfo] = useState({ usageStr: '...', quotaStr: '...', percent: 0 });
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getStorageEstimate().then(setStorageInfo);
  }, []);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportDatabase();
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setImportStatus(null);
      const res = await importDatabase(file, 'replace');
      if (res.success && res.stats) {
        setImportStatus({
          success: true,
          message: `Successfully restored ${res.stats.groups} groups, ${res.stats.lessons} lessons, and ${res.stats.files} attached files!`,
        });
        onRefreshData();
        getStorageEstimate().then(setStorageInfo);
      } else {
        setImportStatus({
          success: false,
          message: res.error || 'Failed to import backup file.',
        });
      }
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClearAll = async () => {
    await clearAllDatabase();
    setIsClearModalOpen(false);
    onRefreshData();
    getStorageEstimate().then(setStorageInfo);
    setImportStatus({
      success: true,
      message: 'All local planner data has been reset.',
    });
  };

  const handleSeed = async () => {
    try {
      setIsSeeding(true);
      await seedSampleData();
      onRefreshData();
      getStorageEstimate().then(setStorageInfo);
      setImportStatus({
        success: true,
        message: 'Sample demo lessons and materials loaded successfully.',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Settings & Data Backup
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your offline storage, backups, and appearance.
          </p>
        </div>

        <button
          onClick={onBack}
          className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      {/* Storage & Privacy Advisory Banner */}
      <div className="bg-brand-50/70 dark:bg-brand-950/40 border border-brand-200/80 dark:border-brand-900/60 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
        <Info className="w-5 h-5 text-brand-600 dark:text-brand-400 mt-0.5 flex-shrink-0" />
        <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          <p className="font-bold text-slate-900 dark:text-white">
            100% Offline & Private to this Device
          </p>
          <p>
            Your lesson plans and uploaded files are stored safely in your browser's IndexedDB. They are completely private to your computer or phone.
          </p>
          <p className="text-brand-800 dark:text-brand-300 font-medium">
            💡 Use <strong>Export Backup</strong> regularly to keep safe copies or transfer your lessons to another computer.
          </p>
        </div>
      </div>

      {/* Import Status Alert */}
      {importStatus && (
        <div className={`p-4 rounded-xl text-xs font-medium border flex items-center gap-3 animate-in fade-in ${
          importStatus.success
            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
            : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
        }`}>
          {importStatus.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{importStatus.message}</span>
        </div>
      )}

      {/* SECTION 1: DATA BACKUP & RESTORE */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Data Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Export all lessons, homework, and file attachments to a file.
          </p>
        </div>

        {/* Local Storage Indicator */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/70 dark:border-slate-700/60 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-slate-400" />
              Device Storage Usage
            </span>
            <span className="font-mono text-slate-600 dark:text-slate-400 font-medium">
              {storageInfo.usageStr} used of {storageInfo.quotaStr}
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-brand-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(1, storageInfo.percent)}%` }}
            />
          </div>
        </div>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Export */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-500 bg-white dark:bg-slate-800 hover:bg-brand-50/40 dark:hover:bg-slate-800/80 transition-all text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Download className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Export Backup File
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Downloads a single backup file containing all groups, lessons, notes, and attached worksheets.
            </p>
          </button>

          {/* Import */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-500 bg-white dark:bg-slate-800 hover:bg-brand-50/40 dark:hover:bg-slate-800/80 transition-all text-left group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Upload className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Import Backup File
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select a previously exported JSON backup file to restore on this device.
            </p>
          </button>
        </div>

        {/* Demo Data & Reset */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handleSeed}
            disabled={isSeeding}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{isSeeding ? 'Loading sample data...' : 'Load Sample Demo Lessons'}</span>
          </button>

          <button
            onClick={() => setIsClearModalOpen(true)}
            className="px-3.5 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Planner Data</span>
          </button>
        </div>
      </div>

      {/* SECTION 2: APPEARANCE */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Appearance
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Choose your preferred color theme.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setTheme('light')}
            className={`p-3.5 rounded-xl border text-center transition-all ${
              theme === 'light'
                ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-bold'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Sun className="w-5 h-5 mx-auto mb-1.5 text-amber-500" />
            <span className="text-xs">Light</span>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`p-3.5 rounded-xl border text-center transition-all ${
              theme === 'dark'
                ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-bold'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Moon className="w-5 h-5 mx-auto mb-1.5 text-brand-400" />
            <span className="text-xs">Dark</span>
          </button>

          <button
            onClick={() => setTheme('system')}
            className={`p-3.5 rounded-xl border text-center transition-all ${
              theme === 'system'
                ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-bold'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Laptop className="w-5 h-5 mx-auto mb-1.5 text-slate-400" />
            <span className="text-xs">System</span>
          </button>
        </div>
      </div>

      {/* Clear All Confirmation Modal */}
      <ConfirmModal
        isOpen={isClearModalOpen}
        title="Clear All Planner Data?"
        message="Are you sure you want to permanently erase all groups, lessons, uploaded files, and print checklists from this browser? This action cannot be undone unless you have an exported backup file."
        confirmLabel="Clear All Data"
        isDestructive={true}
        onConfirm={handleClearAll}
        onCancel={() => setIsClearModalOpen(false)}
      />
    </div>
  );
};
