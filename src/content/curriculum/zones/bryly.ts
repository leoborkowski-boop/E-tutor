/** Dział: Bryły – graniastosłupy i ostrosłupy. */
import { ERR, EX, L, P, R, V, fmt, int, lvl, mc, person, pick, q, r6, tf } from '../kit';
import { cubeFig, cuboidFig, pyramidFig, triPrismFig } from '../figures';
import type { Skill, Zone } from '../model';

const S = (id: string, title: string, theory: Skill['theory'], gen: Skill['gen']): Skill => ({ id: `b-${id}`, title, theory, gen });
const sid = (id: string) => `b-${id}`;

const TRIPLES: [number, number, number][] = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17]];
const NKAT: [number, string][] = [[3, 'trójkątnego'], [4, 'czworokątnego'], [5, 'pięciokątnego'], [6, 'sześciokątnego'], [8, 'ośmiokątnego'], [10, 'dziesięciokątnego']];

export const BRYLY: Zone = {
  id: 'bryly',
  title: 'Bryły',
  short: 'Graniastosłupy i ostrosłupy: krawędzie, siatki, pole powierzchni i objętość.',
  mark: '▣',
  skills: [
    S(
      'graniastoslup-elementy',
      'Graniastosłup: wierzchołki, krawędzie, ściany',
      [P('Graniastosłup n-kątny ma dwie podstawy (n-kąty) i n ścian bocznych (prostokąty, jeśli jest prosty).'), L('wierzchołki: 2n', 'krawędzie: 3n', 'ściany: n + 2'), V(triPrismFig(4, 3, 4), 'Graniastosłup trójkątny: 6 wierzchołków, 9 krawędzi, 5 ścian.')],
      (d, r) => {
        const [n, name] = pick(r, NKAT.slice(0, lvl(d, 3, 5, 6)));
        const what = pick(r, [['wierzchołków', 2 * n, '2n'], ['krawędzi', 3 * n, '3n'], ['ścian', n + 2, 'n + 2']] as [string, number, string][]);
        if (d === 3 && r() < 0.5) return q(sid('graniastoslup-elementy'), d, { prompt: `Graniastosłup ma ${3 * n} krawędzi. Ile ma ścian?`, ans: n + 2, hints: ['Krawędzi jest 3n – oblicz n.'], sol: [`3n = ${3 * n}, n = ${n}`, `Ściany: n + 2 = ${n + 2}`] });
        return q(sid('graniastoslup-elementy'), d, { prompt: `Ile ${what[0]} ma graniastosłup ${name}?`, ans: what[1], hints: [`W graniastosłupie n-kątnym liczba ${what[0]} to ${what[2]}.`], sol: [`n = ${n}, ${what[2]} = ${what[1]}`] });
      },
    ),
    S(
      'ostroslup-elementy',
      'Ostrosłup: wierzchołki, krawędzie, ściany',
      [P('Ostrosłup n-kątny ma jedną podstawę (n-kąt) i n ścian bocznych (trójkąty), które schodzą się w wierzchołku.'), L('wierzchołki: n + 1', 'krawędzie: 2n', 'ściany: n + 1'), V(pyramidFig(4, 4), 'Ostrosłup czworokątny: 5 wierzchołków, 8 krawędzi, 5 ścian.')],
      (d, r) => {
        const [n, name] = pick(r, NKAT.slice(0, lvl(d, 3, 5, 6)));
        const what = pick(r, [['wierzchołków', n + 1, 'n + 1'], ['krawędzi', 2 * n, '2n'], ['ścian', n + 1, 'n + 1']] as [string, number, string][]);
        if (d === 3 && r() < 0.5) return q(sid('ostroslup-elementy'), d, { prompt: `Ostrosłup ma ${2 * n} krawędzi. Ile ma wierzchołków?`, ans: n + 1, hints: ['Krawędzi jest 2n.'], sol: [`2n = ${2 * n}, n = ${n}`, `Wierzchołki: n + 1 = ${n + 1}`] });
        return q(sid('ostroslup-elementy'), d, { prompt: `Ile ${what[0]} ma ostrosłup ${name}?`, ans: what[1], hints: [`W ostrosłupie n-kątnym liczba ${what[0]} to ${what[2]}.`], sol: [`n = ${n}, ${what[2]} = ${what[1]}`], wrong: [[what[0] === 'krawędzi' ? 3 * n : 2 * n, 'To wzór dla graniastosłupa.']] });
      },
    ),
    S(
      'szescian-v',
      'Objętość sześcianu',
      [R('V = a³', 'Wzór'), EX('Krawędź 4 cm', ['4 · 4 · 4 = 64'], '64 cm³')],
      (d, r) => {
        const a = d === 3 ? r6(int(r, 2, 12) / 2) : int(r, 2, lvl(d, 6, 12, 12));
        return q(sid('szescian-v'), d, { prompt: `Oblicz objętość sześcianu o krawędzi ${fmt(a)} cm.`, visual: cubeFig(1, `${fmt(a)} cm`), ans: r6(a ** 3), unit: 'cm³', hints: ['V = a · a · a'], sol: [`V = ${fmt(a)}³ = ${fmt(r6(a ** 3))} cm³`], wrong: [[r6(3 * a), 'a³ to a · a · a, a nie 3 · a.'], [r6(6 * a * a), 'To pole powierzchni, a nie objętość.']] });
      },
    ),
    S(
      'szescian-p',
      'Pole powierzchni sześcianu',
      [R('Pc = 6a² – sześć jednakowych kwadratowych ścian.', 'Wzór')],
      (d, r) => {
        const a = int(r, 2, lvl(d, 6, 12, 15));
        if (d === 3 && r() < 0.5) return q(sid('szescian-p'), d, { prompt: `Pole powierzchni sześcianu wynosi ${6 * a * a} cm². Oblicz jego objętość.`, ans: a ** 3, unit: 'cm³', hints: ['Jedna ściana: Pc : 6. Krawędź: pierwiastek z pola ściany.'], sol: [`Ściana: ${6 * a * a} : 6 = ${a * a} cm²`, `a = ${a} cm`, `V = ${a ** 3} cm³`] });
        return q(sid('szescian-p'), d, { prompt: `Oblicz pole powierzchni sześcianu o krawędzi ${a} cm.`, visual: cubeFig(1, `${a} cm`), ans: 6 * a * a, unit: 'cm²', hints: ['Sześcian ma 6 ścian, każda to kwadrat o boku a.'], sol: [`Pc = 6 · ${a}² = 6 · ${a * a} = ${6 * a * a} cm²`], wrong: [[4 * a * a, 'Sześcian ma 6 ścian, a nie 4.'], [a ** 3, 'To objętość.']] });
      },
    ),
    S(
      'prostopadloscian-v',
      'Objętość prostopadłościanu',
      [R('V = a · b · c', 'Wzór'), V(cuboidFig(5, 3, 2, 'a', 'b', 'c'), 'Długość, szerokość i wysokość')],
      (d, r) => {
        const a = int(r, 2, 12), b = int(r, 2, 10), c = d === 3 ? r6(int(r, 3, 20) / 2) : int(r, 2, 10);
        return q(sid('prostopadloscian-v'), d, { prompt: `Oblicz objętość prostopadłościanu o wymiarach ${a} cm × ${b} cm × ${fmt(c)} cm.`, visual: cuboidFig(a, b, Number(c), `${a} cm`, `${b} cm`, `${fmt(c)} cm`), ans: r6(a * b * c), unit: 'cm³', hints: ['Pomnóż trzy wymiary.'], sol: [`V = ${a} · ${b} · ${fmt(c)} = ${fmt(r6(a * b * c))} cm³`], wrong: [[r6(a + b + c), 'Wymiary mnożymy, a nie dodajemy.']] });
      },
    ),
    S(
      'prostopadloscian-p',
      'Pole powierzchni prostopadłościanu',
      [R('Pc = 2ab + 2ac + 2bc – trzy pary jednakowych prostokątów.', 'Wzór'), EX('Wymiary 5 × 3 × 2', ['2 · 15 + 2 · 10 + 2 · 6 = 30 + 20 + 12'], '62')],
      (d, r) => {
        const a = int(r, 2, 10), b = int(r, 2, 8), c = int(r, 2, 8);
        const pc = 2 * (a * b + a * c + b * c);
        return q(sid('prostopadloscian-p'), d, { prompt: `Oblicz pole powierzchni prostopadłościanu o wymiarach ${a} cm × ${b} cm × ${c} cm.`, visual: cuboidFig(a, b, c, `${a} cm`, `${b} cm`, `${c} cm`), ans: pc, unit: 'cm²', hints: ['Oblicz pola trzech różnych ścian i pomnóż sumę przez 2.'], sol: [`${a} · ${b} = ${a * b}, ${a} · ${c} = ${a * c}, ${b} · ${c} = ${b * c}`, `Pc = 2 · (${a * b} + ${a * c} + ${b * c}) = ${pc} cm²`], wrong: [[pc / 2, 'Każda ściana występuje dwa razy.'], [a * b * c, 'To objętość.']] });
      },
    ),
    S(
      'krawedzie',
      'Suma długości krawędzi',
      [L('Prostopadłościan ma 12 krawędzi: po 4 o długościach a, b i c. Suma: 4(a + b + c).', 'Sześcian: 12a.')],
      (d, r) => {
        const a = int(r, 2, 15), b = int(r, 2, 12), c = int(r, 2, 10);
        if (d === 1) return q(sid('krawedzie'), d, { prompt: `Ile wynosi suma długości wszystkich krawędzi sześcianu o krawędzi ${a} cm?`, ans: 12 * a, unit: 'cm', hints: ['Sześcian ma 12 krawędzi.'], sol: [`12 · ${a} = ${12 * a} cm`], wrong: [[6 * a, 'Sześcian ma 12 krawędzi, a nie 6.']] });
        if (d === 3) return q(sid('krawedzie'), d, { prompt: `Z drutu o długości ${4 * (a + b + c)} cm zrobiono szkielet prostopadłościanu o wymiarach ${a} cm × ${b} cm × x cm. Ile wynosi x?`, ans: c, unit: 'cm', hints: ['Suma krawędzi to 4(a + b + c).'], sol: [`4(${a} + ${b} + x) = ${4 * (a + b + c)}`, `${a + b} + x = ${a + b + c}`, `x = ${c} cm`] });
        return q(sid('krawedzie'), d, { prompt: `Ile wynosi suma długości wszystkich krawędzi prostopadłościanu o wymiarach ${a} cm × ${b} cm × ${c} cm?`, visual: cuboidFig(a, b, c, `${a}`, `${b}`, `${c}`), ans: 4 * (a + b + c), unit: 'cm', hints: ['Każdy wymiar występuje w 4 krawędziach.'], sol: [`4 · (${a} + ${b} + ${c}) = ${4 * (a + b + c)} cm`], wrong: [[a + b + c, 'Każda długość występuje 4 razy.']] });
      },
    ),
    S(
      'jednostki',
      'Jednostki objętości i litry',
      [L('1 dm³ = 1 l (litr)', '1 dm³ = 1000 cm³', '1 cm³ = 1 ml', '1 m³ = 1000 dm³ = 1000 l'), ERR('1 m³ = 100 dm³', '1 m³ = 10 · 10 · 10 dm³ = 1000 dm³', 'Przy jednostkach sześciennych mnożnik jest „do sześcianu”.')],
      (d, r) => {
        const conv = pick(r, lvl(d, [['l', 'ml', 1000], ['dm³', 'l', 1]], [['m³', 'l', 1000], ['l', 'cm³', 1000], ['dm³', 'cm³', 1000]], [['m³', 'dm³', 1000], ['m³', 'cm³', 1000000], ['hl', 'l', 100]]) as [string, string, number][]);
        const v = r6(int(r, 1, 40) / (d === 1 ? 1 : 4));
        if (conv[2] === 1) return q(sid('jednostki'), d, { prompt: `Ile litrów to ${fmt(v)} dm³?`, ans: v, unit: 'l', hints: ['1 dm³ = 1 l.'], sol: [`${fmt(v)} dm³ = ${fmt(v)} l`] });
        if (r() < 0.5) return q(sid('jednostki'), d, { prompt: `Zamień: ${fmt(v)} ${conv[0]} = ? ${conv[1]}`, ans: r6(v * conv[2]), unit: conv[1], hints: [`1 ${conv[0]} = ${fmt(conv[2])} ${conv[1]}.`], sol: [`${fmt(v)} · ${fmt(conv[2])} = ${fmt(r6(v * conv[2]))} ${conv[1]}`], wrong: [[r6(v * 100), 'Sprawdź przelicznik jednostek objętości.']] });
        return q(sid('jednostki'), d, { prompt: `Zamień: ${fmt(r6(v * conv[2]))} ${conv[1]} = ? ${conv[0]}`, ans: v, unit: conv[0], hints: [`1 ${conv[0]} = ${fmt(conv[2])} ${conv[1]}. Podziel.`], sol: [`${fmt(r6(v * conv[2]))} : ${fmt(conv[2])} = ${fmt(v)} ${conv[0]}`] });
      },
    ),
    S(
      'akwarium',
      'Pojemność naczyń (akwarium, basen)',
      [P('Pojemność naczynia w litrach to jego objętość w dm³. Najlepiej od razu zamienić wymiary na decymetry.'), EX('Akwarium 60 cm × 30 cm × 40 cm', ['6 dm · 3 dm · 4 dm = 72 dm³'], '72 litry')],
      (d, r) => {
        const a = int(r, 3, 12) * 10, b = int(r, 2, 6) * 10, c = int(r, 2, 6) * 10;
        const litres = (a * b * c) / 1000;
        if (d === 3) {
          const fill = pick(r, [50, 75, 80]);
          return q(sid('akwarium'), d, { prompt: `Akwarium ma wymiary ${a} cm × ${b} cm × ${c} cm i jest wypełnione wodą w ${fill}%. Ile litrów wody jest w akwarium?`, ans: r6((litres * fill) / 100), unit: 'l', hints: ['Oblicz pojemność w dm³ (litrach).', `Oblicz ${fill}% tej pojemności.`], sol: [`V = ${a / 10} · ${b / 10} · ${c / 10} = ${litres} l`, `${fill}% z ${litres} = ${fmt(r6((litres * fill) / 100))} l`] });
        }
        return q(sid('akwarium'), d, { prompt: `Ile litrów wody zmieści akwarium o wymiarach ${a} cm × ${b} cm × ${c} cm?`, visual: cuboidFig(a, b, c, `${a} cm`, `${b} cm`, `${c} cm`), ans: litres, unit: 'l', hints: ['Zamień wymiary na decymetry: 10 cm = 1 dm.', '1 dm³ = 1 l'], sol: [`${a / 10} dm · ${b / 10} dm · ${c / 10} dm = ${litres} dm³ = ${litres} l`], wrong: [[a * b * c, 'To wynik w cm³ – zamień na litry (: 1000).']] });
      },
    ),
    S(
      'graniastoslup-trojkat-v',
      'Objętość graniastosłupa trójkątnego',
      [R('V = Pp · H – pole podstawy razy wysokość bryły.', 'Wzór'), P('Gdy podstawą jest trójkąt prostokątny o przyprostokątnych a i b: Pp = {a · b/2}.'), V(triPrismFig(4, 3, 5, 'a', 'b', 'H'))],
      (d, r) => {
        const a = int(r, 2, 12), b = int(r, 2, 10), H = int(r, 2, 15);
        const pp = (a * b) / 2;
        return q(sid('graniastoslup-trojkat-v'), d, { prompt: `Podstawą graniastosłupa prostego jest trójkąt prostokątny o przyprostokątnych ${a} cm i ${b} cm. Wysokość graniastosłupa wynosi ${H} cm. Oblicz jego objętość.`, visual: triPrismFig(a, b, H, `${a}`, `${b}`, `${H}`), ans: r6(pp * H), unit: 'cm³', hints: ['Najpierw pole podstawy (trójkąta).', 'V = Pp · H'], sol: [`Pp = ${a} · ${b} : 2 = ${fmt(pp)} cm²`, `V = ${fmt(pp)} · ${H} = ${fmt(r6(pp * H))} cm³`], wrong: [[a * b * H, 'Pole trójkąta to połowa iloczynu przyprostokątnych.']] });
      },
    ),
    S(
      'pole-boczne',
      'Pole powierzchni bocznej graniastosłupa',
      [R('Pole boczne graniastosłupa prostego = obwód podstawy · wysokość.', 'Wzór'), P('Pole całkowite = 2 · pole podstawy + pole boczne.')],
      (d, r) => {
        const [a, b, c] = pick(r, TRIPLES.slice(0, lvl(d, 2, 3, 5)));
        const H = int(r, 2, 12);
        if (d === 3) {
          const pc = 2 * ((a * b) / 2) + (a + b + c) * H;
          return q(sid('pole-boczne'), d, { prompt: `Podstawą graniastosłupa prostego jest trójkąt prostokątny o bokach ${a} cm, ${b} cm i ${c} cm. Wysokość bryły to ${H} cm. Oblicz pole powierzchni całkowitej.`, visual: triPrismFig(a, b, H, `${a}`, `${b}`, `${H}`), ans: pc, unit: 'cm²', hints: ['Pole boczne: obwód podstawy · H.', 'Dodaj dwa pola podstawy.'], sol: [`Pb = (${a} + ${b} + ${c}) · ${H} = ${(a + b + c) * H} cm²`, `2Pp = 2 · ${(a * b) / 2} = ${a * b} cm²`, `Pc = ${pc} cm²`] });
        }
        return q(sid('pole-boczne'), d, { prompt: `Podstawą graniastosłupa prostego jest trójkąt o bokach ${a} cm, ${b} cm i ${c} cm. Wysokość bryły to ${H} cm. Oblicz pole powierzchni bocznej.`, ans: (a + b + c) * H, unit: 'cm²', hints: ['Ściany boczne to prostokąty o wysokości H i szerokościach równych bokom podstawy.'], sol: [`Pb = (${a} + ${b} + ${c}) · ${H} = ${(a + b + c) * H} cm²`] });
      },
    ),
    S(
      'prawidlowy-czworokatny',
      'Graniastosłup prawidłowy czworokątny',
      [P('Graniastosłup prawidłowy czworokątny ma w podstawie kwadrat. V = a² · H, Pc = 2a² + 4aH.')],
      (d, r) => {
        const a = int(r, 2, 10), H = int(r, 2, 15);
        if (r() < 0.5) return q(sid('prawidlowy-czworokatny'), d, { prompt: `Graniastosłup prawidłowy czworokątny ma krawędź podstawy ${a} cm i wysokość ${H} cm. Oblicz jego objętość.`, visual: cuboidFig(a, a, H, `${a} cm`, `${a} cm`, `${H} cm`), ans: a * a * H, unit: 'cm³', hints: ['V = a² · H'], sol: [`V = ${a}² · ${H} = ${a * a * H} cm³`], wrong: [[a * H, 'Podstawą jest kwadrat – jego pole to a².']] });
        return q(sid('prawidlowy-czworokatny'), d, { prompt: `Graniastosłup prawidłowy czworokątny ma krawędź podstawy ${a} cm i wysokość ${H} cm. Oblicz pole powierzchni całkowitej.`, visual: cuboidFig(a, a, H, `${a} cm`, `${a} cm`, `${H} cm`), ans: 2 * a * a + 4 * a * H, unit: 'cm²', hints: ['Dwie podstawy (kwadraty) i cztery ściany boczne (prostokąty a × H).'], sol: [`2 · ${a}² + 4 · ${a} · ${H} = ${2 * a * a} + ${4 * a * H} = ${2 * a * a + 4 * a * H} cm²`], wrong: [[a * a + 4 * a * H, 'Bryła ma dwie podstawy.']] });
      },
    ),
    S(
      'wysokosc-z-v',
      'Wysokość lub krawędź z objętości',
      [P('Przekształcamy wzór na objętość: z V = Pp · H mamy H = V : Pp.')],
      (d, r) => {
        const a = int(r, 2, 10), b = int(r, 2, 10), H = int(r, 2, 12);
        if (d === 1) return q(sid('wysokosc-z-v'), d, { prompt: `Prostopadłościan o podstawie ${a} cm × ${b} cm ma objętość ${a * b * H} cm³. Jaka jest jego wysokość?`, ans: H, unit: 'cm', hints: ['H = V : (a · b)'], sol: [`${a * b * H} : ${a * b} = ${H} cm`] });
        const litres = int(r, 2, 20) * 10;
        const base = pick(r, [20, 25, 40, 50]);
        const h = r6((litres * 1000) / (base * base));
        if (Number.isInteger(h * 10)) return q(sid('wysokosc-z-v'), d, { prompt: `Do pustego naczynia w kształcie graniastosłupa o kwadratowej podstawie ${base} cm × ${base} cm wlano ${litres} l wody. Do jakiej wysokości sięga woda?`, ans: h, unit: 'cm', hints: [`${litres} l = ${litres * 1000} cm³`, 'H = V : Pp'], sol: [`Pp = ${base * base} cm²`, `H = ${litres * 1000} : ${base * base} = ${fmt(h)} cm`] });
        return q(sid('wysokosc-z-v'), d, { prompt: `Prostopadłościan o podstawie ${a} cm × ${b} cm ma objętość ${a * b * H} cm³. Jaka jest jego wysokość?`, ans: H, unit: 'cm', hints: ['H = V : (a · b)'], sol: [`${a * b * H} : ${a * b} = ${H} cm`] });
      },
    ),
    S(
      'przekatna-sciany',
      'Przekątna ściany prostopadłościanu',
      [P('Ściana prostopadłościanu jest prostokątem – jej przekątną liczymy z twierdzenia Pitagorasa.')],
      (d, r) => {
        const [a, b, c] = pick(r, TRIPLES.slice(0, lvl(d, 2, 3, 5)));
        const third = int(r, 2, 10);
        return q(sid('przekatna-sciany'), d, { prompt: `Prostopadłościan ma wymiary ${a} cm × ${b} cm × ${third} cm. Oblicz długość przekątnej ściany o wymiarach ${a} cm × ${b} cm.`, ans: c, unit: 'cm', hints: ['d² = a² + b²'], sol: [`d² = ${a}² + ${b}² = ${c * c}`, `d = ${c} cm`] });
      },
    ),
    S(
      'przekatna-prostopadloscianu',
      'Przekątna prostopadłościanu',
      [R('d = √(a² + b² + c²)', 'Wzór'), EX('Wymiary 2 × 3 × 6', ['4 + 9 + 36 = 49'], 'd = 7')],
      (d, r) => {
        const [a, b, c, dd] = pick(r, [[2, 3, 6, 7], [1, 4, 8, 9], [2, 6, 9, 11], [4, 4, 7, 9], [2, 10, 11, 15], [6, 6, 7, 11], [3, 4, 12, 13], [2, 5, 14, 15]] as [number, number, number, number][]);
        return q(sid('przekatna-prostopadloscianu'), d, { prompt: `Oblicz długość przekątnej prostopadłościanu o wymiarach ${a} cm × ${b} cm × ${c} cm.`, visual: cuboidFig(c, b, a, `${c}`, `${b}`, `${a}`, 'd'), ans: dd, unit: 'cm', hints: ['d² = a² + b² + c²'], sol: [`d² = ${a * a} + ${b * b} + ${c * c} = ${dd * dd}`, `d = ${dd} cm`], wrong: [[a + b + c, 'Przekątna to nie suma wymiarów.']] });
      },
    ),
    S(
      'przekatna-szescianu',
      'Przekątna sześcianu',
      [R('Przekątna sześcianu o krawędzi a: d = a√3. Przekątna ściany: a√2.', 'Wzory')],
      (d, r) => {
        const a = int(r, 2, 12);
        if (r() < 0.5) return q(sid('przekatna-szescianu'), d, { prompt: `Krawędź sześcianu ma ${a} cm. Jego przekątna ma długość k√3 cm. Ile wynosi k?`, visual: cuboidFig(3, 3, 3, `${a}`, undefined, undefined, 'd'), ans: a, unit: '√3', answerText: `${a}√3 cm`, hints: ['d = a√3'], sol: [`d = ${a}√3 cm`] });
        return q(sid('przekatna-szescianu'), d, { prompt: `Przekątna sześcianu ma ${a}√3 cm. Oblicz objętość sześcianu.`, ans: a ** 3, unit: 'cm³', hints: ['d = a√3, więc krawędź to ' + a + ' cm.'], sol: [`a = ${a} cm`, `V = ${a}³ = ${a ** 3} cm³`] });
      },
    ),
    S(
      'ostroslup-v',
      'Objętość ostrosłupa',
      [R('V = {1/3} · Pp · H', 'Wzór'), P('Ostrosłup ma trzy razy mniejszą objętość niż graniastosłup o tej samej podstawie i wysokości.'), V(pyramidFig(4, 5, 'a', 'H'))],
      (d, r) => {
        const a = int(r, 2, 12), H = 3 * int(r, 1, 6);
        if (d === 3) {
          const b = int(r, 2, 8);
          return q(sid('ostroslup-v'), d, { prompt: `Podstawą ostrosłupa jest prostokąt ${a} cm × ${b} cm, a wysokość ostrosłupa wynosi ${H} cm. Oblicz objętość.`, ans: (a * b * H) / 3, unit: 'cm³', hints: ['V = (1/3) · Pp · H'], sol: [`Pp = ${a * b} cm²`, `V = ${a * b} · ${H} : 3 = ${(a * b * H) / 3} cm³`], wrong: [[a * b * H, 'Nie zapomnij o {1/3}.']] });
        }
        return q(sid('ostroslup-v'), d, { prompt: `Ostrosłup prawidłowy czworokątny ma krawędź podstawy ${a} cm i wysokość ${H} cm. Oblicz jego objętość.`, visual: pyramidFig(a, H, `${a} cm`, `${H} cm`), ans: (a * a * H) / 3, unit: 'cm³', hints: ['Podstawa to kwadrat: Pp = a².', 'V = (1/3) · Pp · H'], sol: [`Pp = ${a}² = ${a * a} cm²`, `V = ${a * a} · ${H} : 3 = ${(a * a * H) / 3} cm³`], wrong: [[a * a * H, 'Objętość ostrosłupa to 1/3 iloczynu Pp · H.']] });
      },
    ),
    S(
      'ostroslup-p',
      'Pole powierzchni ostrosłupa',
      [P('Pole całkowite = pole podstawy + pole ścian bocznych (trójkątów).'), EX('Ostrosłup prawidłowy czworokątny: a = 6, wysokość ściany bocznej h = 5', ['Pp = 36', 'Pb = 4 · 6 · 5 : 2 = 60'], 'Pc = 96')],
      (d, r) => {
        const a = 2 * int(r, 1, 6), h = int(r, 3, 12);
        const pb = 4 * ((a * h) / 2);
        if (d === 1) return q(sid('ostroslup-p'), d, { prompt: `Ostrosłup prawidłowy czworokątny ma krawędź podstawy ${a} cm, a wysokość ściany bocznej ${h} cm. Oblicz pole powierzchni bocznej.`, ans: pb, unit: 'cm²', hints: ['Są 4 jednakowe trójkąty o podstawie a i wysokości h.'], sol: [`Jedna ściana: ${a} · ${h} : 2 = ${(a * h) / 2} cm²`, `Pb = 4 · ${(a * h) / 2} = ${pb} cm²`] });
        return q(sid('ostroslup-p'), d, { prompt: `Ostrosłup prawidłowy czworokątny ma krawędź podstawy ${a} cm, a wysokość ściany bocznej ${h} cm. Oblicz pole powierzchni całkowitej.`, ans: a * a + pb, unit: 'cm²', hints: ['Pc = Pp + Pb', 'Pp = a², Pb = 4 · (a · h : 2)'], sol: [`Pp = ${a * a} cm²`, `Pb = ${pb} cm²`, `Pc = ${a * a + pb} cm²`], wrong: [[pb, 'Dodaj pole podstawy.'], [a * a + 4 * a * h, 'Ściany boczne to trójkąty – ich pole to połowa iloczynu.']] });
      },
    ),
    S(
      'ostroslup-pitagoras',
      'Wysokość ściany bocznej ostrosłupa',
      [P('W ostrosłupie prawidłowym czworokątnym wysokość bryły H, połowa krawędzi podstawy {a/2} i wysokość ściany bocznej h tworzą trójkąt prostokątny: h² = H² + ({a/2})².')],
      (d, r) => {
        const [x, H, h] = pick(r, TRIPLES.slice(0, lvl(d, 2, 3, 5)));
        const a = 2 * x;
        return q(sid('ostroslup-pitagoras'), d, { prompt: `Ostrosłup prawidłowy czworokątny ma krawędź podstawy ${a} cm i wysokość ${H} cm. Oblicz wysokość ściany bocznej.`, visual: pyramidFig(a, H, `${a} cm`, `${H} cm`), ans: h, unit: 'cm', hints: [`Połowa krawędzi podstawy: ${x} cm.`, 'h² = H² + (a/2)²'], sol: [`h² = ${H}² + ${x}² = ${h * h}`, `h = ${h} cm`], wrong: [[r6(Math.sqrt(H * H + a * a)), 'Użyj połowy krawędzi podstawy.']] });
      },
    ),
    S(
      'siatki',
      'Siatki brył',
      [P('Siatka bryły to wszystkie jej ściany rozłożone na płaszczyźnie.'), L('siatka sześcianu: 6 kwadratów', 'siatka graniastosłupa trójkątnego: 2 trójkąty i 3 prostokąty', 'siatka ostrosłupa czworokątnego: 1 czworokąt i 4 trójkąty')],
      (d, r) => {
        const items: [string, string, string[]][] = [
          ['Z jakich wielokątów składa się siatka graniastosłupa prostego trójkątnego?', '2 trójkąty i 3 prostokąty', ['3 trójkąty i 2 prostokąty', '1 trójkąt i 3 prostokąty', '4 trójkąty']],
          ['Z jakich wielokątów składa się siatka ostrosłupa czworokątnego?', '1 czworokąt i 4 trójkąty', ['2 czworokąty i 4 trójkąty', '4 czworokąty i 1 trójkąt', '5 trójkątów']],
          ['Z ilu kwadratów składa się siatka sześcianu?', '6', ['4', '8', '12']],
          ['Ile prostokątów jest w siatce graniastosłupa prostego sześciokątnego (nie licząc podstaw)?', '6', ['8', '12', '2']],
          ['Z jakich wielokątów składa się siatka ostrosłupa trójkątnego?', '4 trójkąty', ['3 trójkąty', '1 trójkąt i 3 prostokąty', '6 trójkątów']],
        ];
        const [prompt, right, wrong] = pick(r, items.slice(0, lvl(d, 3, 4, 5)));
        return mc(sid('siatki'), d, r, { prompt, right, wrong, hints: ['Policz podstawy i ściany boczne bryły.'], sol: [`Odpowiedź: ${right}`] });
      },
    ),
    S(
      'skalowanie',
      'Zmiana wymiarów a objętość',
      [R('Gdy wszystkie wymiary bryły zwiększymy k razy, pole powierzchni wzrośnie k² razy, a objętość k³ razy.', 'Zapamiętaj'), EX('Krawędź sześcianu zwiększono 2 razy.', ['Objętość: 2³ = 8 razy większa'], '8 razy')],
      (d, r) => {
        const k = int(r, 2, lvl(d, 2, 3, 5));
        const v = r() < 0.6;
        return q(sid('skalowanie'), d, { prompt: `Krawędź sześcianu zwiększono ${k} razy. Ile razy wzrosło jego ${v ? 'objętość' : 'pole powierzchni'}?`.replace('wzrosło jego objętość', 'wzrosła jego objętość'), ans: v ? k ** 3 : k * k, unit: 'razy', hints: [v ? 'Objętość zależy od a³.' : 'Pole zależy od a².'], sol: [v ? `${k}³ = ${k ** 3}` : `${k}² = ${k * k}`], wrong: [[k, v ? 'Objętość rośnie szybciej niż krawędź – k³ razy.' : 'Pole rośnie k² razy.']] });
      },
    ),
    S(
      'kostki',
      'Ile kostek mieści się w pudełku',
      [P('Liczymy, ile kostek zmieści się wzdłuż każdej krawędzi pudełka, i mnożymy te liczby.')],
      (d, r) => {
        const k = pick(r, [1, 2, 5]);
        const x = int(r, 2, 8), y = int(r, 2, 6), z = int(r, 2, 5);
        return q(sid('kostki'), d, { prompt: `Ile sześciennych kostek o krawędzi ${k} cm zmieści się w pudełku o wymiarach ${x * k} cm × ${y * k} cm × ${z * k} cm?`, ans: x * y * z, hints: [`Wzdłuż każdej krawędzi zmieści się ${x}, ${y} i ${z} kostek.`], sol: [`${x * k} : ${k} = ${x}, ${y * k} : ${k} = ${y}, ${z * k} : ${k} = ${z}`, `${x} · ${y} · ${z} = ${x * y * z}`], wrong: [[x * k * y * k * z * k, 'To objętość pudełka w cm³ – podziel przez objętość jednej kostki.']] });
      },
    ),
    S(
      'napelnianie',
      'Napełnianie basenu',
      [P('Czas napełniania = objętość : wydajność pompy. Uważaj na jednostki: 1 m³ = 1000 l.')],
      (d, r) => {
        const who = person(r);
        const a = int(r, 2, 8), b = int(r, 2, 5), h = pick(r, [1, 1.5, 2]);
        const v = r6(a * b * h);
        const rate = pick(r, [500, 1000, 2000, 250]);
        const hours = r6((v * 1000) / rate);
        return q(sid('napelnianie'), d, { prompt: `${who.name} napełnia basen w kształcie prostopadłościanu o wymiarach ${a} m × ${b} m × ${fmt(h)} m. Pompa tłoczy ${rate} litrów wody na godzinę. Ile godzin potrwa napełnianie?`, ans: hours, unit: 'h', hints: ['Oblicz objętość w m³ i zamień na litry.', 'Podziel przez wydajność pompy.'], sol: [`V = ${a} · ${b} · ${fmt(h)} = ${fmt(v)} m³ = ${fmt(v * 1000)} l`, `${fmt(v * 1000)} : ${rate} = ${fmt(hours)} h`], wrong: [[r6(v / rate), 'Zamień m³ na litry (· 1000).']] });
      },
    ),
    S(
      'masa',
      'Masa bryły z objętości',
      [P('Masa = objętość · gęstość (masa 1 cm³ danego materiału).'), L('woda: 1 cm³ waży 1 g', 'żelazo: 1 cm³ waży około 7,8 g', 'drewno sosnowe: 1 cm³ waży około 0,5 g')],
      (d, r) => {
        const [mat, dens] = pick(r, [['żelaza', 7.8], ['aluminium', 2.7], ['drewna sosnowego', 0.5], ['szkła', 2.5]] as [string, number][]);
        const a = int(r, 2, 10);
        const vol = a ** 3;
        const m = r6(vol * dens);
        return q(sid('masa'), d, { prompt: `1 cm³ ${mat} waży ${fmt(dens)} g. Ile gramów waży sześcian z ${mat} o krawędzi ${a} cm?`, ans: m, unit: 'g', hints: ['Oblicz objętość sześcianu.', 'Pomnóż przez masę 1 cm³.'], sol: [`V = ${a}³ = ${vol} cm³`, `m = ${vol} · ${fmt(dens)} = ${fmt(m)} g`], wrong: [[r6(3 * a * dens), 'Objętość sześcianu to a³.']] });
      },
    ),
    S(
      'pr-falsz',
      'Prawda czy fałsz: bryły',
      [P('Sprawdzaj zdania o bryłach, licząc elementy albo podstawiając liczby do wzorów.')],
      (d, r) => {
        const items: [string, boolean, string][] = [
          ['Każdy sześcian jest prostopadłościanem.', true, 'Sześcian to prostopadłościan o równych krawędziach.'],
          ['Ostrosłup czworokątny ma 8 krawędzi.', true, '4 krawędzie podstawy + 4 boczne.'],
          ['Graniastosłup pięciokątny ma 10 ścian.', false, 'Ma 5 + 2 = 7 ścian.'],
          ['Objętość ostrosłupa to Pp · H.', false, 'V = {1/3} · Pp · H.'],
          ['1 m³ = 1000 litrów.', true, '1 m³ = 1000 dm³, a 1 dm³ = 1 l.'],
          ['Sześcian o krawędzi 2 cm ma objętość 6 cm³.', false, 'V = 2³ = 8 cm³.'],
          ['Ściany boczne graniastosłupa prostego są prostokątami.', true, 'Krawędzie boczne są prostopadłe do podstaw.'],
          ['Ostrosłup trójkątny ma 4 wierzchołki.', true, '3 wierzchołki podstawy i wierzchołek ostrosłupa.'],
        ];
        const a = pick(r, items), b = pick(r, items.filter((x) => x !== a));
        return tf(sid('pr-falsz'), d, { items: [a, b] });
      },
    ),
  ],
};
