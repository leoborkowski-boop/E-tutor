/** Generatory zadań interaktywnych: zamalowywanie, oś liczbowa, kolejność, pary. */
import { Fraction, F, lcm } from '../../lib/fraction';
import { int, pick, shuffle } from '../../lib/random';
import type { Difficulty, LineTask, MatchTask, OrderTask, Rng, ShadeTask, TopicId } from '../types';
import { id, m, mixedNumber, mm, properFraction } from './helpers';

/* ---------- Zamaluj część paska ---------- */

export function shadeTask(d: Difficulty, rng: Rng, topic: TopicId = 'pojecie'): ShadeTask {
  const target = properFraction(rng, 2, d === 1 ? 8 : 6);
  // poziom 1: pasek ma tyle części, ile mianownik; wyżej – wielokrotność (równoważność ułamków)
  const k = d === 1 ? 1 : d === 2 ? pick(rng, [2, 3]) : pick(rng, [2, 3, 4]);
  const den = target.den * k;
  const need = target.num * k;
  return {
    id: id(topic),
    topicId: topic,
    difficulty: d,
    format: 'shade',
    prompt: k === 1 ? `Zamaluj ${m(target)} paska. Dotknij części, aby je zamalować.` : `Pasek podzielono na ${den} równych części. Zamaluj ${m(target)} paska.`,
    den,
    target,
    misconceptions: [
      ...(k > 1 ? [{ count: target.num, message: `Pasek ma ${den} części, a nie ${target.den}. ${m(target)} = {${need}/${den}}, więc zamaluj ${need} części.` }] : []),
      { count: den - need, message: 'Zamalowano tyle części, ile powinno zostać pustych. Zamaluj część opisaną licznikiem.' },
    ].filter((x) => x.count !== need),
    hints:
      k === 1
        ? [`Mianownik ${target.den} – pasek ma ${target.den} części. Licznik ${target.num} – tyle zamaluj.`]
        : [`Rozszerz ${m(target)} tak, aby mianownik był równy ${den}.`, `${m(target)} = {${need}/${den}}`],
    solution:
      k === 1
        ? [`Pasek ma ${den} części. Zamalowujemy ${need}.`]
        : [`${den} : ${target.den} = ${k}, więc rozszerzamy przez ${k}: ${m(target)} = {${need}/${den}}.`, `Zamalowujemy ${need} z ${den} części.`],
    answerText: `${need} z ${den} części`,
  };
}

/* ---------- Zaznacz na osi liczbowej ---------- */

export function lineTask(d: Difficulty, rng: Rng, topic: TopicId = 'pojecie'): LineTask {
  let den: number;
  let max: number;
  let target: Fraction;
  if (topic === 'mieszane') {
    den = pick(rng, [2, 3, 4, 5]);
    max = 3;
    target = mixedNumber(rng, 2, den, den);
    if (target.den !== den) target = Fraction.fromMixed(1, 1, den);
  } else if (topic === 'dziesietne') {
    const opts: [number, number][] = [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [3, 2], [5, 4], [7, 5]];
    const [n, dd] = pick(rng, opts);
    target = F(n, dd);
    den = dd === 2 ? 4 : dd;
    max = 2;
  } else {
    den = d === 1 ? pick(rng, [3, 4, 5, 6]) : pick(rng, [4, 5, 6, 8]);
    max = d === 1 ? 1 : 2;
    let at = int(rng, 1, den * max - 1);
    if (at % den === 0) at++;
    target = F(at, den);
  }
  const label = topic === 'dziesietne' ? target.toDecimalString() : topic === 'mieszane' ? mm(target) : m(target);
  const steps = (target.valueOf() * den) | 0;
  return {
    id: id(topic),
    topicId: topic,
    difficulty: d,
    format: 'numberline',
    prompt: `Zaznacz na osi liczbę ${label}. Dotknij osi albo przeciągnij punkt.`,
    min: 0,
    max,
    den,
    target,
    misconceptions:
      topic === 'dziesietne'
        ? [{ value: F(Math.round(target.valueOf() * 10), den), message: `Jednostka jest podzielona na ${den} części, a nie na 10. Zamień ${label} na ułamek zwykły.` }]
        : [],
    hints: [
      `Odcinek od 0 do 1 podzielono na ${den} części – każda to {1/${den}}.`,
      topic === 'dziesietne' ? `${label} = ${m(target)} = {${steps}/${den}}` : `${label} = {${steps}/${den}} – odlicz ${steps} małych odcinków od zera.`,
    ],
    solution: [
      `Jedna działka to {1/${den}}.`,
      `${label} = {${steps}/${den}}, więc punkt leży ${steps} działek od zera.`,
    ],
    answerText: label,
  };
}

/* ---------- Ułóż w kolejności ---------- */

export function orderTask(d: Difficulty, rng: Rng): OrderTask {
  const count = d === 1 ? 3 : 4;
  const values: Fraction[] = [];
  const commonDen = int(rng, 6, 12); // poziom 1: wspólny mianownik
  let guard = 0;
  while (values.length < count && guard++ < 200) {
    let f: Fraction;
    if (d === 1) f = F(int(rng, 1, commonDen - 1), commonDen);
    else if (d === 3 && rng() < 0.4) f = mixedNumber(rng, 1, 2, 6);
    else f = properFraction(rng, 2, 12);
    if (!values.some((v) => v.equals(f))) values.push(f);
  }
  const direction: 'asc' | 'desc' = rng() < 0.7 ? 'asc' : 'desc';
  const sorted = [...values].sort((a, b) => (direction === 'asc' ? a.compare(b) : b.compare(a)));
  const L = values.reduce((acc, v) => lcm(acc, v.den), 1);
  const fmt = (f: Fraction) => (f.isProper() ? m(f) : mm(f));
  return {
    id: id('porownywanie'),
    topicId: 'porownywanie',
    difficulty: d,
    format: 'order',
    prompt: `Ułóż liczby od ${direction === 'asc' ? '**najmniejszej** do największej' : '**największej** do najmniejszej'}. Dotykaj kolejno kart.`,
    items: shuffle(rng, values).map((v) => ({ text: fmt(v), value: v })),
    direction,
    hints: [
      L <= 60 ? `Sprowadź wszystkie ułamki do wspólnego mianownika ${L}.` : 'Porównaj każdy ułamek z {1/2} albo zamień je na ułamki dziesiętne.',
      'Najpierw znajdź skrajne liczby – najmniejszą i największą.',
    ],
    solution: [
      ...(L <= 60 ? [`Wspólny mianownik ${L}: ${values.map((v) => `${fmt(v)} = {${v.num * (L / v.den)}/${L}}`).join(', ')}.`] : []),
      `Kolejność: ${sorted.map(fmt).join(direction === 'asc' ? ' < ' : ' > ')}.`,
    ],
    answerText: sorted.map(fmt).join(direction === 'asc' ? ' < ' : ' > '),
  };
}

/* ---------- Połącz w pary ---------- */

export function matchDecimalTask(d: Difficulty, rng: Rng): MatchTask {
  const pool: [number, number][] =
    d === 1
      ? [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [1, 10], [3, 10]]
      : [[1, 8], [3, 8], [3, 5], [7, 20], [9, 25], [1, 20], [3, 4], [6, 25], [5, 8]];
  const chosen = shuffle(rng, pool).slice(0, 4).map(([n, den]) => F(n, den));
  return {
    id: id('dziesietne'),
    topicId: 'dziesietne',
    difficulty: d,
    format: 'match',
    prompt: 'Połącz w pary równe liczby: dotknij ułamka zwykłego, a potem odpowiadającego mu ułamka dziesiętnego.',
    pairs: chosen.map((f) => ({ left: m(f), right: f.toDecimalString() })),
    hints: ['Rozszerz każdy ułamek do mianownika 10, 100 lub 1000.', 'Na przykład {3/4} = {75/100} = 0,75.'],
    solution: chosen.map((f) => `${m(f)} = ${f.toDecimalString()}`),
    answerText: chosen.map((f) => `${m(f)} = ${f.toDecimalString()}`).join(', '),
  };
}

export function matchEquivalentTask(d: Difficulty, rng: Rng): MatchTask {
  const bases: Fraction[] = [];
  let guard = 0;
  while (bases.length < 4 && guard++ < 100) {
    const b = properFraction(rng, 2, d === 1 ? 6 : 9);
    if (!bases.some((x) => x.equals(b))) bases.push(b);
  }
  const pairs = bases.map((b) => {
    const k = int(rng, 2, d === 1 ? 4 : 7);
    return { left: m(b), right: `{${b.num * k}/${b.den * k}}`, k, b };
  });
  return {
    id: id('skracanie'),
    topicId: 'skracanie',
    difficulty: d,
    format: 'match',
    prompt: 'Połącz w pary ułamki równe: dotknij ułamka po lewej, a potem równego mu ułamka po prawej.',
    pairs: pairs.map(({ left, right }) => ({ left, right })),
    hints: ['Skróć każdy ułamek z prawej kolumny do postaci nieskracalnej.'],
    solution: pairs.map((p) => `${p.right} = {${p.b.num * p.k}:${p.k}/${p.b.den * p.k}:${p.k}} = ${p.left}`),
    answerText: pairs.map((p) => `${p.left} = ${p.right}`).join(', '),
  };
}
