import { db, generateId } from './db';
import { Group, Lesson, LessonFile, PrintItem } from '../types';

export async function seedSampleData(): Promise<void> {
  const now = new Date();
  
  // Format dates relative to today
  const formatDate = (daysOffset: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
  };

  const group1Id = generateId();
  const group2Id = generateId();
  const group3Id = generateId();

  const sampleGroups: Group[] = [
    {
      id: group1Id,
      name: 'Group 10–12',
      description: 'Junior English • Mon / Wed / Fri 16:00',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: group2Id,
      name: 'Group 13–15',
      description: 'Intermediate Teens • Tue / Thu 17:30',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: group3Id,
      name: 'Pre-Intermediate',
      description: 'Adults general course • Sat / Sun 10:00',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];

  const lesson1Id = generateId();
  const lesson2Id = generateId();
  const lesson3Id = generateId();
  const lesson4Id = generateId();

  const sampleLessons: Lesson[] = [
    {
      id: lesson1Id,
      groupId: group1Id,
      date: formatDate(0), // Today
      title: 'Animals + Present Simple',
      lessonPlan: `1. Warm-up (10 min) — Quick mime game: guess the wild animal.
2. Vocabulary Revision (15 min) — Animal habitats & adjectives (fierce, gentle, nocturnal).
3. Present Simple Grammar (20 min) — He/she/it + -s/es rule with animal habits (e.g., "A penguin swims").
4. Controlled Practice (15 min) — Gap fill worksheet in pairs.
5. Speaking Activity (20 min) — "Create your own mythical animal and describe its daily routine".
6. Wrap-up & Review (10 min) — Exit ticket questions.`,
      homework: `1. Workbook page 34, exercises 1–4.
2. Write 6 sentences describing your favorite animal using Present Simple.
3. Learn 8 new animal adjectives for next lesson's spelling challenge.`,
      notes: 'Remember to bring the printed animal flashcards and colored markers for group drawing.',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: lesson2Id,
      groupId: group1Id,
      date: formatDate(-2),
      title: 'Have got / Has got & Daily Objects',
      lessonPlan: `1. Warm-up (10 min) — "What's in my bag?" mystery game.
2. Grammar presentation (20 min) — Have got vs Has got positive & questions.
3. Pair practice (20 min) — Interview partner about possessions.
4. Speaking game (25 min) — Board game with question cards.
5. Summary (15 min) — Common errors correction on board.`,
      homework: `Workbook page 30, ex 2 & 3.
Draw your dream bedroom and write 5 things it has got.`,
      notes: 'Group struggled a bit with questions ("Has he got..."), review at the start of next lesson.',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: lesson3Id,
      groupId: group2Id,
      date: formatDate(-1),
      title: 'Past Continuous & Interrupted Actions',
      lessonPlan: `1. Warm-up (10 min) — Alibi game: "What were you doing at 8 PM yesterday?"
2. Grammar focus (25 min) — When vs While (Past Simple + Past Continuous).
3. Listening task (20 min) — Crime investigation audio track.
4. Group roleplay (25 min) — Detective interviews suspects.
5. Homework briefing (10 min).`,
      homework: `Read text on Student Book p. 48 and answer questions 1–6.
Write a 100-word paragraph describing a funny accident using Past Continuous.`,
      notes: 'Bring audio speaker for the listening section.',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: lesson4Id,
      groupId: group3Id,
      date: formatDate(-3),
      title: 'Travel & Giving Directions',
      lessonPlan: `1. Warm-up (10 min) — City map orientation.
2. Essential phrases (15 min) — "Go straight", "Take the second left", "Opposite the station".
3. Pair Map Practice (25 min) — Giving each other directions to hidden landmarks.
4. Real-world listening (20 min) — Tourist asking for subway line.
5. Review (10 min).`,
      homework: `Workbook Unit 5 review page 42.`,
      notes: 'Print city maps for pair practice.',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];

  // Create sample dummy text blobs to simulate actual uploaded worksheet files
  const sampleFiles: LessonFile[] = [
    {
      id: generateId(),
      lessonId: lesson1Id,
      name: 'Animal_Habitats_Worksheet.pdf',
      type: 'application/pdf',
      size: 142850,
      data: new Blob(['%PDF-1.4 Sample PDF content for Animal Habitats Worksheet'], { type: 'application/pdf' }),
      createdAt: now.toISOString(),
    },
    {
      id: generateId(),
      lessonId: lesson1Id,
      name: 'Present_Simple_Animal_Cards.docx',
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 78300,
      data: new Blob(['Sample DOCX content for Present Simple Animal Cards'], { type: 'application/octet-stream' }),
      createdAt: now.toISOString(),
    },
    {
      id: generateId(),
      lessonId: lesson2Id,
      name: 'Have_Got_Boardgame.pdf',
      type: 'application/pdf',
      size: 215400,
      data: new Blob(['%PDF-1.4 Sample PDF content for Have Got Board Game'], { type: 'application/pdf' }),
      createdAt: now.toISOString(),
    },
  ];

  const samplePrintItems: PrintItem[] = [
    {
      id: generateId(),
      lessonId: lesson1Id,
      fileId: sampleFiles[0].id,
      fileName: 'Animal_Habitats_Worksheet.pdf',
      copies: 15,
      notes: 'Double-sided, one per student',
      isPrinted: false,
      createdAt: now.toISOString(),
    },
    {
      id: generateId(),
      lessonId: lesson1Id,
      fileId: sampleFiles[1].id,
      fileName: 'Present_Simple_Animal_Cards.docx',
      copies: 8,
      notes: 'Cut in half for pair work',
      isPrinted: false,
      createdAt: now.toISOString(),
    },
    {
      id: generateId(),
      lessonId: lesson2Id,
      fileId: sampleFiles[2].id,
      fileName: 'Have_Got_Boardgame.pdf',
      copies: 6,
      notes: 'Color print if possible (groups of 3)',
      isPrinted: true,
      createdAt: now.toISOString(),
    },
  ];

  await db.transaction('rw', db.groups, db.lessons, db.files, db.printItems, async () => {
    await db.groups.bulkAdd(sampleGroups);
    await db.lessons.bulkAdd(sampleLessons);
    await db.files.bulkAdd(sampleFiles);
    await db.printItems.bulkAdd(samplePrintItems);
  });
}
