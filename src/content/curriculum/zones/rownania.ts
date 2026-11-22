/** Dział: Równania, proporcje, prędkość, droga, czas. */
import { Fraction } from '../../../lib/fraction';
import { EX, L, P, R, fmt, frac, g, int, lvl, mc, nz, par, person, pick, q, r6, tf } from '../kit';
import { poly } from './wyrazenia';
import type { Skill, Zone } from '../model';

const S = (id: string, title: string, theory: Skill['theory'], gen: Skill['gen']): Skill => ({ id: `r-${id}`, title, theory, gen });
const sid = (id: string) => `r-${id}`;

const X = { prefix: 'x =', placeholder: 'np. 4' };

export const ROWNANIA: Zone = {
  id: 'rownania',
  title: 'Równania i proporcje',
  short: 'Równania pierwszego stopnia, zadania tekstowe, proporcjonalność, skala, prędkość, droga i czas.',
  mark: 'x=',
  skills: [
    S(
      'dodawanie',
      'Równania typu x + a = b',
      [P('Równanie to równość z niewiadomą. Rozwiązać je – to znaleźć liczbę, która spełnia tę równość.'), R('Do obu stron równania możemy dodać (lub od nich odjąć) tę samą liczbę.', 'Zasada'), EX('x + 7 = 3', ['Odejmujemy 7 od obu stron.', 'x = 3 − 7'], 'x = −4')],
      (d, r) => {
        const x = nz(r, lvl(d, 1, -20, -60), lvl(d, 20, 30, 60));
        const a = nz(r, lvl(d, 1, -15, -40), lvl(d, 15, 20, 40));
        const sub = r() < 0.4;
        const b = sub ? x - a : x + a;
        return q(sid('dodawanie'), d, { ...X, prompt: `Rozwiąż równanie: x ${sub ? '−' : '+'} ${Math.abs(a) === a ? a : `(${fmt(a)})`} = ${fmt(b)}`, ans: x, hints: [sub ? `Dodaj ${par(a)} do obu stron.` : `Odejmij ${par(a)} od obu stron.`], sol: [`x = ${fmt(b)} ${sub ? '+' : '−'} ${par(a)}`, `x = ${fmt(x)}`], wrong: [[sub ? b - a : b + a, 'Przenosząc liczbę na drugą stronę, wykonaj działanie przeciwne.']] });
      },
    ),
    S(
      'mnozenie',
      'Równania typu ax = b',
      [R('Obie strony równania możemy pomnożyć lub podzielić przez tę samą liczbę różną od zera.', 'Zasada'), EX('−4x = 28', ['Dzielimy obie strony przez −4.'], 'x = −7'), EX('{x/3} = 5', ['Mnożymy obie strony przez 3.'], 'x = 15')],
      (d, r) => {
        const x = nz(r, lvl(d, 1, -12, -15), 12);
        const a = nz(r, lvl(d, 2, -9, -9), 9);
        if (d === 3 && r() < 0.5) {
          const k = int(r, 2, 6);
          return q(sid('mnozenie'), d, { ...X, prompt: `Rozwiąż równanie: {x/${k}} = ${fmt(x)}`, ans: x * k, hints: [`Pomnóż obie strony przez ${k}.`], sol: [`x = ${fmt(x)} · ${k} = ${fmt(x * k)}`], wrong: [[r6(x / k), `Mnożymy przez ${k}, a nie dzielimy.`]] });
        }
        return q(sid('mnozenie'), d, { ...X, prompt: `Rozwiąż równanie: ${a === 1 ? '' : a === -1 ? '−' : fmt(a)}x = ${fmt(a * x)}`, ans: x, hints: [`Podziel obie strony przez ${par(a)}.`], sol: [`x = ${fmt(a * x)} : ${par(a)} = ${fmt(x)}`], wrong: [[-x, 'Sprawdź znak wyniku.'], [a * x - a, 'Liczbę przy x dzielimy, a nie odejmujemy.']] });
      },
    ),
    S(
      'ax-b',
      'Równania typu ax + b = c',
      [P('Najpierw przenosimy liczby bez x na drugą stronę, potem dzielimy przez współczynnik przy x.'), EX('3x − 5 = 16', ['3x = 16 + 5 = 21', 'x = 21 : 3'], 'x = 7')],
      (d, r) => {
        const x = nz(r, lvl(d, 1, -10, -12), 12);
        const a = nz(r, lvl(d, 2, -6, -9), 9);
        const b = nz(r, -15, 15);
        const c = a * x + b;
        return q(sid('ax-b'), d, { ...X, prompt: `Rozwiąż równanie: ${poly([[a, 'x'], [b, '']])} = ${fmt(c)}`, ans: x, hints: [`Najpierw ${b > 0 ? 'odejmij' : 'dodaj'} ${Math.abs(b)} ${b > 0 ? 'od' : 'do'} obu stron.`, `Potem podziel przez ${par(a)}.`], sol: [`${poly([[a, 'x']])} = ${fmt(c)} ${b > 0 ? '−' : '+'} ${Math.abs(b)} = ${fmt(c - b)}`, `x = ${fmt(c - b)} : ${par(a)} = ${fmt(x)}`], wrong: [[r6((c + b) / a), `Przenosząc ${fmt(b)} na drugą stronę, zmień znak.`]], steps: [{ prompt: `Ile wynosi ${poly([[a, 'x']])}?`, answer: { value: new Fraction(c - b), unit: undefined, prefix: `${poly([[a, 'x']])} =` }, hint: `Przenieś ${fmt(b)} na prawą stronę ze zmienionym znakiem.` }, { prompt: 'Ile wynosi x?', answer: { value: new Fraction(x), prefix: 'x =' }, hint: `Podziel ${fmt(c - b)} przez ${par(a)}.` }] });
      },
    ),
    S(
      'obie-strony',
      'Niewiadoma po obu stronach',
      [P('Wyrazy z x przenosimy na jedną stronę, liczby na drugą. Przenosząc wyraz na drugą stronę, zmieniamy jego znak.'), EX('5x + 3 = 2x + 18', ['5x − 2x = 18 − 3', '3x = 15'], 'x = 5')],
      (d, r) => {
        const x = nz(r, lvl(d, 1, -9, -12), 12);
        const a = int(r, 2, 9);
        let c = int(r, 1, 8);
        while (c === a) c = int(r, 1, 8);
        const b = nz(r, -12, 12);
        const e = a * x + b - c * x;
        return q(sid('obie-strony'), d, { ...X, prompt: `Rozwiąż równanie: ${poly([[a, 'x'], [b, '']])} = ${poly([[c, 'x'], [e, '']])}`, ans: x, hints: ['Przenieś wyrazy z x na lewą stronę, a liczby na prawą.', `Otrzymasz ${poly([[a - c, 'x']])} = ${fmt(e - b)}.`], sol: [`${poly([[a, 'x'], [-c, 'x']])} = ${fmt(e)} − ${par(b)}`, `${poly([[a - c, 'x']])} = ${fmt(e - b)}`, `x = ${fmt(x)}`], wrong: [[r6((e + b) / (a - c)), 'Liczbę przenoszoną na drugą stronę bierzemy ze zmienionym znakiem.'], [r6((e - b) / (a + c)), 'Wyraz z x przenoszony na drugą stronę zmienia znak.']] });
      },
    ),
    S(
      'nawiasy',
      'Równania z nawiasami',
      [P('Najpierw opuszczamy nawiasy, potem porządkujemy równanie.'), EX('3(x − 2) = x + 4', ['3x − 6 = x + 4', '2x = 10'], 'x = 5')],
      (d, r) => {
        const x = nz(r, -8, 10), k = int(r, 2, 6), b = nz(r, -6, 6);
        const minus = d === 3;
        let c = int(r, 1, 4);
        if (minus && c === k) c = k === 1 ? 2 : k - 1;
        // k(x + b) − c(x − 1) = rhs  lub  k(x + b) = c·x + rhs
        const lhs = minus ? k * (x + b) - c * (x - 1) : k * (x + b);
        const rhsConst = minus ? lhs : lhs - c * x;
        const prompt = minus ? `${k}(${poly([[1, 'x'], [b, '']])}) − ${c}(x − 1) = ${fmt(rhsConst)}` : `${k}(${poly([[1, 'x'], [b, '']])}) = ${poly([[c, 'x'], [rhsConst, '']])}`;
        if (!minus && k === c) return q(sid('nawiasy'), d, { ...X, prompt: `Rozwiąż równanie: ${k}(${poly([[1, 'x'], [b, '']])}) = ${fmt(k * (x + b))}`, ans: x, hints: [`Podziel obie strony przez ${k}.`], sol: [`x + ${par(b)} = ${fmt(x + b)}`, `x = ${fmt(x)}`] });
        return q(sid('nawiasy'), d, { ...X, prompt: `Rozwiąż równanie: ${prompt}`, ans: x, hints: ['Opuść nawiasy – mnóż liczbę przed nawiasem przez każdy wyraz.', minus ? 'Minus przed nawiasem zmienia znaki w nawiasie.' : 'Wyrazy z x przenieś na jedną stronę.'], sol: [minus ? `${poly([[k, 'x'], [k * b, '']])}${' − ' + c + 'x + ' + c} = ${fmt(rhsConst)}` : `${poly([[k, 'x'], [k * b, '']])} = ${poly([[c, 'x'], [rhsConst, '']])}`, `x = ${fmt(x)}`], wrong: minus ? [[r6((rhsConst - k * b + c) / (k + c)), 'Minus przed nawiasem zmienia znak wyrazu −' + c + 'x.']] : [] });
      },
    ),
    S(
      'ulamki',
      'Równania z ułamkami',
      [R('Mnożymy obie strony równania przez wspólny mianownik – ułamki znikają.', 'Sposób'), EX('{x/2} + {x/3} = 10', ['Mnożymy przez 6: 3x + 2x = 60', '5x = 60'], 'x = 12')],
      (d, r) => {
        if (d === 1) {
          const k = int(r, 2, 6), x = k * int(r, 1, 9), b = int(r, 1, 9);
          return q(sid('ulamki'), d, { ...X, prompt: `Rozwiąż równanie: {x/${k}} + ${b} = ${x / k + b}`, ans: x, hints: [`Odejmij ${b}, potem pomnóż przez ${k}.`], sol: [`{x/${k}} = ${x / k}`, `x = ${x / k} · ${k} = ${x}`] });
        }
        const [p, s] = pick(r, [[2, 3], [3, 4], [2, 5], [4, 6], [3, 6], [2, 4]] as [number, number][]);
        const l = (p * s) / gcdN(p, s);
        const x = l * nz(r, -5, 6);
        const rhs = x / p + x / s;
        return q(sid('ulamki'), d, { ...X, prompt: `Rozwiąż równanie: {x/${p}} + {x/${s}} = ${fmt(rhs)}`, ans: x, hints: [`Pomnóż obie strony przez ${l}.`], sol: [`${l / p}x + ${l / s}x = ${fmt(rhs * l)}`, `${l / p + l / s}x = ${fmt(rhs * l)}`, `x = ${fmt(x)}`], wrong: [[r6(rhs / (1 / p + 1 / s) / l), 'Pomnóż przez wspólny mianownik obie strony.']] });
      },
    ),
    S(
      'ulamki-nawias',
      'Równania z ułamkiem całej strony',
      [P('Gdy cała strona równania jest ułamkiem, mnożymy obie strony przez jego mianownik. Licznik traktujemy jak wyrażenie w nawiasie.'), EX('{x+4/3} = 5', ['Mnożymy obie strony przez 3: x + 4 = 15'], 'x = 11')],
      (d, r) => {
        const k = int(r, 2, 6), b = nz(r, -9, 9);
        const y = nz(r, -6, 8);
        const x = k * y - b;
        const top = poly([[1, 'x'], [b, '']]).replace(/ /g, '');
        if (d === 3) {
          const m = int(r, 2, 4);
          return q(sid('ulamki-nawias'), d, { ...X, prompt: `Rozwiąż równanie: {${m}x/${k}} = ${frac(new Fraction(m * x, k))}`, ans: x, hints: [`Pomnóż obie strony przez ${k}, potem podziel przez ${m}.`], sol: [`${m}x = ${fmt(m * x)}`, `x = ${fmt(x)}`] });
        }
        return q(sid('ulamki-nawias'), d, { ...X, prompt: `Rozwiąż równanie: {${top}/${k}} = ${fmt(y)}`, ans: x, hints: [`Pomnóż obie strony przez ${k}.`], sol: [`${poly([[1, 'x'], [b, '']])} = ${fmt(y * k)}`, `x = ${fmt(x)}`], wrong: [[y - b, `Najpierw pomnóż obie strony przez ${k}.`]] });
      },
    ),
    S(
      'sprawdzanie',
      'Sprawdzanie rozwiązania',
      [P('Aby sprawdzić, czy liczba jest rozwiązaniem, wstawiamy ją do obu stron równania. Jeśli wyniki są równe – to jest rozwiązanie.')],
      (d, r) => {
        const x = nz(r, -6, 8), a = int(r, 2, 6), b = nz(r, -9, 9);
        const c = a * x + b;
        const wrongX = x + nz(r, -3, 3);
        const eq = `${poly([[a, 'x'], [b, '']])} = ${fmt(c)}`;
        return tf(sid('sprawdzanie'), d, { items: [[`Liczba ${fmt(x)} jest rozwiązaniem równania ${eq}.`, true, `${fmt(a)} · ${par(x)} + ${par(b)} = ${fmt(c)}.`], [`Liczba ${fmt(wrongX)} jest rozwiązaniem równania ${eq}.`, false, `${fmt(a)} · ${par(wrongX)} + ${par(b)} = ${fmt(a * wrongX + b)}, a nie ${fmt(c)}.`]] });
      },
    ),
    S(
      'sprzeczne',
      'Równania sprzeczne i tożsamościowe',
      [L('Równanie **sprzeczne** nie ma rozwiązań, np. x + 2 = x + 5 → 2 = 5 (fałsz).', 'Równanie **tożsamościowe** spełnia każda liczba, np. 2(x + 1) = 2x + 2 → 2 = 2 (prawda).')],
      (d, r) => {
        const a = int(r, 2, 6), b = int(r, 1, 9), c = int(r, 1, 9);
        const kind = pick(r, ['sprz', 'toz', 'jedno'] as const);
        const eqs = {
          sprz: `${a}(x + ${b}) = ${a}x + ${a * b + c}`,
          toz: `${a}(x + ${b}) = ${a}x + ${a * b}`,
          jedno: `${a}(x + ${b}) = ${a + 1}x + ${a * b - c}`,
        };
        const right = { sprz: 'nie ma rozwiązań (sprzeczne)', toz: 'każda liczba jest rozwiązaniem (tożsamościowe)', jedno: `ma jedno rozwiązanie: x = ${c}` }[kind];
        return mc(sid('sprzeczne'), d, r, { prompt: `Równanie ${eqs[kind]}:`, right, wrong: ['nie ma rozwiązań (sprzeczne)', 'każda liczba jest rozwiązaniem (tożsamościowe)', `ma jedno rozwiązanie: x = ${c}`, `ma jedno rozwiązanie: x = ${-c}`].filter((x) => x !== right), hints: ['Opuść nawias i przenieś wyrazy z x na jedną stronę. Co zostaje?'], sol: [`Po opuszczeniu nawiasu: ${a}x + ${a * b} = …`, `Odpowiedź: ${right}.`] });
      },
    ),
    S(
      'liczby',
      'Zadania tekstowe: liczby',
      [P('Plan: oznacz niewiadomą, zapisz równanie, rozwiąż je i sprawdź odpowiedź w treści zadania.'), EX('Gdy do liczby dodamy jej trzykrotność, otrzymamy 52.', ['x + 3x = 52', '4x = 52'], 'x = 13')],
      (d, r) => {
        const x = int(r, 2, 30), k = int(r, 2, 5), b = int(r, 1, 20);
        const v = pick(r, lvl(d, [0], [0, 1], [1, 2]));
        if (v === 0) return q(sid('liczby'), d, { prompt: `Gdy do pewnej liczby dodamy jej ${k}-krotność, otrzymamy ${x + k * x}. Jaka to liczba?`, ans: x, hints: ['Oznacz liczbę przez x: x + ' + k + 'x = ' + (x + k * x) + '.'], sol: [`x + ${k}x = ${x + k * x}`, `${k + 1}x = ${x + k * x}`, `x = ${x}`] });
        if (v === 1) return q(sid('liczby'), d, { prompt: `Pewną liczbę pomnożono przez ${k} i dodano ${b}. Otrzymano ${k * x + b}. Jaka to liczba?`, ans: x, hints: [`${k}x + ${b} = ${k * x + b}`], sol: [`${k}x + ${b} = ${k * x + b}`, `${k}x = ${k * x}`, `x = ${x}`], wrong: [[r6((k * x + b) / k), `Najpierw odejmij ${b}.`]] });
        const y = x + b;
        return q(sid('liczby'), d, { prompt: `Suma dwóch liczb wynosi ${x + y}. Jedna z nich jest o ${b} większa od drugiej. Jaka jest mniejsza liczba?`, ans: x, hints: [`Mniejsza: x, większa: x + ${b}.`], sol: [`x + x + ${b} = ${x + y}`, `2x = ${2 * x}`, `x = ${x}`], wrong: [[r6((x + y) / 2), 'To połowa sumy – liczby nie są równe.']] });
      },
    ),
    S(
      'wiek',
      'Zadania tekstowe: wiek',
      [EX('Mama jest 4 razy starsza od córki. Za 6 lat będzie 3 razy starsza. Ile lat ma córka?', ['Córka: x, mama: 4x.', '4x + 6 = 3(x + 6)', 'x = 12'], '12 lat')],
      (d, r) => {
        const p = person(r);
        const x = int(r, 4, 14), k = int(r, 3, 5);
        if (d === 1) return q(sid('wiek'), d, { prompt: `Tata jest ${k} razy starszy od ${p.f ? 'córki' : 'syna'}. Razem mają ${x + k * x} lat. Ile lat ma ${p.f ? 'córka' : 'syn'}?`, ans: x, unit: 'lat', hints: [`Dziecko: x, tata: ${k}x.`], sol: [`x + ${k}x = ${x + k * x}`, `x = ${x}`] });
        // za n lat tata będzie m razy starszy
        for (const n of [2, 3, 4, 5, 6, 8, 10, 12]) {
          const num = k * x + n, den = x + n;
          if (num % den === 0 && num / den >= 2 && num / den < k) {
            const m = num / den;
            return q(sid('wiek'), d, { prompt: `Tata jest ${k} razy starszy od ${p.f ? 'córki' : 'syna'}. Za ${n} lat będzie od ${g(p, 'niego', 'niej')} ${m} razy starszy. Ile lat ma teraz ${p.f ? 'córka' : 'syn'}?`, ans: x, unit: 'lat', hints: [`Teraz: x i ${k}x. Za ${n} lat: x + ${n} i ${k}x + ${n}.`], sol: [`${k}x + ${n} = ${m}(x + ${n})`, `${k - m}x = ${m * n - n}`, `x = ${x}`] });
          }
        }
        const diff = (k - 1) * x;
        return q(sid('wiek'), d, { prompt: `Mama jest ${k} razy starsza od ${p.f ? 'córki' : 'syna'} i o ${diff} lat starsza. Ile lat ma ${p.f ? 'córka' : 'syn'}?`, ans: x, unit: 'lat', hints: [`${k}x − x = ${diff}`], sol: [`${k - 1}x = ${diff}`, `x = ${x}`] });
      },
    ),
    S(
      'zakupy',
      'Zadania tekstowe: zakupy',
      [EX('3 zeszyty i 2 długopisy kosztują 19 zł. Długopis jest o 2 zł droższy od zeszytu.', ['Zeszyt: x, długopis: x + 2.', '3x + 2(x + 2) = 19', 'x = 3'], 'zeszyt 3 zł')],
      (d, r) => {
        const x = int(r, 2, 12), m = int(r, 1, 5), a = int(r, 2, 5), b = int(r, 1, 4);
        const total = a * x + b * (x + m);
        return q(sid('zakupy'), d, { prompt: `${a} zeszyty i ${b} ${b === 1 ? 'długopis' : 'długopisy'} kosztują razem ${total} zł. Długopis jest o ${m} zł droższy od zeszytu. Ile kosztuje zeszyt?`, ans: x, unit: 'zł', hints: [`Zeszyt: x, długopis: x + ${m}.`, `${a}x + ${b}(x + ${m}) = ${total}`], sol: [`${a}x + ${b}x + ${b * m} = ${total}`, `${a + b}x = ${total - b * m}`, `x = ${x} zł`], wrong: [[x + m, 'To cena długopisu.']] });
      },
    ),
    S(
      'obwod',
      'Zadania tekstowe: obwód figury',
      [EX('Prostokąt ma obwód 36 cm, a jeden bok jest 2 razy dłuższy od drugiego.', ['Boki: x i 2x.', '2x + 4x = 36', 'x = 6'], 'boki 6 cm i 12 cm')],
      (d, r) => {
        const x = int(r, 2, 15), m = int(r, 1, 8), k = int(r, 2, 4);
        if (r() < 0.5) return q(sid('obwod'), d, { prompt: `Obwód prostokąta wynosi ${2 * x + 2 * (x + m)} cm. Jeden bok jest o ${m} cm dłuższy od drugiego. Jaka jest długość krótszego boku?`, ans: x, unit: 'cm', hints: [`Boki: x i x + ${m}.`], sol: [`2x + 2(x + ${m}) = ${2 * x + 2 * (x + m)}`, `4x = ${4 * x}`, `x = ${x} cm`] });
        return q(sid('obwod'), d, { prompt: `W trójkącie równoramiennym ramię jest ${k} razy dłuższe od podstawy. Obwód wynosi ${x + 2 * k * x} cm. Jaka jest długość podstawy?`, ans: x, unit: 'cm', hints: [`Podstawa: x, ramiona: ${k}x i ${k}x.`], sol: [`x + 2 · ${k}x = ${x + 2 * k * x}`, `${1 + 2 * k}x = ${x + 2 * k * x}`, `x = ${x} cm`], wrong: [[k * x, 'To długość ramienia.']] });
      },
    ),
    S(
      'proporcja',
      'Proporcje',
      [R('{a/b} = {c/d} ⇔ a · d = b · c (iloczyn wyrazów skrajnych = iloczyn wyrazów środkowych).', 'Własność'), EX('{x/6} = {4/3}', ['3x = 24'], 'x = 8')],
      (d, r) => {
        const b = int(r, 2, 9), c = int(r, 1, 9), e = int(r, 2, 9);
        const x = new Fraction(b * c, e);
        if (d === 1 && !x.isInteger()) return q(sid('proporcja'), d, { ...X, prompt: `Rozwiąż proporcję: {x/${e * 2}} = {${c}/2}`, ans: c * e, hints: ['Pomnóż na krzyż.'], sol: [`2x = ${2 * c * e}`, `x = ${c * e}`] });
        return q(sid('proporcja'), d, { ...X, prompt: `Rozwiąż proporcję: {x/${b}} = {${c}/${e}}`, ans: x, hints: ['Pomnóż na krzyż: x · ' + e + ' = ' + b + ' · ' + c + '.'], sol: [`${e}x = ${b * c}`, `x = ${frac(x, true)}`] });
      },
    ),
    S(
      'wprost',
      'Wielkości wprost proporcjonalne',
      [P('Wielkości są wprost proporcjonalne, gdy ile razy wzrośnie jedna, tyle razy wzrośnie druga (np. liczba kupionych bułek i cena).'), EX('3 kg jabłek kosztują 12,60 zł. Ile kosztuje 5 kg?', ['1 kg: 12,60 : 3 = 4,20 zł', '5 kg: 5 · 4,20 = 21 zł'], '21 zł')],
      (d, r) => {
        const unitPrice = r6(int(r, 5, 80) / 10);
        const a = int(r, 2, 6);
        let b = int(r, 2, 12);
        while (b === a) b = int(r, 2, 12);
        const prod = pick(r, [['kg jabłek', 'kg'], ['litry soku', 'l'], ['m materiału', 'm']] as [string, string][]);
        return q(sid('wprost'), d, { prompt: `${a} ${prod[0]} kosztują ${fmt(r6(a * unitPrice))} zł. Ile zapłacimy za ${b} ${prod[1]}?`, ans: r6(b * unitPrice), unit: 'zł', hints: [`Oblicz cenę za 1 ${prod[1]}.`], sol: [`1 ${prod[1]}: ${fmt(r6(a * unitPrice))} : ${a} = ${fmt(unitPrice)} zł`, `${b} ${prod[1]}: ${b} · ${fmt(unitPrice)} = ${fmt(r6(b * unitPrice))} zł`] });
      },
    ),
    S(
      'odwrotnie',
      'Wielkości odwrotnie proporcjonalne',
      [P('Wielkości są odwrotnie proporcjonalne, gdy ile razy wzrośnie jedna, tyle razy zmaleje druga (np. liczba pracowników i czas pracy). Ich iloczyn jest stały.'), EX('4 malarzy maluje szkołę 6 dni. Ile dni zajmie to 3 malarzom?', ['Praca: 4 · 6 = 24 „malarzodni”', '24 : 3 = 8'], '8 dni')],
      (d, r) => {
        const work = pick(r, [24, 36, 48, 60, 72, 120]);
        const divs = [2, 3, 4, 5, 6, 8, 10, 12].filter((k) => work % k === 0);
        const a = pick(r, divs);
        let b = pick(r, divs);
        while (b === a) b = pick(r, divs);
        return q(sid('odwrotnie'), d, { prompt: `${a} pracowników wykonuje zlecenie w ${work / a} dni. W ile dni wykona je ${b} pracowników, pracujących w tym samym tempie?`, ans: work / b, unit: 'dni', hints: ['Więcej pracowników – mniej dni. Iloczyn liczby pracowników i dni jest stały.'], sol: [`${a} · ${work / a} = ${work}`, `${work} : ${b} = ${work / b} dni`], wrong: [[r6(((work / a) * b) / a), 'To wielkości odwrotnie proporcjonalne – więcej pracowników to mniej dni.']] });
      },
    ),
    S(
      'podzial',
      'Podział w danym stosunku',
      [P('Podzielić liczbę w stosunku a : b to podzielić ją na a + b równych części; pierwsza osoba dostaje a części, druga b części.'), EX('Podziel 60 zł w stosunku 2 : 3.', ['2 + 3 = 5 części, 1 część = 12 zł', '24 zł i 36 zł'], '24 zł i 36 zł')],
      (d, r) => {
        const a = int(r, 1, 5), b = int(r, a + 1, 7);
        const part = int(r, 2, 30);
        const total = (a + b) * part;
        const p1 = person(r), p2 = person(r, p1);
        return q(sid('podzial'), d, { prompt: `${p1.name} i ${p2.name} podzielili ${total} zł w stosunku ${a} : ${b}. Ile złotych dostał${p2.f ? 'a' : ''} ${p2.name}?`, ans: b * part, unit: 'zł', hints: [`Kwotę dzielimy na ${a} + ${b} = ${a + b} równych części.`], sol: [`1 część: ${total} : ${a + b} = ${part} zł`, `${p2.name}: ${b} · ${part} = ${b * part} zł`], wrong: [[a * part, `To część osoby, która dostała ${a} części.`], [r6(total / b), 'Dzielimy przez sumę części stosunku.']] });
      },
    ),
    S(
      'skala',
      'Skala mapy: z mapy do rzeczywistości',
      [R('Skala 1 : 50 000 oznacza, że 1 cm na mapie to 50 000 cm = 500 m w terenie.', 'Skala'), EX('Na mapie w skali 1 : 200 000 odległość wynosi 3,5 cm.', ['3,5 · 200 000 cm = 700 000 cm', '700 000 cm = 7 km'], '7 km')],
      (d, r) => {
        const sc = pick(r, lvl(d, [100000, 200000, 50000], [25000, 300000, 500000], [20000, 250000, 1500000]));
        const cm = r6(int(r, 2, 30) / 2);
        const km = r6((cm * sc) / 100000);
        return q(sid('skala'), d, { prompt: `Na mapie w skali 1 : ${fmt(sc)} odległość między miastami wynosi ${fmt(cm)} cm. Jaka jest rzeczywista odległość w kilometrach?`, ans: km, unit: 'km', hints: [`1 cm na mapie to ${fmt(sc)} cm, czyli ${fmt(r6(sc / 100000))} km.`], sol: [`${fmt(cm)} · ${fmt(sc)} cm = ${fmt(r6(cm * sc))} cm`, `= ${fmt(km)} km`], wrong: [[r6((cm * sc) / 1000), '1 km = 100 000 cm.'], [r6((cm * sc) / 10000), '1 km = 100 000 cm.']] });
      },
    ),
    S(
      'skala-odwrotnie',
      'Skala mapy: z rzeczywistości na mapę',
      [EX('Odległość 12 km na mapie w skali 1 : 300 000.', ['12 km = 1 200 000 cm', '1 200 000 : 300 000 = 4'], '4 cm')],
      (d, r) => {
        const sc = pick(r, [100000, 200000, 250000, 500000, 50000]);
        const cm = r6(int(r, 2, 24) / 2);
        const km = r6((cm * sc) / 100000);
        if (d === 3 && r() < 0.5) {
          return q(sid('skala-odwrotnie'), d, { prompt: `Odcinek długości ${fmt(cm)} cm na mapie odpowiada ${fmt(km)} km w terenie. W jakiej skali jest mapa? Podaj liczbę n ze skali 1 : n.`, ans: sc, prefix: '1 :', hints: ['Zamień kilometry na centymetry i podziel przez długość na mapie.'], sol: [`${fmt(km)} km = ${fmt(r6(km * 100000))} cm`, `${fmt(r6(km * 100000))} : ${fmt(cm)} = ${fmt(sc)}`] });
        }
        return q(sid('skala-odwrotnie'), d, { prompt: `Rzeczywista odległość wynosi ${fmt(km)} km. Ile centymetrów wyniesie na mapie w skali 1 : ${fmt(sc)}?`, ans: cm, unit: 'cm', hints: ['Zamień kilometry na centymetry.', `Podziel przez ${fmt(sc)}.`], sol: [`${fmt(km)} km = ${fmt(r6(km * 100000))} cm`, `${fmt(r6(km * 100000))} : ${fmt(sc)} = ${fmt(cm)} cm`] });
      },
    ),
    S(
      'predkosc',
      'Prędkość',
      [R('v = {s/t} – prędkość to droga podzielona przez czas.', 'Wzór'), EX('Rowerzysta przejechał 36 km w 1,5 h.', ['36 : 1,5 = 24'], '24 km/h')],
      (d, r) => {
        const v = int(r, lvl(d, 3, 10, 40), lvl(d, 20, 90, 120));
        const t = pick(r, lvl(d, [1, 2, 3, 4], [0.5, 1.5, 2.5, 3], [0.25, 0.75, 1.25, 2.5]));
        const s = r6(v * t);
        const tText = t >= 1 && Number.isInteger(t) ? `${t} h` : `${fmt(t)} h (${fmt(t * 60)} min)`;
        return q(sid('predkosc'), d, { prompt: `Samochód przejechał ${fmt(s)} km w czasie ${tText}. Z jaką średnią prędkością jechał?`, ans: v, unit: 'km/h', hints: ['Podziel drogę przez czas w godzinach.'], sol: [`v = ${fmt(s)} : ${fmt(t)} = ${v} km/h`], wrong: [[r6(s * t), 'Prędkość to droga podzielona przez czas.']] });
      },
    ),
    S(
      'droga',
      'Droga',
      [R('s = v · t', 'Wzór'), P('Czas musi być w tych samych jednostkach co prędkość: przy km/h – w godzinach. 30 min = 0,5 h, 15 min = 0,25 h, 20 min = {1/3} h.')],
      (d, r) => {
        const v = int(r, lvl(d, 4, 10, 30), lvl(d, 15, 80, 120));
        const min = pick(r, lvl(d, [60, 120, 180], [30, 90, 150], [15, 45, 20, 40, 75]));
        const s = r6((v * min) / 60);
        if (!Number.isInteger(s * 100)) return q(sid('droga'), d, { prompt: `Pociąg jedzie z prędkością ${v * 3} km/h. Jaką drogę przejedzie w ${min} minut?`, ans: r6((v * 3 * min) / 60), unit: 'km', hints: [`${min} min = {${min}/60} h.`], sol: [`s = ${v * 3} · {${min}/60} = ${fmt(r6((v * 3 * min) / 60))} km`] });
        return q(sid('droga'), d, { prompt: `Pociąg jedzie z prędkością ${v} km/h. Jaką drogę przejedzie w ${min} minut?`, ans: s, unit: 'km', hints: [`Zamień ${min} min na godziny.`, 's = v · t'], sol: [`${min} min = ${fmt(r6(min / 60))} h`, `s = ${v} · ${fmt(r6(min / 60))} = ${fmt(s)} km`], wrong: [[v * min, 'Czas trzeba zamienić na godziny.']] });
      },
    ),
    S(
      'czas',
      'Czas',
      [R('t = {s/v}', 'Wzór'), EX('Ile minut zajmie przejście 3 km z prędkością 4 km/h?', ['t = 3 : 4 = 0,75 h', '0,75 h = 45 min'], '45 min')],
      (d, r) => {
        const v = pick(r, [4, 5, 6, 10, 12, 15, 20, 30, 40, 60, 80, 90]);
        const min = pick(r, lvl(d, [60, 120, 30], [30, 45, 90, 20, 40], [15, 18, 36, 48, 75, 50]));
        const s = r6((v * min) / 60);
        if (!Number.isInteger(s * 10)) return q(sid('czas'), d, { prompt: `Ile minut potrzeba, by przejechać ${v} km z prędkością ${v * 2} km/h?`, ans: 30, unit: 'min', hints: ['t = s : v'], sol: [`t = ${v} : ${v * 2} = 0,5 h = 30 min`] });
        return q(sid('czas'), d, { prompt: `Ile minut potrzeba, by pokonać ${fmt(s)} km z prędkością ${v} km/h?`, ans: min, unit: 'min', hints: ['Oblicz czas w godzinach: t = s : v.', 'Zamień godziny na minuty (· 60).'], sol: [`t = ${fmt(s)} : ${v} = ${fmt(r6(min / 60))} h`, `${fmt(r6(min / 60))} h = ${min} min`], wrong: [[r6(min / 60), 'To wynik w godzinach – zamień go na minuty.']] });
      },
    ),
    S(
      'jednostki',
      'Zamiana km/h i m/s',
      [L('1 m/s = 3,6 km/h', 'km/h → m/s: dzielimy przez 3,6', 'm/s → km/h: mnożymy przez 3,6'), EX('72 km/h w m/s', ['72 : 3,6 = 20'], '20 m/s')],
      (d, r) => {
        const ms = int(r, 1, lvl(d, 10, 30, 40)) * (d === 1 ? 5 : 1);
        const kmh = r6(ms * 3.6);
        if (r() < 0.5) return q(sid('jednostki'), d, { prompt: `Zamień ${fmt(kmh)} km/h na m/s.`, ans: ms, unit: 'm/s', hints: ['Podziel przez 3,6.'], sol: [`${fmt(kmh)} : 3,6 = ${ms} m/s`], wrong: [[r6(kmh * 3.6), 'Na m/s dzielimy przez 3,6.']] });
        return q(sid('jednostki'), d, { prompt: `Zamień ${ms} m/s na km/h.`, ans: kmh, unit: 'km/h', hints: ['Pomnóż przez 3,6.'], sol: [`${ms} · 3,6 = ${fmt(kmh)} km/h`], wrong: [[r6(ms / 3.6), 'Na km/h mnożymy przez 3,6.']] });
      },
    ),
    S(
      'spotkanie',
      'Ruch naprzeciw siebie',
      [P('Gdy dwa pojazdy jadą naprzeciw siebie, odległość między nimi maleje o sumę ich prędkości w każdej godzinie.'), EX('Z miast odległych o 210 km wyjechały naprzeciw siebie auta: 60 km/h i 80 km/h.', ['60 + 80 = 140 km/h', '210 : 140 = 1,5 h'], 'spotkają się po 1,5 h')],
      (d, r) => {
        const v1 = int(r, 4, 12) * 10, v2 = int(r, 4, 12) * 10;
        const t = pick(r, [0.5, 1, 1.5, 2, 2.5, 3]);
        const s = r6((v1 + v2) * t);
        return q(sid('spotkanie'), d, { prompt: `Z dwóch miast odległych o ${fmt(s)} km wyjechały jednocześnie naprzeciw siebie dwa samochody: jeden z prędkością ${v1} km/h, drugi ${v2} km/h. Po ilu godzinach się spotkają?`, ans: t, unit: 'h', hints: ['W każdej godzinie zbliżają się o sumę prędkości.'], sol: [`${v1} + ${v2} = ${v1 + v2} km/h`, `${fmt(s)} : ${v1 + v2} = ${fmt(t)} h`], wrong: [[r6(s / Math.abs(v1 - v2 || 1)), 'Jadą naprzeciw siebie – prędkości dodajemy.']] });
      },
    ),
    S(
      'srednia-predkosc',
      'Średnia prędkość na trasie',
      [R('Średnia prędkość = {cała droga/cały czas} – a nie średnia z prędkości!', 'Uwaga'), EX('2 h jazdy z prędkością 60 km/h i 1 h z prędkością 90 km/h.', ['Droga: 120 + 90 = 210 km', 'Czas: 3 h', '210 : 3 = 70'], '70 km/h')],
      (d, r) => {
        const v1 = int(r, 3, 9) * 10, v2 = int(r, 3, 12) * 10;
        const t1 = int(r, 1, 3), t2 = int(r, 1, 3);
        const s = v1 * t1 + v2 * t2;
        const avg = r6(s / (t1 + t2));
        if (!Number.isInteger(avg * 100)) return q(sid('srednia-predkosc'), d, { prompt: `Autokar jechał ${t1} h z prędkością ${v1} km/h i ${t1} h z prędkością ${v2} km/h. Jaka była jego średnia prędkość?`, ans: (v1 + v2) / 2, unit: 'km/h', hints: ['Oblicz całą drogę i cały czas.'], sol: [`Droga: ${v1 * t1 + v2 * t1} km, czas: ${2 * t1} h`, `${v1 * t1 + v2 * t1} : ${2 * t1} = ${fmt((v1 + v2) / 2)} km/h`] });
        return q(sid('srednia-predkosc'), d, { prompt: `Autokar jechał ${t1} h z prędkością ${v1} km/h, a potem ${t2} h z prędkością ${v2} km/h. Jaka była jego średnia prędkość na całej trasie?`, ans: avg, unit: 'km/h', hints: ['Oblicz całą drogę i cały czas.', 'Średnia prędkość = cała droga : cały czas.'], sol: [`Droga: ${v1 * t1} + ${v2 * t2} = ${s} km`, `Czas: ${t1 + t2} h`, `${s} : ${t1 + t2} = ${fmt(avg)} km/h`], wrong: [[(v1 + v2) / 2, 'Średnia prędkość to nie średnia z prędkości – podziel całą drogę przez cały czas.']] });
      },
    ),
  ],
};

function gcdN(a: number, b: number): number {
  return b ? gcdN(b, a % b) : a;
}

