/**
 * Narzędzia do pisania lekcji: budowanie zadań, formatowanie liczb po polsku,
 * odmiana, imiona do zadań tekstowych.
 */
import { Fraction, gcd } from '../../lib/fraction';
import { int, pick, shuffle, uid } from '../../lib/random';
import type { ChoiceTask, Difficulty, InputTask, Misconception, Rng, Step, TheoryBlock, TrueFalseTask, Visual } from '../types';

export type Num = number | Fraction;
export { gcd, int, pick, shuffle };

/** Zamienia liczbę (także dziesiętną) na dokładny ułamek. */
export function fr(n: Num): Fraction {
  if (n instanceof Fraction) return n;
  if (Number.isInteger(n)) return new Fraction(n);
  return new Fraction(Math.round(n * 1_000_000), 1_000_000).simplify();
}

/** Zaokrąglenie usuwające błędy zmiennoprzecinkowe (0.1 + 0.2 → 0.3). */
export function r6(n: number) {
  return Math.round(n * 1_000_000) / 1_000_000;
}

/** Zapis liczby po polsku: przecinek dziesiętny, spacja co trzy cyfry od 10 000, ułamek gdy rozwinięcie nieskończone. */
export function fmt(n: Num, mixed = false): string {
  const f = fr(n).simplify();
  if (f.den !== 1 && !f.hasFiniteDecimal()) return f.toMarkup(mixed);
  const s = f.den === 1 ? String(f.num) : f.toDecimalString();
  const neg = s.startsWith('-');
  const body = neg ? s.slice(1) : s;
  const [ip, dp] = body.split(',');
  const grouped = ip.length > 4 ? ip.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : ip;
  return `${neg ? '−' : ''}${grouped}${dp ? ',' + dp : ''}`;
}

/** Ułamek zwykły w notacji MathText (np. {3/4}), liczba całkowita bez nawiasów. */
export function frac(n: Num, mixed = false) {
  return fr(n).simplify().toMarkup(mixed);
}

/** Odmiana rzeczownika po liczebniku: 1 jabłko, 2 jabłka, 5 jabłek. */
export function pl(n: number, one: string, few: string, many: string) {
  const a = Math.abs(n);
  if (a === 1) return one;
  if (!Number.isInteger(a)) return few;
  const l = a % 10;
  const ll = a % 100;
  return l >= 2 && l <= 4 && !(ll >= 12 && ll <= 14) ? few : many;
}

/** Liczba z odmienionym rzeczownikiem, np. „5 zł”, „3 cukierki”. */
export function nw(n: number, one: string, few: string, many: string) {
  return `${fmt(n)} ${pl(n, one, few, many)}`;
}

export type Person = { name: string; f: boolean };
const PEOPLE: Person[] = [
  { name: 'Ola', f: true },
  { name: 'Kuba', f: false },
  { name: 'Zosia', f: true },
  { name: 'Antek', f: false },
  { name: 'Maja', f: true },
  { name: 'Szymon', f: false },
  { name: 'Lena', f: true },
  { name: 'Filip', f: false },
  { name: 'Hania', f: true },
  { name: 'Bartek', f: false },
  { name: 'Julia', f: true },
  { name: 'Wojtek', f: false },
  { name: 'Nina', f: true },
  { name: 'Igor', f: false },
];
export function person(rng: Rng, not?: Person): Person {
  let p = pick(rng, PEOPLE);
  let guard = 0;
  while (not && p.name === not.name && guard++ < 10) p = pick(rng, PEOPLE);
  return p;
}
/** Forma czasownika zależna od rodzaju: g(p, 'kupił', 'kupiła'). */
export function g(p: Person, m: string, f: string) {
  return p.f ? f : m;
}

/* ---------------- Budowanie zadań ---------------- */

export type QOpts = {
  prompt: string;
  ans: Num;
  hints: string[];
  sol: string[];
  unit?: string;
  prefix?: string;
  visual?: Visual;
  /** typowe błędne wyniki z wyjaśnieniem */
  wrong?: [Num, string][];
  /** wymagana forma odpowiedzi */
  form?: 'decimal' | 'simplest' | 'common';
  placeholder?: string;
  answerText?: string;
  steps?: Step[];
};

/** Zadanie z polem odpowiedzi (liczba, ułamek, ułamek dziesiętny). */
export function q(skill: string, d: Difficulty, o: QOpts): InputTask {
  const value = fr(o.ans);
  const misconceptions: Misconception[] = (o.wrong ?? [])
    .map(([v, message]) => ({ value: fr(v), message }))
    .filter((mc) => !mc.value.equals(value));
  return {
    id: uid(skill),
    topicId: skill,
    difficulty: d,
    format: 'input',
    prompt: o.prompt,
    visual: o.visual,
    answer: {
      value,
      check:
        o.form === 'decimal'
          ? { requireDecimal: true }
          : o.form === 'simplest'
            ? { requireSimplest: true }
            : o.form === 'common'
              ? { requireCommon: true, requireSimplest: true }
              : undefined,
      unit: o.unit,
      prefix: o.prefix,
      placeholder: o.placeholder ?? 'wynik',
    },
    misconceptions,
    steps: o.steps,
    hints: o.hints,
    solution: o.sol,
    answerText: o.answerText ?? `${fmt(value)}${o.unit ? ' ' + o.unit : ''}`,
  };
}

export type McOpts = {
  prompt: string;
  /** poprawna odpowiedź (tekst z notacją MathText) */
  right: string;
  /** błędne odpowiedzi: tekst albo [tekst, wyjaśnienie błędu] */
  wrong: (string | [string, string])[];
  hints: string[];
  sol: string[];
  visual?: Visual;
};

/** Zadanie wyboru (A–D). Usuwa powtórzenia i bierze maks. 3 błędne odpowiedzi. */
export function mc(skill: string, d: Difficulty, rng: Rng, o: McOpts): ChoiceTask {
  const seen = new Set([o.right]);
  const wrongs: { text: string; misconception?: string }[] = [];
  for (const w of shuffle(rng, o.wrong)) {
    const [text, why] = Array.isArray(w) ? w : [w, undefined];
    if (seen.has(text)) continue;
    seen.add(text);
    wrongs.push({ text, misconception: why });
    if (wrongs.length >= 3) break;
  }
  const choices = shuffle(rng, [{ text: o.right, correct: true }, ...wrongs.map((w) => ({ ...w, correct: false }))]);
  return {
    id: uid(skill),
    topicId: skill,
    difficulty: d,
    format: 'choice',
    prompt: o.prompt,
    visual: o.visual,
    choices,
    hints: o.hints,
    solution: o.sol,
    answerText: o.right,
  };
}

/** Zadanie prawda/fałsz. */
export function tf(skill: string, d: Difficulty, o: { prompt?: string; items: [string, boolean, string][]; visual?: Visual }): TrueFalseTask {
  return {
    id: uid(skill),
    topicId: skill,
    difficulty: d,
    format: 'truefalse',
    prompt: o.prompt ?? 'Oceń prawdziwość zdań. Wybierz **P**, jeśli zdanie jest prawdziwe, albo **F**, jeśli jest fałszywe.',
    visual: o.visual,
    statements: o.items.map(([text, isTrue, explanation]) => ({ text, isTrue, explanation })),
    hints: [],
    solution: o.items.map(([, , e]) => e),
    answerText: o.items.map(([, t]) => (t ? 'P' : 'F')).join(', '),
  };
}

/** Liczbowe odpowiedzi do wyboru z typowymi błędami i bliskimi wartościami. */
export function numMc(skill: string, d: Difficulty, rng: Rng, o: Omit<McOpts, 'right' | 'wrong'> & { ans: Num; wrong?: [Num, string][]; unit?: string }): ChoiceTask {
  const u = o.unit ? ` ${o.unit}` : '';
  const a = fr(o.ans);
  const wrong: [string, string][] = (o.wrong ?? []).filter(([v]) => !fr(v).equals(a)).map(([v, why]) => [fmt(v) + u, why]);
  const near: string[] = [];
  const base = Number(a.valueOf());
  for (const k of shuffle(rng, [2, 10, 0.5, 0.1])) near.push(fmt(r6(base * k)) + u);
  for (const k of shuffle(rng, [1, -1, 2, -2])) near.push(fmt(r6(base + k * (Number.isInteger(base) ? Math.max(1, Math.round(Math.abs(base) / 10)) : 0.5))) + u);
  return mc(skill, d, rng, { ...o, right: fmt(a) + u, wrong: [...wrong, ...near] });
}

/* ---------------- Bloki teorii ---------------- */

export const P = (text: string): TheoryBlock => ({ type: 'p', text });
export const R = (text: string, title?: string): TheoryBlock => ({ type: 'rule', text, title });
export const L = (...items: string[]): TheoryBlock => ({ type: 'list', items });
export const EX = (problem: string, steps: string[], answer: string, title?: string): TheoryBlock => ({ type: 'example', problem, steps, answer, title });
export const ERR = (wrong: string, right: string, why: string): TheoryBlock => ({ type: 'mistake', wrong, right, why });
export const V = (visual: Visual, caption?: string): TheoryBlock => ({ type: 'visual', visual, caption });

/** Wybór wartości zależny od poziomu trudności. */
export function lvl<T>(d: Difficulty, a: T, b: T, c: T): T {
  return d === 1 ? a : d === 2 ? b : c;
}

/** Losowa liczba całkowita różna od zera. */
export function nz(rng: Rng, min: number, max: number) {
  let v = 0;
  while (v === 0) v = int(rng, min, max);
  return v;
}

/** Liczba w nawiasie, jeśli ujemna: (−3). */
export function par(n: Num) {
  const s = fmt(n);
  return s.startsWith('−') ? `(${s})` : s;
}
