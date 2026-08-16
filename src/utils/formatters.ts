import { format, parseISO, isToday, isYesterday, isTomorrow, differenceInDays } from 'date-fns';

export function formatLessonDate(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    return format(d, 'MMMM d, yyyy');
  } catch {
    return dateStr;
  }
}

export function formatLessonDateShort(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    return format(d, 'EEE, MMM d');
  } catch {
    return dateStr;
  }
}

export function formatFullDayDate(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    return format(d, 'EEEE, MMMM d, yyyy');
  } catch {
    return dateStr;
  }
}

export function getRelativeDateBadge(dateStr: string): { label: string; isRecent: boolean } {
  try {
    const d = parseISO(dateStr);
    if (isToday(d)) return { label: 'Today', isRecent: true };
    if (isTomorrow(d)) return { label: 'Tomorrow', isRecent: true };
    if (isYesterday(d)) return { label: 'Yesterday', isRecent: true };
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const target = new Date(d);
    target.setHours(0,0,0,0);
    const diff = differenceInDays(today, target);

    if (diff > 0 && diff <= 7) return { label: `${diff}d ago`, isRecent: false };
    if (diff < 0 && Math.abs(diff) <= 7) return { label: `In ${Math.abs(diff)}d`, isRecent: true };
    
    return { label: format(d, 'MMM d'), isRecent: false };
  } catch {
    return { label: dateStr, isRecent: false };
  }
}

export function formatBytes(bytes: number, decimals: number = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function getFileTypeCategory(name: string, type?: string): {
  category: 'pdf' | 'doc' | 'sheet' | 'slide' | 'image' | 'audio' | 'video' | 'archive' | 'other';
  color: string;
  bgLight: string;
  bgDark: string;
} {
  const ext = name.split('.').pop()?.toLowerCase() || '';

  if (['mp3', 'wav', 'm4a', 'aac', 'ogg', 'wma', 'flac'].includes(ext) || type?.startsWith('audio/')) {
    return { category: 'audio', color: 'text-fuchsia-600 dark:text-fuchsia-400', bgLight: 'bg-fuchsia-50', bgDark: 'dark:bg-fuchsia-950/40' };
  }
  if (['mp4', 'webm', 'mov', 'mkv', 'avi', 'm4v'].includes(ext) || type?.startsWith('video/')) {
    return { category: 'video', color: 'text-rose-600 dark:text-rose-400', bgLight: 'bg-rose-50', bgDark: 'dark:bg-rose-950/40' };
  }
  if (ext === 'pdf' || type?.includes('pdf')) {
    return { category: 'pdf', color: 'text-red-600 dark:text-red-400', bgLight: 'bg-red-50', bgDark: 'dark:bg-red-950/40' };
  }
  if (['doc', 'docx', 'odt', 'rtf', 'txt', 'md'].includes(ext) || type?.includes('word') || type?.includes('text')) {
    return { category: 'doc', color: 'text-blue-600 dark:text-blue-400', bgLight: 'bg-blue-50', bgDark: 'dark:bg-blue-950/40' };
  }
  if (['xls', 'xlsx', 'csv', 'ods'].includes(ext) || type?.includes('sheet') || type?.includes('excel')) {
    return { category: 'sheet', color: 'text-emerald-600 dark:text-emerald-400', bgLight: 'bg-emerald-50', bgDark: 'dark:bg-emerald-950/40' };
  }
  if (['ppt', 'pptx', 'odp', 'key'].includes(ext) || type?.includes('presentation') || type?.includes('powerpoint')) {
    return { category: 'slide', color: 'text-amber-600 dark:text-amber-400', bgLight: 'bg-amber-50', bgDark: 'dark:bg-amber-950/40' };
  }
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext) || type?.startsWith('image/')) {
    return { category: 'image', color: 'text-purple-600 dark:text-purple-400', bgLight: 'bg-purple-50', bgDark: 'dark:bg-purple-950/40' };
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return { category: 'archive', color: 'text-slate-600 dark:text-slate-400', bgLight: 'bg-slate-100', bgDark: 'dark:bg-slate-800' };
  }
  return { category: 'other', color: 'text-slate-600 dark:text-slate-400', bgLight: 'bg-slate-100', bgDark: 'dark:bg-slate-800' };
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function previewBlob(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
