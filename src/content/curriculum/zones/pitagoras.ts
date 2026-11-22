/** Dział: Twierdzenie Pitagorasa i układ współrzędnych. */
import { EX, L, P, R, V, fmt, int, lvl, mc, nz, par, pick, q, r6, tf } from '../kit';
import { rectFig, rhombusFig, rightTriFig, trapezoidFig, triFig } from '../figures';
import type { Skill, Zone } from '../model';
import type { Visual } from '../../types';

const S = (id: string, title: string, theory: Skill['theory'], gen: Skill['gen']): Skill => ({ id: `t-${id}`, title, theory, gen });
const sid = (id: string) => `t-${id}`;

const TRIPLES: [number, number, number][] = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [12, 16, 20], [7, 24, 25], [15, 20, 25], [20, 21, 29], [10, 24, 26]];
const triple = (d: 1 | 2 | 3, r: () => number) => pick(r, TRIPLES.slice(0, lvl(d, 3, 6, 10)));
const pt = (x: number, y: number) => `(${fmt(x)}, ${fmt(y)})`;

function plane(points: { x: number; y: number; label: string }[], extra: Partial<Extract<Visual, { kind: 'plane' }>> = {}): Visual {
  const m = Math.max(5, ...points.flatMap((p) => [Math.abs(p.x), Math.abs(p.y)])) + 1;
  return { kind: 'plane', min: -m, max: m, points, ...extra };
}

export const PITAGORAS: Zone = {
  id: 'pitagoras',
  title: 'Pitagoras i układ współrzędnych',
  short: 'Twierdzenie Pitagorasa w trójkątach i czworokątach, punkty i odcinki w układzie współrzędnych.',
  mark: 'a²+b²',
  skills: [
    S(
      'przeciwprostokatna',
      'Przeciwprostokątna',
      [R('W trójkącie prostokątnym: a² + b² = c², gdzie c to przeciwprostokątna (bok naprzeciw kąta prostego).', 'Twierdzenie Pitagorasa'), V(rightTriFig(4, 3, 'a', 'b', 'c'), 'c – najdłuższy bok, leży naprzeciw kąta prostego'), EX('Przyprostokątne: 6 i 8.', ['6² + 8² = 36 + 64 = 100', 'c = √100'], 'c = 10')],
      (d, r) => {
        const [a, b, c] = triple(d, r);
        return q(sid('przeciwprostokatna'), d, { prompt: `Przyprostokątne trójkąta prostokątnego mają ${a} cm i ${b} cm. Oblicz długość przeciwprostokątnej.`, visual: rightTriFig(a, b, `${a}`, `${b}`, 'c'), ans: c, unit: 'cm', hints: ['c² = a² + b²', `${a}² + ${b}² = ${a * a + b * b}`], sol: [`c² = ${a}² + ${b}² = ${a * a} + ${b * b} = ${c * c}`, `c = √${c * c} = ${c} cm`], wrong: [[a + b, 'Przeciwprostokątna to nie suma przyprostokątnych.'], [c * c, 'To c². Wyciągnij jeszcze pierwiastek.']] });
      },
    ),
    S(
      'przyprostokatna',
      'Przyprostokątna',
      [R('Gdy znamy przeciwprostokątną c i przyprostokątną a: b² = c² − a².', 'Wzór'), EX('c = 13, a = 5.', ['b² = 169 − 25 = 144'], 'b = 12')],
      (d, r) => {
        const [a, b, c] = triple(d, r);
        return q(sid('przyprostokatna'), d, { prompt: `Przeciwprostokątna trójkąta prostokątnego ma ${c} cm, a jedna przyprostokątna ${a} cm. Oblicz drugą przyprostokątną.`, visual: rightTriFig(a, b, `${a}`, 'b', `${c}`), ans: b, unit: 'cm', hints: ['b² = c² − a²'], sol: [`b² = ${c}² − ${a}² = ${c * c} − ${a * a} = ${b * b}`, `b = ${b} cm`], wrong: [[c - a, 'Odejmujemy kwadraty, a nie długości.']] });
      },
    ),
    S(
      'czy-prostokatny',
      'Czy trójkąt jest prostokątny',
      [R('Jeśli a² + b² = c² (c – najdłuższy bok), to trójkąt jest prostokątny.', 'Twierdzenie odwrotne')],
      (d, r) => {
        const [a, b, c] = triple(d, r);
        const k = int(r, 1, 2);
        const fake = [a, b + k, c];
        const items: [string, boolean, string][] = [
          [`Trójkąt o bokach ${a}, ${b}, ${c} jest prostokątny.`, true, `${a}² + ${b}² = ${a * a + b * b} = ${c}².`],
          [`Trójkąt o bokach ${fake.join(', ')} jest prostokątny.`, false, `${a}² + ${b + k}² = ${a * a + (b + k) ** 2}, a ${c}² = ${c * c}.`],
        ];
        return tf(sid('czy-prostokatny'), d, { items: r() < 0.5 ? items : [items[1], items[0]] });
      },
    ),
    S(
      'trojki',
      'Trójki pitagorejskie',
      [P('Trójka pitagorejska to trzy liczby naturalne a, b, c, dla których a² + b² = c². Najbardziej znane: 3, 4, 5 oraz 5, 12, 13.'), R('Wielokrotność trójki pitagorejskiej też jest trójką pitagorejską: 6, 8, 10 i 9, 12, 15.', 'Przydatne')],
      (d, r) => {
        const [a, b, c] = triple(d, r);
        const fakes = [[a, b, c + 1], [a + 1, b, c], [a, b + 2, c + 1], [a + 2, b + 2, c + 2]];
        return mc(sid('trojki'), d, r, { prompt: 'Które liczby mogą być długościami boków trójkąta prostokątnego?', right: `${a}, ${b}, ${c}`, wrong: fakes.map((f) => [f.join(', '), `${f[0]}² + ${f[1]}² = ${f[0] ** 2 + f[1] ** 2}, a ${f[2]}² = ${f[2] ** 2}.`] as [string, string]), hints: ['Sprawdź, czy suma kwadratów dwóch mniejszych liczb równa się kwadratowi największej.'], sol: [`${a}² + ${b}² = ${a * a} + ${b * b} = ${c * c} = ${c}²`] });
      },
    ),
    S(
      'przekatna-kwadratu',
      'Przekątna kwadratu',
      [R('Przekątna kwadratu o boku a: d = a√2.', 'Wzór'), EX('Kwadrat o boku 5.', ['d² = 5² + 5² = 50', 'd = √50 = 5√2'], '5√2')],
      (d, r) => {
        const a = int(r, 2, lvl(d, 8, 12, 20));
        if (d === 3 && r() < 0.5) return q(sid('przekatna-kwadratu'), d, { prompt: `Przekątna kwadratu ma długość ${a}√2 cm. Ile wynosi pole tego kwadratu?`, ans: a * a, unit: 'cm²', hints: ['d = a√2, więc bok to a.'], sol: [`Bok: ${a} cm`, `Pole: ${a}² = ${a * a} cm²`] });
        return q(sid('przekatna-kwadratu'), d, { prompt: `Bok kwadratu ma ${a} cm. Jego przekątna ma długość k√2 cm. Ile wynosi k?`, visual: rectFig(3, 3, `${a} cm`, `${a} cm`, { diagonal: 'd' }), ans: a, unit: '√2', answerText: `${a}√2 cm`, hints: ['d = a√2'], sol: [`d² = ${a}² + ${a}² = ${2 * a * a}`, `d = √${2 * a * a} = ${a}√2 cm`], wrong: [[2 * a, 'Przekątna to a√2, a nie 2a.']] });
      },
    ),
    S(
      'przekatna-prostokata',
      'Przekątna prostokąta',
      [P('Przekątna dzieli prostokąt na dwa trójkąty prostokątne – boki prostokąta są przyprostokątnymi.')],
      (d, r) => {
        const [a, b, c] = triple(d, r);
        if (d === 3 && r() < 0.5) return q(sid('przekatna-prostokata'), d, { prompt: `Przekątna prostokąta ma ${c} cm, a jeden bok ${a} cm. Oblicz pole prostokąta.`, visual: rectFig(b, a, '?', `${a} cm`, { diagonal: `${c} cm` }), ans: a * b, unit: 'cm²', hints: ['Najpierw oblicz drugi bok z twierdzenia Pitagorasa.'], sol: [`Drugi bok: √(${c}² − ${a}²) = ${b} cm`, `Pole: ${a} · ${b} = ${a * b} cm²`] });
        return q(sid('przekatna-prostokata'), d, { prompt: `Prostokąt ma boki ${a} cm i ${b} cm. Oblicz długość jego przekątnej.`, visual: rectFig(b, a, `${b} cm`, `${a} cm`, { diagonal: 'd' }), ans: c, unit: 'cm', hints: ['d² = a² + b²'], sol: [`d² = ${a * a} + ${b * b} = ${c * c}`, `d = ${c} cm`], wrong: [[a + b, 'Przekątna to nie suma boków.']] });
      },
    ),
    S(
      'rownoboczny',
      'Wysokość trójkąta równobocznego',
      [R('Wysokość trójkąta równobocznego o boku a: h = {a√3/2}.', 'Wzór'), EX('Bok 6.', ['h² = 6² − 3² = 27', 'h = √27 = 3√3'], '3√3')],
      (d, r) => {
        const a = 2 * int(r, 1, lvl(d, 5, 8, 12));
        if (d === 3 && r() < 0.5) {
          const k = (a * a) / 4;
          return q(sid('rownoboczny'), d, { prompt: `Bok trójkąta równobocznego ma ${a} cm. Jego pole wynosi k√3 cm². Ile wynosi k?`, ans: k, unit: '√3', answerText: `${k}√3 cm²`, hints: ['P = {a²√3/4}'], sol: [`P = ${a}² · √3 : 4 = ${k}√3 cm²`] });
        }
        return q(sid('rownoboczny'), d, { prompt: `Bok trójkąta równobocznego ma ${a} cm. Jego wysokość ma długość k√3 cm. Ile wynosi k?`, visual: triFig([0, 0], [2, 0], [1, Math.sqrt(3)], { sides: [`${a} cm`, `${a} cm`, `${a} cm`], height: 'h' }), ans: a / 2, unit: '√3', answerText: `${a / 2}√3 cm`, hints: ['Wysokość dzieli podstawę na połowy. Użyj twierdzenia Pitagorasa.', 'h = a√3 : 2'], sol: [`h² = ${a}² − ${a / 2}² = ${a * a - (a * a) / 4}`, `h = ${a / 2}√3 cm`], wrong: [[a, 'h = a√3 : 2 – nie zapomnij podzielić przez 2.']] });
      },
    ),
    S(
      'polkwadrat',
      'Trójkąt o kątach 45°, 45°, 90°',
      [P('To połowa kwadratu: przyprostokątne są równe, a przeciwprostokątna jest √2 razy dłuższa.'), L('przyprostokątne: a, a', 'przeciwprostokątna: a√2')],
      (d, r) => {
        const a = int(r, 2, 12);
        if (r() < 0.5) return q(sid('polkwadrat'), d, { prompt: `Przyprostokątna trójkąta prostokątnego równoramiennego ma ${a} cm. Przeciwprostokątna ma k√2 cm. Ile wynosi k?`, visual: rightTriFig(1, 1, `${a}`, `${a}`, '?'), ans: a, unit: '√2', answerText: `${a}√2 cm`, hints: ['Przeciwprostokątna = a√2'], sol: [`c = ${a}√2 cm`] });
        return q(sid('polkwadrat'), d, { prompt: `Przeciwprostokątna trójkąta prostokątnego równoramiennego ma ${a}√2 cm. Jaką długość ma przyprostokątna?`, ans: a, unit: 'cm', hints: ['c = a√2, więc a = c : √2.'], sol: [`a = ${a}√2 : √2 = ${a} cm`] });
      },
    ),
    S(
      'polrownoboczny',
      'Trójkąt o kątach 30°, 60°, 90°',
      [P('To połowa trójkąta równobocznego.'), L('krótsza przyprostokątna (naprzeciw 30°): a', 'przeciwprostokątna: 2a', 'dłuższa przyprostokątna: a√3')],
      (d, r) => {
        const a = int(r, 2, 10);
        const v = pick(r, lvl(d, [0], [0, 1], [1, 2]));
        if (v === 0) return q(sid('polrownoboczny'), d, { prompt: `W trójkącie o kątach 30°, 60°, 90° krótsza przyprostokątna ma ${a} cm. Ile ma przeciwprostokątna?`, ans: 2 * a, unit: 'cm', hints: ['Przeciwprostokątna jest 2 razy dłuższa od krótszej przyprostokątnej.'], sol: [`c = 2 · ${a} = ${2 * a} cm`] });
        if (v === 1) return q(sid('polrownoboczny'), d, { prompt: `W trójkącie o kątach 30°, 60°, 90° przeciwprostokątna ma ${2 * a} cm. Dłuższa przyprostokątna ma k√3 cm. Ile wynosi k?`, ans: a, unit: '√3', answerText: `${a}√3 cm`, hints: ['Krótsza przyprostokątna to połowa przeciwprostokątnej.', 'Dłuższa: a√3.'], sol: [`Krótsza: ${a} cm`, `Dłuższa: ${a}√3 cm`] });
        return q(sid('polrownoboczny'), d, { prompt: `W trójkącie o kątach 30°, 60°, 90° dłuższa przyprostokątna ma ${a}√3 cm. Oblicz obwód trójkąta bez części z pierwiastkiem: obwód = x + ${a}√3. Ile wynosi x?`, ans: 3 * a, unit: 'cm', hints: ['Krótsza przyprostokątna: ' + a + ', przeciwprostokątna: ' + 2 * a + '.'], sol: [`${a} + ${2 * a} = ${3 * a}`, `Obwód: ${3 * a} + ${a}√3 cm`] });
      },
    ),
    S(
      'drabina',
      'Pitagoras w zadaniach (drabina, telewizor, maszt)',
      [P('Narysuj sytuację i znajdź trójkąt prostokątny: ściana i ziemia tworzą kąt prosty, drabina jest przeciwprostokątną.'), EX('Drabina 5 m oparta o ścianę, dół 3 m od ściany.', ['h² = 5² − 3² = 16'], 'h = 4 m')],
      (d, r) => {
        const [a, b, c] = triple(d, r);
        const kind = pick(r, [0, 1, 2]);
        if (kind === 0) return q(sid('drabina'), d, { prompt: `Drabina o długości ${c} m oparta jest o ścianę. Jej dolny koniec stoi ${a} m od ściany. Na jakiej wysokości drabina dotyka ściany?`, visual: rightTriFig(a, b, `${a} m`, 'h', `${c} m`), ans: b, unit: 'm', hints: ['Drabina to przeciwprostokątna.'], sol: [`h² = ${c}² − ${a}² = ${b * b}`, `h = ${b} m`] });
        if (kind === 1) {
          const k = pick(r, [5, 10, 20]);
          return q(sid('drabina'), d, { prompt: `Ekran telewizora ma szerokość ${b * k} cm i wysokość ${a * k} cm. Jaka jest długość przekątnej ekranu?`, visual: rectFig(b, a, `${b * k} cm`, `${a * k} cm`, { diagonal: 'd' }), ans: c * k, unit: 'cm', hints: ['Przekątna, szerokość i wysokość tworzą trójkąt prostokątny.'], sol: [`d² = ${b * k}² + ${a * k}² = ${(c * k) ** 2}`, `d = ${c * k} cm`] });
        }
        return q(sid('drabina'), d, { prompt: `Maszt o wysokości ${b} m podtrzymuje lina przymocowana do ziemi ${a} m od podstawy masztu. Jaka jest długość liny (od szczytu masztu do ziemi)?`, visual: rightTriFig(a, b, `${a} m`, `${b} m`, '?'), ans: c, unit: 'm', hints: ['Lina to przeciwprostokątna.'], sol: [`l² = ${a}² + ${b}² = ${c * c}`, `l = ${c} m`] });
      },
    ),
    S(
      'rownoramienny',
      'Wysokość trójkąta równoramiennego',
      [P('Wysokość opuszczona na podstawę dzieli trójkąt równoramienny na dwa przystające trójkąty prostokątne i dzieli podstawę na połowy.'), EX('Ramię 13, podstawa 10.', ['h² = 13² − 5² = 144'], 'h = 12')],
      (d, r) => {
        const [a, b, c] = triple(d, r);
        const base = 2 * a;
        if (d === 3 && r() < 0.5) return q(sid('rownoramienny'), d, { prompt: `Trójkąt równoramienny ma podstawę ${base} cm i ramię ${c} cm. Oblicz jego pole.`, visual: triFig([0, 0], [base, 0], [a, b], { sides: [`${base} cm`, `${c} cm`, `${c} cm`], height: 'h' }), ans: a * b, unit: 'cm²', hints: ['Najpierw oblicz wysokość z twierdzenia Pitagorasa.'], sol: [`h = √(${c}² − ${a}²) = ${b} cm`, `P = ${base} · ${b} : 2 = ${a * b} cm²`] });
        return q(sid('rownoramienny'), d, { prompt: `Trójkąt równoramienny ma podstawę ${base} cm i ramiona po ${c} cm. Oblicz wysokość opuszczoną na podstawę.`, visual: triFig([0, 0], [base, 0], [a, b], { sides: [`${base} cm`, `${c} cm`, `${c} cm`], height: 'h' }), ans: b, unit: 'cm', hints: [`Połowa podstawy to ${a} cm.`, 'h² = ramię² − (połowa podstawy)²'], sol: [`h² = ${c}² − ${a}² = ${b * b}`, `h = ${b} cm`] });
      },
    ),
    S(
      'trapez',
      'Pitagoras w trapezie',
      [P('W trapezie równoramiennym wysokości odcinają po bokach dwa trójkąty prostokątne. Ich krótsza przyprostokątna to połowa różnicy podstaw.')],
      (d, r) => {
        const [a, b, c] = triple(d, r);
        const top = int(r, 2, 10);
        const bottom = top + 2 * a;
        return q(sid('trapez'), d, { prompt: `Trapez równoramienny ma podstawy ${bottom} cm i ${top} cm oraz ramiona po ${c} cm. Oblicz jego wysokość.`, visual: trapezoidFig(bottom, top, b, `${bottom} cm`, `${top} cm`, 'h'), ans: b, unit: 'cm', hints: [`Odcinek przy podstawie: (${bottom} − ${top}) : 2 = ${a} cm.`, 'h² = ramię² − odcinek²'], sol: [`(${bottom} − ${top}) : 2 = ${a}`, `h² = ${c}² − ${a}² = ${b * b}`, `h = ${b} cm`] });
      },
    ),
    S(
      'romb',
      'Pitagoras w rombie',
      [P('Przekątne rombu przecinają się pod kątem prostym i dzielą się na połowy. Bok rombu to przeciwprostokątna trójkąta o przyprostokątnych równych połowom przekątnych.')],
      (d, r) => {
        const [a, b, c] = triple(d, r);
        if (d === 3 && r() < 0.5) return q(sid('romb'), d, { prompt: `Bok rombu ma ${c} cm, a jedna przekątna ${2 * a} cm. Oblicz długość drugiej przekątnej.`, visual: rhombusFig(2 * a, 2 * b, `${2 * a} cm`, '?'), ans: 2 * b, unit: 'cm', hints: ['Połowa drugiej przekątnej: √(bok² − połowa pierwszej²).'], sol: [`√(${c}² − ${a}²) = ${b}`, `Druga przekątna: ${2 * b} cm`], wrong: [[b, 'To połowa przekątnej.']] });
        return q(sid('romb'), d, { prompt: `Przekątne rombu mają ${2 * a} cm i ${2 * b} cm. Oblicz długość boku rombu.`, visual: rhombusFig(2 * a, 2 * b, `${2 * a} cm`, `${2 * b} cm`), ans: c, unit: 'cm', hints: [`Połowy przekątnych: ${a} cm i ${b} cm.`], sol: [`bok² = ${a}² + ${b}² = ${c * c}`, `bok = ${c} cm`], wrong: [[r6(Math.sqrt(4 * a * a + 4 * b * b)), 'Użyj połówek przekątnych.']] });
      },
    ),
    S(
      'wspolrzedne',
      'Odczytywanie współrzędnych punktu',
      [P('Punkt zapisujemy jako (x, y): najpierw współrzędna pozioma (oś x), potem pionowa (oś y).'), L('A = (3, 2): 3 w prawo, 2 w górę', 'B = (−2, 1): 2 w lewo, 1 w górę')],
      (d, r) => {
        const x = d === 1 ? int(r, 1, 5) : nz(r, -5, 5), y = d === 1 ? int(r, 1, 5) : nz(r, -5, 5);
        return mc(sid('wspolrzedne'), d, r, { prompt: 'Jakie współrzędne ma punkt A?', visual: plane([{ x, y, label: 'A' }]), right: pt(x, y), wrong: [[pt(y, x), 'Najpierw podajemy x (poziomo), potem y (pionowo).'], pt(-x, y), pt(x, -y)], hints: ['Odczytaj najpierw położenie na osi poziomej, potem na pionowej.'], sol: [`A = ${pt(x, y)}`] });
      },
    ),
    S(
      'cwiartki',
      'Ćwiartki układu współrzędnych',
      [L('I ćwiartka: x > 0, y > 0', 'II ćwiartka: x < 0, y > 0', 'III ćwiartka: x < 0, y < 0', 'IV ćwiartka: x > 0, y < 0')],
      (d, r) => {
        const x = nz(r, -9, 9), y = nz(r, -9, 9);
        const ans = x > 0 ? (y > 0 ? 'I' : 'IV') : y > 0 ? 'II' : 'III';
        return mc(sid('cwiartki'), d, r, { prompt: `W której ćwiartce układu współrzędnych leży punkt ${pt(x, y)}?`, right: ans, wrong: ['I', 'II', 'III', 'IV'].filter((c) => c !== ans), hints: ['Sprawdź znaki obu współrzędnych.'], sol: [`x ${x > 0 ? '>' : '<'} 0, y ${y > 0 ? '>' : '<'} 0 – ćwiartka ${ans}.`] });
      },
    ),
    S(
      'odleglosc-prosta',
      'Długość odcinka poziomego i pionowego',
      [P('Gdy punkty mają tę samą współrzędną y, długość odcinka to różnica współrzędnych x (i odwrotnie).'), EX('A = (−3, 2), B = (5, 2)', ['|5 − (−3)| = 8'], '8')],
      (d, r) => {
        const y = nz(r, -5, 5), x1 = nz(r, -6, 2), x2 = int(r, x1 + 2, 7);
        const horiz = r() < 0.5;
        const A = horiz ? { x: x1, y, label: 'A' } : { x: y, y: x1, label: 'A' };
        const B = horiz ? { x: x2, y, label: 'B' } : { x: y, y: x2, label: 'B' };
        return q(sid('odleglosc-prosta'), d, { prompt: `Oblicz długość odcinka AB, gdy A = ${pt(A.x, A.y)} i B = ${pt(B.x, B.y)}.`, visual: plane([A, B], { segments: [[0, 1]] }), ans: x2 - x1, hints: [`Punkty mają tę samą współrzędną ${horiz ? 'y' : 'x'}.`], sol: [`|${fmt(x2)} − ${par(x1)}| = ${x2 - x1}`], wrong: [[Math.abs(x2 + x1), 'Uważaj na liczby ujemne – odejmij współrzędne.']] });
      },
    ),
    S(
      'srodek',
      'Środek odcinka',
      [R('Środek odcinka AB, gdzie A = (x₁, y₁), B = (x₂, y₂): S = ((x₁ + x₂) : 2, (y₁ + y₂) : 2).', 'Wzór'), EX('A = (2, −4), B = (6, 2)', ['x: (2 + 6) : 2 = 4', 'y: (−4 + 2) : 2 = −1'], 'S = (4, −1)')],
      (d, r) => {
        const sx = nz(r, -4, 4), sy = nz(r, -4, 4), dx = int(r, 1, 3), dy = int(r, 1, 3);
        const A = { x: sx - dx, y: sy - dy }, B = { x: sx + dx, y: sy + dy };
        return mc(sid('srodek'), d, r, { prompt: `Jakie współrzędne ma środek odcinka AB, gdy A = ${pt(A.x, A.y)} i B = ${pt(B.x, B.y)}?`, right: pt(sx, sy), wrong: [[pt(B.x - A.x, B.y - A.y), 'Współrzędne dodajemy i dzielimy przez 2, a nie odejmujemy.'], pt(sy, sx), [pt(A.x + B.x, A.y + B.y), 'Nie zapomnij podzielić przez 2.']], hints: ['Dodaj odpowiednie współrzędne i podziel przez 2.'], sol: [`x: (${fmt(A.x)} + ${par(B.x)}) : 2 = ${fmt(sx)}`, `y: (${fmt(A.y)} + ${par(B.y)}) : 2 = ${fmt(sy)}`] });
      },
    ),
    S(
      'dlugosc-odcinka',
      'Długość odcinka w układzie współrzędnych',
      [R('|AB| = √((x₂ − x₁)² + (y₂ − y₁)²) – to twierdzenie Pitagorasa dla trójkąta o przyprostokątnych równoległych do osi.', 'Wzór'), EX('A = (1, 1), B = (4, 5)', ['3² + 4² = 25'], '|AB| = 5')],
      (d, r) => {
        const [a, b, c] = pick(r, TRIPLES.slice(0, lvl(d, 1, 2, 3)));
        const x1 = nz(r, -4, 2), y1 = nz(r, -4, 2);
        const swap = r() < 0.5;
        const B = { x: x1 + (swap ? b : a), y: y1 + (swap ? a : b) };
        return q(sid('dlugosc-odcinka'), d, { prompt: `Oblicz długość odcinka AB, gdy A = ${pt(x1, y1)} i B = ${pt(B.x, B.y)}.`, visual: plane([{ x: x1, y: y1, label: 'A' }, { x: B.x, y: B.y, label: 'B' }], { segments: [[0, 1]] }), ans: c, hints: [`Różnice współrzędnych: ${swap ? b : a} i ${swap ? a : b}.`, 'Użyj twierdzenia Pitagorasa.'], sol: [`(${swap ? b : a})² + (${swap ? a : b})² = ${c * c}`, `|AB| = ${c}`], wrong: [[a + b, 'Odległość to nie suma różnic współrzędnych.']] });
      },
    ),
    S(
      'symetria-osie',
      'Punkt symetryczny względem osi',
      [L('względem osi x: (x, y) → (x, −y)', 'względem osi y: (x, y) → (−x, y)')],
      (d, r) => {
        const x = nz(r, -6, 6), y = nz(r, -6, 6);
        const ox = r() < 0.5;
        const right = ox ? pt(x, -y) : pt(-x, y);
        return mc(sid('symetria-osie'), d, r, { prompt: `Punkt A = ${pt(x, y)}. Jakie współrzędne ma punkt symetryczny do A względem osi ${ox ? 'x' : 'y'}?`, right, wrong: [ox ? pt(-x, y) : pt(x, -y), [pt(-x, -y), 'To symetria względem początku układu.'], pt(y, x)], hints: [`Przy symetrii względem osi ${ox ? 'x' : 'y'} zmienia się znak współrzędnej ${ox ? 'y' : 'x'}.`], sol: [`A' = ${right}`] });
      },
    ),
    S(
      'symetria-srodek',
      'Punkt symetryczny względem początku układu',
      [R('Względem punktu (0, 0): (x, y) → (−x, −y) – zmieniamy znaki obu współrzędnych.', 'Reguła')],
      (d, r) => {
        const x = nz(r, -7, 7), y = nz(r, -7, 7);
        if (d === 3) {
          const sx = nz(r, -3, 3), sy = nz(r, -3, 3);
          return mc(sid('symetria-srodek'), d, r, { prompt: `Punkt A = ${pt(x, y)}. Jakie współrzędne ma punkt symetryczny do A względem punktu S = ${pt(sx, sy)}?`, right: pt(2 * sx - x, 2 * sy - y), wrong: [pt(-x, -y), pt(sx - x, sy - y), pt(x + sx, y + sy)], hints: ['S jest środkiem odcinka AA\'.'], sol: [`x: 2 · ${par(sx)} − ${par(x)} = ${fmt(2 * sx - x)}`, `y: 2 · ${par(sy)} − ${par(y)} = ${fmt(2 * sy - y)}`] });
        }
        return mc(sid('symetria-srodek'), d, r, { prompt: `Jakie współrzędne ma punkt symetryczny do ${pt(x, y)} względem początku układu współrzędnych?`, right: pt(-x, -y), wrong: [pt(-x, y), pt(x, -y), pt(y, x)], hints: ['Zmień znaki obu współrzędnych.'], sol: [`${pt(x, y)} → ${pt(-x, -y)}`] });
      },
    ),
    S(
      'pole-w-ukladzie',
      'Pole figury w układzie współrzędnych',
      [P('Gdy boki figury są równoległe do osi, ich długości odczytujemy jako różnice współrzędnych.')],
      (d, r) => {
        const x1 = nz(r, -5, 0), y1 = nz(r, -5, 0), w = int(r, 2, 7), h = int(r, 2, 6);
        if (r() < 0.5) {
          const pts = [{ x: x1, y: y1, label: 'A' }, { x: x1 + w, y: y1, label: 'B' }, { x: x1 + w, y: y1 + h, label: 'C' }, { x: x1, y: y1 + h, label: 'D' }];
          return q(sid('pole-w-ukladzie'), d, { prompt: `Oblicz pole prostokąta ABCD o wierzchołkach A = ${pt(pts[0].x, pts[0].y)}, B = ${pt(pts[1].x, pts[1].y)}, C = ${pt(pts[2].x, pts[2].y)}, D = ${pt(pts[3].x, pts[3].y)}.`, visual: plane(pts, { poly: true }), ans: w * h, hints: [`|AB| = ${w}, |BC| = ${h}.`], sol: [`P = ${w} · ${h} = ${w * h}`] });
        }
        const pts = [{ x: x1, y: y1, label: 'A' }, { x: x1 + w, y: y1, label: 'B' }, { x: x1 + int(r, 0, w), y: y1 + h, label: 'C' }];
        return q(sid('pole-w-ukladzie'), d, { prompt: `Oblicz pole trójkąta ABC, gdy A = ${pt(pts[0].x, pts[0].y)}, B = ${pt(pts[1].x, pts[1].y)}, C = ${pt(pts[2].x, pts[2].y)}.`, visual: plane(pts, { poly: true }), ans: r6((w * h) / 2), hints: [`Podstawa AB ma długość ${w}.`, `Wysokość to odległość C od prostej AB: ${h}.`], sol: [`P = ${w} · ${h} : 2 = ${fmt(r6((w * h) / 2))}`], wrong: [[w * h, 'Pole trójkąta to połowa iloczynu podstawy i wysokości.']] });
      },
    ),
    S(
      'czwarty-wierzcholek',
      'Brakujący wierzchołek równoległoboku',
      [P('W równoległoboku ABCD: przesunięcie z A do B jest takie samo jak z D do C. Stąd C = D + (B − A).')],
      (d, r) => {
        const A = { x: nz(r, -4, 1), y: nz(r, -4, 0) };
        const vx = int(r, 2, 5), vy = d === 1 ? 0 : int(r, -1, 2);
        const ux = d === 1 ? 0 : int(r, 0, 2), uy = int(r, 2, 4);
        const B = { x: A.x + vx, y: A.y + vy }, D = { x: A.x + ux, y: A.y + uy };
        const C = { x: B.x + ux, y: B.y + uy };
        return mc(sid('czwarty-wierzcholek'), d, r, { prompt: `Trzy wierzchołki ${d === 1 ? 'prostokąta' : 'równoległoboku'} ABCD to A = ${pt(A.x, A.y)}, B = ${pt(B.x, B.y)}, D = ${pt(D.x, D.y)}. Jakie współrzędne ma wierzchołek C?`, visual: plane([{ ...A, label: 'A' }, { ...B, label: 'B' }, { ...D, label: 'D' }]), right: pt(C.x, C.y), wrong: [pt(D.x - vx, D.y - vy), pt(B.x - ux, B.y - uy), pt(C.x + 1, C.y)], hints: ['Przesuń punkt D o tyle samo, o ile B jest przesunięty względem A.'], sol: [`B − A = (${vx}, ${vy})`, `C = D + (${vx}, ${vy}) = ${pt(C.x, C.y)}`] });
      },
    ),
    S(
      'przesuniecie',
      'Przesunięcie punktu',
      [P('Przesunięcie o a jednostek w prawo i b w górę zmienia punkt (x, y) na (x + a, y + b). W lewo i w dół – odejmujemy.')],
      (d, r) => {
        const x = nz(r, -5, 5), y = nz(r, -5, 5), a = nz(r, -5, 5), b = nz(r, -5, 5);
        const dirA = a > 0 ? `${a} w prawo` : `${-a} w lewo`, dirB = b > 0 ? `${b} w górę` : `${-b} w dół`;
        return mc(sid('przesuniecie'), d, r, { prompt: `Punkt A = ${pt(x, y)} przesunięto o ${dirA} i o ${dirB}. Jakie współrzędne ma nowy punkt?`, right: pt(x + a, y + b), wrong: [pt(x + b, y + a), pt(x - a, y - b), pt(x + a, y - b)], hints: ['W prawo/w górę – dodajemy, w lewo/w dół – odejmujemy.'], sol: [`(${fmt(x)} + ${par(a)}, ${fmt(y)} + ${par(b)}) = ${pt(x + a, y + b)}`] });
      },
    ),
    S(
      'obwod-w-ukladzie',
      'Obwód figury w układzie współrzędnych',
      [P('Długości boków ukośnych liczymy z twierdzenia Pitagorasa, a poziomych i pionowych – jako różnice współrzędnych.')],
      (d, r) => {
        const [a, b, c] = pick(r, TRIPLES.slice(0, lvl(d, 1, 2, 3)));
        const x = nz(r, -4, 0), y = nz(r, -4, 0);
        const pts = [{ x, y, label: 'A' }, { x: x + a, y, label: 'B' }, { x, y: y + b, label: 'C' }];
        return q(sid('obwod-w-ukladzie'), d, { prompt: `Oblicz obwód trójkąta ABC, gdy A = ${pt(x, y)}, B = ${pt(x + a, y)}, C = ${pt(x, y + b)}.`, visual: plane(pts, { poly: true }), ans: a + b + c, hints: [`|AB| = ${a}, |AC| = ${b}.`, '|BC| oblicz z twierdzenia Pitagorasa.'], sol: [`|BC| = √(${a}² + ${b}²) = ${c}`, `Obwód: ${a} + ${b} + ${c} = ${a + b + c}`], wrong: [[a + b, 'Dodaj także długość boku BC.']] });
      },
    ),
    S(
      'mieszane',
      'Pitagoras – zadania mieszane',
      [P('W zadaniach mieszanych szukaj ukrytego trójkąta prostokątnego: w prostokącie, rombie, trapezie, w układzie współrzędnych.')],
      (d, r) => {
        const [a, b, c] = triple(d, r);
        const k = int(r, 1, 3);
        return q(sid('mieszane'), d, { prompt: `Pole prostokąta wynosi ${a * k * b * k} cm², a jeden z jego boków ma ${a * k} cm. Oblicz długość przekątnej.`, visual: rectFig(b, a, '?', `${a * k} cm`, { diagonal: 'd' }), ans: c * k, unit: 'cm', hints: ['Najpierw oblicz drugi bok z pola.', 'Potem przekątną z twierdzenia Pitagorasa.'], sol: [`Drugi bok: ${a * k * b * k} : ${a * k} = ${b * k} cm`, `d = √(${a * k}² + ${b * k}²) = ${c * k} cm`] });
      },
    ),
  ],
};

