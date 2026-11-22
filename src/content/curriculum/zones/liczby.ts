/** Dział: Liczby i działania (naturalne, całkowite, dziesiętne, podzielność, jednostki). */
import type { Difficulty } from '../../types';
import { ERR, EX, L, P, R, fmt, g, int, lvl, mc, nw, numMc, nz, par, person, pick, pl, q, r6, shuffle, tf } from '../kit';
import type { Skill, Zone } from '../model';

const S = (id: string, title: string, theory: Skill['theory'], gen: Skill['gen']): Skill => ({ id: `l-${id}`, title, theory, gen });
const sid = (id: string) => `l-${id}`;

function gcd(a: number, b: number): number {
  return b ? gcd(b, a % b) : Math.abs(a);
}
const lcm = (a: number, b: number) => (a / gcd(a, b)) * b;

function primeFactors(n: number): number[] {
  const out: number[] = [];
  let x = n;
  for (let p = 2; p * p <= x; p++) while (x % p === 0) (out.push(p), (x /= p));
  if (x > 1) out.push(x);
  return out;
}
const isPrime = (n: number) => n > 1 && primeFactors(n).length === 1;

const ROMAN: [number, string][] = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];
function roman(n: number) {
  let s = '';
  let x = n;
  for (const [v, r] of ROMAN) while (x >= v) (s += r, (x -= v));
  return s;
}

const DAYS = ['poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota', 'niedziela'];
const hhmm = (min: number) => `${Math.floor(min / 60) % 24}:${String(min % 60).padStart(2, '0')}`;

/** Działanie pisemne na liczbach całkowitych: a op b. */
function arith(skill: string, d: Difficulty, a: number, op: '+' | '−' | '·' | ':', b: number, ans: number, hints: string[], sol: string[], wrong: [number, string][] = []) {
  return q(skill, d, { prompt: `Oblicz: ${par(a)} ${op} ${par(b)}`, ans, hints, sol, wrong });
}

export const LICZBY: Zone = {
  id: 'liczby',
  title: 'Liczby i działania',
  short: 'Liczby naturalne, całkowite i dziesiętne, podzielność, zaokrąglenia, jednostki i czas.',
  mark: '123',
  skills: [
    S(
      'pamiec',
      'Dodawanie i odejmowanie w pamięci',
      [
        P('Duże liczby łatwiej dodawać i odejmować **po kawałku**: najpierw setki, potem dziesiątki, na końcu jedności.'),
        R('Zamiast 487 + 196 policz 487 + 200 − 4 = 683. Dodajemy „okrągłą” liczbę i poprawiamy wynik.', 'Sprytny sposób'),
        EX('Oblicz 1250 − 380.', ['1250 − 300 = 950', '950 − 80 = 870'], '870'),
      ],
      (d, r) => {
        const a = lvl(d, int(r, 30, 99), int(r, 120, 999), int(r, 1200, 9999));
        const b = lvl(d, int(r, 11, 60), int(r, 50, 400), int(r, 300, 3000));
        const add = r() < 0.5;
        const ans = add ? a + b : a - b;
        return arith(
          sid('pamiec'),
          d,
          a,
          add ? '+' : '−',
          b,
          ans,
          [add ? 'Dodaj najpierw setki i dziesiątki drugiej liczby, potem jedności.' : 'Odejmij najpierw pełne setki i dziesiątki, potem jedności.'],
          [`${fmt(a)} ${add ? '+' : '−'} ${fmt(b)} = ${fmt(ans)}`],
          [[add ? a - b : a + b, add ? 'To wynik odejmowania, a trzeba było dodać.' : 'To wynik dodawania, a trzeba było odjąć.']],
        );
      },
    ),
    S(
      'pisemne',
      'Mnożenie i dzielenie liczb naturalnych',
      [
        P('Mnożąc przez liczbę dwucyfrową, rozbij ją: 34 · 26 = 34 · 20 + 34 · 6.'),
        R('Dzielenie sprawdzamy mnożeniem: jeśli 432 : 12 = 36, to 36 · 12 = 432.', 'Sprawdzenie'),
        EX('Oblicz 34 · 26.', ['34 · 20 = 680', '34 · 6 = 204', '680 + 204 = 884'], '884'),
      ],
      (d, r) => {
        const x = lvl(d, int(r, 3, 9), int(r, 12, 39), int(r, 21, 99));
        const y = lvl(d, int(r, 12, 40), int(r, 11, 29), int(r, 21, 79));
        if (r() < 0.5) return arith(sid('pisemne'), d, x, '·', y, x * y, [`Rozbij ${y} na dziesiątki i jedności.`], [`${x} · ${y} = ${fmt(x * y)}`]);
        return arith(sid('pisemne'), d, x * y, ':', x, y, [`Szukasz liczby, która pomnożona przez ${x} da ${fmt(x * y)}.`], [`${fmt(x * y)} : ${x} = ${y}, bo ${y} · ${x} = ${fmt(x * y)}.`]);
      },
    ),
    S(
      'kolejnosc',
      'Kolejność wykonywania działań',
      [
        L('Najpierw działania w nawiasach.', 'Potem potęgowanie.', 'Potem mnożenie i dzielenie – od lewej do prawej.', 'Na końcu dodawanie i odejmowanie – od lewej do prawej.'),
        ERR('2 + 3 · 4 = 20', '2 + 3 · 4 = 2 + 12 = 14', 'Mnożenie wykonujemy przed dodawaniem.'),
        EX('Oblicz 18 − 12 : 3 · 2.', ['12 : 3 = 4', '4 · 2 = 8', '18 − 8 = 10'], '10'),
      ],
      (d, r) => {
        const a = int(r, 2, 9), b = int(r, 2, 9), c = int(r, 2, 9), e = int(r, 10, 40);
        const variants = lvl(d, [0, 1], [1, 2, 3], [2, 3, 4]);
        const v = pick(r, variants);
        const items: [string, number, string[], [number, string][]][] = [
          [`${e} + ${a} · ${b}`, e + a * b, [`${a} · ${b} = ${a * b}`, `${e} + ${a * b} = ${e + a * b}`], [[(e + a) * b, 'Najpierw mnożenie, potem dodawanie.']]],
          [`${e + a * b} − ${a} · ${b}`, e, [`${a} · ${b} = ${a * b}`, `${e + a * b} − ${a * b} = ${e}`], [[(e + a * b - a) * b, 'Najpierw mnożenie, potem odejmowanie.']]],
          [`(${e} − ${a}) · ${b}`, (e - a) * b, [`${e} − ${a} = ${e - a}`, `${e - a} · ${b} = ${(e - a) * b}`], [[e - a * b, 'Działanie w nawiasie wykonujemy najpierw.']]],
          [`${a * b * c} : ${a} : ${b}`, c, [`${a * b * c} : ${a} = ${b * c}`, `${b * c} : ${b} = ${c}`], []],
          [`${e} − ${a * c} : ${a} · ${b}`, e - c * b, [`${a * c} : ${a} = ${c}`, `${c} · ${b} = ${c * b}`, `${e} − ${c * b} = ${e - c * b}`], [[e - c / b, 'Mnożenie i dzielenie wykonujemy od lewej do prawej.']]],
        ];
        const [expr, ans, sol, wrong] = items[v];
        return q(sid('kolejnosc'), d, { prompt: `Oblicz: ${expr}`, ans, hints: ['Najpierw nawiasy, potem mnożenie i dzielenie (od lewej), na końcu dodawanie i odejmowanie.'], sol, wrong });
      },
    ),
    S(
      'ujemne-os',
      'Liczby ujemne i porównywanie',
      [
        P('Na osi liczbowej liczby ujemne leżą na lewo od zera. Im bardziej na lewo, tym liczba **mniejsza**.'),
        R('−8 < −3, bo −8 leży dalej na lewo od zera niż −3.', 'Zapamiętaj'),
        ERR('−8 > −3', '−8 < −3', 'Wśród liczb ujemnych mniejsza jest ta, która jest dalej od zera.'),
      ],
      (d, r) => {
        const a = nz(r, -20, lvl(d, 10, 5, 0) || -1);
        let b = nz(r, -20, 15);
        while (b === a) b = nz(r, -20, 15);
        if (d === 1 || r() < 0.4) {
          const right = a < b ? '<' : '>';
          return mc(sid('ujemne-os'), d, r, {
            prompt: `Jaki znak należy wstawić w miejsce □? ${fmt(a)} □ ${fmt(b)}`,
            right,
            wrong: [[right === '<' ? '>' : '<', 'Porównaj położenie liczb na osi: mniejsza leży bardziej na lewo.'], '='],
            hints: ['Wyobraź sobie oś liczbową. Która liczba leży bardziej na lewo?'],
            sol: [`${fmt(a)} ${right} ${fmt(b)}, bo ${fmt(Math.min(a, b))} leży na osi na lewo od ${fmt(Math.max(a, b))}.`],
          });
        }
        const list = shuffle(r, [a, b, nz(r, -30, 30), nz(r, -9, 9)]).filter((x, i, arr) => arr.indexOf(x) === i);
        const min = Math.min(...list);
        return mc(sid('ujemne-os'), d, r, {
          prompt: `Która z liczb jest najmniejsza: ${list.map((x) => fmt(x)).join('; ')}?`,
          right: fmt(min),
          wrong: list.filter((x) => x !== min).map((x) => fmt(x)),
          hints: ['Najmniejsza liczba leży na osi najbardziej na lewo.'],
          sol: [`Najbardziej na lewo leży ${fmt(min)}.`],
        });
      },
    ),
    S(
      'calkowite-dod',
      'Dodawanie i odejmowanie liczb całkowitych',
      [
        R('Odjąć liczbę to dodać liczbę przeciwną: 5 − (−3) = 5 + 3 = 8.', 'Odejmowanie'),
        L('Liczby o tych samych znakach: dodaj wartości, zostaw znak: −4 + (−6) = −10.', 'Liczby o różnych znakach: odejmij mniejszą wartość od większej i weź znak liczby „silniejszej”: −9 + 4 = −5.'),
        EX('Oblicz −7 − (−12).', ['−7 − (−12) = −7 + 12', '−7 + 12 = 5'], '5'),
      ],
      (d, r) => {
        const a = nz(r, lvl(d, -15, -40, -120), lvl(d, 15, 40, 120));
        const b = nz(r, lvl(d, -15, -40, -120), lvl(d, 15, 40, 120));
        const add = r() < 0.5;
        const ans = add ? a + b : a - b;
        return arith(
          sid('calkowite-dod'),
          d,
          a,
          add ? '+' : '−',
          b,
          ans,
          add ? ['Ustal, czy liczby mają ten sam znak. Jeśli różne – odejmij wartości.'] : ['Zamień odejmowanie na dodawanie liczby przeciwnej.'],
          add ? [`${fmt(a)} + ${par(b)} = ${fmt(ans)}`] : [`${fmt(a)} − ${par(b)} = ${fmt(a)} + ${par(-b)} = ${fmt(ans)}`],
          [[add ? a - b : a + b, add ? 'Dodajesz, a nie odejmujesz – sprawdź znaki.' : 'Odjęcie liczby ujemnej to dodanie liczby dodatniej.'], [-ans, 'Sprawdź znak wyniku.']],
        );
      },
    ),
    S(
      'calkowite-mn',
      'Mnożenie i dzielenie liczb całkowitych',
      [
        R('Ten sam znak → wynik **dodatni**. Różne znaki → wynik **ujemny**.', 'Znak wyniku'),
        L('(−4) · (−5) = 20', '(−36) : 4 = −9', 'Parzysta liczba minusów w iloczynie daje plus, nieparzysta – minus.'),
      ],
      (d, r) => {
        const a = nz(r, -12, 12), b = nz(r, -12, 12);
        if (d === 3) {
          const c = nz(r, -5, 5);
          const ans = a * b * c;
          return q(sid('calkowite-mn'), d, { prompt: `Oblicz: ${par(a)} · ${par(b)} · ${par(c)}`, ans, hints: ['Policz, ile jest czynników ujemnych: parzysta liczba → wynik dodatni.'], sol: [`${par(a)} · ${par(b)} = ${fmt(a * b)}`, `${par(a * b)} · ${par(c)} = ${fmt(ans)}`], wrong: [[-ans, 'Sprawdź znak: policz czynniki ujemne.']] });
        }
        if (r() < 0.5) return arith(sid('calkowite-mn'), d, a, '·', b, a * b, ['Najpierw ustal znak wyniku, potem pomnóż wartości.'], [`${par(a)} · ${par(b)} = ${fmt(a * b)}`], [[-a * b, 'Sprawdź znak wyniku.']]);
        return arith(sid('calkowite-mn'), d, a * b, ':', a, b, ['Najpierw ustal znak wyniku, potem podziel wartości.'], [`${fmt(a * b)} : ${par(a)} = ${fmt(b)}`], [[-b, 'Sprawdź znak wyniku.']]);
      },
    ),
    S(
      'bezwzgledna',
      'Wartość bezwzględna',
      [P('Wartość bezwzględna liczby to jej **odległość od zera** na osi liczbowej. Zawsze jest nieujemna.'), L('|7| = 7', '|−7| = 7', '|0| = 0')],
      (d, r) => {
        const a = nz(r, -30, 30);
        if (d === 1) return q(sid('bezwzgledna'), d, { prompt: `Oblicz |${fmt(a)}|.`, ans: Math.abs(a), hints: ['Jak daleko od zera leży ta liczba?'], sol: [`|${fmt(a)}| = ${Math.abs(a)}`], wrong: [[-Math.abs(a), 'Wartość bezwzględna nie jest ujemna.']] });
        const b = nz(r, -20, 20);
        const ans = Math.abs(a) - Math.abs(b);
        return q(sid('bezwzgledna'), d, { prompt: `Oblicz: |${fmt(a)}| − |${fmt(b)}|`, ans, hints: ['Najpierw oblicz każdą wartość bezwzględną osobno.'], sol: [`|${fmt(a)}| = ${Math.abs(a)}, |${fmt(b)}| = ${Math.abs(b)}`, `${Math.abs(a)} − ${Math.abs(b)} = ${fmt(ans)}`], wrong: [[a - b, 'Najpierw zamień liczby na ich wartości bezwzględne.']] });
      },
    ),
    S(
      'podzielnosc',
      'Cechy podzielności',
      [
        L(
          'przez **2** – ostatnia cyfra parzysta,',
          'przez **3** – suma cyfr dzieli się przez 3,',
          'przez **4** – liczba z dwóch ostatnich cyfr dzieli się przez 4,',
          'przez **5** – ostatnia cyfra 0 lub 5,',
          'przez **9** – suma cyfr dzieli się przez 9,',
          'przez **10** – ostatnia cyfra 0.',
        ),
        EX('Czy 4512 dzieli się przez 3?', ['Suma cyfr: 4 + 5 + 1 + 2 = 12.', '12 dzieli się przez 3.'], 'Tak'),
      ],
      (d, r) => {
        const k = pick(r, lvl(d, [2, 5, 10], [3, 4, 9], [3, 4, 9, 6]));
        const make = (div: boolean) => {
          let n = int(r, 100, lvl(d, 999, 9999, 99999));
          let guard = 0;
          while ((n % k === 0) !== div && guard++ < 200) n++;
          return n;
        };
        const yes = make(true);
        const nos = [make(false), make(false), make(false)].filter((n, i, a) => a.indexOf(n) === i);
        const why = (n: number) =>
          k === 3 || k === 9 ? `suma cyfr ${String(n).split('').join(' + ')} = ${String(n).split('').reduce((s, c) => s + Number(c), 0)}` : k === 4 ? `liczba z dwóch ostatnich cyfr to ${n % 100}` : k === 6 ? 'dzieli się przez 2 i przez 3' : `ostatnia cyfra to ${n % 10}`;
        return mc(sid('podzielnosc'), d, r, {
          prompt: `Która z liczb jest podzielna przez ${k}?`,
          right: fmt(yes),
          wrong: nos.map((n) => [fmt(n), `${fmt(n)} nie dzieli się przez ${k}: ${why(n)}.`] as [string, string]),
          hints: [k === 6 ? 'Liczba dzieli się przez 6, gdy dzieli się przez 2 i przez 3.' : `Przypomnij sobie cechę podzielności przez ${k}.`],
          sol: [`${fmt(yes)} dzieli się przez ${k}: ${why(yes)}.`],
        });
      },
    ),
    S(
      'pierwsze',
      'Liczby pierwsze i złożone',
      [
        P('Liczba **pierwsza** ma dokładnie dwa dzielniki: 1 i samą siebie (2, 3, 5, 7, 11, 13, …). Liczba **złożona** ma więcej dzielników.'),
        R('1 nie jest ani pierwsza, ani złożona. 2 to jedyna parzysta liczba pierwsza.', 'Uwaga'),
      ],
      (d, r) => {
        const range = lvl(d, [2, 30], [20, 70], [50, 120]);
        const primes: number[] = [];
        const comps: number[] = [];
        for (let n = range[0]; n <= range[1]; n++) (isPrime(n) ? primes : comps).push(n);
        const askPrime = r() < 0.6;
        const right = pick(r, askPrime ? primes : comps);
        const wrongPool = shuffle(r, askPrime ? comps.filter((n) => n % 2 === 1 || d === 1) : primes).slice(0, 3);
        const fac = (n: number) => primeFactors(n).join(' · ');
        return mc(sid('pierwsze'), d, r, {
          prompt: `Która z liczb jest liczbą ${askPrime ? 'pierwszą' : 'złożoną'}?`,
          right: String(right),
          wrong: wrongPool.map((n) => [String(n), isPrime(n) ? `${n} jest liczbą pierwszą.` : `${n} = ${fac(n)}, więc jest złożona.`] as [string, string]),
          hints: ['Sprawdź, czy liczba dzieli się przez 2, 3, 5 lub 7.'],
          sol: [isPrime(right) ? `${right} dzieli się tylko przez 1 i przez ${right}.` : `${right} = ${fac(right)}, więc ma więcej niż dwa dzielniki.`],
        });
      },
    ),
    S(
      'rozklad',
      'Rozkład na czynniki pierwsze',
      [P('Dzielimy liczbę przez najmniejsze możliwe liczby pierwsze, aż zostanie 1.'), EX('Rozłóż 84.', ['84 : 2 = 42', '42 : 2 = 21', '21 : 3 = 7', '7 : 7 = 1'], '84 = 2 · 2 · 3 · 7')],
      (d, r) => {
        const pool = lvl(d, [2, 3, 5], [2, 3, 5, 7], [2, 3, 5, 7, 11, 13]);
        const k = lvl(d, 3, 4, 4);
        const fs = Array.from({ length: k }, () => pick(r, pool)).sort((x, y) => x - y);
        const n = fs.reduce((a, b) => a * b, 1);
        const right = fs.join(' · ');
        const alt = [...fs];
        alt[alt.length - 1] = alt[alt.length - 1] * 2;
        return mc(sid('rozklad'), d, r, {
          prompt: `Który zapis jest rozkładem liczby ${n} na czynniki pierwsze?`,
          right,
          wrong: [
            [alt.slice(1).join(' · '), 'Iloczyn tych liczb nie jest równy ' + n + '.'],
            [[fs[0] * fs[1], ...fs.slice(2)].join(' · '), `${fs[0] * fs[1]} nie jest liczbą pierwszą.`],
            [[1, ...fs.slice(1)].join(' · '), '1 nie jest liczbą pierwszą, a iloczyn się nie zgadza.'],
          ],
          hints: [`Zacznij od dzielenia ${n} przez ${fs[0]}.`],
          sol: [`${n} = ${right}`, 'Wszystkie czynniki są liczbami pierwszymi, a ich iloczyn wynosi ' + n + '.'],
        });
      },
    ),
    S(
      'nwd',
      'Największy wspólny dzielnik (NWD)',
      [P('NWD to największa liczba, przez którą dzielą się obie liczby.'), EX('NWD(24, 36)', ['Dzielniki 24: 1, 2, 3, 4, 6, 8, 12, 24.', 'Dzielniki 36: 1, 2, 3, 4, 6, 9, 12, 18, 36.', 'Największy wspólny: 12.'], 'NWD(24, 36) = 12')],
      (d, r) => {
        const k = int(r, 2, lvl(d, 6, 12, 18));
        let a = int(r, 2, 9), b = int(r, 2, 9);
        while (gcd(a, b) !== 1 || a === b) (a = int(r, 2, 9), (b = int(r, 2, 9)));
        const x = a * k, y = b * k;
        if (d === 3 && r() < 0.5) {
          return q(sid('nwd'), d, {
            prompt: `Z ${x} róż i ${y} tulipanów florystka chce zrobić jak najwięcej jednakowych bukietów, wykorzystując wszystkie kwiaty. Ile bukietów zrobi?`,
            ans: k,
            hints: ['Liczba bukietów musi dzielić obie liczby kwiatów – szukasz NWD.'],
            sol: [`NWD(${x}, ${y}) = ${k}`, `Zrobi ${k} bukietów: każdy ma ${a} róż i ${b} tulipanów.`],
            wrong: [[lcm(x, y), 'To NWW. Liczba bukietów musi być dzielnikiem obu liczb.']],
          });
        }
        return q(sid('nwd'), d, { prompt: `Oblicz NWD(${x}, ${y}).`, ans: k, hints: ['Wypisz dzielniki obu liczb albo rozłóż je na czynniki pierwsze.'], sol: [`${x} = ${k} · ${a}, ${y} = ${k} · ${b}`, `NWD(${x}, ${y}) = ${k}`], wrong: [[lcm(x, y), 'To NWW, a nie NWD.']] });
      },
    ),
    S(
      'nww',
      'Najmniejsza wspólna wielokrotność (NWW)',
      [P('NWW to najmniejsza liczba (większa od 0), która dzieli się przez obie liczby.'), EX('NWW(6, 8)', ['Wielokrotności 8: 8, 16, 24, …', '24 dzieli się przez 6.'], 'NWW(6, 8) = 24')],
      (d, r) => {
        const a = int(r, 2, lvl(d, 9, 15, 25)), b = int(r, 2, lvl(d, 9, 15, 25));
        const ans = lcm(a, b);
        if (d >= 2 && r() < 0.5)
          return q(sid('nww'), d, {
            prompt: `Autobus linii A odjeżdża z pętli co ${a} min, a linii B co ${b} min. O 8:00 odjechały razem. Po ilu minutach znów odjadą razem?`,
            ans,
            unit: 'min',
            hints: ['Szukasz najmniejszej liczby, która dzieli się przez obie liczby minut.'],
            sol: [`NWW(${a}, ${b}) = ${ans}`, `Znów odjadą razem po ${ans} min.`],
            wrong: [[a * b, 'To wspólna wielokrotność, ale nie najmniejsza.']],
          });
        return q(sid('nww'), d, { prompt: `Oblicz NWW(${a}, ${b}).`, ans, hints: [`Wypisuj kolejne wielokrotności ${Math.max(a, b)} i sprawdzaj, czy dzielą się przez ${Math.min(a, b)}.`], sol: [`NWW(${a}, ${b}) = ${ans}`], wrong: [[gcd(a, b), 'To NWD, a nie NWW.']] });
      },
    ),
    S(
      'zaokr-nat',
      'Zaokrąglanie liczb naturalnych',
      [R('Patrzymy na pierwszą odrzucaną cyfrę: 0–4 → w dół, 5–9 → w górę.', 'Reguła'), L('4 738 ≈ 4 740 (do dziesiątek)', '4 738 ≈ 4 700 (do setek)', '4 738 ≈ 5 000 (do tysięcy)')],
      (d, r) => {
        const n = int(r, lvl(d, 100, 1000, 10000), lvl(d, 999, 99999, 999999));
        const [place, name] = pick(r, lvl(d, [[10, 'dziesiątek'], [100, 'setek']], [[100, 'setek'], [1000, 'tysięcy']], [[1000, 'tysięcy'], [10000, 'dziesiątek tysięcy']]) as [number, string][]);
        const ans = Math.round(n / place) * place;
        const down = Math.floor(n / place) * place;
        return q(sid('zaokr-nat'), d, {
          prompt: `Zaokrąglij liczbę ${fmt(n)} do ${name}.`,
          ans,
          hints: [`Spójrz na cyfrę zaraz za rzędem ${name}.`],
          sol: [`Pierwsza odrzucana cyfra to ${Math.floor((n % place) / (place / 10))}, więc zaokrąglamy w ${ans > n ? 'górę' : 'dół'}.`, `${fmt(n)} ≈ ${fmt(ans)}`],
          wrong: [[ans === down ? down + place : down, 'Sprawdź pierwszą odrzucaną cyfrę: 5–9 to zaokrąglenie w górę.']],
        });
      },
    ),
    S(
      'zaokr-dz',
      'Zaokrąglanie ułamków dziesiętnych',
      [R('Do części dziesiątych zostawiamy 1 cyfrę po przecinku, do setnych – 2 cyfry. Pierwsza odrzucana cyfra 5–9 → w górę.', 'Reguła'), L('3,846 ≈ 3,8 (do części dziesiątych)', '3,846 ≈ 3,85 (do części setnych)', '3,846 ≈ 4 (do jedności)')],
      (d, r) => {
        const n = r6(int(r, 1000, 99999) / 1000);
        const [dig, name] = pick(r, lvl(d, [[0, 'jedności'], [1, 'części dziesiątych']], [[1, 'części dziesiątych'], [2, 'części setnych']], [[2, 'części setnych'], [1, 'części dziesiątych']]) as [number, string][]);
        const f = 10 ** dig;
        const ans = r6(Math.round(r6(n * f)) / f);
        return q(sid('zaokr-dz'), d, {
          prompt: `Zaokrąglij liczbę ${fmt(n)} do ${name}.`,
          ans,
          form: 'decimal',
          placeholder: 'np. 3,8',
          hints: [`Zostaw ${dig} ${pl(dig, 'cyfrę', 'cyfry', 'cyfr')} po przecinku i spójrz na następną.`],
          sol: [`${fmt(n)} ≈ ${fmt(ans)}`],
          wrong: [[r6(Math.trunc(r6(n * f)) / f), 'Pierwsza odrzucana cyfra to 5 lub więcej – trzeba zaokrąglić w górę.']],
        });
      },
    ),
    S(
      'dziesietne-dod',
      'Dodawanie i odejmowanie ułamków dziesiętnych',
      [R('Podpisujemy liczby **przecinek pod przecinkiem** i działamy jak na liczbach naturalnych. Brakujące miejsca uzupełniamy zerami.', 'Reguła'), ERR('3,5 + 1,25 = 1,60', '3,50 + 1,25 = 4,75', 'Cyfry tego samego rzędu muszą stać pod sobą.')],
      (d, r) => {
        const a = r6(int(r, 10, lvl(d, 99, 999, 9999)) / lvl(d, 10, 100, 100));
        const b = r6(int(r, 1, lvl(d, 99, 999, 9999)) / lvl(d, 10, 10, 1000));
        const add = r() < 0.5 || b > a;
        const ans = r6(add ? a + b : a - b);
        return q(sid('dziesietne-dod'), d, { prompt: `Oblicz: ${fmt(a)} ${add ? '+' : '−'} ${fmt(b)}`, ans, hints: ['Zapisz liczby przecinek pod przecinkiem, uzupełnij zera.'], sol: [`${fmt(a)} ${add ? '+' : '−'} ${fmt(b)} = ${fmt(ans)}`] });
      },
    ),
    S(
      'dziesietne-mn',
      'Mnożenie ułamków dziesiętnych',
      [R('Mnożymy jak liczby naturalne, a w wyniku oddzielamy przecinkiem tyle cyfr, ile jest **razem** po przecinku w obu czynnikach.', 'Reguła'), EX('Oblicz 0,3 · 0,4.', ['3 · 4 = 12', 'Razem 2 cyfry po przecinku.'], '0,12')],
      (d, r) => {
        const a = r6(int(r, 2, lvl(d, 9, 25, 99)) / 10);
        const b = d === 1 ? int(r, 2, 9) : r6(int(r, 2, lvl(d, 9, 9, 99)) / 10);
        const ans = r6(a * b);
        return q(sid('dziesietne-mn'), d, { prompt: `Oblicz: ${fmt(a)} · ${fmt(b)}`, ans, hints: ['Pomnóż bez przecinków, potem policz cyfry po przecinku w obu czynnikach.'], sol: [`${fmt(a)} · ${fmt(b)} = ${fmt(ans)}`], wrong: [[r6(ans * 10), 'Za mało cyfr po przecinku w wyniku.'], [r6(ans / 10), 'Za dużo cyfr po przecinku w wyniku.']] });
      },
    ),
    S(
      'dziesietne-dz',
      'Dzielenie ułamków dziesiętnych',
      [R('Przesuwamy przecinek w dzielnej i dzielniku o tyle samo miejsc w prawo, aż dzielnik będzie liczbą naturalną.', 'Reguła'), EX('Oblicz 4,2 : 0,06.', ['Przesuwamy przecinek o 2 miejsca: 420 : 6.', '420 : 6 = 70'], '70')],
      (d, r) => {
        const b = d === 1 ? int(r, 2, 9) : r6(int(r, 2, 9) / lvl(d, 10, 10, 100));
        const ans = d === 1 ? r6(int(r, 2, 40) / 10) : int(r, 2, 60);
        const a = r6(ans * b);
        return q(sid('dziesietne-dz'), d, { prompt: `Oblicz: ${fmt(a)} : ${fmt(b)}`, ans, hints: [d === 1 ? 'Dziel jak liczby naturalne, przecinek w wyniku pod przecinkiem dzielnej.' : 'Przesuń przecinek w obu liczbach tak, by dzielnik był liczbą naturalną.'], sol: [`${fmt(a)} : ${fmt(b)} = ${fmt(ans)}`, `Sprawdzenie: ${fmt(ans)} · ${fmt(b)} = ${fmt(a)}`], wrong: [[r6(ans / 10), 'Przesuń przecinek o tyle samo miejsc w obu liczbach.'], [r6(ans * 10), 'Przesuń przecinek o tyle samo miejsc w obu liczbach.']] });
      },
    ),
    S(
      'potegi10',
      'Mnożenie i dzielenie przez 10, 100, 1000',
      [L('· 10, · 100, · 1000 → przecinek w **prawo** o 1, 2, 3 miejsca.', ': 10, : 100, : 1000 → przecinek w **lewo** o 1, 2, 3 miejsca.'), L('3,7 · 100 = 370', '45 : 1000 = 0,045')],
      (d, r) => {
        const a = r6(int(r, 1, 9999) / pick(r, [1, 10, 100]));
        const k = pick(r, [10, 100, 1000]);
        const mul = r() < 0.5;
        const ans = r6(mul ? a * k : a / k);
        return q(sid('potegi10'), d, { prompt: `Oblicz: ${fmt(a)} ${mul ? '·' : ':'} ${fmt(k)}`, ans, hints: [`Przesuń przecinek o ${String(k).length - 1} ${pl(String(k).length - 1, 'miejsce', 'miejsca', 'miejsc')} w ${mul ? 'prawo' : 'lewo'}.`], sol: [`${fmt(a)} ${mul ? '·' : ':'} ${fmt(k)} = ${fmt(ans)}`], wrong: [[r6(mul ? a / k : a * k), mul ? 'Przy mnożeniu przecinek idzie w prawo.' : 'Przy dzieleniu przecinek idzie w lewo.']] });
      },
    ),
    S(
      'szacowanie',
      'Szacowanie wyników',
      [P('Szacując, zaokrąglamy liczby tak, by łatwo je było policzyć w pamięci. Wynik jest przybliżony, ale pozwala sprawdzić, czy obliczenia mają sens.'), EX('Oszacuj 49 · 21.', ['49 ≈ 50, 21 ≈ 20', '50 · 20 = 1000'], 'około 1000')],
      (d, r) => {
        const a = int(r, 19, 99) + r6(int(r, 1, 9) / 10) * (d === 3 ? 1 : 0);
        const b = int(r, 11, 59);
        const exact = r6(a * b);
        const ra = Math.round(a / 10) * 10, rb = Math.round(b / 10) * 10;
        const est = ra * rb;
        return numMc(sid('szacowanie'), d, r, {
          prompt: `Który wynik jest najbliższy wartości ${fmt(a)} · ${b}? Nie licz dokładnie – oszacuj.`,
          ans: est,
          wrong: [[est * 10, 'Sprawdź rząd wielkości – za dużo zer.'], [r6(est / 10), 'Sprawdź rząd wielkości – za mało zer.']],
          hints: ['Zaokrąglij oba czynniki do dziesiątek.'],
          sol: [`${fmt(a)} ≈ ${ra}, ${b} ≈ ${rb}`, `${ra} · ${rb} = ${fmt(est)} (dokładnie: ${fmt(exact)})`],
        });
      },
    ),
    S(
      'rzymskie',
      'Liczby rzymskie',
      [
        P('I = 1, V = 5, X = 10, L = 50, C = 100, D = 500, M = 1000.'),
        L('Znaki dodajemy: XV = 15, CC = 200.', 'Mniejszy znak przed większym odejmujemy: IV = 4, IX = 9, XL = 40, XC = 90, CD = 400, CM = 900.', 'Ten sam znak piszemy najwyżej 3 razy z rzędu.'),
      ],
      (d, r) => {
        const n = int(r, lvl(d, 1, 40, 400), lvl(d, 40, 400, 3999));
        if (r() < 0.5)
          return q(sid('rzymskie'), d, { prompt: `Zapisz cyframi arabskimi liczbę **${roman(n)}**.`, ans: n, hints: ['Czytaj od lewej. Jeśli mniejszy znak stoi przed większym – odejmij go.'], sol: [`${roman(n)} = ${n}`] });
        return mc(sid('rzymskie'), d, r, {
          prompt: `Jak zapisać liczbę ${n} w systemie rzymskim?`,
          right: roman(n),
          wrong: [roman(n + pick(r, [1, 10])), roman(Math.max(1, n - pick(r, [1, 10]))), roman(n).replace('IV', 'IIII').replace('IX', 'VIIII').replace('XL', 'XXXX').replace('XC', 'LXXXX')],
          hints: ['Rozbij liczbę na tysiące, setki, dziesiątki i jedności.'],
          sol: [`${n} = ${roman(n)}`],
        });
      },
    ),
    S(
      'czas',
      'Obliczenia zegarowe',
      [P('Godzina ma 60 minut, doba ma 24 godziny. Licząc czas, dochodzimy najpierw do pełnej godziny.'), EX('Film zaczął się o 18:45 i trwał 1 h 50 min. O której się skończył?', ['18:45 + 15 min = 19:00', 'Zostało 1 h 35 min.', '19:00 + 1 h 35 min = 20:35'], '20:35')],
      (d, r) => {
        const start = int(r, 6 * 60, 20 * 60) - (r() < 0.6 ? 0 : 0);
        const s = start - (start % 5);
        const dur = lvl(d, int(r, 2, 9) * 5, int(r, 7, 30) * 5, int(r, 20, 60) * 5);
        if (r() < 0.5) {
          const end = s + dur;
          return mc(sid('czas'), d, r, {
            prompt: `Lekcja zaczęła się o ${hhmm(s)} i trwała ${Math.floor(dur / 60) ? `${Math.floor(dur / 60)} h ` : ''}${dur % 60} min. O której się skończyła?`,
            right: hhmm(end),
            wrong: [hhmm(end + 40), hhmm(end - 60), hhmm(s + Math.floor(dur / 60) * 100 + (dur % 60))].map((x) => [x, 'Pamiętaj: godzina ma 60 minut, nie 100.'] as [string, string]),
            hints: ['Dolicz najpierw minuty do pełnej godziny.'],
            sol: [`${hhmm(s)} + ${dur} min = ${hhmm(end)}`],
          });
        }
        const end = s + dur;
        return q(sid('czas'), d, { prompt: `Pociąg odjechał o ${hhmm(s)}, a przyjechał o ${hhmm(end)}. Ile minut trwała podróż?`, ans: dur, unit: 'min', hints: ['Policz minuty do pełnej godziny, potem pełne godziny, potem resztę.'], sol: [`Od ${hhmm(s)} do ${hhmm(end)} mija ${dur} min.`] });
      },
    ),
    S(
      'kalendarz',
      'Kalendarz',
      [L('Tydzień ma 7 dni. Po 7, 14, 21… dniach wypada ten sam dzień tygodnia.', 'Miesiące mają 31 dni (styczeń, marzec, maj, lipiec, sierpień, październik, grudzień), 30 dni (kwiecień, czerwiec, wrzesień, listopad) albo 28/29 (luty).'), EX('Dziś jest wtorek. Jaki dzień będzie za 10 dni?', ['10 = 7 + 3', 'Za 7 dni znów wtorek, potem 3 dni dalej.'], 'piątek')],
      (d, r) => {
        const today = int(r, 0, 6);
        const n = lvl(d, int(r, 2, 13), int(r, 15, 60), int(r, 60, 200));
        const ans = DAYS[(today + n) % 7];
        return mc(sid('kalendarz'), d, r, {
          prompt: `Dziś jest ${DAYS[today]}. Jaki dzień tygodnia będzie za ${n} dni?`,
          right: ans,
          wrong: [DAYS[(today + n + 1) % 7], DAYS[(today + n + 6) % 7], DAYS[(today + (n % 10)) % 7]].map((x) => [x, `Podziel ${n} przez 7 i spójrz na resztę.`] as [string, string]),
          hints: [`Co 7 dni wraca ${DAYS[today]}. Ile zostaje po odjęciu pełnych tygodni?`],
          sol: [`${n} = 7 · ${Math.floor(n / 7)} + ${n % 7}`, `Po pełnych tygodniach znów jest ${DAYS[today]}, a ${n % 7} ${pl(n % 7, 'dzień', 'dni', 'dni')} później: ${ans}.`],
        });
      },
    ),
    S(
      'jednostki',
      'Jednostki długości i masy',
      [L('1 km = 1000 m, 1 m = 100 cm, 1 cm = 10 mm', '1 t = 1000 kg, 1 kg = 1000 g, 1 kg = 100 dag'), R('Zamieniając na **mniejszą** jednostkę – mnożymy, na **większą** – dzielimy.', 'Reguła')],
      (d, r) => {
        const conv = pick(r, [
          ['km', 'm', 1000],
          ['m', 'cm', 100],
          ['cm', 'mm', 10],
          ['kg', 'g', 1000],
          ['t', 'kg', 1000],
          ['kg', 'dag', 100],
        ] as [string, string, number][]);
        const big = r6(int(r, 1, lvl(d, 9, 99, 999)) / lvl(d, 1, 10, 100));
        const toSmall = r() < 0.5;
        const [from, to] = toSmall ? [conv[0], conv[1]] : [conv[1], conv[0]];
        const val = toSmall ? big : r6(big * conv[2]);
        const ans = toSmall ? r6(big * conv[2]) : big;
        return q(sid('jednostki'), d, { prompt: `Zamień: ${fmt(val)} ${from} = ? ${to}`, ans, unit: to, hints: [`1 ${conv[0]} = ${fmt(conv[2])} ${conv[1]}.`], sol: [`${fmt(val)} ${from} = ${fmt(ans)} ${to}`], wrong: [[toSmall ? r6(val / conv[2]) : r6(val * conv[2]), toSmall ? 'Na mniejszą jednostkę – mnożymy.' : 'Na większą jednostkę – dzielimy.']] });
      },
    ),
    S(
      'odleglosc-os',
      'Odległość liczb na osi',
      [P('Odległość dwóch liczb na osi to wartość bezwzględna ich różnicy: |a − b|.'), EX('Jaka jest odległość między −4 a 7?', ['|7 − (−4)| = |11|'], '11')],
      (d, r) => {
        const a = nz(r, -20, 5);
        const b = nz(r, -5, 20);
        if (d === 3) {
          const mid = r6((a + b) / 2);
          return q(sid('odleglosc-os'), d, { prompt: `Jaka liczba leży na osi dokładnie w połowie między ${fmt(a)} a ${fmt(b)}?`, ans: mid, hints: ['Środek odcinka to średnia arytmetyczna końców.'], sol: [`(${fmt(a)} + ${par(b)}) : 2 = ${fmt(mid)}`] });
        }
        return q(sid('odleglosc-os'), d, { prompt: `Jaka jest odległość na osi liczbowej między liczbami ${fmt(a)} i ${fmt(b)}?`, ans: Math.abs(a - b), hints: ['Odejmij mniejszą liczbę od większej.'], sol: [`|${fmt(b)} − ${par(a)}| = ${Math.abs(a - b)}`], wrong: [[Math.abs(Math.abs(a) - Math.abs(b)), 'Uwaga na liczby ujemne: odległość to różnica liczb, nie ich wartości bezwzględnych.']] });
      },
    ),
    S(
      'tekstowe',
      'Zadania tekstowe z liczbami całkowitymi',
      [P('Temperatura, stan konta, wysokość nad i pod poziomem morza – to sytuacje, w których przydają się liczby ujemne.'), EX('Rano było −6°C, w południe o 9 stopni cieplej. Jaka była temperatura w południe?', ['−6 + 9 = 3'], '3°C')],
      (d, r) => {
        const p = person(r);
        const t = pick(r, [0, 1, 2]);
        if (t === 0) {
          const t1 = int(r, -15, 3), dt = int(r, 3, 14);
          const up = r() < 0.6;
          const ans = up ? t1 + dt : t1 - dt;
          return q(sid('tekstowe'), d, { prompt: `Rano termometr pokazywał ${fmt(t1)}°C. Do południa temperatura ${up ? 'wzrosła' : 'spadła'} o ${dt} stopni. Ile stopni było w południe?`, ans, unit: '°C', hints: [up ? 'Wzrost temperatury to dodawanie.' : 'Spadek temperatury to odejmowanie.'], sol: [`${fmt(t1)} ${up ? '+' : '−'} ${dt} = ${fmt(ans)}`] });
        }
        if (t === 1) {
          const day = int(r, -12, -2), night = int(r, -25, day - 1);
          return q(sid('tekstowe'), d, { prompt: `W dzień temperatura wynosiła ${fmt(day)}°C, a w nocy ${fmt(night)}°C. O ile stopni temperatura w nocy była niższa?`, ans: day - night, unit: '°C', hints: ['Oblicz różnicę: temperatura w dzień minus temperatura w nocy.'], sol: [`${fmt(day)} − ${par(night)} = ${day - night}`], wrong: [[Math.abs(day + night), 'Odejmij temperaturę nocną od dziennej, uważając na znaki.']] });
        }
        const saldo = int(r, 20, 200), spend = int(r, saldo + 10, saldo + 300);
        return q(sid('tekstowe'), d, { prompt: `${p.name} ${g(p, 'miał', 'miała')} na koncie ${saldo} zł. ${g(p, 'Zapłacił', 'Zapłaciła')} kartą ${spend} zł, korzystając z debetu. Jaki jest teraz stan konta?`, ans: saldo - spend, unit: 'zł', hints: ['Odejmij wydatek od stanu konta. Wynik może być ujemny.'], sol: [`${saldo} − ${spend} = ${fmt(saldo - spend)}`, `Stan konta: ${nw(saldo - spend, 'złoty', 'złote', 'złotych')} (debet).`] });
      },
    ),
    S(
      'wielokrotnosci',
      'Dzielniki i wielokrotności',
      [P('Dzielnik liczby to liczba, przez którą dzieli się ona bez reszty. Wielokrotność to wynik mnożenia liczby przez 1, 2, 3, …'), L('Dzielniki 12: 1, 2, 3, 4, 6, 12.', 'Wielokrotności 12: 12, 24, 36, 48, …')],
      (d, r) => {
        const n = pick(r, lvl(d, [12, 18, 20, 16], [24, 30, 36, 28], [48, 60, 72, 84, 90]));
        const divs: number[] = [];
        for (let k = 1; k <= n; k++) if (n % k === 0) divs.push(k);
        if (r() < 0.5) return q(sid('wielokrotnosci'), d, { prompt: `Ile dzielników ma liczba ${n}?`, ans: divs.length, hints: ['Wypisuj dzielniki parami: 1 i ' + n + ', 2 i ' + n / 2 + ', …'], sol: [`Dzielniki ${n}: ${divs.join(', ')}.`, `Jest ich ${divs.length}.`] });
        const k = int(r, 2, 9);
        const lo = int(r, 50, 150);
        const count = Math.floor(199 / k) - Math.floor((lo - 1) / k);
        return q(sid('wielokrotnosci'), d, { prompt: `Ile wielokrotności liczby ${k} jest w przedziale od ${lo} do 199 (z końcami)?`, ans: count, hints: [`Znajdź najmniejszą i największą wielokrotność ${k} w tym przedziale.`], sol: [`Do 199 jest ${Math.floor(199 / k)} wielokrotności ${k}, do ${lo - 1} jest ich ${Math.floor((lo - 1) / k)}.`, `${Math.floor(199 / k)} − ${Math.floor((lo - 1) / k)} = ${count}`] });
      },
    ),
    S(
      'pr-falsz',
      'Prawda czy fałsz: działania na liczbach',
      [P('W zadaniach typu „prawda/fałsz” sprawdzaj każde zdanie osobno – najlepiej licząc na kartce.')],
      (d, r) => {
        const a = nz(r, -9, 9), b = nz(r, -9, 9);
        const s1 = r() < 0.5;
        const v1 = s1 ? a * b : -a * b;
        const n = int(r, 100, 999);
        const s2 = n % 3 === 0;
        return tf(sid('pr-falsz'), d, {
          items: [
            [`${par(a)} · ${par(b)} = ${fmt(v1)}`, v1 === a * b, `${par(a)} · ${par(b)} = ${fmt(a * b)}.`],
            [`Liczba ${n} jest podzielna przez 3.`, s2, `Suma cyfr to ${String(n).split('').reduce((s, c) => s + Number(c), 0)}, ${s2 ? 'dzieli się' : 'nie dzieli się'} przez 3.`],
          ],
        });
      },
    ),
  ],
};

