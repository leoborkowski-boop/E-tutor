import type { Difficulty, Generator, TheoryBlock } from '../types';

/** Umiejętność: jedna rzecz, której uczeń się uczy (np. „Procent danej liczby”). */
export type Skill = {
  id: string;
  title: string;
  /** Teoria pokazywana w lekcji „Poznaj” */
  theory: TheoryBlock[];
  gen: Generator;
};

/** Dział egzaminacyjny (np. „Procenty”). */
export type Zone = {
  id: string;
  title: string;
  short: string;
  /** krótki znak na kafelku, np. „%” */
  mark: string;
  skills: Skill[];
  /** Dodatkowa teoria i laboratoria (dla ułamków – stare ekrany działów) */
  extraLink?: { label: string; href: string };
};

export type LessonKind = 'poznaj' | 'cwicz' | 'trudniej' | 'sprawdzian';

export type Lesson = {
  id: string;
  zoneId: string;
  skillId: string;
  kind: LessonKind;
  /** numer lekcji w dziale (1…) */
  n: number;
  title: string;
  diffs: Difficulty[];
};

export const LESSON_KINDS: { kind: LessonKind; label: string; about: string; diffs: Difficulty[] }[] = [
  { kind: 'poznaj', label: 'Poznaj', about: 'teoria, przykład i 4 łatwe zadania', diffs: [1, 1, 1, 2] },
  { kind: 'cwicz', label: 'Ćwicz', about: '6 zadań z podpowiedziami', diffs: [1, 2, 1, 2, 2, 2] },
  { kind: 'trudniej', label: 'Trudniej', about: '6 trudniejszych zadań', diffs: [2, 3, 2, 3, 3, 3] },
  { kind: 'sprawdzian', label: 'Sprawdzian', about: '5 zadań; 4 dobre odpowiedzi zaliczają', diffs: [2, 2, 3, 3, 3] },
];

export function lessonId(skillId: string, kind: LessonKind) {
  return `${skillId}--${kind}`;
}

export function buildLessons(zone: Zone): Lesson[] {
  let n = 0;
  return zone.skills.flatMap((s) =>
    LESSON_KINDS.map((k) => ({
      id: lessonId(s.id, k.kind),
      zoneId: zone.id,
      skillId: s.id,
      kind: k.kind,
      n: ++n,
      title: `${k.label}: ${s.title}`,
      diffs: k.diffs,
    })),
  );
}

/** Gwiazdki za lekcję na podstawie średniego wyniku 0–1. */
export function starsFor(kind: LessonKind, avg: number, correct: number, total: number): number {
  if (kind === 'sprawdzian' && correct < Math.ceil(total * 0.8)) return 0;
  if (avg >= 0.9) return 3;
  if (avg >= 0.7) return 2;
  return 1;
}
