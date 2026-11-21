import { describe, expect, it } from 'vitest';
import { seeded } from '../../lib/random';
import { checkFractionAnswer } from '../../lib/parse';
import type { Difficulty, Task } from '../types';
import { ALL_TOPICS, buildDiagnostic, buildExam, generateTask, toChoice } from './index';
import type { Fraction } from '../../lib/fraction';

function canonical(value: Fraction, check: Record<string, boolean | undefined> = {}) {
  if (check.requireDecimal) return value.toDecimalString();
  if (check.requireImproper) return value.simplify().toPlain(false);
  return value.simplify().toPlain(true);
}

function allText(t: Task): string {
  const parts = [t.prompt, t.answerText, ...t.hints, ...t.solution];
  if (t.format === 'choice') parts.push(...t.choices.map((c) => c.text + (c.misconception ?? '')));
  if (t.format === 'truefalse') parts.push(...t.statements.map((s) => s.text + s.explanation));
  if (t.format === 'input' && t.steps) parts.push(...t.steps.map((s) => s.prompt + (s.hint ?? '')));
  return parts.join(' | ');
}

function validateTask(t: Task) {
  const text = allText(t);
  expect(text, text).not.toMatch(/NaN|undefined|Infinity|\[object/);
  if (t.format === 'input') {
    const a = t.answer;
    if (a.validate) expect(a.validate(a.value)).toBe(true);
    else expect(checkFractionAnswer(canonical(a.value, a.check), a.value, a.check).status, t.prompt).toBe('correct');
    for (const mc of t.misconceptions ?? []) expect(mc.value.equals(a.value), `${t.prompt} misconception == answer`).toBe(false);
    for (const s of t.steps ?? []) expect(checkFractionAnswer(canonical(s.answer.value, s.answer.check), s.answer.value, s.answer.check).status).toBe('correct');
  } else if (t.format === 'choice') {
    expect(t.choices.filter((c) => c.correct).length, t.prompt).toBe(1);
    expect(new Set(t.choices.map((c) => c.text)).size, t.choices.map((c) => c.text).join(',')).toBe(t.choices.length);
    expect(t.choices.length).toBeGreaterThanOrEqual(3);
  } else if (t.format === 'truefalse') {
    expect(t.statements.length).toBe(2);
  } else if (t.format === 'shade') {
    // odpowiedź musi dać się zamalować całkowitą liczbą części
    expect(((t.target.num * t.den) / t.target.den) % 1).toBe(0);
    expect(t.target.valueOf()).toBeGreaterThan(0);
    expect(t.target.valueOf()).toBeLessThan(1);
    for (const mc of t.misconceptions ?? []) expect(mc.count).not.toBe((t.target.num * t.den) / t.target.den);
  } else if (t.format === 'numberline') {
    const tick = (t.target.valueOf() - t.min) * t.den;
    expect(Math.abs(tick - Math.round(tick))).toBeLessThan(1e-9);
    expect(tick).toBeGreaterThan(0);
    expect(tick).toBeLessThan((t.max - t.min) * t.den);
  } else if (t.format === 'order') {
    for (let i = 0; i < t.items.length; i++) for (let j = i + 1; j < t.items.length; j++) expect(t.items[i].value.equals(t.items[j].value)).toBe(false);
  } else if (t.format === 'match') {
    expect(new Set(t.pairs.map((p) => p.left)).size).toBe(t.pairs.length);
    expect(new Set(t.pairs.map((p) => p.right)).size).toBe(t.pairs.length);
  }
}

describe('generatory zadań', () => {
  for (const topic of ALL_TOPICS) {
    for (const d of [1, 2, 3] as Difficulty[]) {
      it(`${topic} / poziom ${d}`, () => {
        for (let seed = 1; seed <= 300; seed++) {
          const rng = seeded(seed * 7919 + d);
          const t = generateTask(topic, d, rng);
          expect(t.topicId).toBe(topic);
          validateTask(t);
          const c = toChoice(t, rng);
          if (c) validateTask(c);
        }
      });
    }
  }

  it('arkusz egzaminacyjny', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const exam = buildExam(seeded(seed));
      expect(exam.length).toBe(15);
      expect(exam.filter((e) => e.kind === 'open').length).toBe(3);
      exam.forEach((e) => validateTask(e.task));
    }
  });

  it('test diagnostyczny', () => {
    const tasks = buildDiagnostic(seeded(5));
    expect(tasks.length).toBe(18);
    tasks.forEach(validateTask);
  });
});
