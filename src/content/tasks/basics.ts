/** Generatory: pojęcie ułamka, skracanie/rozszerzanie, liczby mieszane. */
import { Fraction, F, gcd } from '../../lib/fraction';
import { int, pick } from '../../lib/random';
import type { Difficulty, Generator, Rng, Task } from '../types';
import { SIMPLEST, fractionChoices, id, m, mixedNumber, properFraction, textChoices } from './helpers';

/* ================= 1. Pojęcie ułamka, oś liczbowa ================= */

export function shadedBar(d: Difficulty, rng: Rng): Task {
  const den = d === 1 ? int(rng, 3, 8) : int(rng, 5, 12);
  const num = int(rng, 1, den - 1);
  const ans = F(num, den);
  return {
    id: id('pojecie'),
    topicId: 'pojecie',
    difficulty: d,
    format: 'input',
    prompt: 'Jaka część paska jest zamalowana? Zapisz ją w postaci ułamka.',
    visual: { kind: 'bar', num, den },
    answer: { value: ans, placeholder: 'np. 3/5' },
    misconceptions: [
      ...(den - num !== num
        ? [{ value: F(den - num, den), message: 'Policzono części niezamalowane. W liczniku wpisujemy liczbę części **zamalowanych**.' }]
        : []),
      ...(den - num > 0 && num !== den - num
        ? [
            {
              value: F(num, den - num),
              message: 'Mianownik to liczba **wszystkich** części paska, a nie tylko niezamalowanych.',
            },
          ]
        : []),
    ],
    hints: ['Policz, na ile równych części podzielono pasek – to będzie mianownik.', 'Policz zamalowane części – to będzie licznik.'],
    solution: [
      `Pasek podzielono na ${den} równych części, więc mianownik to ${den}.`,
      `Zamalowane ${num === 1 ? 'jest' : num < 5 ? 'są' : 'jest'} ${num} ${num === 1 ? 'część' : 'części'}, więc licznik to ${num}.`,
      `Zamalowana część to ${m(ans)}.`,
    ],
    answerText: m(ans),
  };
}

export function numberLinePoint(d: Difficulty, rng: Rng): Task {
  const den = d === 1 ? pick(rng, [2, 3, 4, 5]) : pick(rng, [3, 4, 5, 6, 8]);
  const max = d === 1 ? 1 : 2;
  let at = int(rng, 1, den * max - 1);
  if (at % den === 0) at += 1;
  const ans = new Fraction(at, den);
  const ticksWrong = F(at, den + 1);
  const choices = fractionChoices(
    rng,
    ans,
    [
      { value: ticksWrong, message: 'Liczymy **odcinki** między 0 a 1, a nie kreski. Kresek jest o jedną więcej niż odcinków.' },
      { value: F(at + 1, den), message: 'Zacznij liczenie od zera – pierwszy odcinek kończy się na pierwszej kresce za zerem.' },
      { value: F(den, at), message: 'Licznik i mianownik zamieniły się miejscami.' },
    ],
    { mixed: false },
  );
  return {
    id: id('pojecie'),
    topicId: 'pojecie',
    difficulty: d,
    format: 'choice',
    prompt: 'Jaką liczbę oznacza punkt **A** na osi liczbowej?',
    visual: { kind: 'numberline', min: 0, max, den, points: [{ at, label: 'A' }] },
    choices,
    hints: [
      'Sprawdź, na ile równych odcinków podzielono odcinek od 0 do 1.',
      `Każdy mały odcinek to ${m(F(1, den))}. Policz, ile takich odcinków dzieli punkt A od zera.`,
    ],
    solution: [
      `Odcinek od 0 do 1 podzielono na ${den} równych części, więc jedna część to ${m(F(1, den))}.`,
      `Od zera do punktu A jest ${at} takich ${at === 1 ? 'część' : 'części'}.`,
      `A = ${m(ans)}${!ans.isProper() ? ` = ${ans.toMarkup(true)}` : ''}.`,
    ],
    answerText: m(ans),
  };
}

const UNITS_OF_TIME = [
  { part: 15, whole: 60, partName: 'minut', wholeName: 'godziny', eq: '1 godzina = 60 minut' },
  { part: 20, whole: 60, partName: 'minut', wholeName: 'godziny', eq: '1 godzina = 60 minut' },
  { part: 45, whole: 60, partName: 'minut', wholeName: 'godziny', eq: '1 godzina = 60 minut' },
  { part: 40, whole: 60, partName: 'minut', wholeName: 'godziny', eq: '1 godzina = 60 minut' },
  { part: 6, whole: 24, partName: 'godzin', wholeName: 'doby', eq: '1 doba = 24 godziny' },
  { part: 8, whole: 24, partName: 'godzin', wholeName: 'doby', eq: '1 doba = 24 godziny' },
  { part: 18, whole: 24, partName: 'godzin', wholeName: 'doby', eq: '1 doba = 24 godziny' },
  { part: 250, whole: 1000, partName: 'gramów', wholeName: 'kilograma', eq: '1 kg = 1000 g' },
  { part: 750, whole: 1000, partName: 'gramów', wholeName: 'kilograma', eq: '1 kg = 1000 g' },
  { part: 200, whole: 1000, partName: 'gramów', wholeName: 'kilograma', eq: '1 kg = 1000 g' },
  { part: 25, whole: 100, partName: 'centymetrów', wholeName: 'metra', eq: '1 m = 100 cm' },
  { part: 60, whole: 100, partName: 'centymetrów', wholeName: 'metra', eq: '1 m = 100 cm' },
  { part: 3, whole: 12, partName: 'miesiące', wholeName: 'roku', eq: '1 rok = 12 miesięcy' },
  { part: 9, whole: 12, partName: 'miesięcy', wholeName: 'roku', eq: '1 rok = 12 miesięcy' },
  { part: 4, whole: 12, partName: 'miesiące', wholeName: 'roku', eq: '1 rok = 12 miesięcy' },
];

export function unitPart(d: Difficulty, rng: Rng): Task {
  const u = pick(rng, UNITS_OF_TIME);
  const raw = F(u.part, u.whole);
  const ans = raw.simplify();
  const g = gcd(u.part, u.whole);
  return {
    id: id('pojecie'),
    topicId: 'pojecie',
    difficulty: d,
    format: 'input',
    prompt: `Jaką częścią ${u.wholeName} jest ${u.part} ${u.partName}? Podaj ułamek nieskracalny.`,
    answer: { value: ans, check: SIMPLEST, placeholder: 'np. 1/4' },
    misconceptions: [{ value: raw.inverse(), message: 'Ułamek odwrócił się. Część (mniejsza liczba) idzie do licznika, całość do mianownika.' }],
    hints: [
      `${u.eq}. Zapisz ułamek: część przez całość, czyli ${m(raw)}.`,
      `Teraz skróć ułamek ${m(raw)} – podziel licznik i mianownik przez ${g}.`,
    ],
    solution: [
      `${u.eq}, więc szukana część to ${m(raw)}.`,
      `Skracamy przez ${g}: ${m(raw)} = ${m(ans)}.`,
    ],
    answerText: m(ans),
  };
}

export const pojecieGenerators: Generator[] = [
  (d, r) => shadedBar(d, r),
  (d, r) => numberLinePoint(d, r),
  (d, r) => (d === 1 ? shadedBar(d, r) : unitPart(d, r)),
];

/* ================= 2. Skracanie i rozszerzanie ================= */

export function simplifyTask(d: Difficulty, rng: Rng): Task {
  const base = properFraction(rng, 2, d === 1 ? 7 : 10);
  const k = d === 1 ? int(rng, 2, 4) : d === 2 ? int(rng, 3, 8) : pick(rng, [6, 8, 9, 12, 14, 15]);
  const given = F(base.num * k, base.den * k);
  return {
    id: id('skracanie'),
    topicId: 'skracanie',
    difficulty: d,
    format: 'input',
    prompt: `Skróć ułamek ${m(given)} do postaci nieskracalnej.`,
    answer: { value: base, check: SIMPLEST, placeholder: 'np. 2/3' },
    misconceptions: [
      { value: F(base.num, given.den), message: 'Skracając, dzielimy przez tę samą liczbę **i licznik, i mianownik**.' },
      { value: F(given.num, base.den), message: 'Skracając, dzielimy przez tę samą liczbę **i licznik, i mianownik**.' },
    ],
    hints: [
      `Poszukaj liczby, przez którą dzielą się jednocześnie ${given.num} i ${given.den}.`,
      `Największy wspólny dzielnik liczb ${given.num} i ${given.den} to ${k}.`,
    ],
    solution: [
      `NWD(${given.num}, ${given.den}) = ${k}.`,
      `Dzielimy licznik i mianownik przez ${k}: ${m(given)} = {${given.num}:${k}/${given.den}:${k}} = ${m(base)}.`,
      `Ułamka ${m(base)} nie da się już skrócić.`,
    ],
    answerText: m(base),
  };
}

export function extendTask(d: Difficulty, rng: Rng): Task {
  const base = properFraction(rng, 2, d === 1 ? 6 : 9);
  const k = int(rng, 2, d === 1 ? 5 : 9);
  const target = base.den * k;
  const ans = F(base.num * k);
  return {
    id: id('skracanie'),
    topicId: 'skracanie',
    difficulty: d,
    format: 'input',
    prompt: `Rozszerz ułamek ${m(base)} tak, aby miał mianownik ${target}. Jaki będzie licznik? {${base.num}/${base.den}} = {□/${target}}`,
    answer: { value: ans, placeholder: 'licznik', prefix: 'licznik =' },
    misconceptions: [
      {
        value: F(base.num + (target - base.den)),
        message: 'Rozszerzając ułamek, **mnożymy** licznik i mianownik przez tę samą liczbę – nie dodajemy.',
      },
      { value: F(base.num), message: 'Licznik też trzeba pomnożyć – tak samo jak mianownik.' },
    ],
    hints: [`Przez ile trzeba pomnożyć ${base.den}, żeby otrzymać ${target}?`, `${base.den} · ${k} = ${target}. Licznik też pomnóż przez ${k}.`],
    solution: [
      `${target} : ${base.den} = ${k}, więc mnożymy licznik i mianownik przez ${k}.`,
      `${m(base)} = {${base.num}·${k}/${base.den}·${k}} = {${base.num * k}/${target}}.`,
    ],
    answerText: String(base.num * k),
  };
}

export function equivalentChoice(d: Difficulty, rng: Rng): Task {
  const base = properFraction(rng, 3, d === 1 ? 7 : 11);
  const k = int(rng, 2, 5);
  const correct = F(base.num * k, base.den * k);
  const render = (f: Fraction) => `{${f.num}/${f.den}}`;
  const wrongs = [
    { value: F(base.num + k, base.den + k), message: 'Dodanie tej samej liczby do licznika i mianownika zmienia wartość ułamka.' },
    { value: F(base.num * k, base.den + k), message: 'Licznik i mianownik trzeba zmienić w ten sam sposób – oba pomnożyć.' },
    { value: F(base.num + k, base.den * k), message: 'Licznik i mianownik trzeba zmienić w ten sam sposób – oba pomnożyć.' },
    { value: F(base.num * k + 1, base.den * k), message: 'Licznik i mianownik trzeba pomnożyć przez tę samą liczbę.' },
    { value: F(base.num * k, base.den * k + 1), message: 'Licznik i mianownik trzeba pomnożyć przez tę samą liczbę.' },
    { value: F(base.den * k, base.num * k), message: 'Ten ułamek jest odwrócony – licznik zamienił się z mianownikiem.' },
  ];
  // Odpowiedzi wyświetlamy bez skracania, ale porównujemy wartości
  const picked: typeof wrongs = [];
  for (const w of wrongs) {
    if (picked.length >= 3) break;
    if (w.value.equals(base) || picked.some((p) => render(p.value) === render(w.value))) continue;
    picked.push(w);
  }
  const choices = [
    { text: render(correct), correct: true },
    ...picked.map((w) => ({ text: render(w.value), correct: false, misconception: w.message })),
  ];
  return {
    id: id('skracanie'),
    topicId: 'skracanie',
    difficulty: d,
    format: 'choice',
    prompt: `Który ułamek jest równy ułamkowi ${m(base)}?`,
    choices: textChoices(rng, choices[0].text, choices.slice(1)),
    hints: ['Ułamki są równe, gdy jeden powstaje z drugiego przez pomnożenie licznika i mianownika przez tę samą liczbę.'],
    solution: [`${m(base)} = {${base.num}·${k}/${base.den}·${k}} = ${render(correct)}.`, `Pozostałe ułamki mają inną wartość.`],
    answerText: render(correct),
  };
}

export const skracanieGenerators: Generator[] = [
  (d, r) => simplifyTask(d, r),
  (d, r) => extendTask(d, r),
  (d, r) => equivalentChoice(d, r),
];

/* ================= 3. Liczby mieszane, ułamki niewłaściwe ================= */

export function mixedToImproper(d: Difficulty, rng: Rng): Task {
  const v = mixedNumber(rng, d === 1 ? 3 : 6, 2, d === 1 ? 6 : 10);
  const mx = v.toMixed();
  return {
    id: id('mieszane'),
    topicId: 'mieszane',
    difficulty: d,
    format: 'input',
    prompt: `Zamień liczbę mieszaną ${v.toMarkup(true)} na ułamek niewłaściwy.`,
    answer: { value: v, check: { requireImproper: true }, placeholder: 'np. 7/3' },
    misconceptions: [
      { value: F(mx.whole + mx.num, mx.den), message: 'Całości trzeba najpierw zamienić na części: pomnóż część całkowitą przez mianownik.' },
      { value: F(mx.whole * mx.num, mx.den), message: 'Część całkowitą mnożymy przez **mianownik** (a nie licznik), a potem dodajemy licznik.' },
      { value: F(mx.whole * mx.den, mx.den), message: 'Nie zapomnij dodać licznika części ułamkowej.' },
    ],
    hints: [
      `Jedna całość to {${mx.den}/${mx.den}}. Ile to części w ${mx.whole} całościach?`,
      `${mx.whole} · ${mx.den} = ${mx.whole * mx.den}. Teraz dodaj licznik ${mx.num}.`,
    ],
    solution: [
      `Licznik: ${mx.whole} · ${mx.den} + ${mx.num} = ${v.num}.`,
      `Mianownik się nie zmienia: ${mx.den}.`,
      `${v.toMarkup(true)} = ${m(v)}.`,
    ],
    answerText: m(v),
  };
}

export function improperToMixed(d: Difficulty, rng: Rng): Task {
  const v = mixedNumber(rng, d === 1 ? 3 : 7, 2, d === 1 ? 6 : 11);
  const mx = v.toMixed();
  const swapped = mx.num < mx.den && mx.whole < mx.den && mx.whole !== mx.num ? Fraction.fromMixed(mx.num, mx.whole, mx.den) : null;
  return {
    id: id('mieszane'),
    topicId: 'mieszane',
    difficulty: d,
    format: 'input',
    prompt: `Zamień ułamek ${m(v)} na liczbę mieszaną.`,
    answer: { value: v, check: { requireMixed: true, requireSimplest: true }, placeholder: 'np. 2 1/3' },
    misconceptions: swapped
      ? [{ value: swapped, message: 'Wynik dzielenia to część całkowita, a **reszta** to licznik części ułamkowej.' }]
      : [],
    hints: [`Podziel ${v.num} przez ${v.den} z resztą.`, `${v.num} : ${v.den} = ${mx.whole} reszty ${mx.num}.`],
    solution: [
      `${v.num} : ${v.den} = ${mx.whole} reszty ${mx.num}.`,
      `Wynik dzielenia (${mx.whole}) to całości, reszta (${mx.num}) to licznik, mianownik zostaje ${mx.den}.`,
      `${m(v)} = ${v.toMarkup(true)}.`,
    ],
    answerText: v.toMarkup(true),
  };
}

export function mixedOnLineChoice(d: Difficulty, rng: Rng): Task {
  const v = mixedNumber(rng, d === 1 ? 2 : 4, 2, 9);
  const mx = v.toMixed();
  const correct = `${mx.whole} i ${mx.whole + 1}`;
  return {
    id: id('mieszane'),
    topicId: 'mieszane',
    difficulty: d,
    format: 'choice',
    prompt: `Między którymi kolejnymi liczbami całkowitymi leży liczba ${m(v)}?`,
    choices: textChoices(rng, correct, [
      { text: `${mx.whole - 1} i ${mx.whole}`, misconception: 'Wyłącz całości: podziel licznik przez mianownik.' },
      { text: `${mx.whole + 1} i ${mx.whole + 2}`, misconception: 'Wyłącz całości: podziel licznik przez mianownik.' },
      { text: `${Math.min(v.num, 50)} i ${Math.min(v.num, 50) + 1}`, misconception: 'Licznik to nie wartość ułamka – ułamek to licznik **podzielony** przez mianownik.' },
    ]),
    hints: ['Zamień ułamek na liczbę mieszaną.'],
    solution: [`${m(v)} = ${v.toMarkup(true)}`, `Ta liczba jest większa od ${mx.whole} i mniejsza od ${mx.whole + 1}.`],
    answerText: correct,
  };
}

export const mieszaneGenerators: Generator[] = [
  (d, r) => mixedToImproper(d, r),
  (d, r) => improperToMixed(d, r),
  (d, r) => (d === 1 ? mixedToImproper(d, r) : mixedOnLineChoice(d, r)),
];
