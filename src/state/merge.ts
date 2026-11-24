/**
 * Łączenie postępów z dwóch źródeł (to urządzenie i konto na serwerze).
 *
 * Zasada: nic nie ginie, wynik nie zależy od kolejności (merge(a, b) = merge(b, a)),
 * a ponowne scalenie tego samego niczego nie zmienia – dzięki temu synchronizacja może
 * się powtarzać i działać na wielu urządzeniach naraz.
 */
import { EMPTY_PROGRESS, type Attempt, type ExamResult, type Progress, type TopicMeta } from './progress';

export const MAX_ATTEMPTS = 3000;

const asObj = <T>(x: unknown): Record<string, T> => (x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, T>) : {});
const asArr = <T>(x: unknown): T[] => (Array.isArray(x) ? (x as T[]) : []);

function sortedKeys<T>(o: Record<string, T>): Record<string, T> {
  return Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]]));
}

/** Dane z serwera lub pliku → poprawny obiekt Progress (brakujące pola uzupełnione, `[]` zamiast `{}` naprawione). */
export function normalizeProgress(p: unknown): Progress {
  const o = asObj<unknown>(p);
  return {
    attempts: asArr<Attempt>(o.attempts).filter((a) => a && typeof a.ts === 'number' && typeof a.topicId === 'string'),
    topicMeta: asObj<TopicMeta>(o.topicMeta),
    diagnosticDone: o.diagnosticDone === true,
    exams: asArr<ExamResult>(o.exams).filter((e) => e && typeof e.ts === 'number'),
    studySeconds: asObj<number>(o.studySeconds),
    badges: asObj<number>(o.badges),
    theoryRead: asObj<number>(o.theoryRead) as Progress['theoryRead'],
    lessons: asObj<{ stars: number; ts: number }>(o.lessons),
  };
}

const attemptKey = (a: Attempt) => `${a.ts}|${a.topicId}|${a.source}|${a.difficulty}|${a.correct ? 1 : 0}|${a.hints}|${a.score}`;
const examKey = (e: ExamResult) => `${e.ts}|${e.points}|${e.max}`;

function unionBy<T>(a: T[], b: T[], key: (x: T) => string, order: (x: T) => number): T[] {
  const m = new Map<string, T>();
  for (const x of [...a, ...b]) if (!m.has(key(x))) m.set(key(x), x);
  return [...m.entries()].sort(([ka, xa], [kb, xb]) => order(xa) - order(xb) || (ka < kb ? -1 : ka > kb ? 1 : 0)).map(([, x]) => x);
}

export function mergeProgress(a: Progress, b: Progress): Progress {
  const A = normalizeProgress(a);
  const B = normalizeProgress(b);

  const attempts = unionBy(A.attempts, B.attempts, attemptKey, (x) => x.ts).slice(-MAX_ATTEMPTS);

  const topicMeta: Record<string, TopicMeta> = {};
  for (const k of new Set([...Object.keys(A.topicMeta), ...Object.keys(B.topicMeta)])) {
    const x = A.topicMeta[k];
    const y = B.topicMeta[k];
    const last = Math.max(x?.lastMasteredTs ?? 0, y?.lastMasteredTs ?? 0);
    topicMeta[k] = { reviewStage: Math.max(x?.reviewStage ?? 0, y?.reviewStage ?? 0), ...(last ? { lastMasteredTs: last } : {}) };
  }

  // czas nauki w danym dniu: większa z wartości (suma policzyłaby tę samą naukę dwa razy)
  const studySeconds: Record<string, number> = {};
  for (const k of new Set([...Object.keys(A.studySeconds), ...Object.keys(B.studySeconds)])) {
    studySeconds[k] = Math.max(A.studySeconds[k] ?? 0, B.studySeconds[k] ?? 0);
  }

  // odznaki i przeczytana teoria: liczy się najwcześniejsza data
  const earliest = (x: Record<string, number>, y: Record<string, number>) => {
    const out: Record<string, number> = {};
    for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) {
      out[k] = Math.min(x[k] ?? Infinity, y[k] ?? Infinity);
    }
    return out;
  };

  // lekcje: więcej gwiazdek wygrywa; przy remisie późniejsza data
  const lessons: Record<string, { stars: number; ts: number }> = {};
  for (const k of new Set([...Object.keys(A.lessons), ...Object.keys(B.lessons)])) {
    const x = A.lessons[k];
    const y = B.lessons[k];
    if (!x || !y) lessons[k] = (x ?? y)!;
    else lessons[k] = x.stars !== y.stars ? (x.stars > y.stars ? x : y) : { stars: x.stars, ts: Math.max(x.ts, y.ts) };
  }

  return {
    ...EMPTY_PROGRESS,
    attempts,
    topicMeta: sortedKeys(topicMeta),
    diagnosticDone: A.diagnosticDone || B.diagnosticDone,
    exams: unionBy(A.exams, B.exams, examKey, (x) => x.ts),
    studySeconds: sortedKeys(studySeconds),
    badges: sortedKeys(earliest(A.badges, B.badges)),
    theoryRead: sortedKeys(earliest(A.theoryRead as Record<string, number>, B.theoryRead as Record<string, number>)) as Progress['theoryRead'],
    lessons: sortedKeys(lessons),
  };
}

/** Postać do porównań: dwa równoważne zestawy postępów dają ten sam tekst. */
export function canonicalJson(p: Progress): string {
  return JSON.stringify(mergeProgress(p, EMPTY_PROGRESS));
}

export function isEmptyProgress(p: Progress): boolean {
  const n = normalizeProgress(p);
  return !n.attempts.length && !n.exams.length && !Object.keys(n.lessons).length && !Object.keys(n.studySeconds).length && !n.diagnosticDone;
}
