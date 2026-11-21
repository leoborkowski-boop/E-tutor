import { describe, expect, it } from 'vitest';
import { F } from './fraction';
import { checkLine, checkMatch, checkOrder, checkShade } from './interactiveCheck';
import type { LineTask, MatchTask, OrderTask, ShadeTask } from '../content/types';

const base = { id: 'x', topicId: 'pojecie' as const, difficulty: 2 as const, prompt: '', hints: [], solution: [], answerText: '' };

describe('sprawdzanie zadań interaktywnych', () => {
  it('zamalowywanie akceptuje ułamki równe', () => {
    const t: ShadeTask = { ...base, format: 'shade', den: 8, target: F(3, 4), misconceptions: [{ count: 3, message: 'm' }] };
    expect(checkShade(t, 6).ok).toBe(true);
    expect(checkShade(t, 3).misconception).toBe('m');
    expect(checkShade(t, 0).countsAsTry).toBe(false);
  });
  it('oś liczbowa', () => {
    const t: LineTask = { ...base, format: 'numberline', min: 0, max: 2, den: 4, target: F(5, 4) };
    expect(checkLine(t, 5).ok).toBe(true);
    expect(checkLine(t, 6).message).toMatch(/za daleko/);
    expect(checkLine(t, null).countsAsTry).toBe(false);
  });
  it('kolejność', () => {
    const t: OrderTask = { ...base, format: 'order', direction: 'asc', items: [F(1, 2), F(1, 3), F(3, 4)].map((v) => ({ text: v.toMarkup(), value: v })) };
    expect(checkOrder(t, [1, 0, 2]).ok).toBe(true);
    expect(checkOrder(t, [0, 1, 2]).ok).toBe(false);
    expect(checkOrder(t, [0, 1, 2]).misconception).toMatch(/mniejszym mianowniku/);
  });
  it('pary', () => {
    const t: MatchTask = { ...base, format: 'match', pairs: [{ left: 'a', right: '1' }, { left: 'b', right: '2' }] };
    const rightOrder = [1, 0]; // prawa kolumna pokazana odwrotnie
    expect(checkMatch(t, { 0: 1, 1: 0 }, rightOrder).ok).toBe(true);
    const wrong = checkMatch(t, { 0: 0, 1: 1 }, rightOrder);
    expect(wrong.ok).toBe(false);
    expect(wrong.correctLeft).toEqual([]);
  });
});
