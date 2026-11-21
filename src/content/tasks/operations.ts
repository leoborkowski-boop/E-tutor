/** Generatory: porównywanie, dodawanie/odejmowanie, mnożenie/dzielenie. */
import { Fraction, F, gcd, lcm } from '../../lib/fraction';
import { int, pick, shuffle } from '../../lib/random';
import type { Difficulty, Generator, Misconception, Rng, Step, Task } from '../types';
import { SIMPLEST, cmpSign, fractionChoices, id, m, mixedNumber, mm, properFraction } from './helpers';

/* ================= 4. Porównywanie ================= */

function compareTask(d: Difficulty, rng: Rng): Task {
  let a: Fraction;
  let b: Fraction;
  let kind: 'sameDen' | 'sameNum' | 'general' | 'mixed';
  if (d === 1) {
    kind = pick(rng, ['sameDen', 'sameNum'] as const);
    if (kind === 'sameDen') {
      const den = int(rng, 5, 12);
      const n1 = int(rng, 1, den - 1);
      let n2 = int(rng, 1, den - 1);
      if (n2 === n1) n2 = n1 === 1 ? 2 : n1 - 1;
      a = F(n1, den);
      b = F(n2, den);
    } else {
      const num = int(rng, 1, 5);
      const d1 = int(rng, num + 1, 12);
      let d2 = int(rng, num + 1, 12);
      if (d2 === d1) d2 = d1 + 1;
      a = F(num, d1);
      b = F(num, d2);
    }
  } else if (d === 2) {
    kind = 'general';
    a = properFraction(rng, 3, 10);
    b = properFraction(rng, 3, 10);
    let guard = 0;
    while ((a.den === b.den || a.num === b.num) && guard++ < 30) b = properFraction(rng, 3, 10);
    if (rng() < 0.15) b = F(a.num * 2, a.den * 2); // czasem równe
  } else {
    kind = rng() < 0.5 ? 'mixed' : 'general';
    if (kind === 'mixed') {
      a = mixedNumber(rng, 3, 3, 9);
      const w = a.toMixed().whole;
      const p = properFraction(rng, 3, 9);
      b = Fraction.fromMixed(w, p.num, p.den);
    } else {
      // „bliskie” ułamki typu n/(n+1)
      const n1 = int(rng, 3, 9);
      let n2 = int(rng, 3, 9);
      if (n2 === n1) n2 = n1 + 1;
      a = F(n1, n1 + 1);
      b = F(n2, n2 + 1);
    }
  }
  const sign = cmpSign(a, b);
  const L = lcm(a.den, b.den);
  const misByDen = 'Gdy liczniki są równe, większy jest ułamek o **mniejszym** mianowniku – całość podzielono na mniej, czyli większych części.';
  const misGeneral = `Sprowadź ułamki do wspólnego mianownika ${L} i porównaj liczniki.`;
  const wrongMessage = kind === 'sameNum' ? misByDen : kind === 'sameDen' ? 'Przy równych mianownikach większy jest ułamek o większym liczniku.' : misGeneral;
  const fmt = (f: Fraction) => (kind === 'mixed' ? mm(f) : m(f));
  const solution: string[] =
    kind === 'sameDen'
      ? [`Mianowniki są równe (${a.den}), więc porównujemy liczniki: ${a.num} ${cmpSign(F(a.num), F(b.num))} ${b.num}.`]
      : kind === 'sameNum'
        ? [`Liczniki są równe (${a.num}). Mniejszy mianownik oznacza większe części.`, `${a.den} ${a.den < b.den ? '<' : '>'} ${b.den}, więc ${m(a)} ${sign} ${m(b)}.`]
        : [
            ...(kind === 'mixed' ? [`Części całkowite są równe (${a.toMixed().whole}), porównujemy części ułamkowe.`] : []),
            `Wspólny mianownik: ${L}.`,
            `${m(a)} = {${a.num * (L / a.den)}/${L}}, ${m(b)} = {${b.num * (L / b.den)}/${L}}.`,
          ];
  solution.push(`Odpowiedź: ${fmt(a)} ${sign} ${fmt(b)}.`);
  return {
    id: id('porownywanie'),
    topicId: 'porownywanie',
    difficulty: d,
    format: 'choice',
    prompt: `Wstaw odpowiedni znak: ${fmt(a)} □ ${fmt(b)}`,
    choices: ['<', '>', '='].map((s) => ({ text: s, correct: s === sign, misconception: s === sign ? undefined : wrongMessage })),
    hints:
      kind === 'sameDen'
        ? ['Mianowniki są takie same – wystarczy porównać liczniki.']
        : kind === 'sameNum'
          ? ['Liczniki są takie same. Pomyśl: co jest większe – ⅓ czy ⅕ pizzy?']
          : ['Sprowadź oba ułamki do wspólnego mianownika.', `Wspólny mianownik może wynosić ${L}.`],
    solution,
    answerText: sign,
  };
}

function largestChoice(d: Difficulty, rng: Rng): Task {
  const pool: Fraction[] = [];
  let guard = 0;
  while (pool.length < 4 && guard++ < 100) {
    const f = properFraction(rng, 3, d === 1 ? 8 : 12);
    if (!pool.some((p) => p.equals(f))) pool.push(f);
  }
  const sorted = [...pool].sort((x, y) => y.compare(x));
  const best = sorted[0];
  const biggestDen = [...pool].sort((x, y) => y.den - x.den)[0];
  const biggestNum = [...pool].sort((x, y) => y.num - x.num)[0];
  const L = pool.reduce((acc, f) => lcm(acc, f.den), 1);
  return {
    id: id('porownywanie'),
    topicId: 'porownywanie',
    difficulty: d,
    format: 'choice',
    prompt: 'Który z ułamków jest **największy**?',
    choices: shuffle(
      rng,
      pool.map((f) => ({
        text: m(f),
        correct: f.equals(best),
        misconception: f.equals(best)
          ? undefined
          : f === biggestDen
            ? 'Duży mianownik nie oznacza dużego ułamka – oznacza, że całość podzielono na więcej, mniejszych części.'
            : f === biggestNum
              ? 'Sam licznik nie wystarczy – trzeba wziąć pod uwagę też mianownik.'
              : 'Porównaj ułamki, sprowadzając je do wspólnego mianownika lub zamieniając na ułamki dziesiętne.',
      })),
    ),
    hints: ['Porównaj każdy ułamek z {1/2} albo sprowadź wszystkie do wspólnego mianownika.', `Wspólny mianownik może wynosić ${L}.`],
    solution: [
      `Sprowadzamy do mianownika ${L}: ${pool.map((f) => `${m(f)} = {${f.num * (L / f.den)}/${L}}`).join(', ')}.`,
      `Największy licznik ma ${m(best)}.`,
    ],
    answerText: m(best),
  };
}

function betweenTask(d: Difficulty, rng: Rng): Task {
  const a = properFraction(rng, 3, 9);
  let b = properFraction(rng, 3, 9);
  let guard = 0;
  while (a.equals(b) && guard++ < 30) b = properFraction(rng, 3, 9);
  const [lo, hi] = a.compare(b) < 0 ? [a, b] : [b, a];
  const L = lcm(lo.den, hi.den) * 2;
  const loN = lo.num * (L / lo.den);
  const hiN = hi.num * (L / hi.den);
  const example = F(loN + 1, L).simplify();
  return {
    id: id('porownywanie'),
    topicId: 'porownywanie',
    difficulty: d,
    format: 'input',
    prompt: `Podaj **dowolny** ułamek, który jest większy od ${m(lo)} i mniejszy od ${m(hi)}.`,
    answer: {
      value: example,
      validate: (f) => f.compare(lo) > 0 && f.compare(hi) < 0,
      placeholder: 'np. 5/12',
    },
    hints: [
      'Sprowadź oba ułamki do wspólnego mianownika.',
      `Jeśli liczniki są zbyt blisko siebie, rozszerz oba ułamki jeszcze raz, np. do mianownika ${L}.`,
    ],
    solution: [
      `Sprowadzamy do mianownika ${L}: ${m(lo)} = {${loN}/${L}}, ${m(hi)} = {${hiN}/${L}}.`,
      `Każdy ułamek o mianowniku ${L} i liczniku między ${loN} a ${hiN} jest dobrą odpowiedzią, np. ${m(example)}.`,
    ],
    answerText: `np. ${m(example)}`,
  };
}

export const porownywanieGenerators: Generator[] = [
  (d, r) => compareTask(d, r),
  (d, r) => (d === 1 ? compareTask(d, r) : largestChoice(d, r)),
  (d, r) => (d === 3 ? betweenTask(d, r) : compareTask(d, r)),
];

/* ================= 5. Dodawanie i odejmowanie ================= */

function addSubTask(d: Difficulty, rng: Rng): Task {
  const op = rng() < 0.5 ? '+' : '−';
  let a: Fraction;
  let b: Fraction;
  if (d === 1) {
    const den = int(rng, 3, 12);
    const n1 = int(rng, 1, den - 1);
    let n2 = int(rng, 1, den - 1);
    if (n2 === n1) n2 = n1 === 1 ? 2 : n1 - 1;
    a = F(n1, den);
    b = F(n2, den);
  } else if (d === 2) {
    a = properFraction(rng, 2, 10);
    b = properFraction(rng, 2, 10);
    let guard = 0;
    while (a.den === b.den && guard++ < 30) b = properFraction(rng, 2, 10);
  } else {
    a = mixedNumber(rng, 4, 2, 8);
    b = rng() < 0.5 ? mixedNumber(rng, 3, 2, 8) : properFraction(rng, 2, 8);
  }
  if (op === '−' && a.compare(b) < 0) [a, b] = [b, a];
  if (op === '−' && a.equals(b)) b = F(1, b.den * 2);
  const result = op === '+' ? a.add(b) : a.sub(b);
  const L = lcm(a.den, b.den);
  const aL = a.withDen(L);
  const bL = b.withDen(L);
  const fmt = d === 3 ? mm : m;
  const sumNum = op === '+' ? aL.num + bL.num : aL.num - bL.num;
  const unsimplified = F(sumNum, L);

  const misconceptions: Misconception[] = [];
  if (a.den !== b.den) {
    const wrong = op === '+' ? F(a.num + b.num, a.den + b.den) : a.den !== b.den && a.den - b.den !== 0 ? F(a.num - b.num, a.den - b.den) : null;
    if (wrong && wrong.den > 0 && !wrong.equals(result))
      misconceptions.push({
        value: wrong,
        message: `Nie ${op === '+' ? 'dodajemy' : 'odejmujemy'} mianowników! Najpierw sprowadź ułamki do wspólnego mianownika (${L}), a potem ${op === '+' ? 'dodaj' : 'odejmij'} tylko liczniki.`,
      });
  } else {
    const wrong = op === '+' ? F(a.num + b.num, a.den * 2) : null;
    if (wrong && !wrong.equals(result))
      misconceptions.push({ value: wrong, message: 'Przy wspólnym mianowniku dodajemy tylko liczniki – mianownik zostaje bez zmian.' });
  }
  if (d === 3 && op === '−') {
    // typowy błąd: odejmowanie całości i części osobno „na odwrót”
    const ma = a.toMixed();
    const mb = b.toMixed();
    if (aL.num % L < bL.num % L) {
      const wrong = Fraction.fromMixed(ma.whole - mb.whole, Math.abs(bL.num % L - (aL.num % L)), L);
      if (!wrong.equals(result) && wrong.valueOf() > 0)
        misconceptions.push({
          value: wrong,
          message: 'Gdy części ułamkowej nie da się odjąć, „pożycz” jedną całość albo zamień obie liczby na ułamki niewłaściwe.',
        });
    }
  }

  const steps: Step[] | undefined =
    a.den !== b.den
      ? [
          {
            prompt: `Jaki jest najmniejszy wspólny mianownik ułamków ${fmt(a)} i ${fmt(b)}?`,
            answer: { value: F(L), placeholder: 'mianownik' },
            misconceptions: a.den * b.den !== L ? [{ value: F(a.den * b.den), message: `${a.den * b.den} też jest wspólnym mianownikiem, ale istnieje mniejszy.` }] : [],
            hint: `Szukamy najmniejszej liczby, która dzieli się przez ${a.den} i przez ${b.den}.`,
          },
          {
            prompt: `Rozszerz pierwszy ułamek: ${m(a)} = {□/${L}}`,
            answer: { value: F(aL.num), placeholder: 'licznik' },
            hint: `${L} : ${a.den} = ${L / a.den}. Pomnóż licznik przez ${L / a.den}.`,
          },
          {
            prompt: `Rozszerz drugi ułamek: ${m(b)} = {□/${L}}`,
            answer: { value: F(bL.num), placeholder: 'licznik' },
            hint: `${L} : ${b.den} = ${L / b.den}. Pomnóż licznik przez ${L / b.den}.`,
          },
          {
            prompt: `Oblicz {${aL.num}/${L}} ${op} {${bL.num}/${L}} i podaj wynik w najprostszej postaci.`,
            answer: { value: result, check: SIMPLEST, placeholder: 'wynik' },
            hint: `${op === '+' ? 'Dodaj' : 'Odejmij'} liczniki, mianownik zostaje ${L}. Na końcu sprawdź, czy da się skrócić.`,
          },
        ]
      : undefined;

  const solution: string[] = [];
  if (d === 3) solution.push(`Zamieniamy na ułamki niewłaściwe: ${mm(a)} = ${m(a)}${b.isProper() ? '' : `, ${mm(b)} = ${m(b)}`}.`);
  if (a.den !== b.den) solution.push(`Wspólny mianownik: ${L}. ${m(a)} = {${aL.num}/${L}}, ${m(b)} = {${bL.num}/${L}}.`);
  solution.push(`{${aL.num}/${L}} ${op} {${bL.num}/${L}} = {${sumNum}/${L}}${unsimplified.isSimplest() ? '' : ` = ${m(result)}`}.`);
  if (!result.isProper() && !result.isInteger()) solution.push(`Jako liczba mieszana: ${mm(result)}.`);

  return {
    id: id('dodawanie'),
    topicId: 'dodawanie',
    difficulty: d,
    format: 'input',
    prompt: `Oblicz: ${fmt(a)} ${op} ${fmt(b)}. Wynik podaj w najprostszej postaci.`,
    answer: { value: result, check: SIMPLEST, placeholder: 'np. 5/6 lub 1 1/4' },
    misconceptions,
    steps,
    hints:
      a.den === b.den
        ? ['Mianowniki są takie same – wystarczy ' + (op === '+' ? 'dodać' : 'odjąć') + ' liczniki.', 'Na końcu sprawdź, czy wynik da się skrócić.']
        : [
            ...(d === 3 ? ['Zamień liczby mieszane na ułamki niewłaściwe.'] : []),
            `Sprowadź ułamki do wspólnego mianownika. Najmniejszy to ${L}.`,
            `${m(a)} = {${aL.num}/${L}}, ${m(b)} = {${bL.num}/${L}}.`,
          ],
    solution,
    answerText: result.isProper() ? m(result) : mm(result),
  };
}

function missingAddend(d: Difficulty, rng: Rng): Task {
  const a = properFraction(rng, 2, 8);
  let total = properFraction(rng, 2, 10);
  let guard = 0;
  while (total.compare(a) <= 0 && guard++ < 50) total = properFraction(rng, 2, 10);
  if (total.compare(a) <= 0) total = a.add(F(1, 4));
  const x = total.sub(a);
  return {
    id: id('dodawanie'),
    topicId: 'dodawanie',
    difficulty: d,
    format: 'input',
    prompt: `Jaką liczbę trzeba dodać do ${m(a)}, aby otrzymać ${mm(total)}?`,
    answer: { value: x, check: SIMPLEST, placeholder: 'np. 1/6' },
    misconceptions: [{ value: total.add(a), message: 'Szukamy brakującego składnika – trzeba **odjąć**, a nie dodać.' }],
    hints: ['Brakujący składnik = suma − znany składnik.', `Oblicz ${mm(total)} − ${m(a)}.`],
    solution: [`□ = ${mm(total)} − ${m(a)} = ${mm(x)}.`, `Sprawdzenie: ${m(a)} + ${mm(x)} = ${mm(total)}.`],
    answerText: mm(x),
  };
}

export const dodawanieGenerators: Generator[] = [
  (d, r) => addSubTask(d, r),
  (d, r) => addSubTask(d, r),
  (d, r) => (d === 1 ? addSubTask(d, r) : missingAddend(d, r)),
];

/* ================= 6. Mnożenie i dzielenie ================= */

function mulDivTask(d: Difficulty, rng: Rng): Task {
  const op: '·' | ':' = rng() < 0.5 ? '·' : ':';
  let a: Fraction;
  let b: Fraction;
  if (d === 1) {
    a = properFraction(rng, 2, 9);
    b = rng() < 0.5 ? F(int(rng, 2, 6)) : properFraction(rng, 2, 9);
  } else if (d === 2) {
    a = properFraction(rng, 2, 12);
    b = properFraction(rng, 2, 12);
    // zachęta do skracania „na krzyż”: mianownik a i licznik b mają wspólny dzielnik
    if (op === '·' && rng() < 0.6) {
      const k = int(rng, 2, 3);
      const d1 = int(rng, 2, 4) * k;
      let n1 = int(rng, 1, d1 - 1);
      while (gcd(n1, d1) !== 1) n1 = int(rng, 1, d1 - 1);
      const n2 = k * int(rng, 1, 2);
      let d2 = int(rng, n2 + 1, n2 + 7);
      while (gcd(n2, d2) !== 1) d2++;
      a = F(n1, d1);
      b = F(n2, d2);
    }
  } else {
    a = mixedNumber(rng, 3, 2, 6);
    b = rng() < 0.5 ? mixedNumber(rng, 2, 2, 6) : properFraction(rng, 2, 8);
  }
  if (op === ':' && a.equals(b)) b = b.isInteger() ? F(b.num + 1) : F(b.num, b.den + 1).simplify();
  const result = op === '·' ? a.mul(b) : a.div(b);
  const fmt = d === 3 ? mm : m;

  const misconceptions: Misconception[] = [];
  if (op === ':') {
    const asMul = a.mul(b);
    if (!asMul.equals(result)) misconceptions.push({ value: asMul, message: 'Dzieląc przez ułamek, **mnożymy przez jego odwrotność** – odwróć dzielnik.' });
    const flippedFirst = a.inverse().mul(b);
    if (!flippedFirst.equals(result) && !flippedFirst.equals(asMul))
      misconceptions.push({ value: flippedFirst, message: 'Odwracamy **dzielnik** (drugą liczbę), a nie dzielną.' });
  } else if (b.isInteger()) {
    const both = F(a.num * b.num, a.den * b.num);
    if (!both.equals(result)) misconceptions.push({ value: both, message: 'Mnożąc ułamek przez liczbę naturalną, mnożymy tylko **licznik**.' });
  } else {
    const L = lcm(a.den, b.den);
    const wrong = F(a.num * (L / a.den) * b.num * (L / b.den), L);
    if (!wrong.equals(result)) misconceptions.push({ value: wrong, message: 'Przy mnożeniu nie trzeba wspólnego mianownika: mnożymy licznik przez licznik i mianownik przez mianownik.' });
  }
  if (d === 3) {
    const ma = a.toMixed();
    const mb = b.toMixed();
    const separate =
      op === '·'
        ? F(ma.whole * mb.whole).add(F(ma.num, ma.den).mul(F(mb.num || 0, mb.den)))
        : null;
    if (separate && !separate.equals(result))
      misconceptions.push({ value: separate, message: 'Liczb mieszanych nie mnożymy „całości z całościami”. Zamień je najpierw na ułamki niewłaściwe.' });
  }

  const divisor = op === ':' ? b.inverse() : b;
  const steps: Step[] | undefined =
    d >= 2
      ? [
          ...(d === 3
            ? [
                {
                  prompt: `Zamień ${mm(a)} na ułamek niewłaściwy.`,
                  answer: { value: a, check: { requireImproper: true }, placeholder: 'np. 7/3' },
                  hint: 'Część całkowitą pomnóż przez mianownik i dodaj licznik.',
                } as Step,
                ...(b.isProper()
                  ? []
                  : [
                      {
                        prompt: `Zamień ${mm(b)} na ułamek niewłaściwy.`,
                        answer: { value: b, check: { requireImproper: true }, placeholder: 'np. 5/2' },
                        hint: 'Część całkowitą pomnóż przez mianownik i dodaj licznik.',
                      } as Step,
                    ]),
              ]
            : []),
          ...(op === ':'
            ? [
                {
                  prompt: `Jaka jest odwrotność liczby ${m(b)}?`,
                  answer: { value: b.inverse(), placeholder: 'odwrotność' },
                  hint: 'Odwrotność ułamka otrzymasz, zamieniając licznik z mianownikiem.',
                } as Step,
              ]
            : []),
          {
            prompt: `Oblicz ${m(a)} · ${m(divisor)} i podaj wynik w najprostszej postaci.`,
            answer: { value: result, check: SIMPLEST, placeholder: 'wynik' },
            hint: 'Licznik razy licznik, mianownik razy mianownik. Możesz skracać „na krzyż” przed mnożeniem.',
          },
        ]
      : undefined;

  const solution: string[] = [];
  if (d === 3) solution.push(`Zamieniamy na ułamki niewłaściwe: ${mm(a)} = ${m(a)}${b.isProper() ? '' : `, ${mm(b)} = ${m(b)}`}.`);
  if (op === ':') solution.push(`Dzielenie zamieniamy na mnożenie przez odwrotność: ${m(a)} : ${m(b)} = ${m(a)} · ${m(divisor)}.`);
  solution.push(
    `${m(a)} · ${m(divisor)} = {${a.num}·${divisor.num}/${a.den}·${divisor.den}} = ${m(F(a.num * divisor.num, a.den * divisor.den))}${
      F(a.num * divisor.num, a.den * divisor.den).isSimplest() ? '' : ` = ${m(result)}`
    }.`,
  );
  if (!result.isProper() && !result.isInteger()) solution.push(`Jako liczba mieszana: ${mm(result)}.`);

  return {
    id: id('mnozenie'),
    topicId: 'mnozenie',
    difficulty: d,
    format: 'input',
    prompt: `Oblicz: ${fmt(a)} ${op} ${fmt(b)}. Wynik podaj w najprostszej postaci.`,
    answer: { value: result, check: SIMPLEST, placeholder: 'np. 3/10' },
    misconceptions,
    steps,
    hints: [
      ...(d === 3 ? ['Zamień liczby mieszane na ułamki niewłaściwe.'] : []),
      ...(op === ':' ? [`Zamiast dzielić przez ${m(b)}, pomnóż przez ${m(b.inverse())}.`] : []),
      'Mnożymy licznik przez licznik i mianownik przez mianownik. Przed mnożeniem warto skrócić.',
    ],
    solution,
    answerText: result.isProper() ? m(result) : mm(result),
  };
}

function reciprocalChoice(d: Difficulty, rng: Rng): Task {
  const v = d === 1 ? properFraction(rng, 2, 9) : mixedNumber(rng, 3, 2, 7);
  const inv = v.inverse();
  return {
    id: id('mnozenie'),
    topicId: 'mnozenie',
    difficulty: d,
    format: 'choice',
    prompt: `Jaka jest odwrotność liczby ${mm(v)}?`,
    choices: fractionChoices(
      rng,
      inv,
      [
        ...(v.isProper()
          ? []
          : [
              {
                value: Fraction.fromMixed(v.toMixed().whole, v.toMixed().den, v.toMixed().num),
                message: 'Liczbę mieszaną najpierw zamień na ułamek niewłaściwy, a dopiero potem odwróć.',
              },
            ]),
        { value: v.neg(), message: 'Odwrotność to nie liczba przeciwna. Odwrotność ma taki znak jak liczba.' },
        { value: F(1, v.num), message: 'Odwracamy cały ułamek: licznik zamienia się z mianownikiem.' },
      ],
    ),
    hints: ['Odwrotność liczby a to taka liczba b, że a · b = 1.', 'Liczbę mieszaną zamień na ułamek niewłaściwy, potem zamień licznik z mianownikiem.'],
    solution: [
      ...(v.isProper() ? [] : [`${mm(v)} = ${m(v)}.`]),
      `Odwrotnością ${m(v)} jest ${m(inv)}, bo ${m(v)} · ${m(inv)} = 1.`,
    ],
    answerText: m(inv),
  };
}

export const mnozenieGenerators: Generator[] = [
  (d, r) => mulDivTask(d, r),
  (d, r) => mulDivTask(d, r),
  (d, r) => (d === 3 ? mulDivTask(d, r) : reciprocalChoice(d, r)),
];

/* Dla zadań prawda/fałsz w arkuszu egzaminacyjnym */
export function comparisonStatements(rng: Rng) {
  const a = properFraction(rng, 3, 9);
  let b = properFraction(rng, 3, 9);
  let guard = 0;
  while (a.equals(b) && guard++ < 30) b = properFraction(rng, 3, 9);
  const truth = a.compare(b) > 0;
  return {
    text: `${m(a)} > ${m(b)}`,
    isTrue: truth,
    explanation: `${m(a)} = {${a.num * b.den}/${a.den * b.den}}, ${m(b)} = {${b.num * a.den}/${a.den * b.den}}, więc ${m(a)} ${cmpSign(a, b)} ${m(b)}.`,
  };
}

export function additionStatement(rng: Rng) {
  const a = properFraction(rng, 2, 7);
  let b = properFraction(rng, 2, 7);
  let guard = 0;
  while (a.den === b.den && guard++ < 30) b = properFraction(rng, 2, 7);
  const correct = a.add(b);
  const showWrong = rng() < 0.5;
  const shown = showWrong ? F(a.num + b.num, a.den + b.den) : correct;
  return {
    text: `${m(a)} + ${m(b)} = ${mm(shown)}`,
    isTrue: shown.equals(correct),
    explanation: `${m(a)} + ${m(b)} = ${mm(correct)}${showWrong ? ' – nie dodaje się mianowników.' : '.'}`,
  };
}

