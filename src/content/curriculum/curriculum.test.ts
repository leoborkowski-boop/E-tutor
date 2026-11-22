import { describe, expect, it } from 'vitest';
import { ALL_LESSONS, LESSONS_BY_ZONE, ZONES } from '.';
import { seeded } from '../../lib/random';
import { parseAnswer } from '../../lib/parse';
import type { Difficulty, Task } from '../types';

/** Liczba losowań na umiejętność (SEEDS=300 npx vitest run – dokładniejszy test). */
const SEEDS = Number((globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.SEEDS ?? 60);

const BAD = /NaN|undefined|Infinity|\[object|null/;

function texts(t: Task): string[] {
  const out = [t.prompt, t.answerText, ...t.hints, ...t.solution];
  if (t.format === 'choice') out.push(...t.choices.map((c) => c.text));
  if (t.format === 'truefalse') out.push(...t.statements.flatMap((s) => [s.text, s.explanation]));
  return out;
}

describe('program lekcji', () => {
  it('każdy dział ma co najmniej 100 lekcji', () => {
    for (const z of ZONES) expect(LESSONS_BY_ZONE[z.id].length, z.title).toBeGreaterThanOrEqual(100);
  });

  it('identyfikatory lekcji są unikalne', () => {
    expect(new Set(ALL_LESSONS.map((l) => l.id)).size).toBe(ALL_LESSONS.length);
  });

  for (const z of ZONES) {
    describe(z.title, () => {
      for (const s of z.skills) {
        it(`${s.title}: zadania są poprawne`, () => {
          expect(s.theory.length, 'teoria').toBeGreaterThan(0);
          for (let seed = 1; seed <= SEEDS; seed++) {
            const d = ((seed % 3) + 1) as Difficulty;
            const t = s.gen(d, seeded(seed * 7919 + s.id.length));
            const where = `${s.id} d=${d} seed=${seed}: ${t.prompt}`;
            for (const x of texts(t)) expect(BAD.test(x), `${where} → „${x}”`).toBe(false);
            expect(t.prompt.length, where).toBeGreaterThan(5);
            if (t.format === 'input') {
              const v = t.answer.value;
              expect(Number.isFinite(v.num) && Number.isFinite(v.den) && v.den !== 0, where).toBe(true);
              // poprawna odpowiedź zapisana tak, jak w rozwiązaniu, musi przejść sprawdzanie
              const typed = v.hasFiniteDecimal() ? v.toDecimalString() : v.toPlain(false);
              expect(parseAnswer(typed)?.value.equals(v), `${where} → ${typed}`).toBe(true);
              // odpowiedź do wpisania: ułamek o rozsądnym mianowniku albo najwyżej 6 cyfr po przecinku
              const decimals = (typed.split(',')[1] ?? '').length;
              expect(decimals <= 6 || v.simplify().den <= 1000, `${where} → ${typed}`).toBe(true);
              if (!v.hasFiniteDecimal()) expect(v.simplify().den, `${where} → ${typed}`).toBeLessThanOrEqual(1000);
              for (const m of t.misconceptions ?? []) expect(m.value.equals(v), `${where}: błąd = odpowiedź`).toBe(false);
            }
            if (t.format === 'choice') {
              expect(t.choices.filter((c) => c.correct).length, where).toBe(1);
              expect(t.choices.length, where).toBeGreaterThanOrEqual(2);
              expect(new Set(t.choices.map((c) => c.text)).size, `${where}: powtórzone odpowiedzi`).toBe(t.choices.length);
            }
            if (t.format === 'truefalse') expect(t.statements.length, where).toBeGreaterThan(0);
          }
        });
      }
    });
  }
});
