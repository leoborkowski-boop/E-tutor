/** Dział: Wyrażenia algebraiczne. */
import { ERR, EX, L, P, R, V, fmt, g, int, lvl, mc, nz, par, person, pick, q, r6, tf } from '../kit';
import { rectFig } from '../figures';
import type { Skill, Zone } from '../model';

const S = (id: string, title: string, theory: Skill['theory'], gen: Skill['gen']): Skill => ({ id: `a-${id}`, title, theory, gen });
const sid = (id: string) => `a-${id}`;

/** Jednomian: współczynnik i zmienna, np. (−1, 'x') → −x */
export function mono(c: number, v: string, first = true): string {
  if (c === 0) return first ? '0' : '';
  const abs = Math.abs(c);
  const body = v && abs === 1 ? v : `${fmt(abs)}${v}`;
  if (first) return c < 0 ? `−${body}` : body;
  return c < 0 ? ` − ${body}` : ` + ${body}`;
}
/** Suma jednomianów, pomija zera: poly([[2,'x²'],[-3,'x'],[5,'']]) → 2x² − 3x + 5 */
export function poly(terms: [number, string][]): string {
  const nz = terms.filter(([c]) => c !== 0);
  if (!nz.length) return '0';
  return nz.map(([c, v], i) => mono(c, v, i === 0)).join('');
}

export const WYRAZENIA: Zone = {
  id: 'wyrazenia',
  title: 'Wyrażenia algebraiczne',
  short: 'Zapisywanie i upraszczanie wyrażeń, wartości wyrażeń, nawiasy, wzory i ciągi.',
  mark: 'ab',
  skills: [
    S(
      'zapis',
      'Zapisywanie wyrażeń algebraicznych',
      [P('Wyrażenie algebraiczne to zapis z liczbami, literami i znakami działań.'), L('liczba o 5 większa od x → x + 5', 'liczba 3 razy mniejsza od x → x : 3', 'kwadrat sumy a i b → (a + b)²', 'suma kwadratów a i b → a² + b²')],
      (d, r) => {
        const k = int(r, 2, 9);
        const items: [string, string, (string | [string, string])[]][] = [
          [`liczba o ${k} większa od x`, `x + ${k}`, [`${k}x`, `x − ${k}`, [`x : ${k}`, '„O ... większa” to dodawanie.']]],
          [`liczba ${k} razy większa od x`, `${k}x`, [`x + ${k}`, `x : ${k}`, [`${k} + x`, '„Razy większa” to mnożenie.']]],
          [`liczba o ${k} mniejsza od podwojonej liczby x`, `2x − ${k}`, [`2(x − ${k})`, `${k} − 2x`, `x − ${k}`]],
          ['kwadrat sumy liczb a i b', '(a + b)²', [['a² + b²', 'To suma kwadratów, a nie kwadrat sumy.'], '2(a + b)', 'a + b²']],
          ['suma kwadratów liczb a i b', 'a² + b²', [['(a + b)²', 'To kwadrat sumy.'], '2a + 2b', '(a + b) · 2']],
          [`połowa różnicy liczb x i ${k}`, `(x − ${k}) : 2`, [`x − ${k} : 2`, `x : 2 − ${k}`, `2(x − ${k})`]],
        ];
        const it = items[pick(r, lvl(d, [0, 1], [2, 3, 4], [3, 4, 5]))];
        return mc(sid('zapis'), d, r, { prompt: `Który zapis oznacza: **${it[0]}**?`, right: it[1], wrong: it[2], hints: ['Czytaj opis po kolei i zapisuj każde działanie.'], sol: [`${it[0]} → ${it[1]}`] });
      },
    ),
    S(
      'wartosc',
      'Wartość wyrażenia',
      [P('Aby obliczyć wartość wyrażenia, wstawiamy liczbę w miejsce litery i liczymy, pilnując kolejności działań.'), EX('Oblicz 3x² − 2x dla x = 4.', ['3 · 4² − 2 · 4', '3 · 16 − 8 = 48 − 8'], '40')],
      (d, r) => {
        const a = nz(r, -5, 6), b = nz(r, -9, 9);
        const x = d === 1 ? int(r, 1, 6) : nz(r, -5, 5);
        if (d === 1) return q(sid('wartosc'), d, { prompt: `Oblicz wartość wyrażenia ${poly([[a, 'x'], [b, '']])} dla x = ${x}.`, ans: a * x + b, hints: [`Wstaw ${x} w miejsce x.`], sol: [`${fmt(a)} · ${par(x)} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${a * x + b}`] });
        const ans = a * x * x + b * x;
        return q(sid('wartosc'), d, { prompt: `Oblicz wartość wyrażenia ${poly([[a, 'x²'], [b, 'x']])} dla x = ${fmt(x)}.`, ans, hints: [`Wstaw ${par(x)} w miejsce x. Najpierw potęga.`], sol: [`${fmt(a)} · ${par(x)}² ${b < 0 ? '−' : '+'} ${Math.abs(b)} · ${par(x)}`, `= ${fmt(a)} · ${x * x} ${b * x < 0 ? '−' : '+'} ${Math.abs(b * x)} = ${fmt(ans)}`], wrong: [[a * -(x * x) + b * x, 'Kwadrat liczby ujemnej jest dodatni.'], [(a * x) ** 2 + b * x, `Do kwadratu podnosimy tylko x, a nie ${a}x.`]] });
      },
    ),
    S(
      'wartosc-2',
      'Wartość wyrażenia z dwiema zmiennymi',
      [P('Każdą literę zastępujemy jej wartością. Liczby ujemne i ułamki wstawiamy w nawiasach.'), EX('Oblicz 2a − b² dla a = 3, b = −2.', ['2 · 3 − (−2)²', '6 − 4'], '2')],
      (d, r) => {
        const a = nz(r, -6, 6), b = nz(r, -6, 6);
        const k = int(r, 2, 5);
        const v = d === 3 ? 2 : pick(r, [0, 1]);
        const variants: [string, number][] = [
          [`${k}a + b`, k * a + b],
          [`a · b − ${k}`, a * b - k],
          [`a² − ${k}b`, a * a - k * b],
        ];
        const [ex, ans] = variants[v];
        return q(sid('wartosc-2'), d, { prompt: `Oblicz wartość wyrażenia ${ex} dla a = ${fmt(a)} i b = ${fmt(b)}.`, ans, hints: ['Wstaw liczby w nawiasach, jeśli są ujemne.'], sol: [`${ex.replace(/a/g, par(a)).replace(/b/g, par(b))} = ${fmt(ans)}`] });
      },
    ),
    S(
      'podobne',
      'Wyrazy podobne',
      [P('Wyrazy podobne mają tę samą część literową (te same litery w tych samych potęgach): 3x i −5x, 2ab i 7ab.'), R('Dodajemy wyrazy podobne, dodając ich współczynniki: 3x + 5x = 8x.', 'Redukcja'), ERR('3x + 2 = 5x', '3x + 2 nie da się uprościć', '3x i 2 to nie są wyrazy podobne.')],
      (d, r) => {
        const a = nz(r, -9, 9), b = nz(r, -9, 9);
        const c = d >= 2 ? nz(r, -9, 9) : 0;
        const k = a + b + c;
        return q(sid('podobne'), d, { prompt: `Uprość wyrażenie ${poly([[a, 'x'], [b, 'x'], ...(c ? ([[c, 'x']] as [number, string][]) : [])])}. Podaj współczynnik przy x.`, ans: k, unit: 'x', answerText: mono(k, 'x'), hints: ['Dodaj liczby stojące przed x (ze znakami).'], sol: [`${fmt(a)} + ${par(b)}${c ? ' + ' + par(c) : ''} = ${fmt(k)}`, `Wynik: ${mono(k, 'x')}`], wrong: [[a * b * (c || 1), 'Współczynniki dodajemy, a nie mnożymy.']] });
      },
    ),
    S(
      'redukcja',
      'Redukcja wyrazów podobnych',
      [P('Porządkujemy wyrażenie: osobno wyrazy z x², z x i liczby.'), EX('Uprość 5x + 3 − 2x + 7.', ['5x − 2x = 3x', '3 + 7 = 10'], '3x + 10')],
      (d, r) => {
        const a = nz(r, -8, 9), b = nz(r, -9, 9), c = nz(r, -8, 9), e = nz(r, -9, 9);
        const sq = d === 3;
        const f = sq ? nz(r, -5, 5) : 0;
        const expr = sq ? `${mono(f, 'x²')}${mono(a, 'x', false)}${mono(b, '', false)}${mono(c, 'x', false)}${mono(e, '', false)}${mono(-f + 1, 'x²', false)}` : `${mono(a, 'x')}${mono(b, '', false)}${mono(c, 'x', false)}${mono(e, '', false)}`;
        const right = poly([[sq ? 1 : 0, 'x²'], [a + c, 'x'], [b + e, '']]);
        return mc(sid('redukcja'), d, r, {
          prompt: `Uprość wyrażenie: ${expr}`,
          right,
          wrong: [poly([[sq ? 1 : 0, 'x²'], [a - c, 'x'], [b + e, '']]), poly([[sq ? 1 : 0, 'x²'], [a + c, 'x'], [b - e, '']]), [poly([[sq ? 1 : 0, 'x²'], [a + c + b + e, 'x']]), 'Liczb bez x nie dodajemy do wyrazów z x.'], poly([[sq ? -1 : 0, 'x²'], [a + c, 'x'], [b + e, '']])],
          hints: ['Zbierz osobno wyrazy z x i osobno liczby. Pilnuj znaków.'],
          sol: [`Wyrazy z x: ${fmt(a)} + ${par(c)} = ${fmt(a + c)}`, `Liczby: ${fmt(b)} + ${par(e)} = ${fmt(b + e)}`, ...(sq ? [`Wyrazy z x²: ${fmt(f)} + ${par(1 - f)} = 1`] : []), `Wynik: ${right}`],
        });
      },
    ),
    S(
      'jednomiany',
      'Mnożenie jednomianów',
      [R('Mnożymy współczynniki, a potęgi tej samej litery – dodając wykładniki: 3x · 4x = 12x², 2a · 5ab = 10a²b.', 'Reguła')],
      (d, r) => {
        const a = nz(r, -6, 9), b = nz(r, -6, 9);
        const right = d === 3 ? `${mono(a * b, 'a²b')}` : mono(a * b, 'x²');
        if (d === 3)
          return mc(sid('jednomiany'), d, r, { prompt: `Oblicz: ${mono(a, 'a')} · ${par(b) === fmt(b) ? mono(b, 'ab') : '(' + mono(b, 'ab') + ')'}`, right, wrong: [mono(a + b, 'a²b'), mono(a * b, 'ab'), mono(-a * b, 'a²b')], hints: ['Pomnóż liczby, potem litery: a · a = a².'], sol: [`${fmt(a)} · ${par(b)} = ${fmt(a * b)}`, 'a · ab = a²b', `Wynik: ${right}`] });
        return q(sid('jednomiany'), d, { prompt: `Oblicz: ${mono(a, 'x')} · ${b < 0 ? '(' + mono(b, 'x') + ')' : mono(b, 'x')}. Podaj współczynnik przy x².`, ans: a * b, unit: 'x²', answerText: right, hints: ['Pomnóż liczby, a x · x = x².'], sol: [`${fmt(a)} · ${par(b)} = ${fmt(a * b)}`, `Wynik: ${right}`], wrong: [[a + b, 'Współczynniki mnożymy.']] });
      },
    ),
    S(
      'nawias-liczba',
      'Mnożenie sumy przez liczbę',
      [R('a(b + c) = ab + ac – mnożymy **każdy** wyraz w nawiasie.', 'Rozdzielność'), ERR('3(x + 4) = 3x + 4', '3(x + 4) = 3x + 12', 'Liczbę przed nawiasem mnożymy przez każdy wyraz.')],
      (d, r) => {
        const k = nz(r, lvl(d, 2, -6, -9), 9), b = nz(r, -9, 9);
        const right = poly([[k, 'x'], [k * b, '']]);
        return mc(sid('nawias-liczba'), d, r, { prompt: `Opuść nawias: ${fmt(k)}(${poly([[1, 'x'], [b, '']])})`, right, wrong: [[poly([[k, 'x'], [b, '']]), 'Pomnóż przez liczbę także drugi wyraz w nawiasie.'], poly([[k, 'x'], [-k * b, '']]), poly([[1, 'x'], [k * b, '']])], hints: [`Pomnóż ${fmt(k)} przez x i przez ${fmt(b)}.`], sol: [`${fmt(k)} · x = ${mono(k, 'x')}`, `${fmt(k)} · ${par(b)} = ${fmt(k * b)}`, `Wynik: ${right}`] });
      },
    ),
    S(
      'dzielenie',
      'Dzielenie sumy przez liczbę',
      [R('(a + b) : k = a : k + b : k – dzielimy **każdy** wyraz.', 'Reguła'), EX('(12x − 8) : 4', ['12x : 4 = 3x', '−8 : 4 = −2'], '3x − 2')],
      (d, r) => {
        const k = int(r, 2, lvl(d, 5, 9, 12)), a = nz(r, -6, 9), b = nz(r, -9, 9);
        const right = poly([[a, 'x'], [b, '']]);
        return mc(sid('dzielenie'), d, r, { prompt: `Wykonaj dzielenie: (${poly([[k * a, 'x'], [k * b, '']])}) : ${k}`, right, wrong: [[poly([[a, 'x'], [k * b, '']]), 'Podziel przez ' + k + ' także drugi wyraz.'], poly([[k * a, 'x'], [b, '']]), poly([[a, 'x'], [-b, '']])], hints: [`Podziel przez ${k} każdy wyraz w nawiasie.`], sol: [`${mono(k * a, 'x')} : ${k} = ${mono(a, 'x')}`, `${fmt(k * b)} : ${k} = ${fmt(b)}`, `Wynik: ${right}`] });
      },
    ),
    S(
      'nawias-jednomian',
      'Mnożenie sumy przez jednomian',
      [EX('Oblicz 2x(3x − 5).', ['2x · 3x = 6x²', '2x · (−5) = −10x'], '6x² − 10x')],
      (d, r) => {
        const k = nz(r, -5, 6), a = nz(r, -5, 6), b = nz(r, -9, 9);
        const right = poly([[k * a, 'x²'], [k * b, 'x']]);
        return mc(sid('nawias-jednomian'), d, r, { prompt: `Wykonaj mnożenie: ${mono(k, 'x')}(${poly([[a, 'x'], [b, '']])})`, right, wrong: [[poly([[k * a, 'x²'], [b, 'x']]), 'Drugi wyraz też mnożymy przez ' + mono(k, 'x') + '.'], poly([[k * a, 'x'], [k * b, 'x']]), poly([[k * a, 'x²'], [k * b, '']])], hints: ['Pomnóż jednomian przez każdy wyraz w nawiasie; x · x = x².'], sol: [`${mono(k, 'x')} · ${mono(a, 'x')} = ${mono(k * a, 'x²')}`, `${mono(k, 'x')} · ${par(b)} = ${mono(k * b, 'x')}`, `Wynik: ${right}`] });
      },
    ),
    S(
      'minus-nawias',
      'Minus przed nawiasem',
      [R('Minus przed nawiasem zmienia znaki **wszystkich** wyrazów w nawiasie: −(x − 3) = −x + 3.', 'Reguła'), EX('Uprość 5x − (2x − 4).', ['5x − 2x + 4'], '3x + 4')],
      (d, r) => {
        const a = nz(r, 2, 9), b = nz(r, 1, 9), c = nz(r, -9, 9);
        const right = poly([[a - b, 'x'], [-c, '']]);
        return mc(sid('minus-nawias'), d, r, { prompt: `Uprość: ${mono(a, 'x')} − (${poly([[b, 'x'], [c, '']])})`, right, wrong: [[poly([[a - b, 'x'], [c, '']]), 'Minus przed nawiasem zmienia znak także drugiego wyrazu.'], poly([[a + b, 'x'], [-c, '']]), poly([[a + b, 'x'], [c, '']])], hints: ['Opuść nawias, zmieniając znaki obu wyrazów w nawiasie.'], sol: [`${mono(a, 'x')} − (${poly([[b, 'x'], [c, '']])}) = ${mono(a, 'x')}${mono(-b, 'x', false)}${mono(-c, '', false)}`, `= ${right}`] });
      },
    ),
    S(
      'sumy',
      'Mnożenie sum algebraicznych',
      [R('(a + b)(c + d) = ac + ad + bc + bd – każdy wyraz z każdym.', 'Reguła'), EX('(x + 2)(x + 5)', ['x² + 5x + 2x + 10'], 'x² + 7x + 10')],
      (d, r) => {
        const a = nz(r, lvl(d, 1, -6, -9), 9), b = nz(r, lvl(d, 1, -6, -9), 9);
        const right = poly([[1, 'x²'], [a + b, 'x'], [a * b, '']]);
        return mc(sid('sumy'), d, r, { prompt: `Wykonaj mnożenie: (${poly([[1, 'x'], [a, '']])})(${poly([[1, 'x'], [b, '']])})`, right, wrong: [[poly([[1, 'x²'], [a * b, '']]), 'Zapomniano o iloczynach x · ' + b + ' i ' + a + ' · x.'], poly([[1, 'x²'], [a * b, 'x'], [a + b, '']]), poly([[2, 'x'], [a * b, '']])], hints: ['Pomnóż każdy wyraz pierwszego nawiasu przez każdy wyraz drugiego.'], sol: [`x · x = x², x · ${par(b)} = ${mono(b, 'x')}, ${fmt(a)} · x = ${mono(a, 'x')}, ${fmt(a)} · ${par(b)} = ${fmt(a * b)}`, `Wynik: ${right}`] });
      },
    ),
    S(
      'wylaczanie',
      'Wyłączanie wspólnego czynnika przed nawias',
      [P('Szukamy największego wspólnego dzielnika współczynników i wspólnych liter.'), EX('6x + 9', ['NWD(6, 9) = 3'], '3(2x + 3)')],
      (d, r) => {
        const k = int(r, 2, 9);
        let a = int(r, 1, 7), b = int(r, 1, 9);
        const gcd = (x: number, y: number): number => (y ? gcd(y, x % y) : x);
        while (gcd(a, b) !== 1) (a = int(r, 1, 7), (b = int(r, 1, 9)));
        const withX = d === 3;
        const right = withX ? `${k}x(${poly([[a, 'x'], [b, '']])})` : `${k}(${poly([[a, 'x'], [b, '']])})`;
        const expr = withX ? poly([[k * a, 'x²'], [k * b, 'x']]) : poly([[k * a, 'x'], [k * b, '']]);
        return mc(sid('wylaczanie'), d, r, { prompt: `Wyłącz wspólny czynnik przed nawias: ${expr}`, right, wrong: [withX ? `${k}(${poly([[a, 'x²'], [b, 'x']])})` : `${k}(${poly([[a, 'x'], [k * b, '']])})`, withX ? `x(${poly([[k * a, 'x'], [b, '']])})` : `${k * a}(x + ${b})`, `${k}(${poly([[a, 'x'], [-b, '']])})`], hints: ['Znajdź NWD współczynników' + (withX ? ' i sprawdź, czy x występuje w każdym wyrazie.' : '.')], sol: [`${expr} = ${right}`, 'Sprawdzenie: wymnóż nawias – dostaniesz wyrażenie wyjściowe.'] });
      },
    ),
    S(
      'uprosc-oblicz',
      'Uprość, a potem oblicz',
      [P('Najpierw upraszczamy wyrażenie, dopiero potem wstawiamy liczbę – mniej liczenia i mniej pomyłek.'), EX('Oblicz 3(x + 2) − 2(x − 1) dla x = 5.', ['3x + 6 − 2x + 2 = x + 8', '5 + 8'], '13')],
      (d, r) => {
        const a = int(r, 2, 6), b = nz(r, -5, 5), c = int(r, 2, 5), e = nz(r, -5, 5);
        const x = d === 3 ? r6(int(r, 1, 9) / 2) * (r() < 0.5 ? -1 : 1) : nz(r, -4, 6);
        const coef = a - c, cons = a * b - c * e;
        const ans = r6(coef * x + cons);
        return q(sid('uprosc-oblicz'), d, { prompt: `Oblicz wartość wyrażenia ${a}(${poly([[1, 'x'], [b, '']])}) − ${c}(${poly([[1, 'x'], [e, '']])}) dla x = ${fmt(x)}.`, ans, hints: ['Najpierw opuść nawiasy i zredukuj wyrazy podobne.'], sol: [`Po uproszczeniu: ${poly([[coef, 'x'], [cons, '']])}`, `Dla x = ${fmt(x)}: ${fmt(coef)} · ${par(x)} + ${par(cons)} = ${fmt(ans)}`], wrong: [[r6(coef * x + a * b + c * e), 'Minus przed drugim nawiasem zmienia znak także jego drugiego wyrazu.']] });
      },
    ),
    S(
      'obwod-pole',
      'Wyrażenia opisujące obwód i pole',
      [P('Długości boków opisane wyrażeniami dodajemy (obwód) albo mnożymy (pole).'), V(rectFig(5, 3, 'x + 3', 'x'), 'Obwód: 2(x + 3) + 2x = 4x + 6. Pole: x(x + 3) = x² + 3x.')],
      (d, r) => {
        const k = int(r, 1, 6);
        const pole = d === 3 && r() < 0.6;
        const right = pole ? poly([[1, 'x²'], [k, 'x']]) : poly([[4, 'x'], [2 * k, '']]);
        return mc(sid('obwod-pole'), d, r, {
          prompt: `Prostokąt ma boki długości x i x + ${k}. Które wyrażenie opisuje jego ${pole ? 'pole' : 'obwód'}?`,
          visual: rectFig(5, 3, `x + ${k}`, 'x'),
          right,
          wrong: pole ? [poly([[2, 'x'], [k, '']]), poly([[4, 'x'], [2 * k, '']]), poly([[1, 'x²'], [k, '']])] : [poly([[2, 'x'], [k, '']]), poly([[4, 'x'], [k, '']]), poly([[1, 'x²'], [k, 'x']])],
          hints: [pole ? 'Pole prostokąta to iloczyn boków.' : 'Obwód to suma wszystkich czterech boków.'],
          sol: [pole ? `x(x + ${k}) = ${right}` : `2 · x + 2(x + ${k}) = ${right}`],
        });
      },
    ),
    S(
      'tekstowe',
      'Wyrażenia w zadaniach tekstowych',
      [P('Oznacz nieznaną wielkość literą i zapisz pozostałe wielkości za jej pomocą.'), EX('Ola ma x lat, a jej tata jest 4 razy starszy. Ile lat będzie miał tata za 5 lat?', ['Tata: 4x', 'Za 5 lat: 4x + 5'], '4x + 5')],
      (d, r) => {
        const p = person(r);
        const k = int(r, 2, 5), m = int(r, 2, 9);
        const v = pick(r, [0, 1, 2]);
        const items: [string, string, string[]][] = [
          [`${p.name} ma x lat, a ${g(p, 'jego', 'jej')} brat jest o ${m} lat starszy. Ile lat razem będą mieli za ${k} lata?`, poly([[2, 'x'], [m + 2 * k, '']]), [poly([[2, 'x'], [m + k, '']]), poly([[1, 'x'], [m + k, '']]), poly([[2, 'x'], [m, '']])]],
          [`Zeszyt kosztuje x zł, a długopis o ${m} zł mniej. Ile kosztuje ${k} zeszyty i długopis?`, poly([[k + 1, 'x'], [-m, '']]), [poly([[k, 'x'], [-m, '']]), poly([[k + 1, 'x'], [m, '']]), poly([[k, 'x'], [-m * k, '']])]],
          [`W skarbonce jest x monet 2-złotowych i o ${m} więcej monet 5-złotowych. Ile złotych jest w skarbonce?`, poly([[7, 'x'], [5 * m, '']]), [poly([[7, 'x'], [m, '']]), poly([[2, 'x'], [m, '']]), poly([[7, 'x'], [2 * m, '']])]],
        ];
        const [prompt, right, wrong] = items[v];
        return mc(sid('tekstowe'), d, r, { prompt, right, wrong, hints: ['Zapisz każdą wielkość z zadania za pomocą x, a potem je połącz.'], sol: [`Odpowiedź: ${right}`] });
      },
    ),
    S(
      'wzory',
      'Przekształcanie wzorów',
      [P('Wyznaczając zmienną ze wzoru, wykonujemy po obu stronach te same działania, jak przy rozwiązywaniu równania.'), EX('Wyznacz t ze wzoru s = v · t.', ['Dzielimy obie strony przez v.'], 't = s : v')],
      (d, r) => {
        const items: [string, string, string, string[]][] = [
          ['s = v · t', 'v', 'v = s : t', ['v = s · t', 'v = t : s', 'v = s − t']],
          ['P = a · h', 'h', 'h = P : a', ['h = P · a', 'h = a : P', 'h = P − a']],
          ['Ob = 2a + 2b', 'a', 'a = (Ob − 2b) : 2', ['a = Ob − 2b', 'a = Ob : 2 − 2b', 'a = (Ob + 2b) : 2']],
          ['P = {ah/2}', 'h', 'h = 2P : a', ['h = P : 2a', 'h = 2a : P', 'h = P · a : 2']],
          ['V = a · b · c', 'c', 'c = V : (a · b)', ['c = V · a · b', 'c = V : a · b', 'c = a · b : V']],
        ];
        const [f, v, right, wrong] = items[pick(r, lvl(d, [0, 1], [0, 1, 3, 4], [2, 3, 4]))];
        return mc(sid('wzory'), d, r, { prompt: `Wyznacz ${v} ze wzoru ${f}.`, right, wrong, hints: [`Zostaw ${v} samo po jednej stronie – wykonuj te same działania po obu stronach.`], sol: [`${f} → ${right}`] });
      },
    ),
    S(
      'parzyste',
      'Liczby parzyste, nieparzyste i podzielne przez k',
      [L('liczba parzysta: 2n', 'liczba nieparzysta: 2n + 1', 'liczba podzielna przez 3: 3n', 'trzy kolejne liczby naturalne: n, n + 1, n + 2')],
      (d, r) => {
        const items: [string, string, string[]][] = [
          ['Która liczba jest nieparzysta dla każdej liczby naturalnej n?', '2n + 1', ['2n', '2n + 2', 'n + 1']],
          ['Która liczba jest parzysta dla każdej liczby naturalnej n?', '2n + 4', ['2n + 1', 'n + 2', '3n']],
          ['Która liczba jest podzielna przez 3 dla każdej liczby naturalnej n?', '3n + 6', ['3n + 1', 'n + 3', '2n + 3']],
          ['Suma trzech kolejnych liczb naturalnych n, n + 1, n + 2 jest równa:', '3n + 3', ['3n + 2', 'n + 3', '3n']],
        ];
        const [prompt, right, wrong] = items[pick(r, lvl(d, [0, 1], [1, 2, 3], [2, 3]))];
        return mc(sid('parzyste'), d, r, { prompt, right, wrong, hints: ['Sprawdź dla kilku wartości n, np. n = 1, 2, 3.'], sol: [`Odpowiedź: ${right}`] });
      },
    ),
    S(
      'kolejne',
      'Kolejne liczby – szukanie liczby',
      [EX('Suma trzech kolejnych liczb naturalnych to 48. Jaka jest najmniejsza z nich?', ['n + (n + 1) + (n + 2) = 48', '3n + 3 = 48', 'n = 15'], '15')],
      (d, r) => {
        const k = lvl(d, 2, 3, pick(r, [3, 4]));
        const even = d === 3 && r() < 0.5;
        const n = even ? 2 * int(r, 3, 30) : int(r, 3, 60);
        const step = even ? 2 : 1;
        const nums = Array.from({ length: k }, (_, i) => n + i * step);
        const sum = nums.reduce((a, b) => a + b, 0);
        return q(sid('kolejne'), d, { prompt: `Suma ${k} kolejnych ${even ? 'liczb parzystych' : 'liczb naturalnych'} jest równa ${sum}. Jaka jest najmniejsza z tych liczb?`, ans: n, hints: [`Oznacz najmniejszą liczbę przez n. Kolejne to ${nums.map((_, i) => (i ? `n + ${i * step}` : 'n')).join(', ')}.`], sol: [`${k}n + ${sum - k * n} = ${sum}`, `${k}n = ${k * n}`, `n = ${n}`], wrong: [[r6(sum / k), 'To średnia tych liczb, a nie najmniejsza.']] });
      },
    ),
    S(
      'procent-wyr',
      'Wyrażenia z procentami',
      [L('x zwiększone o 20% → 1,2x', 'x zmniejszone o 15% → 0,85x', '30% liczby x → 0,3x')],
      (d, r) => {
        const p = pick(r, lvl(d, [10, 20, 50], [15, 25, 30, 40], [5, 12, 35, 8]));
        const up = r() < 0.5;
        const right = `${fmt(r6(up ? 1 + p / 100 : 1 - p / 100))}x`;
        return mc(sid('procent-wyr'), d, r, { prompt: `Cena towaru wynosi x zł. Które wyrażenie opisuje cenę po ${up ? 'podwyżce' : 'obniżce'} o ${p}%?`, right, wrong: [[`${fmt(r6(p / 100))}x`, 'To sama zmiana ceny, a nie nowa cena.'], [`x ${up ? '+' : '−'} ${p}`, 'Procent liczymy z ceny – nie dodajemy samej liczby procent.'], `${fmt(r6(up ? 1 - p / 100 : 1 + p / 100))}x`], hints: [`Nowa cena to ${up ? 100 + p : 100 - p}% starej ceny.`], sol: [`${up ? 100 + p : 100 - p}% · x = ${right}`] });
      },
    ),
    S(
      'porownanie',
      'Porównywanie wartości wyrażeń',
      [P('Gdy wyrażenie zależy od x, jego wartość zmienia się razem z x. Sprawdzaj na konkretnych liczbach.')],
      (d, r) => {
        const x = nz(r, -4, 4);
        const exprs: [string, number][] = [
          ['x²', x * x],
          ['2x', 2 * x],
          ['x + 3', x + 3],
          ['−x', -x],
          ['x³', x ** 3],
        ];
        const pool = exprs.slice(0, lvl(d, 3, 4, 5));
        const max = Math.max(...pool.map((e) => e[1]));
        const winners = pool.filter((e) => e[1] === max);
        if (winners.length > 1) return q(sid('porownanie'), d, { prompt: `Oblicz wartość wyrażenia x² + 2x dla x = ${fmt(x)}.`, ans: x * x + 2 * x, hints: ['Wstaw liczbę w miejsce x.'], sol: [`${par(x)}² + 2 · ${par(x)} = ${x * x + 2 * x}`] });
        return mc(sid('porownanie'), d, r, { prompt: `Które z wyrażeń ma największą wartość dla x = ${fmt(x)}?`, right: winners[0][0], wrong: pool.filter((e) => e[1] !== max).map((e) => [e[0], `${e[0]} = ${fmt(e[1])} dla x = ${fmt(x)}.`] as [string, string]), hints: ['Oblicz wartość każdego wyrażenia.'], sol: pool.map((e) => `${e[0]} = ${fmt(e[1])}`) });
      },
    ),
    S(
      'ciagi',
      'Ciągi liczbowe – wzór ogólny',
      [P('Wzór ogólny ciągu mówi, jak obliczyć wyraz o numerze n, np. aₙ = 3n + 1: a₁ = 4, a₂ = 7, a₃ = 10.'), EX('Oblicz a₁₀ dla aₙ = 3n + 1.', ['3 · 10 + 1'], '31')],
      (d, r) => {
        const a = nz(r, -4, 6), b = nz(r, -9, 9);
        const n = int(r, lvl(d, 2, 5, 10), lvl(d, 6, 20, 50));
        if (d === 3 && r() < 0.5) {
          const target = a * n + b;
          return q(sid('ciagi'), d, { prompt: `Ciąg dany jest wzorem aₙ = ${poly([[a, 'n'], [b, '']])}. Który wyraz tego ciągu jest równy ${fmt(target)}?`, ans: n, prefix: 'n =', hints: [`Rozwiąż równanie ${poly([[a, 'n'], [b, '']])} = ${fmt(target)}.`], sol: [`${poly([[a, 'n'], [b, '']])} = ${fmt(target)}`, `n = ${n}`] });
        }
        return q(sid('ciagi'), d, { prompt: `Ciąg dany jest wzorem aₙ = ${poly([[a, 'n'], [b, '']])}. Oblicz wyraz a${String(n).split('').map((c) => '₀₁₂₃₄₅₆₇₈₉'[Number(c)]).join('')}.`, ans: a * n + b, hints: [`Wstaw n = ${n}.`], sol: [`${fmt(a)} · ${n} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${fmt(a * n + b)}`] });
      },
    ),
    S(
      'patyczki',
      'Ciągi obrazkowe (zapałki, kwadraty)',
      [EX('Z zapałek układamy rząd kwadratów. 1 kwadrat – 4 zapałki, 2 kwadraty – 7, 3 kwadraty – 10.', ['Każdy kolejny kwadrat dodaje 3 zapałki.', 'n kwadratów: 3n + 1 zapałek.'], '3n + 1')],
      (d, r) => {
        const kind = pick(r, [
          { name: 'kwadratów w rzędzie', a: 3, b: 1, first: [4, 7, 10] },
          { name: 'trójkątów w rzędzie', a: 2, b: 1, first: [3, 5, 7] },
          { name: 'sześciokątów w rzędzie', a: 5, b: 1, first: [6, 11, 16] },
        ]);
        const n = int(r, lvl(d, 4, 10, 20), lvl(d, 8, 25, 60));
        if (d === 3 && r() < 0.5) {
          const m = kind.a * n + kind.b;
          return q(sid('patyczki'), d, { prompt: `Z zapałek układamy rząd ${kind.name}: 1 figura – ${kind.first[0]} zapałki, 2 figury – ${kind.first[1]}, 3 figury – ${kind.first[2]}. Ile figur ułożymy z ${m} zapałek?`, ans: n, hints: [`Każda kolejna figura dodaje ${kind.a} zapałki. Zapisz wzór i rozwiąż równanie.`], sol: [`${kind.a}n + ${kind.b} = ${m}`, `n = ${n}`] });
        }
        return q(sid('patyczki'), d, { prompt: `Z zapałek układamy rząd ${kind.name}: 1 figura – ${kind.first[0]} zapałki, 2 figury – ${kind.first[1]}, 3 figury – ${kind.first[2]}. Ile zapałek potrzeba na ${n} figur?`, ans: kind.a * n + kind.b, hints: [`Każda kolejna figura dodaje ${kind.a} zapałki.`, `Wzór: ${kind.a}n + ${kind.b}.`], sol: [`${kind.a} · ${n} + ${kind.b} = ${kind.a * n + kind.b}`], wrong: [[kind.first[0] * n, 'Sąsiednie figury mają wspólną zapałkę – nie liczymy jej dwa razy.']] });
      },
    ),
    S(
      'sprawdz',
      'Czy równość jest prawdziwa',
      [P('Aby sprawdzić, czy przekształcenie jest poprawne, podstaw dowolną liczbę po obu stronach. Jeśli wyniki są różne – przekształcenie jest błędne.')],
      (d, r) => {
        const a = int(r, 2, 6), b = int(r, 2, 9);
        const items: [string, boolean, string][] = [
          [`${a}(x + ${b}) = ${a}x + ${a * b}`, true, `Mnożymy ${a} przez oba wyrazy: ${a}x + ${a * b}.`],
          [`${a}(x + ${b}) = ${a}x + ${b}`, false, `Poprawnie: ${a}x + ${a * b}.`],
          ['(x + 1)² = x² + 1', false, 'Poprawnie: (x + 1)² = x² + 2x + 1.'],
          [`x · x · x = 3x`, false, 'x · x · x = x³.'],
          [`−(x − ${b}) = −x + ${b}`, true, 'Minus przed nawiasem zmienia znaki obu wyrazów.'],
          [`${a}x + ${b}x = ${a + b}x`, true, 'To wyrazy podobne – dodajemy współczynniki.'],
          [`${a}x · ${b}x = ${a * b}x`, false, `${a}x · ${b}x = ${a * b}x².`],
        ];
        const picks = [pick(r, items.slice(0, 4)), pick(r, items.slice(4))];
        return tf(sid('sprawdz'), d, { items: picks });
      },
    ),
    S(
      'wspolczynnik',
      'Współczynnik liczbowy',
      [P('Współczynnik liczbowy to liczba stojąca przed częścią literową: w wyrażeniu −7a²b współczynnik to −7. W wyrażeniu x współczynnik to 1, a w −x to −1.')],
      (d, r) => {
        const c = nz(r, -12, 12);
        const parts = pick(r, ['x', 'ab', 'x²y', 'a³']);
        if (d === 3) {
          const c2 = nz(r, -9, 9);
          return q(sid('wspolczynnik'), d, { prompt: `Jaki jest współczynnik liczbowy jednomianu ${mono(c, 'a')} · ${c2 < 0 ? '(' + mono(c2, 'ab') + ')' : mono(c2, 'ab')} po uproszczeniu?`, ans: c * c2, hints: ['Pomnóż liczby stojące przed literami.'], sol: [`${fmt(c)} · ${par(c2)} = ${fmt(c * c2)}`, `Jednomian: ${mono(c * c2, 'a²b')}`] });
        }
        return q(sid('wspolczynnik'), d, { prompt: `Jaki jest współczynnik liczbowy jednomianu ${mono(c, parts)}?`, ans: c, hints: ['To liczba stojąca przed literami, razem ze znakiem.'], sol: [`Współczynnik: ${fmt(c)}`], wrong: [[-c, 'Pamiętaj o znaku.']] });
      },
    ),
    S(
      'mieszane',
      'Wyrażenia – zadania mieszane',
      [P('W tej lekcji spotkasz różne typy zadań z wyrażeń algebraicznych.')],
      (d, r) => {
        const k = int(r, 2, 6), b = int(r, 1, 9), x = int(r, 1, 5);
        const val = k * (x + b) - x;
        return q(sid('mieszane'), d, { prompt: `Uprość wyrażenie ${k}(x + ${b}) − x i oblicz jego wartość dla x = ${x}.`, ans: val, hints: [`${k}(x + ${b}) − x = ${k - 1}x + ${k * b}`], sol: [`${k}(x + ${b}) − x = ${poly([[k - 1, 'x'], [k * b, '']])}`, `Dla x = ${x}: ${(k - 1) * x} + ${k * b} = ${val}`], wrong: [[k * (x + b) + x, 'Odejmij x, a nie dodawaj.']] });
      },
    ),
  ],
};

