import type { LineTask, MatchTask, OrderTask, ShadeTask } from '../content/types';
import { F } from './fraction';

export type InteractiveVerdict = { ok: boolean; message: string; misconception?: string; countsAsTry: boolean };

const NEUTRAL = (message: string): InteractiveVerdict => ({ ok: false, message, countsAsTry: false });

export function checkShade(task: ShadeTask, shaded: number): InteractiveVerdict {
  if (shaded === 0) return NEUTRAL('Dotknij części paska, aby je zamalować.');
  if (F(shaded, task.den).equals(task.target)) return { ok: true, message: '', countsAsTry: true };
  const mc = task.misconceptions?.find((x) => x.count === shaded);
  if (mc) return { ok: false, message: mc.message, misconception: mc.message, countsAsTry: true };
  const need = (task.target.num * task.den) / task.target.den;
  return {
    ok: false,
    message: shaded > need ? 'Zamalowano za dużo części. Spróbuj jeszcze raz.' : 'Zamalowano za mało części. Spróbuj jeszcze raz.',
    countsAsTry: true,
  };
}

/** `tick` – numer kreski od lewego końca osi (0 = min). */
export function checkLine(task: LineTask, tick: number | null): InteractiveVerdict {
  if (tick === null) return NEUTRAL('Dotknij osi w miejscu, gdzie leży ta liczba.');
  const value = F(task.min * task.den + tick, task.den);
  if (value.equals(task.target)) return { ok: true, message: '', countsAsTry: true };
  const mc = task.misconceptions?.find((x) => x.value.equals(value));
  if (mc && mc.message) return { ok: false, message: mc.message, misconception: mc.message, countsAsTry: true };
  return {
    ok: false,
    message: value.compare(task.target) > 0 ? 'Ten punkt jest za daleko – szukana liczba jest mniejsza.' : 'Ten punkt jest za blisko zera – szukana liczba jest większa.',
    countsAsTry: true,
  };
}

/** `order` – indeksy elementów w kolejności wybranej przez ucznia. */
export function checkOrder(task: OrderTask, order: number[]): InteractiveVerdict {
  if (order.length < task.items.length) return NEUTRAL('Ułóż wszystkie karty – dotykaj ich po kolei.');
  const vals = order.map((i) => task.items[i].value);
  for (let i = 0; i + 1 < vals.length; i++) {
    const c = vals[i].compare(vals[i + 1]);
    const bad = task.direction === 'asc' ? c > 0 : c < 0;
    if (bad) {
      const a = task.items[order[i]].text;
      const b = task.items[order[i + 1]].text;
      const sameNum = vals[i].num === vals[i + 1].num;
      const message = sameNum
        ? `Sprawdź ${a} i ${b}: przy równych licznikach większy jest ułamek o mniejszym mianowniku.`
        : `Sprawdź parę ${a} i ${b} – sprowadź je do wspólnego mianownika.`;
      return { ok: false, message, misconception: sameNum ? 'Przy równych licznikach większy jest ułamek o mniejszym mianowniku.' : undefined, countsAsTry: true };
    }
  }
  return { ok: true, message: '', countsAsTry: true };
}

/** `pairs[leftIndex] = rightIndex` (prawa kolumna w kolejności pokazanej uczniowi: rightOrder). */
export function checkMatch(task: MatchTask, pairs: Record<number, number>, rightOrder: number[]): InteractiveVerdict & { correctLeft: number[] } {
  const n = task.pairs.length;
  if (Object.keys(pairs).length < n) return { ...NEUTRAL('Połącz wszystkie pary.'), correctLeft: [] };
  const correctLeft = Object.entries(pairs)
    .filter(([l, r]) => rightOrder[r] === Number(l))
    .map(([l]) => Number(l));
  if (correctLeft.length === n) return { ok: true, message: '', countsAsTry: true, correctLeft };
  return { ok: false, message: `Poprawne pary: ${correctLeft.length} z ${n}. Popraw pozostałe.`, countsAsTry: true, correctLeft };
}
