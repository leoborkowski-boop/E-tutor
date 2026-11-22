import { buildLessons, type Lesson, type Skill, type Zone } from './model';
import { ULAMKI } from './zones/ulamki';
import { LICZBY } from './zones/liczby';
import { PROCENTY } from './zones/procenty';
import { POTEGI } from './zones/potegi';
import { WYRAZENIA } from './zones/wyrazenia';
import { ROWNANIA } from './zones/rownania';
import { GEOMETRIA } from './zones/geometria';
import { PITAGORAS } from './zones/pitagoras';
import { BRYLY } from './zones/bryly';
import { STATYSTYKA } from './zones/statystyka';

/** Wszystkie działy w kolejności wyświetlania. */
export const ZONES: Zone[] = [ULAMKI, LICZBY, PROCENTY, POTEGI, WYRAZENIA, ROWNANIA, GEOMETRIA, PITAGORAS, BRYLY, STATYSTYKA];

export const ZONE_BY_ID: Record<string, Zone> = Object.fromEntries(ZONES.map((z) => [z.id, z]));

export const LESSONS_BY_ZONE: Record<string, Lesson[]> = Object.fromEntries(ZONES.map((z) => [z.id, buildLessons(z)]));

export const LESSON_BY_ID: Record<string, Lesson> = Object.fromEntries(Object.values(LESSONS_BY_ZONE).flat().map((l) => [l.id, l]));

export const SKILL_BY_ID: Record<string, Skill> = Object.fromEntries(ZONES.flatMap((z) => z.skills.map((s) => [s.id, s])));

export const ALL_LESSONS: Lesson[] = Object.values(LESSONS_BY_ZONE).flat();

/** Następna lekcja w dziale po podanej (albo undefined na końcu działu). */
export function nextLesson(l: Lesson): Lesson | undefined {
  const list = LESSONS_BY_ZONE[l.zoneId];
  return list[list.findIndex((x) => x.id === l.id) + 1];
}

/** Pierwsza nieukończona lekcja działu. */
export function firstOpenLesson(zoneId: string, done: Record<string, { stars: number }>): Lesson | undefined {
  return LESSONS_BY_ZONE[zoneId]?.find((l) => !(done[l.id]?.stars > 0));
}

export type { Lesson, Skill, Zone };
