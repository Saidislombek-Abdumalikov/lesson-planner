import { db } from '../db/db';
import { BackupData, Group, Lesson, LessonFile, PrintItem } from '../types';
import { downloadBlob, formatBytes } from './formatters';

// Convert Blob to Base64
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // remove data:*/*;base64, prefix if needed or store as is
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Convert Base64 data URL to Blob
export function base64ToBlob(base64Data: string, fallbackType: string = 'application/octet-stream'): Blob {
  try {
    const parts = base64Data.split(';base64,');
    if (parts.length === 2) {
      const contentType = parts[0].split(':')[1] || fallbackType;
      const raw = window.atob(parts[1]);
      const rawLength = raw.length;
      const uInt8Array = new Uint8Array(rawLength);
      for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
      }
      return new Blob([uInt8Array], { type: contentType });
    }
    // Fallback if not a data URL
    const raw = window.atob(base64Data);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: fallbackType });
  } catch (err) {
    console.error('Failed to convert base64 to blob:', err);
    return new Blob(['Corrupted file'], { type: fallbackType });
  }
}

export async function exportDatabase(): Promise<void> {
  const [groups, lessons, printItems, rawFiles] = await Promise.all([
    db.groups.toArray(),
    db.lessons.toArray(),
    db.printItems.toArray(),
    db.files.toArray(),
  ]);

  const convertedFiles = [];
  for (const f of rawFiles) {
    const base64Data = await blobToBase64(f.data);
    convertedFiles.push({
      id: f.id,
      lessonId: f.lessonId,
      name: f.name,
      originalName: f.originalName,
      type: f.type,
      size: f.size,
      category: f.category || 'classwork',
      base64Data,
      createdAt: f.createdAt,
    });
  }

  const backup: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    groups,
    lessons,
    printItems,
    files: convertedFiles,
  };

  const jsonString = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const dateStr = new Date().toISOString().split('T')[0];
  downloadBlob(blob, `lesson-planner-backup-${dateStr}.json`);
}

export async function importDatabase(
  backupFile: File,
  mode: 'replace' | 'merge' = 'replace'
): Promise<{ success: boolean; stats?: { groups: number; lessons: number; files: number }; error?: string }> {
  try {
    const text = await backupFile.text();
    const data = JSON.parse(text) as BackupData;

    if (!data.version || !Array.isArray(data.groups) || !Array.isArray(data.lessons)) {
      return { success: false, error: 'Invalid backup file format. Missing required planner data.' };
    }

    const restoredFiles: LessonFile[] = (data.files || []).map(f => ({
      id: f.id,
      lessonId: f.lessonId,
      name: f.name,
      originalName: f.originalName,
      type: f.type,
      size: f.size,
      category: f.category || 'classwork',
      data: base64ToBlob(f.base64Data, f.type),
      createdAt: f.createdAt,
    }));

    await db.transaction('rw', db.groups, db.lessons, db.files, db.printItems, async () => {
      if (mode === 'replace') {
        await db.files.clear();
        await db.printItems.clear();
        await db.lessons.clear();
        await db.groups.clear();
      }

      // Add or update
      await db.groups.bulkPut(data.groups);
      await db.lessons.bulkPut(data.lessons);
      if (data.printItems && data.printItems.length > 0) {
        await db.printItems.bulkPut(data.printItems);
      }
      if (restoredFiles.length > 0) {
        await db.files.bulkPut(restoredFiles);
      }
    });

    return {
      success: true,
      stats: {
        groups: data.groups.length,
        lessons: data.lessons.length,
        files: restoredFiles.length,
      },
    };
  } catch (err: any) {
    console.error('Import error:', err);
    return { success: false, error: err.message || 'Failed to parse and import backup file.' };
  }
}

export async function getStorageEstimate(): Promise<{ usageStr: string; quotaStr: string; percent: number }> {
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percent = quota > 0 ? Math.round((usage / quota) * 100) : 0;
      return {
        usageStr: formatBytes(usage),
        quotaStr: formatBytes(quota),
        percent,
      };
    } catch {
      // ignore
    }
  }
  return { usageStr: 'Unknown', quotaStr: 'Unknown', percent: 0 };
}
