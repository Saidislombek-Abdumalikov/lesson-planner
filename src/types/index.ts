export interface Group {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  groupId: string;
  date: string; // YYYY-MM-DD
  title: string;
  lessonPlan: string;
  homework: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LessonFile {
  id: string;
  lessonId: string;
  name: string; // display name or original filename
  originalName?: string;
  type: string; // MIME type
  size: number; // in bytes
  data: Blob;
  category?: 'classwork' | 'homework'; // default 'classwork'
  createdAt: string;
}

export interface PrintItem {
  id: string;
  lessonId: string;
  fileId?: string; // Optional reference to a LessonFile
  fileName: string;
  copies: number;
  notes?: string;
  category?: 'classwork' | 'homework'; // default 'classwork'
  isPrinted?: boolean;
  createdAt: string;
}

export interface SearchResult {
  lesson: Lesson;
  groupName: string;
  matchedIn: 'title' | 'plan' | 'homework' | 'notes' | 'file';
  snippet: string;
  fileNames?: string[];
}

export interface BackupData {
  version: 1;
  exportedAt: string;
  groups: Group[];
  lessons: Lesson[];
  printItems: PrintItem[];
  files: {
    id: string;
    lessonId: string;
    name: string;
    originalName?: string;
    type: string;
    size: number;
    category?: 'classwork' | 'homework';
    base64Data: string;
    createdAt: string;
  }[];
}
