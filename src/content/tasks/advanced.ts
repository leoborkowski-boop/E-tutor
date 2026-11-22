/** Generatory: ułamki dziesiętne, kolejność działań, ułamek liczby i zadania tekstowe. */
import { Fraction, F, gcd } from '../../lib/fraction';
import { int, pick } from '../../lib/random';
import type { Difficulty, Generator, Rng, Step, Task } from '../types';
import { SIMPLEST, fractionChoices, id, m, mm, properFraction, textChoices } from './helpers';

/* ================= 7. Ułamki dziesiętne ================= */

const FINITE = [
  [1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 8], [3, 8], [5, 8], [7, 8],
  [1, 20], [3, 20], [7, 20], [9, 25], [12, 25], [7, 50], [1, 16], [3, 40], [11, 20],
] as const;

export function toDecimal(d: Difficulty, rng: Rng): Task {
  const pool = d === 1 ? FINITE.slice(0, 8) : FINITE;
  const [n, den] = pick(rng, pool);
  let f = F(n, den);
  if (d === 3 && rng() < 0.5) f = f.add(F(int(rng, 1, 3))); // liczba mieszana
  const dec = f.toDecimalString();
  const k = [10, 100, 1000, 10000].find((p) => p % f.den === 0)!;
  const ext = F(f.num * (k / f.den), k);
  return {
    id: id('dziesietne'),
    topicId: 'dziesietne',
    difficulty: d,
    format: 'input',
    prompt: `Zapisz liczbę ${mm(f)} w postaci ułamka dziesiętnego.`,
    answer: { value: f, check: { requireDecimal: true }, placeholder: 'np. 0,75' },
    misconceptions: [
      ...(f.isProper() && f.num < 10 && f.den < 100
        ? [{ value: Fraction.fromDecimalString(`${f.num},${f.den}`)!, message: `Kreska ułamkowa to dzielenie, a nie przecinek: ${m(f)} = ${f.num} : ${f.den}.` }]
        : []),
      ...(f.isProper() && f.num < 10 && f.den < 100
        ? [{ value: Fraction.fromDecimalString(`0,${f.num}${f.den}`)!, message: `Kreska ułamkowa to dzielenie: ${m(f)} = ${f.num} : ${f.den}. Spróbuj rozszerzyć ułamek do mianownika 10, 100 lub 1000.` }]
        : []),
    ],
    hints: [
      `Rozszerz ułamek tak, aby w mianowniku było 10, 100 lub 1000.`,
      `${m(f)} = ${m(ext)}`,
    ],
    solution: [`Rozszerzamy do mianownika ${k}: ${m(f)} = ${m(ext)}.`, `${m(ext)} = ${dec}.`, `(Można też podzielić ${f.num} : ${f.den} = ${dec}.)`],
    answerText: dec,
  };
}

export function fromDecimal(d: Difficulty, rng: Rng): Task {
  const [n, den] = pick(rng, d === 1 ? FINITE.slice(0, 8) : FINITE);
  let f = F(n, den);
  if (d === 3 && rng() < 0.5) f = f.add(F(int(rng, 1, 4)));
  const dec = f.toDecimalString();
  const places = (dec.split(',')[1] ?? '').length;
  const p = 10 ** places;
  const raw = F(Math.round(f.valueOf() * p), p);
  const g = gcd(raw.num, raw.den);
  return {
    id: id('dziesietne'),
    topicId: 'dziesietne',
    difficulty: d,
    format: 'input',
    prompt: `Zapisz liczbę ${dec} w postaci ułamka zwykłego nieskracalnego${f.isProper() ? '' : ' (może być liczba mieszana)'}.`,
    answer: { value: f, check: { ...SIMPLEST, requireCommon: true }, placeholder: 'np. 3/4' },
    misconceptions: [
      ...(places >= 2 ? [{ value: F(raw.num, 10), message: `Liczba cyfr po przecinku mówi o mianowniku: ${places} cyfry → mianownik ${p}.` }] : []),
    ],
    hints: [`${dec} to ${raw.num} ${places === 1 ? 'dziesiątych' : places === 2 ? 'setnych' : places === 3 ? 'tysięcznych' : 'dziesięciotysięcznych'}.`, `${m(raw)} – teraz skróć.`],
    solution: [`${dec} = ${m(raw)}.`, `Skracamy przez ${g}: ${m(raw)} = ${mm(f)}.`],
    answerText: mm(f),
  };
}

export function periodicChoice(d: Difficulty, rng: Rng): Task {
  const items = [
    { f: F(1, 3), dec: '0,(3)' },
    { f: F(2, 3), dec: '0,(6)' },
    { f: F(1, 6), dec: '0,1(6)' },
    { f: F(5, 6), dec: '0,8(3)' },
    { f: F(1, 9), dec: '0,(1)' },
    { f: F(4, 9), dec: '0,(4)' },
    { f: F(1, 11), dec: '0,(09)' },
    { f: F(2, 11), dec: '0,(18)' },
    { f: F(1, 12), dec: '0,08(3)' },
    { f: F(7, 9), dec: '0,(7)' },
  ];
  const it = pick(rng, items);
  const rounded = it.dec.replace(/[()]/g, '').slice(0, 4);
  const wrongs = items.filter((x) => x !== it).map((x) => x.dec);
  return {
    id: id('dziesietne'),
    topicId: 'dziesietne',
    difficulty: d,
    format: 'choice',
    prompt: `Który zapis jest rozwinięciem dziesiętnym ułamka ${m(it.f)}?`,
    choices: textChoices(rng, it.dec, [
      { text: rounded, misconception: 'To tylko przybliżenie. Dzielenie nigdy się nie kończy – cyfry się powtarzają, więc zapisujemy okres w nawiasie.' },
      { text: pick(rng, wrongs), misconception: `Wykonaj dzielenie pisemne ${it.f.num} : ${it.f.den}.` },
      { text: `0,${it.f.num}${it.f.den}`, misconception: 'Kreska ułamkowa to dzielenie – licznik dzielimy przez mianownik.' },
    ]),
    hints: [`Wykonaj dzielenie ${it.f.num} : ${it.f.den} i obserwuj, czy cyfry się powtarzają.`],
    solution: [`${it.f.num} : ${it.f.den} = ${it.dec.replace(/\((\d+)\)/, '$1$1$1…')}`, `Powtarzającą się część (okres) zapisujemy w nawiasie: ${it.dec}.`],
    answerText: it.dec,
  };
}

export function finiteChoice(d: Difficulty, rng: Rng): Task {
  const finite = pick(rng, FINITE.slice(0, 12));
  const nonFinite = [F(1, 3), F(2, 7), F(5, 6), F(4, 9), F(7, 12), F(3, 11), F(1, 15), F(5, 18)];
  const others = [...nonFinite].sort(() => rng() - 0.5).slice(0, 3);
  const f = F(finite[0], finite[1]);
  return {
    id: id('dziesietne'),
    topicId: 'dziesietne',
    difficulty: d,
    format: 'choice',
    prompt: 'Który ułamek można zapisać w postaci **skończonego** ułamka dziesiętnego?',
    choices: textChoices(
      rng,
      m(f),
      others.map((o) => ({
        text: m(o),
        misconception: `Mianownik ${o.den} ma dzielnik pierwszy inny niż 2 i 5 – rozwinięcie będzie nieskończone (okresowe).`,
      })),
    ),
    hints: ['Ułamek nieskracalny ma skończone rozwinięcie dziesiętne, gdy jego mianownik rozkłada się tylko na dwójki i piątki.'],
    solution: [`${f.den} = ${factorize(f.den)} – same dwójki i piątki, więc ${m(f)} = ${f.toDecimalString()}.`, 'Pozostałe mianowniki mają dzielniki 3, 7 lub 11.'],
    answerText: m(f),
  };
}

function factorize(n: number) {
  const out: number[] = [];
  let x = n;
  for (let p = 2; p * p <= x; p++) while (x % p === 0) (out.push(p), (x /= p));
  if (x > 1) out.push(x);
  return out.join(' · ');
}

export const dziesietneGenerators: Generator[] = [
  (d, r) => toDecimal(d, r),
  (d, r) => fromDecimal(d, r),
  (d, r) => (d === 1 ? toDecimal(d, r) : d === 2 ? finiteChoice(d, r) : periodicChoice(d, r)),
];

export function decimalStatement(rng: Rng) {
  const options = [
    { text: '{1/3} = 0,3', isTrue: false, explanation: '{1/3} = 0,(3) = 0,333…, a nie 0,3.' },
    { text: '{3/4} = 0,75', isTrue: true, explanation: '{3/4} = {75/100} = 0,75.' },
    { text: '{2/5} = 0,25', isTrue: false, explanation: '{2/5} = {4/10} = 0,4.' },
    { text: '{1/8} = 0,125', isTrue: true, explanation: '{1/8} = {125/1000} = 0,125.' },
    { text: '0,6 = {3/5}', isTrue: true, explanation: '0,6 = {6/10} = {3/5}.' },
    { text: '0,05 = {1/5}', isTrue: false, explanation: '0,05 = {5/100} = {1/20}.' },
    { text: '{7/20} = 0,35', isTrue: true, explanation: '{7/20} = {35/100} = 0,35.' },
    { text: '{2/3} = 0,67', isTrue: false, explanation: '0,67 to tylko przybliżenie; {2/3} = 0,(6).' },
  ];
  return pick(rng, options);
}

/* ================= 8. Kolejność działań ================= */

export function orderTask(d: Difficulty, rng: Rng): Task {
  if (d === 1) {
    // a + b · c  (pułapka: liczenie od lewej)
    const a = properFraction(rng, 2, 6);
    const b = properFraction(rng, 2, 6);
    const c = F(int(rng, 2, 4));
    const prod = b.mul(c);
    const res = a.add(prod);
    const leftToRight = a.add(b).mul(c);
    return {
      id: id('kolejnosc'),
      topicId: 'kolejnosc',
      difficulty: d,
      format: 'input',
      prompt: `Oblicz: ${m(a)} + ${m(b)} · ${c.num}`,
      answer: { value: res, check: SIMPLEST, placeholder: 'wynik' },
      misconceptions: [
        { value: leftToRight, message: 'Mnożenie wykonujemy **przed** dodawaniem, nawet jeśli stoi dalej w zapisie.' },
      ],
      steps: [
        { prompt: `Najpierw mnożenie: ${m(b)} · ${c.num} = ?`, answer: { value: prod, check: SIMPLEST } },
        { prompt: `Teraz dodawanie: ${m(a)} + ${mm(prod)} = ?`, answer: { value: res, check: SIMPLEST } },
      ],
      hints: ['Pamiętaj: najpierw mnożenie i dzielenie, potem dodawanie i odejmowanie.', `${m(b)} · ${c.num} = ${mm(prod)}`],
      solution: [`Najpierw mnożenie: ${m(b)} · ${c.num} = ${mm(prod)}.`, `Potem dodawanie: ${m(a)} + ${mm(prod)} = ${mm(res)}.`],
      answerText: mm(res),
    };
  }
  if (d === 2) {
    // (a − b) : c
    let a = properFraction(rng, 2, 8);
    let b = properFraction(rng, 2, 8);
    let guard = 0;
    while (a.compare(b) <= 0 && guard++ < 50) {
      a = properFraction(rng, 2, 8);
      b = properFraction(rng, 2, 8);
    }
    if (a.compare(b) <= 0) [a, b] = [F(5, 6), F(1, 3)];
    const c = properFraction(rng, 2, 6);
    const diff = a.sub(b);
    const res = diff.div(c);
    const noBrackets = a.sub(b.div(c));
    return {
      id: id('kolejnosc'),
      topicId: 'kolejnosc',
      difficulty: d,
      format: 'input',
      prompt: `Oblicz: (${m(a)} − ${m(b)}) : ${m(c)}`,
      answer: { value: res, check: SIMPLEST, placeholder: 'wynik' },
      misconceptions: [{ value: noBrackets, message: 'Działanie w **nawiasie** wykonujemy jako pierwsze.' }],
      steps: [
        { prompt: `Najpierw nawias: ${m(a)} − ${m(b)} = ?`, answer: { value: diff, check: SIMPLEST } },
        { prompt: `Teraz dzielenie: ${mm(diff)} : ${m(c)} = ?`, answer: { value: res, check: SIMPLEST }, hint: 'Pomnóż przez odwrotność dzielnika.' },
      ],
      hints: ['Najpierw oblicz wartość w nawiasie.', `W nawiasie wychodzi ${mm(diff)}. Teraz pomnóż przez odwrotność ${m(c)}, czyli ${m(c.inverse())}.`],
      solution: [`Nawias: ${m(a)} − ${m(b)} = ${mm(diff)}.`, `Dzielenie: ${mm(diff)} : ${m(c)} = ${mm(diff)} · ${m(c.inverse())} = ${mm(res)}.`],
      answerText: mm(res),
    };
  }
  // d === 3: (a/b)² − c · 0,5  lub  0,25 · x + y
  if (rng() < 0.5) {
    const a = properFraction(rng, 2, 5);
    const sq = a.mul(a);
    const c = properFraction(rng, 2, 5);
    const half = F(1, 2);
    const prod = c.mul(half);
    const res = sq.add(prod);
    return {
      id: id('kolejnosc'),
      topicId: 'kolejnosc',
      difficulty: d,
      format: 'input',
      prompt: `Oblicz: (${m(a)})² + ${m(c)} · 0,5`,
      answer: { value: res, check: SIMPLEST, placeholder: 'wynik' },
      misconceptions: [
        { value: F(a.num * a.num, a.den).add(prod), message: 'Do kwadratu podnosimy **cały** ułamek: licznik i mianownik.' },
        { value: F(a.num * 2, a.den * 2).add(prod), message: 'Potęga to mnożenie przez siebie, a nie mnożenie przez 2.' },
      ],
      steps: [
        { prompt: `Potęga: (${m(a)})² = ?`, answer: { value: sq, check: SIMPLEST } },
        { prompt: `Mnożenie: ${m(c)} · 0,5 = ?`, answer: { value: prod, check: SIMPLEST }, hint: '0,5 = {1/2}' },
        { prompt: `Dodawanie: ${m(sq)} + ${m(prod)} = ?`, answer: { value: res, check: SIMPLEST } },
      ],
      hints: ['Kolejność: potęgi, potem mnożenie, na końcu dodawanie.', '0,5 to {1/2}.', `(${m(a)})² = {${a.num}·${a.num}/${a.den}·${a.den}} = ${m(sq)}`],
      solution: [
        `Potęga: (${m(a)})² = ${m(sq)}.`,
        `Mnożenie: ${m(c)} · 0,5 = ${m(c)} · {1/2} = ${m(prod)}.`,
        `Dodawanie: ${m(sq)} + ${m(prod)} = ${mm(res)}.`,
      ],
      answerText: mm(res),
    };
  }
  const x = Fraction.fromMixed(int(rng, 1, 3), 1, pick(rng, [2, 3]));
  const y = properFraction(rng, 2, 6);
  const quarter = F(1, 4);
  const prod = quarter.mul(x);
  const res = prod.add(y);
  return {
    id: id('kolejnosc'),
    topicId: 'kolejnosc',
    difficulty: d,
    format: 'input',
    prompt: `Oblicz: 0,25 · ${mm(x)} + ${m(y)}`,
    answer: { value: res, check: SIMPLEST, placeholder: 'wynik' },
    misconceptions: [{ value: quarter.mul(x.add(y)), message: 'Mnożenie wykonujemy przed dodawaniem – nie mnożymy całej sumy.' }],
    steps: [
      { prompt: `Zamień 0,25 na ułamek zwykły.`, answer: { value: quarter, check: { ...SIMPLEST, requireCommon: true } } },
      { prompt: `Mnożenie: {1/4} · ${mm(x)} = ?`, answer: { value: prod, check: SIMPLEST }, hint: `${mm(x)} = ${m(x)}` },
      { prompt: `Dodawanie: ${mm(prod)} + ${m(y)} = ?`, answer: { value: res, check: SIMPLEST } },
    ],
    hints: ['0,25 = {1/4}.', `Liczbę mieszaną ${mm(x)} zamień na ${m(x)}.`, 'Najpierw mnożenie, potem dodawanie.'],
    solution: [`0,25 = {1/4}, ${mm(x)} = ${m(x)}.`, `{1/4} · ${m(x)} = ${mm(prod)}.`, `${mm(prod)} + ${m(y)} = ${mm(res)}.`],
    answerText: mm(res),
  };
}

export function orderChoice(d: Difficulty, rng: Rng): Task {
  const a = properFraction(rng, 2, 6);
  const n = int(rng, 2, 5);
  const b = properFraction(rng, 2, 6);
  const correct = F(n).sub(a).add(b); // n − a + b
  const wrong1 = F(n).sub(a.add(b));
  return {
    id: id('kolejnosc'),
    topicId: 'kolejnosc',
    difficulty: d,
    format: 'choice',
    prompt: `Ile wynosi ${n} − ${m(a)} + ${m(b)}?`,
    choices: fractionChoices(rng, correct, [
      { value: wrong1, message: 'Dodawanie i odejmowanie wykonujemy po kolei **od lewej do prawej** – nie dodajemy najpierw.' },
      { value: F(n).add(a).sub(b), message: 'Uważaj na znaki: od liczby odejmujemy pierwszy ułamek, a drugi dodajemy.' },
    ], { mixed: true }),
    hints: ['Dodawanie i odejmowanie są „równorzędne” – liczymy od lewej do prawej.'],
    solution: [`${n} − ${m(a)} = ${mm(F(n).sub(a))}.`, `${mm(F(n).sub(a))} + ${m(b)} = ${mm(correct)}.`],
    answerText: mm(correct),
  };
}

export const kolejnoscGenerators: Generator[] = [
  (d, r) => orderTask(d, r),
  (d, r) => orderTask(d, r),
  (d, r) => (d === 1 ? orderChoice(d, r) : orderTask(d, r)),
];

/* ================= 9. Ułamek liczby, zadania tekstowe ================= */

export function fractionOfNumber(d: Difficulty, rng: Rng): Task {
  const f = properFraction(rng, 2, d === 1 ? 6 : 10);
  const n = f.den * int(rng, 2, d === 1 ? 8 : 15);
  const res = F(n).mul(f);
  return {
    id: id('tekstowe'),
    topicId: 'tekstowe',
    difficulty: d,
    format: 'input',
    prompt: `Oblicz ${m(f)} liczby ${n}.`,
    answer: { value: res, placeholder: 'wynik' },
    misconceptions: [
      { value: F(n).mul(f.inverse()), message: `${m(f)} liczby to: liczba **podzielona przez mianownik** i pomnożona przez licznik.` },
      ...(f.num !== 1 ? [{ value: F(n / f.den), message: `To dopiero {1/${f.den}} liczby ${n}. Pomnóż jeszcze przez licznik (${f.num}).` }] : []),
    ],
    hints: [`Najpierw oblicz {1/${f.den}} liczby ${n}, czyli ${n} : ${f.den}.`, `${n} : ${f.den} = ${n / f.den}. Teraz pomnóż przez ${f.num}.`],
    solution: [`{1/${f.den}} liczby ${n} to ${n} : ${f.den} = ${n / f.den}.`, `${m(f)} liczby ${n} to ${n / f.den} · ${f.num} = ${res.num}.`],
    answerText: String(res.num),
  };
}

export function wholeFromPart(d: Difficulty, rng: Rng): Task {
  const f = properFraction(rng, 2, d === 1 ? 6 : 9);
  const unit = int(rng, 2, 12);
  const part = unit * f.num;
  const whole = unit * f.den;
  return {
    id: id('tekstowe'),
    topicId: 'tekstowe',
    difficulty: d,
    format: 'input',
    prompt: `${m(f)} pewnej liczby to ${part}. Jaka to liczba?`,
    answer: { value: F(whole), placeholder: 'liczba' },
    misconceptions: [
      { value: F(part).mul(f), message: `Szukamy **całości**, a nie ${m(f)} z ${part}. Całość jest większa niż jej część.` },
      { value: F(unit), message: `${unit} to dopiero {1/${f.den}} liczby. Całość to ${f.den} takich części.` },
    ],
    hints: [`Jeśli ${f.num} części to ${part}, to ile wynosi jedna część?`, `Jedna część to ${part} : ${f.num} = ${unit}. Całość to ${f.den} części.`],
    solution: [`${f.num} ${f.num === 1 ? 'część' : 'części'} → ${part}, więc 1 część → ${part} : ${f.num} = ${unit}.`, `Całość (${f.den} części) → ${unit} · ${f.den} = ${whole}.`, `(Inaczej: ${part} : ${m(f)} = ${whole}.)`],
    answerText: String(whole),
  };
}

type WordProblem = {
  difficulty: Difficulty;
  prompt: string;
  unit?: string;
  answer: Fraction;
  steps: { prompt: string; answer: Fraction; hint?: string }[];
  misconceptions?: { value: Fraction; message: string }[];
  solution: string[];
};

/** Ręcznie przygotowane zadania tekstowe (rozwiązanie krok po kroku). */
export const WORD_PROBLEMS: WordProblem[] = [
  {
    difficulty: 2,
    prompt: 'Kasia w poniedziałek przeczytała {1/4} książki, a we wtorek {1/3} książki. Jaka część książki została jej do przeczytania?',
    answer: F(5, 12),
    steps: [
      { prompt: 'Jaką część książki Kasia przeczytała łącznie?', answer: F(7, 12), hint: '{1/4} + {1/3} – wspólny mianownik 12.' },
      { prompt: 'Jaka część została do przeczytania?', answer: F(5, 12), hint: 'Cała książka to 1 = {12/12}.' },
    ],
    misconceptions: [{ value: F(7, 12), message: 'To część **przeczytana**. Pytanie dotyczy części, która została.' }],
    solution: ['Przeczytała: {1/4} + {1/3} = {3/12} + {4/12} = {7/12}.', 'Zostało: 1 − {7/12} = {5/12} książki.'],
  },
  {
    difficulty: 1,
    prompt: 'Bilet kosztował 48 zł. Cenę obniżono o {1/6}. Ile kosztuje bilet po obniżce?',
    unit: 'zł',
    answer: F(40),
    steps: [
      { prompt: 'O ile złotych obniżono cenę?', answer: F(8), hint: '{1/6} z 48 to 48 : 6.' },
      { prompt: 'Ile kosztuje bilet po obniżce?', answer: F(40) },
    ],
    misconceptions: [{ value: F(8), message: '8 zł to wysokość **obniżki**. Odejmij ją od ceny.' }],
    solution: ['Obniżka: {1/6} · 48 zł = 8 zł.', 'Nowa cena: 48 zł − 8 zł = 40 zł.'],
  },
  {
    difficulty: 1,
    prompt: 'W klasie jest 28 uczniów. {3/7} klasy to dziewczynki. Ilu jest chłopców?',
    answer: F(16),
    steps: [
      { prompt: 'Ile jest dziewczynek?', answer: F(12), hint: '28 : 7 · 3' },
      { prompt: 'Ilu jest chłopców?', answer: F(16) },
    ],
    misconceptions: [{ value: F(12), message: 'To liczba dziewczynek. Pytanie dotyczy chłopców.' }],
    solution: ['Dziewczynki: {3/7} · 28 = 12.', 'Chłopcy: 28 − 12 = 16.'],
  },
  {
    difficulty: 2,
    prompt: 'Pan Tomek przejechał {2/5} trasy, co stanowi 36 km. Jak długa jest cała trasa?',
    unit: 'km',
    answer: F(90),
    steps: [
      { prompt: 'Ile kilometrów to {1/5} trasy?', answer: F(18), hint: '36 : 2' },
      { prompt: 'Jak długa jest cała trasa?', answer: F(90), hint: 'Cała trasa to {5/5}.' },
    ],
    misconceptions: [{ value: F(72, 5), message: 'Obliczono {2/5} z 36 km. Tymczasem 36 km to {2/5} całej trasy – szukamy całości.' }],
    solution: ['{2/5} trasy → 36 km, więc {1/5} trasy → 18 km.', 'Cała trasa: 5 · 18 km = 90 km.'],
  },
  {
    difficulty: 2,
    prompt: 'Mama miała 3 kg mąki. Zużyła {3/4} kg na ciasto i {1 1/2} kg na chleb. Ile kilogramów mąki zostało?',
    unit: 'kg',
    answer: F(3, 4),
    steps: [
      { prompt: 'Ile kilogramów mąki zużyła łącznie?', answer: F(9, 4), hint: '{3/4} + {1 1/2} = {3/4} + {6/4}' },
      { prompt: 'Ile kilogramów zostało?', answer: F(3, 4) },
    ],
    solution: ['Zużyła: {3/4} + {1 1/2} = {3/4} + {6/4} = {9/4} = {2 1/4} kg.', 'Zostało: 3 − {2 1/4} = {3/4} kg.'],
  },
  {
    difficulty: 2,
    prompt: 'Butelka ma pojemność {3/4} litra. Ile takich butelek można napełnić 6 litrami soku?',
    answer: F(8),
    steps: [{ prompt: 'Oblicz 6 : {3/4}.', answer: F(8), hint: '6 : {3/4} = 6 · {4/3}' }],
    misconceptions: [{ value: F(9, 2), message: 'Obliczono {3/4} z 6. Trzeba sprawdzić, ile razy {3/4} mieści się w 6 – to dzielenie.' }],
    solution: ['Liczba butelek: 6 : {3/4} = 6 · {4/3} = {24/3} = 8.'],
  },
  {
    difficulty: 2,
    prompt: 'Rower kosztuje 1200 zł. Tata zapłacił {5/8} ceny, a resztę dopłaciła babcia. Ile złotych dopłaciła babcia?',
    unit: 'zł',
    answer: F(450),
    steps: [
      { prompt: 'Jaką część ceny zapłaciła babcia?', answer: F(3, 8) },
      { prompt: 'Ile złotych dopłaciła babcia?', answer: F(450), hint: '1200 : 8 · 3' },
    ],
    misconceptions: [{ value: F(750), message: '750 zł zapłacił tata. Babcia dopłaciła resztę.' }],
    solution: ['Babcia zapłaciła 1 − {5/8} = {3/8} ceny.', '{3/8} · 1200 zł = 450 zł.'],
  },
  {
    difficulty: 3,
    prompt:
      'Marek wydał {1/3} kieszonkowego na książkę, a potem {1/4} **pozostałej** kwoty na bilet do kina. Zostało mu 30 zł. Ile wynosiło całe kieszonkowe?',
    unit: 'zł',
    answer: F(60),
    steps: [
      { prompt: 'Jaka część kieszonkowego została po zakupie książki?', answer: F(2, 3) },
      { prompt: 'Jaką część **całego** kieszonkowego kosztował bilet?', answer: F(1, 6), hint: '{1/4} z {2/3}' },
      { prompt: 'Jaka część kieszonkowego została na końcu?', answer: F(1, 2), hint: '{2/3} − {1/6}' },
      { prompt: 'Ile wynosiło całe kieszonkowe?', answer: F(60), hint: 'Połowa kieszonkowego to 30 zł.' },
    ],
    misconceptions: [{ value: F(72), message: 'Bilet kosztował {1/4} **pozostałej** kwoty, a nie całego kieszonkowego.' }],
    solution: [
      'Po książce zostało 1 − {1/3} = {2/3} kieszonkowego.',
      'Bilet: {1/4} · {2/3} = {1/6} kieszonkowego.',
      'Zostało: {2/3} − {1/6} = {4/6} − {1/6} = {3/6} = {1/2} kieszonkowego.',
      '{1/2} kieszonkowego to 30 zł, więc całe kieszonkowe to 60 zł.',
    ],
  },
  {
    difficulty: 3,
    prompt: 'Działka ma powierzchnię 600 m². {2/5} działki zajmuje ogród warzywny, {1/3} trawnik, a resztę sad. Ile metrów kwadratowych zajmuje sad?',
    unit: 'm²',
    answer: F(160),
    steps: [
      { prompt: 'Jaką część działki zajmują ogród i trawnik razem?', answer: F(11, 15) },
      { prompt: 'Jaką część działki zajmuje sad?', answer: F(4, 15) },
      { prompt: 'Ile m² zajmuje sad?', answer: F(160), hint: '600 : 15 · 4' },
    ],
    solution: ['Ogród i trawnik: {2/5} + {1/3} = {6/15} + {5/15} = {11/15}.', 'Sad: 1 − {11/15} = {4/15}.', 'Powierzchnia sadu: {4/15} · 600 m² = 160 m².'],
  },
  {
    difficulty: 2,
    prompt: 'Pociąg jechał przez {2 1/2} godziny ze średnią prędkością 80 km/h. Jaką drogę przebył?',
    unit: 'km',
    answer: F(200),
    steps: [{ prompt: 'Oblicz {2 1/2} · 80.', answer: F(200), hint: '{2 1/2} = {5/2}' }],
    misconceptions: [{ value: F(170), message: 'Liczbę mieszaną zamień na ułamek {5/2}, a potem pomnóż: {5/2} · 80.' }],
    solution: ['Droga = prędkość · czas.', '80 · {2 1/2} = 80 · {5/2} = 200 km.'],
  },
  {
    difficulty: 1,
    prompt: 'Ania ma 45 naklejek, a Bartek ma {4/5} tego, co Ania. Ile naklejek mają razem?',
    answer: F(81),
    steps: [
      { prompt: 'Ile naklejek ma Bartek?', answer: F(36), hint: '45 : 5 · 4' },
      { prompt: 'Ile naklejek mają razem?', answer: F(81) },
    ],
    misconceptions: [{ value: F(36), message: '36 to liczba naklejek Bartka. Pytanie dotyczy obojga dzieci.' }],
    solution: ['Bartek: {4/5} · 45 = 36.', 'Razem: 45 + 36 = 81.'],
  },
  {
    difficulty: 3,
    prompt: 'Woda w basenie zajmuje {3/8} jego pojemności. Po dolaniu 150 litrów basen jest wypełniony w {5/8}. Jaka jest pojemność basenu?',
    unit: 'l',
    answer: F(600),
    steps: [
      { prompt: 'Jaką część pojemności basenu stanowi 150 litrów?', answer: F(1, 4), hint: '{5/8} − {3/8}' },
      { prompt: 'Jaka jest pojemność basenu (w litrach)?', answer: F(600), hint: '{1/4} pojemności to 150 l.' },
    ],
    solution: ['Dolano {5/8} − {3/8} = {2/8} = {1/4} pojemności.', '{1/4} pojemności → 150 l, więc cała pojemność to 4 · 150 l = 600 l.'],
  },
];

export function wordProblemTask(wp: WordProblem): Task {
  const steps: Step[] = wp.steps.map((s) => ({
    prompt: s.prompt,
    answer: { value: s.answer, check: SIMPLEST, unit: undefined },
    hint: s.hint,
  }));
  return {
    id: id('tekstowe'),
    topicId: 'tekstowe',
    difficulty: wp.difficulty,
    format: 'input',
    prompt: wp.prompt,
    answer: { value: wp.answer, check: SIMPLEST, unit: wp.unit, placeholder: 'odpowiedź' },
    misconceptions: wp.misconceptions,
    steps,
    hints: wp.steps.map((s) => s.prompt + (s.hint ? ` (${s.hint})` : '')),
    solution: wp.solution,
    answerText: `${mm(wp.answer)}${wp.unit ? ' ' + wp.unit : ''}`,
  };
}

export function wordProblem(d: Difficulty, rng: Rng): Task {
  const pool = WORD_PROBLEMS.filter((w) => w.difficulty === d);
  return wordProblemTask(pick(rng, pool.length ? pool : WORD_PROBLEMS));
}

export const tekstoweGenerators: Generator[] = [
  (d, r) => (d === 3 ? wordProblem(d, r) : fractionOfNumber(d, r)),
  (d, r) => (d === 1 ? fractionOfNumber(d, r) : wholeFromPart(d, r)),
  (d, r) => wordProblem(d, r),
];
