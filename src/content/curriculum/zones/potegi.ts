/** Dział: Potęgi i pierwiastki. */
import { Fraction } from '../../../lib/fraction';
import { ERR, EX, L, P, R, fmt, frac, int, lvl, mc, numMc, nz, par, pick, q, r6, tf } from '../kit';
import type { Skill, Zone } from '../model';

const S = (id: string, title: string, theory: Skill['theory'], gen: Skill['gen']): Skill => ({ id: `w-${id}`, title, theory, gen });
const sid = (id: string) => `w-${id}`;

const SUP: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
/** Wykładnik zapisany indeksem górnym: sup(12) → ¹² */
export const sup = (n: number) => String(n).split('').map((c) => SUP[c] ?? c).join('');
/** a do potęgi n z nawiasem dla liczb ujemnych i ułamków dziesiętnych */
const pw = (a: number | string, n: number) => `${typeof a === 'number' ? par(a) : a}${sup(n)}`;

const pow = (a: number, n: number) => r6(a ** n);
/** Liczba w notacji wykładniczej: 3,2 · 10⁵ */
function sci(m: number, e: number) {
  return `${fmt(m)} · 10${sup(e)}`;
}

export const POTEGI: Zone = {
  id: 'potegi',
  title: 'Potęgi i pierwiastki',
  short: 'Działania na potęgach, notacja wykładnicza, pierwiastki kwadratowe i sześcienne.',
  mark: 'x²',
  skills: [
    S(
      'potega',
      'Potęga o wykładniku naturalnym',
      [P('Potęga to skrócony zapis mnożenia tej samej liczby: 2⁵ = 2 · 2 · 2 · 2 · 2 = 32.'), L('2 – podstawa potęgi', '5 – wykładnik (ile razy mnożymy)'), ERR('2⁵ = 2 · 5 = 10', '2⁵ = 32', 'Wykładnik mówi, ile razy mnożymy podstawę przez siebie – nie mnożymy podstawy przez wykładnik.')],
      (d, r) => {
        const a = int(r, 2, lvl(d, 5, 9, 12));
        const n = lvl(d, int(r, 2, 3), int(r, 2, 4), int(r, 3, 5));
        const ans = pow(a, n);
        return q(sid('potega'), d, { prompt: `Oblicz: ${pw(a, n)}`, ans, hints: [`${pw(a, n)} = ${Array(n).fill(a).join(' · ')}`], sol: [`${pw(a, n)} = ${Array(n).fill(a).join(' · ')} = ${fmt(ans)}`], wrong: [[a * n, 'Nie mnożymy podstawy przez wykładnik.'], [pow(n, a), 'Podstawa i wykładnik zamieniły się miejscami.']] });
      },
    ),
    S(
      'kwadraty',
      'Kwadraty i sześciany',
      [L('Kwadraty: 1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196, 225', 'Sześciany: 1, 8, 27, 64, 125, 216, 343, 512, 729, 1000'), R('Warto znać je na pamięć – przydają się przy pierwiastkach i w geometrii.', 'Wskazówka')],
      (d, r) => {
        const cube = d === 3 || r() < 0.3;
        const a = cube ? int(r, 2, lvl(d, 5, 6, 10)) : int(r, 2, lvl(d, 10, 15, 20));
        const n = cube ? 3 : 2;
        const ans = pow(a, n);
        if (r() < 0.4) return numMc(sid('kwadraty'), d, r, { prompt: `Ile wynosi ${pw(a, n)}?`, ans, wrong: [[a * n, 'Nie mnożymy podstawy przez wykładnik.'], [pow(a, n === 2 ? 3 : 2), 'Sprawdź wykładnik.']], hints: [`${a} · ${a}${cube ? ' · ' + a : ''}`], sol: [`${pw(a, n)} = ${fmt(ans)}`] });
        return q(sid('kwadraty'), d, { prompt: `Oblicz: ${pw(a, n)}`, ans, hints: [`${a} · ${a}${cube ? ' · ' + a : ''}`], sol: [`${pw(a, n)} = ${fmt(ans)}`], wrong: [[a * n, 'Nie mnożymy podstawy przez wykładnik.']] });
      },
    ),
    S(
      'ujemne',
      'Potęgi liczb ujemnych',
      [L('Liczba ujemna do potęgi **parzystej** → wynik dodatni: (−2)⁴ = 16.', 'Liczba ujemna do potęgi **nieparzystej** → wynik ujemny: (−2)³ = −8.'), ERR('−3² = 9', '−3² = −9, ale (−3)² = 9', 'Bez nawiasu potęgujemy tylko 3, a minus stoi przed wynikiem.')],
      (d, r) => {
        const a = -int(r, 1, lvl(d, 4, 6, 10));
        const n = int(r, 2, lvl(d, 3, 4, 5));
        if (d === 3 && r() < 0.5) {
          const b = -a;
          return q(sid('ujemne'), d, { prompt: `Oblicz: −${b}${sup(n)} + ${pw(a, n)}`, ans: -pow(b, n) + pow(a, n), hints: ['Bez nawiasu minus nie jest potęgowany.'], sol: [`−${b}${sup(n)} = ${fmt(-pow(b, n))}`, `${pw(a, n)} = ${fmt(pow(a, n))}`, `Wynik: ${fmt(-pow(b, n) + pow(a, n))}`] });
        }
        const ans = pow(a, n);
        return q(sid('ujemne'), d, { prompt: `Oblicz: ${pw(a, n)}`, ans, hints: [`Wykładnik ${n} jest ${n % 2 ? 'nieparzysty' : 'parzysty'}, więc wynik będzie ${n % 2 ? 'ujemny' : 'dodatni'}.`], sol: [`${pw(a, n)} = ${fmt(ans)}`], wrong: [[-ans, 'Sprawdź znak: parzysty wykładnik daje wynik dodatni, nieparzysty – ujemny.']] });
      },
    ),
    S(
      'ulamki',
      'Potęgi ułamków i liczb dziesiętnych',
      [R('({a/b})ⁿ = {aⁿ/bⁿ} – potęgujemy licznik i mianownik.', 'Ułamek zwykły'), L('0,3² = 0,09 (dwie cyfry po przecinku)', '0,2³ = 0,008 (trzy cyfry po przecinku)')],
      (d, r) => {
        const n = lvl(d, 2, int(r, 2, 3), 3);
        if (r() < 0.5) {
          const num = int(r, 1, 5), den = int(r, num + 1, 7);
          const ans = new Fraction(num ** n, den ** n);
          return q(sid('ulamki'), d, { prompt: `Oblicz: ({${num}/${den}})${sup(n)}`, ans, hints: ['Podnieś do potęgi osobno licznik i mianownik.'], sol: [`({${num}/${den}})${sup(n)} = {${num}${sup(n)}/${den}${sup(n)}} = ${frac(ans)}`], wrong: [[new Fraction(num ** n, den), 'Potęgujemy także mianownik.'], [new Fraction(num * n, den * n), 'Nie mnożymy przez wykładnik.']] });
        }
        const a = r6(int(r, 1, 9) / (d === 3 ? 10 : 10));
        const base = d === 3 && r() < 0.5 ? r6(a + int(r, 1, 2)) : a;
        const ans = pow(base, n);
        return q(sid('ulamki'), d, { prompt: `Oblicz: ${pw(base, n)}`, ans, hints: ['Pomnóż liczbę przez siebie i policz cyfry po przecinku.'], sol: [`${pw(base, n)} = ${Array(n).fill(fmt(base)).join(' · ')} = ${fmt(ans)}`], wrong: [[r6(base * n), 'Nie mnożymy przez wykładnik.'], [r6(ans * 10), 'Za mało cyfr po przecinku.']] });
      },
    ),
    S(
      'iloczyn',
      'Mnożenie potęg o tych samych podstawach',
      [R('aᵐ · aⁿ = aᵐ⁺ⁿ – wykładniki **dodajemy**.', 'Wzór'), EX('Zapisz 3⁴ · 3⁵ w postaci jednej potęgi.', ['4 + 5 = 9'], '3⁹')],
      (d, r) => {
        const a = int(r, 2, 9);
        const m = int(r, 2, lvl(d, 6, 12, 20)), n = int(r, 2, lvl(d, 6, 12, 20));
        const k = d === 3 ? int(r, 2, 9) : 0;
        const e = m + n + k;
        return q(sid('iloczyn'), d, { prompt: `Zapisz w postaci jednej potęgi liczby ${a}: ${pw(a, m)} · ${pw(a, n)}${k ? ' · ' + pw(a, k) : ''}. Podaj wykładnik.`, prefix: `${a}^`, ans: e, placeholder: 'wykładnik', answerText: `${a}${sup(e)}`, hints: ['Przy mnożeniu potęg o tych samych podstawach wykładniki dodajemy.'], sol: [`${m} + ${n}${k ? ' + ' + k : ''} = ${e}`, `Wynik: ${a}${sup(e)}`], wrong: [[m * n * (k || 1), 'Wykładniki dodajemy, a nie mnożymy.']] });
      },
    ),
    S(
      'iloraz',
      'Dzielenie potęg o tych samych podstawach',
      [R('aᵐ : aⁿ = aᵐ⁻ⁿ – wykładniki **odejmujemy**.', 'Wzór'), EX('Zapisz 7¹⁰ : 7⁴ w postaci jednej potęgi.', ['10 − 4 = 6'], '7⁶')],
      (d, r) => {
        const a = int(r, 2, 9);
        const n = int(r, 2, 8), e = int(r, 1, lvl(d, 6, 12, 20));
        const m = n + e;
        if (d === 3) {
          const k = int(r, 2, 6);
          return q(sid('iloraz'), d, { prompt: `Zapisz w postaci jednej potęgi: (${pw(a, m)} · ${pw(a, k)}) : ${pw(a, n)}. Podaj wykładnik.`, prefix: `${a}^`, ans: m + k - n, placeholder: 'wykładnik', answerText: `${a}${sup(m + k - n)}`, hints: ['Najpierw licznik: wykładniki dodaj. Potem odejmij wykładnik dzielnika.'], sol: [`${m} + ${k} − ${n} = ${m + k - n}`] });
        }
        return q(sid('iloraz'), d, { prompt: `Zapisz w postaci jednej potęgi: ${pw(a, m)} : ${pw(a, n)}. Podaj wykładnik.`, prefix: `${a}^`, ans: e, placeholder: 'wykładnik', answerText: `${a}${sup(e)}`, hints: ['Przy dzieleniu potęg o tych samych podstawach wykładniki odejmujemy.'], sol: [`${m} − ${n} = ${e}`, `Wynik: ${a}${sup(e)}`], wrong: [[m + n, 'Przy dzieleniu wykładniki odejmujemy.']] });
      },
    ),
    S(
      'potega-potegi',
      'Potęga potęgi',
      [R('(aᵐ)ⁿ = aᵐ·ⁿ – wykładniki **mnożymy**.', 'Wzór'), ERR('(2³)⁴ = 2⁷', '(2³)⁴ = 2¹²', 'Przy potędze potęgi wykładniki mnożymy, a nie dodajemy.')],
      (d, r) => {
        const a = int(r, 2, 9), m = int(r, 2, lvl(d, 4, 6, 9)), n = int(r, 2, lvl(d, 4, 6, 9));
        return q(sid('potega-potegi'), d, { prompt: `Zapisz w postaci jednej potęgi: (${pw(a, m)})${sup(n)}. Podaj wykładnik.`, prefix: `${a}^`, ans: m * n, placeholder: 'wykładnik', answerText: `${a}${sup(m * n)}`, hints: ['Wykładniki mnożymy.'], sol: [`${m} · ${n} = ${m * n}`], wrong: [[m + n, 'Przy potędze potęgi wykładniki mnożymy.']] });
      },
    ),
    S(
      'iloczynu',
      'Potęga iloczynu i ilorazu',
      [R('(a · b)ⁿ = aⁿ · bⁿ oraz (a : b)ⁿ = aⁿ : bⁿ', 'Wzory'), EX('Oblicz 2⁵ · 5⁵.', ['2⁵ · 5⁵ = (2 · 5)⁵', '10⁵ = 100 000'], '100 000')],
      (d, r) => {
        const [a, b] = pick(r, [[2, 5], [4, 25], [5, 20], [2, 50], [4, 5]] as [number, number][]);
        const n = int(r, 2, lvl(d, 3, 4, 6));
        const ans = pow(a * b, n);
        if (d === 3 && r() < 0.5) {
          const x = pick(r, [12, 18, 24, 36]);
          const y = pick(r, [2, 3, 4, 6].filter((k) => x % k === 0));
          const m = int(r, 2, 4);
          return q(sid('iloczynu'), d, { prompt: `Oblicz: ${x}${sup(m)} : ${y}${sup(m)}`, ans: pow(x / y, m), hints: ['Zapisz jako (x : y)ⁿ.'], sol: [`${x}${sup(m)} : ${y}${sup(m)} = (${x} : ${y})${sup(m)} = ${x / y}${sup(m)} = ${fmt(pow(x / y, m))}`] });
        }
        return q(sid('iloczynu'), d, { prompt: `Oblicz: ${a}${sup(n)} · ${b}${sup(n)}`, ans, hints: [`Zapisz jako (${a} · ${b})${sup(n)}.`], sol: [`${a}${sup(n)} · ${b}${sup(n)} = (${a} · ${b})${sup(n)} = ${a * b}${sup(n)} = ${fmt(ans)}`] });
      },
    ),
    S(
      'zero-jeden',
      'Potęga o wykładniku 0 i 1',
      [L('a¹ = a', 'a⁰ = 1 dla a ≠ 0', '1ⁿ = 1, 0ⁿ = 0 dla n ≥ 1'), ERR('5⁰ = 0', '5⁰ = 1', 'Każda liczba różna od zera do potęgi 0 daje 1.')],
      (d, r) => {
        const a = nz(r, -20, 99);
        const b = int(r, 2, 9);
        if (d === 1) return numMc(sid('zero-jeden'), d, r, { prompt: `Ile wynosi ${pw(a, 0)}?`, ans: 1, wrong: [[0, 'Liczba różna od zera do potęgi 0 daje 1.'], [a, 'To byłaby potęga o wykładniku 1.']], hints: ['Zapamiętaj: a⁰ = 1.'], sol: [`${pw(a, 0)} = 1`] });
        const ans = 1 + b + (d === 3 ? -pow(-1, 7) : 0);
        return q(sid('zero-jeden'), d, { prompt: `Oblicz: ${pw(a, 0)} + ${b}${sup(1)}${d === 3 ? ' − (−1)⁷' : ''}`, ans, hints: ['a⁰ = 1, a¹ = a.'], sol: [`${pw(a, 0)} = 1, ${b}${sup(1)} = ${b}${d === 3 ? ', (−1)⁷ = −1' : ''}`, `Wynik: ${ans}`], wrong: [[b, 'a⁰ to 1, a nie 0.']] });
      },
    ),
    S(
      'porownywanie',
      'Porównywanie potęg',
      [L('Ta sama podstawa większa od 1: większy wykładnik → większa potęga: 3⁵ > 3⁴.', 'Ten sam wykładnik: większa podstawa → większa potęga (dla liczb dodatnich): 5³ > 4³.'), EX('Porównaj 2¹⁰ i 4⁴.', ['4⁴ = (2²)⁴ = 2⁸', '2¹⁰ > 2⁸'], '2¹⁰ > 4⁴')],
      (d, r) => {
        if (d === 3) {
          const e1 = int(r, 6, 14), e2 = int(r, 3, 6);
          const A = 2 ** e1, B = 4 ** e2;
          const right = A > B ? '>' : A < B ? '<' : '=';
          return mc(sid('porownywanie'), d, r, { prompt: `Jaki znak wstawić w miejsce □? 2${sup(e1)} □ 4${sup(e2)}`, right, wrong: ['<', '>', '='].filter((x) => x !== right), hints: ['Zapisz 4 jako 2².'], sol: [`4${sup(e2)} = 2${sup(2 * e2)}`, `2${sup(e1)} ${right} 2${sup(2 * e2)}`] });
        }
        const a = int(r, 2, 6), m = int(r, 2, 6);
        let n = int(r, 2, 6);
        while (n === m) n = int(r, 2, 6);
        const right = m > n ? '>' : '<';
        return mc(sid('porownywanie'), d, r, { prompt: `Jaki znak wstawić w miejsce □? ${a}${sup(m)} □ ${a}${sup(n)}`, right, wrong: [right === '>' ? '<' : '>', '='], hints: ['Podstawy są takie same i większe od 1 – porównaj wykładniki.'], sol: [`${a}${sup(m)} ${right} ${a}${sup(n)}, bo ${m} ${right} ${n}.`] });
      },
    ),
    S(
      'notacja-duze',
      'Notacja wykładnicza – duże liczby',
      [R('Liczbę zapisujemy jako a · 10ⁿ, gdzie 1 ≤ a < 10.', 'Zapis'), L('350 000 = 3,5 · 10⁵', '6 000 000 = 6 · 10⁶'), ERR('35 · 10⁴', '3,5 · 10⁵', 'Pierwszy czynnik musi być mniejszy od 10.')],
      (d, r) => {
        const mant = r6(int(r, 10, 99) / 10);
        const e = int(r, lvl(d, 3, 4, 6), lvl(d, 5, 8, 12));
        const n = r6(mant * 10 ** e);
        if (r() < 0.5) return q(sid('notacja-duze'), d, { prompt: `Liczbę ${fmt(n)} zapisano w postaci ${fmt(mant)} · 10ⁿ. Ile wynosi n?`, ans: e, prefix: 'n =', hints: [`Policz, o ile miejsc trzeba przesunąć przecinek w liczbie ${fmt(mant)}, by otrzymać ${fmt(n)}.`], sol: [`${fmt(n)} = ${sci(mant, e)}`], wrong: [[e + 1, 'Policz dokładnie miejsca, o które przesuwasz przecinek.']] });
        return mc(sid('notacja-duze'), d, r, { prompt: `Która liczba to ${fmt(n)} zapisane w notacji wykładniczej?`, right: sci(mant, e), wrong: [[sci(mant, e + 1), 'Sprawdź wykładnik – policz cyfry.'], [`${fmt(r6(mant * 10))} · 10${sup(e - 1)}`, 'Pierwszy czynnik musi być mniejszy od 10.'], sci(mant, e - 1)], hints: ['Przecinek stawiamy po pierwszej cyfrze.'], sol: [`${fmt(n)} = ${sci(mant, e)}`] });
      },
    ),
    S(
      'notacja-male',
      'Notacja wykładnicza – małe liczby',
      [R('Liczby mniejsze od 1 zapisujemy z ujemnym wykładnikiem: 0,0004 = 4 · 10⁻⁴.', 'Zapis'), L('10⁻¹ = 0,1', '10⁻² = 0,01', '10⁻³ = 0,001')],
      (d, r) => {
        const mant = r6(int(r, 10, 99) / 10);
        const e = -int(r, lvl(d, 2, 3, 5), lvl(d, 4, 6, 9));
        return q(sid('notacja-male'), d, { prompt: `Liczbę 0,${'0'.repeat(-e - 1)}${String(Math.round(mant * 10)).replace(/0$/, '')} zapisano w postaci ${fmt(mant)} · 10ⁿ. Ile wynosi n?`, ans: e, prefix: 'n =', hints: ['Przecinek przesuwamy w prawo – wykładnik jest ujemny.', 'Policz, o ile miejsc.'], sol: [`Przesuwamy przecinek o ${-e} miejsc w prawo, więc n = ${e}.`], wrong: [[-e, 'Dla liczb mniejszych od 1 wykładnik jest ujemny.']] });
      },
    ),
    S(
      'notacja-dzialania',
      'Działania w notacji wykładniczej',
      [R('(a · 10ᵐ) · (b · 10ⁿ) = (a · b) · 10ᵐ⁺ⁿ', 'Mnożenie'), EX('(2 · 10⁵) · (3 · 10⁴)', ['2 · 3 = 6', '10⁵ · 10⁴ = 10⁹'], '6 · 10⁹')],
      (d, r) => {
        const a = int(r, 1, 4), b = int(r, 1, 2);
        const m = int(r, 2, 8), n = int(r, 2, 8) * (d === 3 && r() < 0.5 ? -1 : 1);
        return q(sid('notacja-dzialania'), d, { prompt: `Wynik działania (${a} · 10${sup(m)}) · (${b} · 10${sup(n)}) zapisano jako ${a * b} · 10ᵏ. Ile wynosi k?`, ans: m + n, prefix: 'k =', hints: ['Wykładniki potęg dziesięciu dodajemy.'], sol: [`${a} · ${b} = ${a * b}`, `10${sup(m)} · 10${sup(n)} = 10${sup(m + n)}`], wrong: [[m * n, 'Przy mnożeniu potęg wykładniki dodajemy.']] });
      },
    ),
    S(
      'kolejnosc',
      'Kolejność działań z potęgami',
      [L('Najpierw nawiasy, potem potęgi, potem mnożenie i dzielenie, na końcu dodawanie i odejmowanie.'), EX('Oblicz 2 + 3 · 2³.', ['2³ = 8', '3 · 8 = 24', '2 + 24 = 26'], '26')],
      (d, r) => {
        const a = int(r, 1, 9), b = int(r, 2, 5), c = int(r, 2, lvl(d, 3, 4, 5)), e = 2;
        const v = pick(r, lvl(d, [0, 1], [1, 2], [2, 3]));
        const items: [string, number, string[], [number, string][]][] = [
          [`${a} + ${b} · ${c}${sup(e)}`, a + b * c ** e, [`${c}${sup(e)} = ${c ** e}`, `${b} · ${c ** e} = ${b * c ** e}`, `${a} + ${b * c ** e} = ${a + b * c ** e}`], [[(a + b) * c ** e, 'Potęgowanie i mnożenie wykonujemy przed dodawaniem.'], [a + (b * c) ** e, 'Potęgujemy tylko liczbę ' + c + '.']]],
          [`(${a} + ${b})${sup(e)} − ${c}${sup(e)}`, (a + b) ** e - c ** e, [`(${a + b})${sup(e)} = ${(a + b) ** e}`, `${c}${sup(e)} = ${c ** e}`, `${(a + b) ** e} − ${c ** e} = ${(a + b) ** e - c ** e}`], [[a ** e + b ** e - c ** e, '(a + b)² to nie to samo co a² + b².']]],
          [`${b}${sup(3)} − ${a} · 2${sup(2)}`, b ** 3 - a * 4, [`${b}${sup(3)} = ${b ** 3}`, `${a} · 4 = ${a * 4}`, `${b ** 3} − ${a * 4} = ${b ** 3 - a * 4}`], []],
          [`(−2)${sup(c)} + ${a}${sup(2)} : ${a}`, (-2) ** c + a, [`(−2)${sup(c)} = ${(-2) ** c}`, `${a}${sup(2)} : ${a} = ${a}`, `Wynik: ${(-2) ** c + a}`], [[2 ** c + a, 'Sprawdź znak potęgi liczby ujemnej.']]],
        ];
        const [expr, ans, sol, wrong] = items[v];
        return q(sid('kolejnosc'), d, { prompt: `Oblicz: ${expr}`, ans, hints: ['Najpierw nawiasy i potęgi, potem mnożenie i dzielenie.'], sol, wrong });
      },
    ),
    S(
      'pierwiastek',
      'Pierwiastek kwadratowy',
      [P('√a to taka liczba nieujemna, która podniesiona do kwadratu daje a.'), L('√49 = 7, bo 7² = 49', '√0,25 = 0,5, bo 0,5² = 0,25', 'Pierwiastek kwadratowy z liczby ujemnej nie istnieje.')],
      (d, r) => {
        const a = int(r, 2, lvl(d, 12, 20, 30));
        if (d === 3 && r() < 0.5) {
          const x = r6(int(r, 1, 12) / 10);
          return q(sid('pierwiastek'), d, { prompt: `Oblicz: √${fmt(pow(x, 2))}`, ans: x, hints: ['Jaka liczba podniesiona do kwadratu daje tę liczbę?'], sol: [`√${fmt(pow(x, 2))} = ${fmt(x)}, bo ${fmt(x)}² = ${fmt(pow(x, 2))}`], wrong: [[r6(pow(x, 2) / 2), 'Pierwiastek to nie połowa liczby.']] });
        }
        return q(sid('pierwiastek'), d, { prompt: `Oblicz: √${a * a}`, ans: a, hints: [`Jaka liczba pomnożona przez siebie daje ${a * a}?`], sol: [`√${a * a} = ${a}, bo ${a}² = ${a * a}`], wrong: [[(a * a) / 2, 'Pierwiastek to nie połowa liczby.']] });
      },
    ),
    S(
      'szescienny',
      'Pierwiastek sześcienny',
      [P('∛a to liczba, która podniesiona do sześcianu daje a. Pierwiastek sześcienny istnieje także z liczb ujemnych.'), L('∛27 = 3', '∛(−8) = −2', '∛0,001 = 0,1')],
      (d, r) => {
        const a = int(r, 1, lvl(d, 5, 10, 10)) * (d >= 2 && r() < 0.4 ? -1 : 1);
        const v = a ** 3;
        return q(sid('szescienny'), d, { prompt: `Oblicz: ∛${v < 0 ? `(${fmt(v)})` : fmt(v)}`, ans: a, hints: [`Jaka liczba podniesiona do sześcianu daje ${fmt(v)}?`], sol: [`∛${fmt(v)} = ${fmt(a)}, bo ${par(a)}³ = ${fmt(v)}`], wrong: [[-a, 'Sprawdź znak: sześcian liczby ujemnej jest ujemny.']] });
      },
    ),
    S(
      'pierw-ulamki',
      'Pierwiastki z ułamków',
      [R('√{a/b} = {√a/√b}', 'Wzór'), EX('√{9/16}', ['√9 = 3, √16 = 4'], '{3/4}'), P('Liczbę mieszaną najpierw zamieniamy na ułamek niewłaściwy: √{2 1/4} = √{9/4} = {3/2}.')],
      (d, r) => {
        const a = int(r, 1, 9), b = int(r, a + 1, 12);
        const g = (x: number, y: number): number => (y ? g(y, x % y) : x);
        const k = g(a, b);
        const num = a / k, den = b / k;
        return q(sid('pierw-ulamki'), d, { prompt: `Oblicz: √{${num * num}/${den * den}}`, ans: new Fraction(num, den), hints: ['Wyciągnij pierwiastek osobno z licznika i z mianownika.'], sol: [`√${num * num} = ${num}, √${den * den} = ${den}`, `Wynik: {${num}/${den}}`], wrong: [[new Fraction(num * num, den), 'Pierwiastkujemy także mianownik.']] });
      },
    ),
    S(
      'szacowanie',
      'Szacowanie pierwiastków',
      [P('Aby oszacować √a, szukamy dwóch kolejnych kwadratów, między którymi leży a.'), EX('Między jakimi liczbami całkowitymi leży √50?', ['49 < 50 < 64', '7 < √50 < 8'], 'między 7 a 8')],
      (d, r) => {
        const n = int(r, 2, lvl(d, 9, 15, 30));
        const a = int(r, n * n + 1, (n + 1) * (n + 1) - 1);
        return mc(sid('szacowanie'), d, r, { prompt: `Między którymi kolejnymi liczbami całkowitymi leży √${a}?`, right: `${n} i ${n + 1}`, wrong: [`${n - 1} i ${n}`, `${n + 1} i ${n + 2}`, [`${Math.floor(a / 2)} i ${Math.floor(a / 2) + 1}`, 'Pierwiastek to nie połowa liczby.']], hints: [`Znajdź kwadraty liczb całkowitych najbliższe ${a}.`], sol: [`${n}² = ${n * n} < ${a} < ${(n + 1) ** 2} = ${n + 1}²`, `${n} < √${a} < ${n + 1}`] });
      },
    ),
    S(
      'mnozenie-pierw',
      'Mnożenie i dzielenie pierwiastków',
      [R('√a · √b = √(a · b) oraz √a : √b = √(a : b)', 'Wzory'), EX('√2 · √18', ['√(2 · 18) = √36'], '6')],
      (d, r) => {
        const [a, b] = pick(r, lvl(d, [[2, 8], [3, 12], [2, 18], [5, 20]], [[2, 32], [3, 27], [6, 24], [5, 45], [7, 28]], [[2, 50], [3, 48], [10, 40], [8, 18], [12, 27]]) as [number, number][]);
        const ans = Math.sqrt(a * b);
        if (r() < 0.3 && b % a === 0 && Number.isInteger(Math.sqrt(b / a))) return q(sid('mnozenie-pierw'), d, { prompt: `Oblicz: √${b} : √${a}`, ans: Math.sqrt(b / a), hints: ['√a : √b = √(a : b)'], sol: [`√${b} : √${a} = √${b / a} = ${Math.sqrt(b / a)}`] });
        return q(sid('mnozenie-pierw'), d, { prompt: `Oblicz: √${a} · √${b}`, ans, hints: ['Pomnóż liczby pod jednym pierwiastkiem.'], sol: [`√${a} · √${b} = √${a * b} = ${ans}`], wrong: [[a * b, 'Pod pierwiastkiem otrzymasz iloczyn – trzeba jeszcze go spierwiastkować.']] });
      },
    ),
    S(
      'wylaczanie',
      'Wyłączanie czynnika przed pierwiastek',
      [R('√(a² · b) = a√b', 'Wzór'), EX('√72', ['72 = 36 · 2', '√36 · √2 = 6√2'], '6√2')],
      (d, r) => {
        const b = pick(r, [2, 3, 5, 6, 7]);
        const a = int(r, 2, lvl(d, 5, 8, 12));
        return q(sid('wylaczanie'), d, { prompt: `Zapisz √${a * a * b} w postaci a√${b}. Podaj a.`, ans: a, unit: `√${b}`, answerText: `${a}√${b}`, hints: [`Rozłóż ${a * a * b} na iloczyn kwadratu liczby i ${b}.`], sol: [`${a * a * b} = ${a * a} · ${b}`, `√${a * a * b} = √${a * a} · √${b} = ${a}√${b}`], wrong: [[a * a, 'Spod pierwiastka wychodzi pierwiastek z kwadratu, a nie sam kwadrat.']] });
      },
    ),
    S(
      'wlaczanie',
      'Włączanie czynnika pod pierwiastek',
      [R('a√b = √(a² · b) dla a ≥ 0', 'Wzór'), EX('3√5', ['3 = √9', '√9 · √5 = √45'], '√45')],
      (d, r) => {
        const a = int(r, 2, lvl(d, 5, 8, 10)), b = pick(r, [2, 3, 5, 6, 7, 10]);
        return q(sid('wlaczanie'), d, { prompt: `Zapisz ${a}√${b} w postaci √x. Podaj x.`, prefix: '√', ans: a * a * b, hints: [`Liczbę ${a} zapisz jako √${a * a}.`], sol: [`${a}√${b} = √${a * a} · √${b} = √${a * a * b}`], wrong: [[a * b, `Pod pierwiastek wchodzi kwadrat liczby ${a}, czyli ${a * a}.`]] });
      },
    ),
    S(
      'dodawanie-pierw',
      'Dodawanie i odejmowanie pierwiastków',
      [R('Dodajemy tylko **pierwiastki podobne** (z tej samej liczby): 3√2 + 5√2 = 8√2.', 'Reguła'), ERR('√2 + √3 = √5', '√2 + √3 – nie da się uprościć', 'Pierwiastek sumy to nie suma pierwiastków.'), EX('√8 + √18', ['√8 = 2√2, √18 = 3√2', '2√2 + 3√2 = 5√2'], '5√2')],
      (d, r) => {
        const b = pick(r, [2, 3, 5]);
        const a = int(r, 1, 9), c = int(r, 1, 9);
        if (d === 3) {
          const x = int(r, 2, 4), y = int(r, 2, 5);
          return q(sid('dodawanie-pierw'), d, { prompt: `Oblicz: √${x * x * b} + √${y * y * b}. Wynik zapisz jako k√${b} i podaj k.`, ans: x + y, unit: `√${b}`, answerText: `${x + y}√${b}`, hints: ['Najpierw wyłącz czynnik przed każdy pierwiastek.'], sol: [`√${x * x * b} = ${x}√${b}, √${y * y * b} = ${y}√${b}`, `${x}√${b} + ${y}√${b} = ${x + y}√${b}`] });
        }
        const sub = r() < 0.4;
        const k = sub ? a - c : a + c;
        return q(sid('dodawanie-pierw'), d, { prompt: `Oblicz: ${a}√${b} ${sub ? '−' : '+'} ${c}√${b}. Wynik zapisz jako k√${b} i podaj k.`, ans: k, unit: `√${b}`, answerText: `${fmt(k)}√${b}`, hints: ['To pierwiastki podobne – działamy tylko na liczbach przed pierwiastkiem.'], sol: [`${a} ${sub ? '−' : '+'} ${c} = ${fmt(k)}`, `Wynik: ${fmt(k)}√${b}`] });
      },
    ),
    S(
      'pierw-potegi',
      'Pierwiastek z kwadratu i kwadrat pierwiastka',
      [L('(√a)² = a dla a ≥ 0', '√(a²) = |a|, np. √((−5)²) = 5'), EX('(3√2)²', ['3² · (√2)² = 9 · 2'], '18')],
      (d, r) => {
        const a = int(r, 2, 6), b = pick(r, [2, 3, 5, 7]);
        if (d === 1) return q(sid('pierw-potegi'), d, { prompt: `Oblicz: (√${a * 3 + 1})²`, ans: a * 3 + 1, hints: ['Kwadrat pierwiastka to liczba spod pierwiastka.'], sol: [`(√${a * 3 + 1})² = ${a * 3 + 1}`] });
        return q(sid('pierw-potegi'), d, { prompt: `Oblicz: (${a}√${b})²`, ans: a * a * b, hints: ['Podnieś do kwadratu osobno liczbę i pierwiastek.'], sol: [`(${a}√${b})² = ${a}² · (√${b})² = ${a * a} · ${b} = ${a * a * b}`], wrong: [[a * a * b * b, '(√b)² = b, a nie b².'], [2 * a * b, 'Nie mnożymy przez 2 – podnosimy do kwadratu.']] });
      },
    ),
    S(
      'porownanie-pierw',
      'Porównywanie liczb z pierwiastkami',
      [P('Aby porównać a√b i c√d, wprowadź liczby pod pierwiastek i porównaj liczby pod pierwiastkami.'), EX('Porównaj 3√2 i 2√3.', ['3√2 = √18, 2√3 = √12', '√18 > √12'], '3√2 > 2√3')],
      (d, r) => {
        const a = int(r, 2, 5), b = pick(r, [2, 3, 5, 6]);
        let c = int(r, 2, 5), e = pick(r, [2, 3, 5, 6]);
        while (a * a * b === c * c * e) (c = int(r, 2, 5), (e = pick(r, [2, 3, 5, 6])));
        const right = a * a * b > c * c * e ? '>' : '<';
        return mc(sid('porownanie-pierw'), d, r, { prompt: `Jaki znak wstawić w miejsce □? ${a}√${b} □ ${c}√${e}`, right, wrong: [right === '>' ? '<' : '>', '='], hints: ['Wprowadź liczby przed pierwiastkiem pod pierwiastek.'], sol: [`${a}√${b} = √${a * a * b}, ${c}√${e} = √${c * c * e}`, `${a}√${b} ${right} ${c}√${e}`] });
      },
    ),
    S(
      'zadania',
      'Potęgi i pierwiastki w zadaniach',
      [P('Pole kwadratu to a², więc bok kwadratu o polu P to √P. Objętość sześcianu to a³, więc krawędź to ∛V.')],
      (d, r) => {
        const a = int(r, 2, lvl(d, 12, 20, 15));
        if (d === 3 || r() < 0.3) return q(sid('zadania'), d, { prompt: `Objętość sześcianu wynosi ${a ** 3} cm³. Jaka jest długość jego krawędzi?`, ans: a, unit: 'cm', hints: ['V = a³, więc a = ∛V.'], sol: [`a = ∛${a ** 3} = ${a} cm`], wrong: [[r6((a ** 3) / 3), 'Nie dzielimy przez 3 – liczymy pierwiastek sześcienny.']] });
        if (r() < 0.5) return q(sid('zadania'), d, { prompt: `Kwadratowa działka ma pole ${a * a} m². Ile metrów siatki potrzeba na ogrodzenie całej działki?`, ans: 4 * a, unit: 'm', hints: ['Najpierw oblicz bok: a = √P.', 'Obwód kwadratu to 4a.'], sol: [`a = √${a * a} = ${a} m`, `Obwód: 4 · ${a} = ${4 * a} m`], wrong: [[a, 'To długość boku. Ogrodzenie to obwód.']] });
        return tf(sid('zadania'), d, { items: [[`Kwadrat o polu ${a * a} cm² ma bok ${a} cm.`, true, `√${a * a} = ${a}.`], [`Sześcian o krawędzi ${a} cm ma objętość ${3 * a} cm³.`, false, `V = ${a}³ = ${a ** 3} cm³.`]] });
      },
    ),
  ],
};

