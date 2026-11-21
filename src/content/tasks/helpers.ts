import { Fraction, gcd } from '../../lib/fraction';
import { int, pick, shuffle, uid } from '../../lib/random';
import type { Choice, Difficulty, Misconception, Rng, TopicId } from '../types';

export const m = (f: Fraction) => f.toMarkup();
export const mm = (f: Fraction) => f.toMarkup(true);

export function id(topic: TopicId) {
  return uid(topic);
}

/** Losowy ułamek właściwy nieskracalny o mianowniku z zakresu. */
export function properFraction(rng: Rng, denMin: number, denMax: number): Fraction {
  const den = int(rng, Math.max(2, denMin), denMax);
  let num = int(rng, 1, den - 1);
  let guard = 0;
  while (gcd(num, den) !== 1 && guard++ < 50) num = int(rng, 1, den - 1);
  if (gcd(num, den) !== 1) num = 1;
  return new Fraction(num, den);
}

/** Losowa liczba mieszana (ułamek niewłaściwy), część ułamkowa nieskracalna. */
export function mixedNumber(rng: Rng, wholeMax: number, denMin: number, denMax: number): Fraction {
  const whole = int(rng, 1, wholeMax);
  const p = properFraction(rng, denMin, denMax);
  return Fraction.fromMixed(whole, p.num, p.den);
}

export function denByDifficulty(d: Difficulty): [number, number] {
  return d === 1 ? [2, 8] : d === 2 ? [3, 12] : [4, 15];
}

/**
 * Buduje 4 odpowiedzi do wyboru (A–D) z poprawnej wartości i
 * „błędnych” wartości odpowiadających typowym błędom.
 */
export function fractionChoices(
  rng: Rng,
  correct: Fraction,
  wrongs: Misconception[],
  opts: { mixed?: boolean; count?: number; render?: (f: Fraction) => string } = {},
): Choice[] {
  const count = opts.count ?? 4;
  const render = opts.render ?? ((f: Fraction) => (opts.mixed ? mm(f) : m(f)));
  const out: Choice[] = [{ text: render(correct), correct: true }];
  const used: Fraction[] = [correct];
  for (const w of wrongs) {
    if (out.length >= count) break;
    if (w.value.den <= 0 || used.some((u) => u.equals(w.value))) continue;
    used.push(w.value);
    out.push({ text: render(w.value), correct: false, misconception: w.message });
  }
  let guard = 0;
  while (out.length < count && guard++ < 200) {
    const base = correct.simplify();
    const cand = new Fraction(
      Math.max(1, base.num + pick(rng, [-2, -1, 1, 2, 3])),
      Math.max(2, base.den + pick(rng, [-1, 0, 1, 2])),
    ).simplify();
    if (used.some((u) => u.equals(cand))) continue;
    used.push(cand);
    out.push({ text: render(cand), correct: false });
  }
  return shuffle(rng, out);
}

export function textChoices(rng: Rng, correct: string, wrongs: { text: string; misconception?: string }[]): Choice[] {
  const out: Choice[] = [{ text: correct, correct: true }];
  for (const w of wrongs) {
    if (out.some((o) => o.text === w.text)) continue;
    out.push({ text: w.text, correct: false, misconception: w.misconception });
  }
  return shuffle(rng, out);
}

/** Losowo wybiera format (pole odpowiedzi / wybór), z preferencją zależną od poziomu. */
export function chooseFormat(rng: Rng, choiceProbability: number): 'input' | 'choice' {
  return rng() < choiceProbability ? 'choice' : 'input';
}

export const SIMPLEST = { requireSimplest: true } as const;

export function cmpSign(a: Fraction, b: Fraction) {
  const c = a.compare(b);
  return c < 0 ? '<' : c > 0 ? '>' : '=';
}
