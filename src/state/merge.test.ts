import { describe, expect, it } from 'vitest';
import { EMPTY_PROGRESS, type Attempt, type Progress } from './progress';
import { MAX_ATTEMPTS, canonicalJson, isEmptyProgress, mergeProgress, normalizeProgress } from './merge';

const att = (ts: number, topicId = 'a', correct = true): Attempt => ({ ts, topicId, difficulty: 1, correct, score: correct ? 1 : 0, hints: 0, source: 'lesson' });
const P = (p: Partial<Progress>): Progress => ({ ...EMPTY_PROGRESS, ...p });

describe('mergeProgress', () => {
  const a = P({
    attempts: [att(1), att(3)],
    lessons: { l1: { stars: 2, ts: 10 }, l2: { stars: 3, ts: 11 } },
    studySeconds: { '2026-11-23': 300, '2026-11-24': 60 },
    badges: { first: 100 },
    topicMeta: { x: { reviewStage: 2, lastMasteredTs: 50 } },
    exams: [{ ts: 7, points: 10, max: 15, minutes: 20 }],
  });
  const b = P({
    attempts: [att(2), att(3)],
    lessons: { l1: { stars: 3, ts: 9 }, l3: { stars: 1, ts: 12 } },
    studySeconds: { '2026-11-23': 120, '2026-11-25': 90 },
    badges: { first: 80, second: 200 },
    topicMeta: { x: { reviewStage: 1, lastMasteredTs: 70 }, y: { reviewStage: 1 } },
    diagnosticDone: true,
  });

  it('nie gubi nic: suma prób bez duplikatów, w kolejności czasu', () => {
    const m = mergeProgress(a, b);
    expect(m.attempts.map((x) => x.ts)).toEqual([1, 2, 3]);
  });

  it('lekcje: więcej gwiazdek wygrywa, nowe lekcje dochodzą', () => {
    const m = mergeProgress(a, b);
    expect(m.lessons.l1.stars).toBe(3);
    expect(m.lessons.l2.stars).toBe(3);
    expect(m.lessons.l3.stars).toBe(1);
  });

  it('czas nauki: większa wartość z dnia, a nie suma', () => {
    const m = mergeProgress(a, b);
    expect(m.studySeconds).toEqual({ '2026-11-23': 300, '2026-11-24': 60, '2026-11-25': 90 });
  });

  it('odznaki: najwcześniejsza data; powtórki: wyższy etap i późniejsza data', () => {
    const m = mergeProgress(a, b);
    expect(m.badges).toEqual({ first: 80, second: 200 });
    expect(m.topicMeta.x).toEqual({ reviewStage: 2, lastMasteredTs: 70 });
    expect(m.topicMeta.y?.reviewStage).toBe(1);
  });

  it('diagnoza zrobiona na którymkolwiek urządzeniu liczy się jako zrobiona', () => {
    expect(mergeProgress(a, b).diagnosticDone).toBe(true);
    expect(mergeProgress(a, a).diagnosticDone).toBe(false);
  });

  it('przemienność: kolejność argumentów nie ma znaczenia', () => {
    expect(canonicalJson(mergeProgress(a, b))).toBe(canonicalJson(mergeProgress(b, a)));
  });

  it('idempotencja: ponowne scalenie niczego nie zmienia', () => {
    const m = mergeProgress(a, b);
    expect(canonicalJson(mergeProgress(m, a))).toBe(canonicalJson(m));
    expect(canonicalJson(mergeProgress(m, b))).toBe(canonicalJson(m));
    expect(canonicalJson(mergeProgress(m, m))).toBe(canonicalJson(m));
  });

  it('remis w gwiazdkach: późniejsza data, niezależnie od kolejności', () => {
    const x = P({ lessons: { l: { stars: 2, ts: 5 } } });
    const y = P({ lessons: { l: { stars: 2, ts: 9 } } });
    expect(mergeProgress(x, y).lessons.l.ts).toBe(9);
    expect(mergeProgress(y, x).lessons.l.ts).toBe(9);
  });

  it('ogranicza liczbę prób do najnowszych', () => {
    const many = P({ attempts: Array.from({ length: MAX_ATTEMPTS + 100 }, (_, i) => att(i + 1)) });
    const m = mergeProgress(many, EMPTY_PROGRESS);
    expect(m.attempts).toHaveLength(MAX_ATTEMPTS);
    expect(m.attempts[0].ts).toBe(101);
  });

  it('scalenie z pustymi postępami nie zmienia postępów', () => {
    expect(canonicalJson(mergeProgress(a, EMPTY_PROGRESS))).toBe(canonicalJson(a));
  });
});

describe('normalizeProgress', () => {
  it('naprawia [] zamiast {} (tak koduje puste obiekty PHP) i brakujące pola', () => {
    const n = normalizeProgress({ attempts: [], badges: [], lessons: [], studySeconds: [], topicMeta: [], theoryRead: [] });
    expect(n.badges).toEqual({});
    expect(n.lessons).toEqual({});
    expect(n.diagnosticDone).toBe(false);
    expect(normalizeProgress(null)).toEqual(EMPTY_PROGRESS);
    expect(normalizeProgress('śmieci')).toEqual(EMPTY_PROGRESS);
  });

  it('odrzuca wpisy bez wymaganych pól', () => {
    const n = normalizeProgress({ attempts: [{ ts: 1, topicId: 'a' }, { foo: 1 }, null], exams: [{ foo: 1 }] });
    expect(n.attempts).toHaveLength(1);
    expect(n.exams).toHaveLength(0);
  });

  it('isEmptyProgress rozpoznaje puste postępy', () => {
    expect(isEmptyProgress(EMPTY_PROGRESS)).toBe(true);
    expect(isEmptyProgress(P({ attempts: [att(1)] }))).toBe(false);
    expect(isEmptyProgress(P({ lessons: { l: { stars: 1, ts: 1 } } }))).toBe(false);
  });
});
