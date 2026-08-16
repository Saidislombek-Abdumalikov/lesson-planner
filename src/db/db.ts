import Dexie, { Table } from 'dexie';
import { Group, Lesson, LessonFile, PrintItem, SearchResult } from '../types';

export class TeacherPlannerDB extends Dexie {
  groups!: Table<Group, string>;
  lessons!: Table<Lesson, string>;
  files!: Table<LessonFile, string>;
  printItems!: Table<PrintItem, string>;

  constructor() {
    super('TeacherPlannerDB');
    this.version(1).stores({
      groups: 'id, name, createdAt, updatedAt',
      lessons: 'id, groupId, date, title, createdAt, updatedAt, [groupId+date]',
      files: 'id, lessonId, name, createdAt',
      printItems: 'id, lessonId, fileId, createdAt',
    });
  }
}

export const db = new TeacherPlannerDB();

// Helper to generate UUIDs
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

// ----------------- GROUPS -----------------
export async function getAllGroups(): Promise<Group[]> {
  return await db.groups.toArray();
}

export async function getGroup(id: string): Promise<Group | undefined> {
  return await db.groups.get(id);
}

export async function createGroup(name: string, description?: string): Promise<Group> {
  const now = new Date().toISOString();
  const newGroup: Group = {
    id: generateId(),
    name: name.trim(),
    description: description?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };
  await db.groups.add(newGroup);
  return newGroup;
}

export async function updateGroup(id: string, name: string, description?: string): Promise<void> {
  await db.groups.update(id, {
    name: name.trim(),
    description: description?.trim() || undefined,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteGroup(groupId: string): Promise<void> {
  await db.transaction('rw', db.groups, db.lessons, db.files, db.printItems, async () => {
    // Find all lessons for this group
    const lessons = await db.lessons.where('groupId').equals(groupId).toArray();
    const lessonIds = lessons.map(l => l.id);

    // Delete files for all lessons
    for (const lessonId of lessonIds) {
      await db.files.where('lessonId').equals(lessonId).delete();
      await db.printItems.where('lessonId').equals(lessonId).delete();
    }

    // Delete lessons
    await db.lessons.where('groupId').equals(groupId).delete();

    // Delete group
    await db.groups.delete(groupId);
  });
}

// ----------------- LESSONS -----------------
export async function getLessonsByGroup(groupId: string, sortAsc: boolean = false): Promise<Lesson[]> {
  const lessons = await db.lessons.where('groupId').equals(groupId).toArray();
  return lessons.sort((a, b) => {
    const cmp = a.date.localeCompare(b.date);
    return sortAsc ? cmp : -cmp; // default newest first
  });
}

export async function getLesson(id: string): Promise<Lesson | undefined> {
  return await db.lessons.get(id);
}

export async function createLesson(data: {
  groupId: string;
  date: string;
  title: string;
  lessonPlan?: string;
  homework?: string;
  notes?: string;
}): Promise<Lesson> {
  const now = new Date().toISOString();
  const newLesson: Lesson = {
    id: generateId(),
    groupId: data.groupId,
    date: data.date,
    title: data.title.trim() || 'Untitled Lesson',
    lessonPlan: data.lessonPlan || '',
    homework: data.homework || '',
    notes: data.notes || '',
    createdAt: now,
    updatedAt: now,
  };
  await db.lessons.add(newLesson);
  return newLesson;
}

export async function updateLesson(
  id: string,
  updates: Partial<Pick<Lesson, 'title' | 'date' | 'lessonPlan' | 'homework' | 'notes'>>
): Promise<void> {
  await db.lessons.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteLesson(lessonId: string): Promise<void> {
  await db.transaction('rw', db.lessons, db.files, db.printItems, async () => {
    await db.files.where('lessonId').equals(lessonId).delete();
    await db.printItems.where('lessonId').equals(lessonId).delete();
    await db.lessons.delete(lessonId);
  });
}

export async function duplicateLesson(
  sourceLessonId: string,
  targetDate: string,
  targetGroupId?: string
): Promise<Lesson> {
  const source = await db.lessons.get(sourceLessonId);
  if (!source) throw new Error('Source lesson not found');

  const targetGId = targetGroupId || source.groupId;
  const now = new Date().toISOString();
  const newLessonId = generateId();

  return await db.transaction('rw', db.lessons, db.files, db.printItems, async () => {
    // 1. Create duplicated lesson
    const duplicatedLesson: Lesson = {
      id: newLessonId,
      groupId: targetGId,
      date: targetDate,
      title: source.title,
      lessonPlan: source.lessonPlan,
      homework: source.homework,
      notes: source.notes,
      createdAt: now,
      updatedAt: now,
    };
    await db.lessons.add(duplicatedLesson);

    // 2. Clone attached files & materials
    const sourceFiles = await db.files.where('lessonId').equals(sourceLessonId).toArray();
    const fileIdMap = new Map<string, string>(); // oldId -> newId

    for (const file of sourceFiles) {
      const newFileId = generateId();
      fileIdMap.set(file.id, newFileId);
      const clonedFile: LessonFile = {
        id: newFileId,
        lessonId: newLessonId,
        name: file.name,
        originalName: file.originalName,
        type: file.type,
        size: file.size,
        data: file.data, // Shared or cloned blob
        category: file.category || 'classwork',
        createdAt: now,
      };
      await db.files.add(clonedFile);
    }

    // 3. Clone print items
    const sourcePrintItems = await db.printItems.where('lessonId').equals(sourceLessonId).toArray();
    for (const item of sourcePrintItems) {
      const newPrintItem: PrintItem = {
        id: generateId(),
        lessonId: newLessonId,
        fileId: item.fileId ? fileIdMap.get(item.fileId) : undefined,
        fileName: item.fileName,
        copies: item.copies,
        notes: item.notes,
        category: item.category || 'classwork',
        isPrinted: false,
        createdAt: now,
      };
      await db.printItems.add(newPrintItem);
    }

    return duplicatedLesson;
  });
}

// ----------------- FILES & MATERIALS -----------------
export async function getFilesForLesson(lessonId: string): Promise<LessonFile[]> {
  return await db.files.where('lessonId').equals(lessonId).toArray();
}

export async function addLessonFile(
  lessonId: string, 
  file: File, 
  customName?: string,
  category: 'classwork' | 'homework' = 'classwork'
): Promise<LessonFile> {
  const now = new Date().toISOString();
  const displayName = customName?.trim() || file.name;
  const newFile: LessonFile = {
    id: generateId(),
    lessonId,
    name: displayName,
    originalName: file.name,
    type: file.type || 'application/octet-stream',
    size: file.size,
    data: file, // Store as File / Blob
    category,
    createdAt: now,
  };
  await db.files.add(newFile);
  return newFile;
}

export async function updateLessonFile(
  fileId: string, 
  updates: Partial<Pick<LessonFile, 'name' | 'category'>>
): Promise<void> {
  await db.files.update(fileId, updates);
}

export async function deleteLessonFile(fileId: string): Promise<void> {
  await db.transaction('rw', db.files, db.printItems, async () => {
    // Also remove or unlink from print items
    await db.printItems.where('fileId').equals(fileId).delete();
    await db.files.delete(fileId);
  });
}

// ----------------- PRINT ITEMS -----------------
export async function getPrintItemsForLesson(lessonId: string): Promise<PrintItem[]> {
  return await db.printItems.where('lessonId').equals(lessonId).toArray();
}

export async function addPrintItem(data: {
  lessonId: string;
  fileId?: string;
  fileName: string;
  copies: number;
  notes?: string;
  category?: 'classwork' | 'homework';
}): Promise<PrintItem> {
  const now = new Date().toISOString();
  const newItem: PrintItem = {
    id: generateId(),
    lessonId: data.lessonId,
    fileId: data.fileId,
    fileName: data.fileName.trim(),
    copies: Math.max(1, data.copies || 1),
    notes: data.notes?.trim() || undefined,
    category: data.category || 'classwork',
    isPrinted: false,
    createdAt: now,
  };
  await db.printItems.add(newItem);
  return newItem;
}

export async function updatePrintItem(id: string, updates: Partial<PrintItem>): Promise<void> {
  await db.printItems.update(id, updates);
}

export async function deletePrintItem(id: string): Promise<void> {
  await db.printItems.delete(id);
}

// ----------------- GLOBAL SEARCH -----------------
export async function searchAll(query: string): Promise<SearchResult[]> {
  const cleanQ = query.trim().toLowerCase();
  if (!cleanQ) return [];

  const [groups, lessons, files] = await Promise.all([
    db.groups.toArray(),
    db.lessons.toArray(),
    db.files.toArray(),
  ]);

  const groupMap = new Map<string, string>();
  groups.forEach(g => groupMap.set(g.id, g.name));

  // Map lessonId to file names
  const lessonFilesMap = new Map<string, string[]>();
  files.forEach(f => {
    const list = lessonFilesMap.get(f.lessonId) || [];
    list.push(f.name);
    lessonFilesMap.set(f.lessonId, list);
  });

  const results: SearchResult[] = [];

  for (const lesson of lessons) {
    const groupName = groupMap.get(lesson.groupId) || 'Unknown Group';
    const attachedFileNames = lessonFilesMap.get(lesson.id) || [];

    if (lesson.title.toLowerCase().includes(cleanQ)) {
      results.push({
        lesson,
        groupName,
        matchedIn: 'title',
        snippet: lesson.title,
        fileNames: attachedFileNames,
      });
    } else if (lesson.lessonPlan.toLowerCase().includes(cleanQ)) {
      results.push({
        lesson,
        groupName,
        matchedIn: 'plan',
        snippet: extractSnippet(lesson.lessonPlan, cleanQ),
        fileNames: attachedFileNames,
      });
    } else if (lesson.homework.toLowerCase().includes(cleanQ)) {
      results.push({
        lesson,
        groupName,
        matchedIn: 'homework',
        snippet: extractSnippet(lesson.homework, cleanQ),
        fileNames: attachedFileNames,
      });
    } else if (lesson.notes && lesson.notes.toLowerCase().includes(cleanQ)) {
      results.push({
        lesson,
        groupName,
        matchedIn: 'notes',
        snippet: extractSnippet(lesson.notes, cleanQ),
        fileNames: attachedFileNames,
      });
    } else {
      const matchingFile = attachedFileNames.find(fn => fn.toLowerCase().includes(cleanQ));
      if (matchingFile) {
        results.push({
          lesson,
          groupName,
          matchedIn: 'file',
          snippet: `Attached file: ${matchingFile}`,
          fileNames: attachedFileNames,
        });
      }
    }
  }

  // Sort results by lesson date (newest first)
  return results.sort((a, b) => b.lesson.date.localeCompare(a.lesson.date));
}

function extractSnippet(text: string, query: string, maxLength: number = 100): string {
  const index = text.toLowerCase().indexOf(query);
  if (index === -1) return text.slice(0, maxLength);
  const start = Math.max(0, index - 30);
  const end = Math.min(text.length, index + query.length + 50);
  let snippet = text.slice(start, end).replace(/\n+/g, ' ');
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  return snippet;
}

// ----------------- CLEAR ALL DATA -----------------
export async function clearAllDatabase(): Promise<void> {
  await db.transaction('rw', db.groups, db.lessons, db.files, db.printItems, async () => {
    await db.files.clear();
    await db.printItems.clear();
    await db.lessons.clear();
    await db.groups.clear();
  });
}
