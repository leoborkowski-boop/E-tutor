/** Dział: Procenty. */
import { ERR, EX, L, P, R, V, fmt, frac, g, int, lvl, mc, numMc, person, pick, q, r6, tf } from '../kit';
import { barChart } from '../figures';
import type { Skill, Zone } from '../model';

const S = (id: string, title: string, theory: Skill['theory'], gen: Skill['gen']): Skill => ({ id: `p-${id}`, title, theory, gen });
const sid = (id: string) => `p-${id}`;
const pc = (n: number) => `${fmt(n)}%`;

/** procenty „ładne” dla danego poziomu */
const P1 = [10, 20, 25, 50, 75];
const P2 = [5, 15, 30, 40, 60, 80, 12, 35];
const P3 = [2.5, 7, 12.5, 17, 23, 120, 150, 0.5];

const PRODUCTS = ['rower', 'kurtka', 'plecak', 'telefon', 'hulajnoga', 'gra', 'buty', 'zegarek'];
const PRODUCTS_FEM = new Set(['kurtka', 'hulajnoga', 'gra']);
const kosztowal = (prod: string) => (PRODUCTS_FEM.has(prod) ? 'kosztowała' : prod === 'buty' ? 'kosztowały' : 'kosztował');

export const PROCENTY: Zone = {
  id: 'procenty',
  title: 'Procenty',
  short: 'Procent liczby, podwyżki i obniżki, lokaty, VAT, stężenia i diagramy.',
  mark: '%',
  skills: [
    S(
      'jako-ulamek',
      'Procent jako ułamek',
      [P('Procent to **setna część** całości: 1% = {1/100} = 0,01.'), L('25% = {25/100} = {1/4}', '50% = {1/2}', '120% = 1,2', '0,5% = 0,005')],
      (d, r) => {
        const p = pick(r, lvl(d, P1, P2, P3));
        if (r() < 0.5) return q(sid('jako-ulamek'), d, { prompt: `Zapisz ${pc(p)} w postaci ułamka dziesiętnego.`, ans: r6(p / 100), form: 'decimal', placeholder: 'np. 0,25', hints: ['Podziel liczbę procent przez 100.'], sol: [`${pc(p)} = ${fmt(p)} : 100 = ${fmt(r6(p / 100))}`], wrong: [[r6(p / 10), 'Procent to setna część – dzielimy przez 100, nie przez 10.']] });
        return q(sid('jako-ulamek'), d, { prompt: `Zapisz ${pc(p)} w postaci ułamka zwykłego nieskracalnego.`, ans: r6(p / 100), form: 'common', placeholder: 'np. 1/4', hints: [`${pc(p)} = {${fmt(p).replace(',', '.')}/100}. Skróć ten ułamek.`], sol: [`${pc(p)} = ${frac(r6(p / 100))}`] });
      },
    ),
    S(
      'na-procent',
      'Ułamek zamieniony na procent',
      [R('Aby zamienić ułamek na procent, mnożymy go przez 100%.', 'Reguła'), L('{3/4} = {3/4} · 100% = 75%', '0,07 = 7%', '1,5 = 150%')],
      (d, r) => {
        const den = pick(r, lvl(d, [2, 4, 5, 10], [4, 5, 20, 25, 50], [8, 40, 200, 16]));
        let num = int(r, 1, den - 1);
        if (d === 3 && r() < 0.3) num = den + int(r, 1, den);
        const p = r6((num / den) * 100);
        const dec = r() < 0.4;
        return q(sid('na-procent'), d, {
          prompt: dec ? `Zapisz liczbę ${fmt(r6(num / den))} w procentach.` : `Zapisz ułamek {${num}/${den}} w procentach.`,
          ans: p,
          unit: '%',
          hints: ['Pomnóż przez 100%.', dec ? 'Przesuń przecinek o dwa miejsca w prawo.' : `Rozszerz ułamek do mianownika 100 albo podziel ${num} : ${den}.`],
          sol: [`${dec ? fmt(r6(num / den)) : `{${num}/${den}}`} · 100% = ${pc(p)}`],
          wrong: [[r6(p / 100), 'Mnożymy przez 100, a nie dzielimy.'], [num, 'To tylko licznik ułamka.']],
        });
      },
    ),
    S(
      'rysunek',
      'Jaki procent figury zamalowano',
      [P('Liczymy, jaką część całości stanowi zamalowany fragment, i zamieniamy ten ułamek na procenty.'), V({ kind: 'bar', num: 3, den: 4 }, 'Zamalowano {3/4} paska, czyli 75%.')],
      (d, r) => {
        const den = pick(r, lvl(d, [2, 4, 5, 10], [5, 10, 20, 4], [8, 20, 25, 40]));
        const num = int(r, 1, den - 1);
        const p = r6((num / den) * 100);
        return q(sid('rysunek'), d, { prompt: 'Jaki procent paska jest zamalowany?', visual: { kind: 'bar', num, den }, ans: p, unit: '%', hints: ['Zapisz zamalowaną część jako ułamek.', 'Zamień ułamek na procent – pomnóż przez 100%.'], sol: [`Zamalowano {${num}/${den}} paska.`, `{${num}/${den}} · 100% = ${pc(p)}`], wrong: [[num, 'To liczba zamalowanych części, a nie procent.']] });
      },
    ),
    S(
      'z-liczby-latwe',
      'Procent liczby: 10%, 25%, 50%',
      [L('50% to połowa: 50% z 80 = 40.', '25% to ćwiartka: 25% z 80 = 20.', '10% to jedna dziesiąta: 10% z 80 = 8.', '1% to jedna setna: 1% z 80 = 0,8.'), R('20% = 2 · 10%, 5% = połowa z 10%, 75% = 3 · 25%.', 'Sprytnie')],
      (d, r) => {
        const p = pick(r, lvl(d, [10, 50, 25], [20, 5, 75, 1], [15, 30, 2, 40]));
        const n = int(r, 2, 40) * lvl(d, 4, 20, 20);
        const ans = r6((n * p) / 100);
        return q(sid('z-liczby-latwe'), d, { prompt: `Oblicz ${pc(p)} liczby ${fmt(n)}.`, ans, hints: [p === 50 ? 'To połowa liczby.' : p === 25 ? 'To ćwiartka liczby.' : `Najpierw oblicz 10% (lub 1%) liczby ${fmt(n)}.`], sol: [`${pc(p)} z ${fmt(n)} = {${p}/100} · ${fmt(n)} = ${fmt(ans)}`], wrong: [[r6(n / p), 'Nie dziel przez liczbę procent – pomnóż przez {p/100}.'.replace('{p/100}', `{${p}/100}`)]] });
      },
    ),
    S(
      'z-liczby',
      'Procent danej liczby',
      [R('p% liczby a = {p/100} · a', 'Wzór'), EX('Oblicz 35% z 240.', ['35% = 0,35', '0,35 · 240 = 84'], '84')],
      (d, r) => {
        const p = pick(r, lvl(d, P2, [...P2, 45, 65], P3));
        const n = int(r, 2, 30) * lvl(d, 20, 20, 40);
        const ans = r6((n * p) / 100);
        if (d >= 2 && r() < 0.5) {
          const who = person(r);
          return q(sid('z-liczby'), d, { prompt: `${who.name} ${g(who, 'zebrał', 'zebrała')} ${fmt(n)} zł na wakacje. ${pc(p)} tej kwoty ${g(who, 'wydał', 'wydała')} na bilety. Ile kosztowały bilety?`, ans, unit: 'zł', hints: [`Oblicz ${pc(p)} z ${fmt(n)}.`], sol: [`${fmt(r6(p / 100))} · ${fmt(n)} = ${fmt(ans)} zł`] });
        }
        return q(sid('z-liczby'), d, { prompt: `Oblicz ${pc(p)} liczby ${fmt(n)}.`, ans, hints: [`Zamień ${pc(p)} na ułamek dziesiętny: ${fmt(r6(p / 100))}.`, `Pomnóż ${fmt(r6(p / 100))} · ${fmt(n)}.`], sol: [`${pc(p)} = ${fmt(r6(p / 100))}`, `${fmt(r6(p / 100))} · ${fmt(n)} = ${fmt(ans)}`], wrong: [[r6((n * p) / 10), 'Procent to setne części – dziel przez 100.']] });
      },
    ),
    S(
      'jakim-procentem',
      'Jakim procentem jednej liczby jest druga',
      [R('a stanowi {a/b} · 100% liczby b.', 'Wzór'), EX('Jakim procentem liczby 80 jest 12?', ['{12/80} = 0,15', '0,15 · 100% = 15%'], '15%')],
      (d, r) => {
        const p = pick(r, lvl(d, P1, P2, [...P2, 2.5, 12.5, 37.5, 150]));
        const b = pick(r, lvl(d, [20, 40, 80, 200], [40, 60, 80, 120, 200], [40, 80, 160, 240]));
        const a = r6((b * p) / 100);
        if (d >= 2 && Number.isInteger(a) && r() < 0.5) {
          const who = person(r);
          return q(sid('jakim-procentem'), d, { prompt: `Na sprawdzianie można było zdobyć ${b} punktów. ${who.name} ${g(who, 'zdobył', 'zdobyła')} ${fmt(a)}. Jaki to procent wszystkich punktów?`, ans: p, unit: '%', hints: ['Podziel liczbę zdobytych punktów przez liczbę wszystkich punktów i pomnóż przez 100%.'], sol: [`${fmt(a)} : ${b} · 100% = ${pc(p)}`], wrong: [[r6((b / a) * 100), 'Ułamek odwrócił się: część dzielimy przez całość.']] });
        }
        return q(sid('jakim-procentem'), d, { prompt: `Jakim procentem liczby ${b} jest liczba ${fmt(a)}?`, ans: p, unit: '%', hints: [`Zapisz ułamek {część/całość} = ${fmt(a)} : ${b}.`, 'Wynik pomnóż przez 100%.'], sol: [`${fmt(a)} : ${b} = ${fmt(r6(p / 100))}`, `${fmt(r6(p / 100))} · 100% = ${pc(p)}`], wrong: [[r6((b / a) * 100), 'Ułamek odwrócił się: część dzielimy przez całość.']] });
      },
    ),
    S(
      'calosc',
      'Liczba, gdy znamy jej procent',
      [P('Jeśli p% liczby to a, to 1% tej liczby to a : p, a cała liczba (100%) to (a : p) · 100.'), EX('30% liczby to 21. Jaka to liczba?', ['1% to 21 : 30 = 0,7', '100% to 0,7 · 100 = 70'], '70')],
      (d, r) => {
        const p = pick(r, lvl(d, P1, P2, P3.filter((x) => x < 100)));
        const n = int(r, 2, 30) * 20;
        const a = r6((n * p) / 100);
        if (r() < 0.5) {
          return q(sid('calosc'), d, { prompt: `Zaliczka na wycieczkę wynosi ${fmt(a)} zł, co stanowi ${pc(p)} ceny. Ile wynosi cała cena?`, ans: n, unit: 'zł', hints: [`${fmt(a)} zł to ${pc(p)}. Ile to 1%?`], sol: [`1% ceny: ${fmt(a)} : ${fmt(p)} = ${fmt(r6(a / p))} zł`, `100% ceny: ${fmt(r6(a / p))} · 100 = ${fmt(n)} zł`], wrong: [[r6((a * p) / 100), `To jest ${pc(p)} z ${fmt(a)}, a szukamy liczby, której ${pc(p)} to ${fmt(a)}.`]] });
        }
        return q(sid('calosc'), d, { prompt: `${pc(p)} pewnej liczby to ${fmt(a)}. Jaka to liczba?`, ans: n, hints: ['Najpierw oblicz 1% tej liczby.'], sol: [`1%: ${fmt(a)} : ${fmt(p)} = ${fmt(r6(a / p))}`, `100%: ${fmt(r6(a / p))} · 100 = ${fmt(n)}`], wrong: [[r6((a * p) / 100), `To jest ${pc(p)} z ${fmt(a)}, a szukamy całości.`]] });
      },
    ),
    S(
      'podwyzka',
      'Podwyżka o p%',
      [R('Po podwyżce o p% nowa cena to (100% + p%) starej ceny.', 'Reguła'), EX('Cena 80 zł wzrosła o 15%.', ['100% + 15% = 115% = 1,15', '1,15 · 80 = 92'], '92 zł')],
      (d, r) => {
        const p = pick(r, lvl(d, P1, P2, P3));
        const n = int(r, 2, 40) * lvl(d, 10, 20, 40);
        const ans = r6(n * (1 + p / 100));
        const prod = pick(r, PRODUCTS);
        return q(sid('podwyzka'), d, { prompt: `${prod[0].toUpperCase() + prod.slice(1)} ${kosztowal(prod)} ${fmt(n)} zł. Cenę podniesiono o ${pc(p)}. Ile wynosi nowa cena?`, ans, unit: 'zł', hints: [`Oblicz ${pc(p)} z ${fmt(n)} i dodaj do ceny.`, `Albo od razu: ${fmt(r6(1 + p / 100))} · ${fmt(n)}.`], sol: [`${pc(p)} z ${fmt(n)} zł = ${fmt(r6((n * p) / 100))} zł`, `${fmt(n)} + ${fmt(r6((n * p) / 100))} = ${fmt(ans)} zł`], wrong: [[r6((n * p) / 100), 'To sama podwyżka. Dodaj ją do starej ceny.'], [n + p, 'Nie dodajemy liczby procent do ceny – najpierw oblicz p% ceny.']] });
      },
    ),
    S(
      'obnizka',
      'Obniżka o p%',
      [R('Po obniżce o p% nowa cena to (100% − p%) starej ceny.', 'Reguła'), EX('Cena 120 zł spadła o 25%.', ['100% − 25% = 75%', '0,75 · 120 = 90'], '90 zł')],
      (d, r) => {
        const p = pick(r, lvl(d, P1, P2, [2.5, 7, 12.5, 17, 23, 45, 65]));
        const n = int(r, 2, 40) * lvl(d, 10, 20, 40);
        const ans = r6(n * (1 - p / 100));
        const prod = pick(r, PRODUCTS);
        return q(sid('obnizka'), d, { prompt: `Na wyprzedaży cenę ${prod === 'buty' ? 'butów' : 'produktu „' + prod + '”'} (${fmt(n)} zł) obniżono o ${pc(p)}. Ile kosztuje teraz?`, ans, unit: 'zł', hints: [`Oblicz ${pc(p)} z ${fmt(n)} i odejmij od ceny.`], sol: [`${pc(p)} z ${fmt(n)} zł = ${fmt(r6((n * p) / 100))} zł`, `${fmt(n)} − ${fmt(r6((n * p) / 100))} = ${fmt(ans)} zł`], wrong: [[r6((n * p) / 100), 'To kwota obniżki, a nie nowa cena.'], [n - p, 'Nie odejmujemy liczby procent – najpierw oblicz p% ceny.']] });
      },
    ),
    S(
      'kilka-zmian',
      'Kilka zmian ceny po kolei',
      [P('Każda kolejna zmiana procentowa liczy się od **aktualnej** ceny, a nie od początkowej.'), ERR('Podwyżka o 20%, potem obniżka o 20% – cena wraca do początkowej.', '100 zł → 120 zł → 96 zł', 'Obniżkę liczymy od 120 zł, więc odejmujemy 24 zł, a nie 20 zł.')],
      (d, r) => {
        const n = int(r, 2, 20) * 50;
        const p1 = pick(r, [10, 20, 25, 50]);
        const p2 = pick(r, [10, 20, 25, 50]);
        const after1 = r6(n * (1 + p1 / 100));
        const ans = r6(after1 * (1 - p2 / 100));
        return q(sid('kilka-zmian'), d, { prompt: `Cena towaru wynosiła ${fmt(n)} zł. Najpierw wzrosła o ${pc(p1)}, a potem zmalała o ${pc(p2)}. Ile wynosi cena końcowa?`, ans, unit: 'zł', hints: ['Najpierw oblicz cenę po podwyżce.', `Obniżkę licz od nowej ceny (${fmt(after1)} zł).`], sol: [`Po podwyżce: ${fmt(r6(1 + p1 / 100))} · ${fmt(n)} = ${fmt(after1)} zł`, `Po obniżce: ${fmt(r6(1 - p2 / 100))} · ${fmt(after1)} = ${fmt(ans)} zł`], wrong: [[r6(n * (1 + (p1 - p2) / 100)), 'Drugą zmianę liczymy od ceny po pierwszej zmianie, a nie od ceny początkowej.']] });
      },
    ),
    S(
      'o-ile-procent',
      'O ile procent wzrosła lub zmalała cena',
      [R('Zmiana procentowa = {różnica/cena początkowa} · 100%', 'Wzór'), EX('Cena wzrosła z 40 zł do 50 zł.', ['Różnica: 10 zł', '{10/40} · 100% = 25%'], 'o 25%')],
      (d, r) => {
        const p = pick(r, lvl(d, P1, P2, [2.5, 12.5, 35, 45, 120]));
        const n = pick(r, [40, 80, 120, 200, 160, 240]);
        const up = r() < 0.5 || p >= 100;
        const m = r6(n * (1 + (up ? p : -p) / 100));
        return q(sid('o-ile-procent'), d, { prompt: `Cena biletu ${up ? 'wzrosła' : 'spadła'} z ${fmt(n)} zł do ${fmt(m)} zł. O ile procent ${up ? 'wzrosła' : 'spadła'}?`, ans: p, unit: '%', hints: ['Oblicz różnicę cen.', 'Podziel różnicę przez cenę **początkową**.'], sol: [`Różnica: ${fmt(r6(Math.abs(m - n)))} zł`, `${fmt(r6(Math.abs(m - n)))} : ${fmt(n)} · 100% = ${pc(p)}`], wrong: [[r6((Math.abs(m - n) / m) * 100), 'Różnicę dzielimy przez cenę początkową, nie końcową.'], [r6(Math.abs(m - n)), 'To różnica w złotych, a nie w procentach.']] });
      },
    ),
    S(
      'przed-obnizka',
      'Cena przed obniżką',
      [P('Jeśli po obniżce o p% towar kosztuje a, to a stanowi (100 − p)% starej ceny.'), EX('Po obniżce o 20% kurtka kosztuje 160 zł.', ['160 zł to 80% ceny.', '1%: 160 : 80 = 2 zł', '100%: 200 zł'], '200 zł')],
      (d, r) => {
        const p = pick(r, lvl(d, [10, 20, 25, 50], [15, 30, 40, 60], [12.5, 35, 45, 5]));
        const n = int(r, 2, 30) * 40;
        const a = r6(n * (1 - p / 100));
        return q(sid('przed-obnizka'), d, { prompt: `Po obniżce o ${pc(p)} gra kosztuje ${fmt(a)} zł. Ile kosztowała przed obniżką?`, ans: n, unit: 'zł', hints: [`${fmt(a)} zł to ${pc(100 - p)} starej ceny.`, 'Oblicz 1% starej ceny.'], sol: [`${fmt(a)} zł = ${pc(100 - p)} ceny`, `100%: ${fmt(a)} : ${fmt(r6(1 - p / 100))} = ${fmt(n)} zł`], wrong: [[r6(a * (1 + p / 100)), 'Nie dodajemy p% do nowej ceny – procent liczono od starej ceny.']] });
      },
    ),
    S(
      'punkty-proc',
      'Punkty procentowe',
      [P('Różnicę dwóch procentów nazywamy **punktami procentowymi**.'), EX('Poparcie wzrosło z 20% do 25%.', ['Wzrost o 5 punktów procentowych.', 'Ale względnie: {5/20} = 25%.'], 'o 5 p.p., czyli o 25%')],
      (d, r) => {
        const a = pick(r, [10, 20, 25, 40, 50]);
        const b = a + pick(r, lvl(d, [5, 10], [5, 10, 15], [2, 5, 10, 15]));
        if (d === 1 || r() < 0.5)
          return q(sid('punkty-proc'), d, { prompt: `Oprocentowanie lokaty wzrosło z ${pc(a)} do ${pc(b)}. O ile punktów procentowych wzrosło?`, ans: b - a, unit: 'p.p.', hints: ['Odejmij procenty od siebie.'], sol: [`${b} − ${a} = ${b - a} punktów procentowych`] });
        const rel = r6(((b - a) / a) * 100);
        return q(sid('punkty-proc'), d, { prompt: `Frekwencja wzrosła z ${pc(a)} do ${pc(b)}. O ile **procent** wzrosła?`, ans: rel, unit: '%', hints: [`Wzrost o ${b - a} p.p. porównaj z wartością początkową (${a}).`], sol: [`Wzrost: ${b - a} p.p.`, `${b - a} : ${a} · 100% = ${pc(rel)}`], wrong: [[b - a, 'To liczba punktów procentowych, a pytanie dotyczy procentów.']] });
      },
    ),
    S(
      'vat',
      'VAT, cena netto i brutto',
      [L('Cena **netto** – bez podatku.', 'Cena **brutto** – z podatkiem VAT.', 'Przy VAT 23%: brutto = 1,23 · netto.'), EX('Netto 200 zł, VAT 23%.', ['23% z 200 = 46', '200 + 46 = 246'], '246 zł')],
      (d, r) => {
        const v = pick(r, [23, 8, 5]);
        const netto = int(r, 1, 40) * lvl(d, 100, 50, 25);
        const brutto = r6(netto * (1 + v / 100));
        if (d === 3 && r() < 0.6) return q(sid('vat'), d, { prompt: `Cena brutto laptopa (z VAT ${v}%) wynosi ${fmt(brutto)} zł. Ile wynosi cena netto?`, ans: netto, unit: 'zł', hints: [`Cena brutto to ${100 + v}% ceny netto.`], sol: [`${fmt(brutto)} : ${fmt(r6(1 + v / 100))} = ${fmt(netto)} zł`], wrong: [[r6(brutto * (1 - v / 100)), 'VAT liczony jest od ceny netto, więc nie odejmujemy 23% od brutto.']] });
        return q(sid('vat'), d, { prompt: `Cena netto usługi wynosi ${fmt(netto)} zł, a stawka VAT to ${v}%. Ile wynosi cena brutto?`, ans: brutto, unit: 'zł', hints: [`Oblicz ${v}% z ${fmt(netto)} i dodaj do ceny netto.`], sol: [`VAT: ${fmt(r6((netto * v) / 100))} zł`, `Brutto: ${fmt(netto)} + ${fmt(r6((netto * v) / 100))} = ${fmt(brutto)} zł`], wrong: [[r6((netto * v) / 100), 'To sam podatek. Dodaj go do ceny netto.']] });
      },
    ),
    S(
      'lokata',
      'Lokata na rok – odsetki',
      [P('Bank dopisuje do lokaty **odsetki**: p% wpłaconej kwoty za rok.'), EX('Wpłata 2000 zł na 4% w skali roku.', ['4% z 2000 = 80 zł', 'Po roku: 2080 zł'], '2080 zł')],
      (d, r) => {
        const k = int(r, 1, 20) * 500;
        const p = pick(r, lvl(d, [2, 4, 5, 10], [3, 6, 2.5, 4], [3.5, 1.5, 6.5]));
        const ods = r6((k * p) / 100);
        const who = person(r);
        if (r() < 0.5) return q(sid('lokata'), d, { prompt: `${who.name} ${g(who, 'wpłacił', 'wpłaciła')} ${fmt(k)} zł na roczną lokatę oprocentowaną ${pc(p)} w skali roku. Ile odsetek dopisze bank po roku?`, ans: ods, unit: 'zł', hints: [`Oblicz ${pc(p)} z ${fmt(k)}.`], sol: [`${fmt(r6(p / 100))} · ${fmt(k)} = ${fmt(ods)} zł`] });
        return q(sid('lokata'), d, { prompt: `${who.name} ${g(who, 'wpłacił', 'wpłaciła')} ${fmt(k)} zł na roczną lokatę oprocentowaną ${pc(p)} w skali roku. Ile będzie na lokacie po roku?`, ans: r6(k + ods), unit: 'zł', hints: [`Oblicz odsetki: ${pc(p)} z ${fmt(k)}.`, 'Dodaj odsetki do wpłaty.'], sol: [`Odsetki: ${fmt(ods)} zł`, `${fmt(k)} + ${fmt(ods)} = ${fmt(r6(k + ods))} zł`], wrong: [[ods, 'To same odsetki. Dodaj je do wpłaconej kwoty.']] });
      },
    ),
    S(
      'lokata-2lata',
      'Lokata na dwa lata (kapitalizacja)',
      [P('Przy **kapitalizacji rocznej** odsetki z pierwszego roku dopisuje się do lokaty i w drugim roku one też „pracują”.'), EX('1000 zł, 10% rocznie, 2 lata.', ['Po roku: 1,1 · 1000 = 1100', 'Po 2 latach: 1,1 · 1100 = 1210'], '1210 zł')],
      (d, r) => {
        const k = int(r, 1, 10) * 1000;
        const p = pick(r, lvl(d, [10, 5], [10, 5, 4, 2], [3, 6, 8]));
        const y1 = r6(k * (1 + p / 100));
        const y2 = r6(y1 * (1 + p / 100));
        return q(sid('lokata-2lata'), d, { prompt: `Na lokatę z roczną kapitalizacją odsetek wpłacono ${fmt(k)} zł. Oprocentowanie wynosi ${pc(p)} w skali roku. Ile będzie na lokacie po 2 latach?`, ans: y2, unit: 'zł', hints: ['Oblicz stan po pierwszym roku.', 'W drugim roku odsetki liczymy od nowej kwoty.'], sol: [`Po 1 roku: ${fmt(y1)} zł`, `Po 2 latach: ${fmt(r6(1 + p / 100))} · ${fmt(y1)} = ${fmt(y2)} zł`], wrong: [[r6(k * (1 + (2 * p) / 100)), 'Przy kapitalizacji w drugim roku odsetki liczymy od kwoty z odsetkami.']] });
      },
    ),
    S(
      'stezenie',
      'Stężenie procentowe roztworu',
      [R('Stężenie = {masa substancji/masa roztworu} · 100%', 'Wzór'), EX('W 200 g roztworu jest 10 g soli.', ['{10/200} · 100% = 5%'], '5%')],
      (d, r) => {
        const p = pick(r, lvl(d, [5, 10, 20, 25], [2, 4, 8, 15], [2.5, 3, 6, 12]));
        const m = int(r, 1, 10) * lvl(d, 100, 100, 200);
        const s = r6((m * p) / 100);
        if (r() < 0.5) return q(sid('stezenie'), d, { prompt: `W ${fmt(m)} g solanki jest ${fmt(s)} g soli. Jakie jest stężenie solanki?`, ans: p, unit: '%', hints: ['Podziel masę soli przez masę całego roztworu.'], sol: [`${fmt(s)} : ${fmt(m)} · 100% = ${pc(p)}`], wrong: [[r6((s / (m - s)) * 100), 'Dzielimy przez masę całego roztworu (razem z solą), a nie samej wody.']] });
        return q(sid('stezenie'), d, { prompt: `Ile gramów cukru jest w ${fmt(m)} g syropu o stężeniu ${pc(p)}?`, ans: s, unit: 'g', hints: [`Oblicz ${pc(p)} z ${fmt(m)} g.`], sol: [`${fmt(r6(p / 100))} · ${fmt(m)} = ${fmt(s)} g`] });
      },
    ),
    S(
      'dolewanie',
      'Dolewanie wody do roztworu',
      [P('Gdy dolewamy wody, masa substancji się **nie zmienia**, rośnie tylko masa roztworu.'), EX('Do 200 g 10% solanki dolano 50 g wody.', ['Sól: 10% z 200 = 20 g', 'Nowy roztwór: 250 g', '{20/250} = 8%'], '8%')],
      (d, r) => {
        const m = pick(r, [100, 200, 300, 400, 500]);
        const p = pick(r, [10, 20, 30, 5]);
        const s = r6((m * p) / 100);
        // dobieramy ilość wody tak, by nowe stężenie miało najwyżej 2 cyfry po przecinku
        const ok = [50, 100, 150, 200, 300, 400, 600].filter((x) => (s * 10000) % (m + x) === 0);
        const w = ok.length ? pick(r, ok) : m;
        const np = r6((s / (m + w)) * 100);
        return q(sid('dolewanie'), d, { prompt: `Do ${m} g roztworu soli o stężeniu ${pc(p)} dolano ${w} g wody. Jakie jest stężenie nowego roztworu?`, ans: np, unit: '%', hints: ['Oblicz masę soli – ona się nie zmienia.', 'Nowa masa roztworu to masa roztworu + dolana woda.'], sol: [`Sól: ${fmt(s)} g`, `Nowy roztwór: ${m + w} g`, `${fmt(s)} : ${m + w} · 100% = ${pc(np)}`], wrong: [[r6(p - (w / m) * 10), 'Nie zgaduj – policz masę soli i podziel przez nową masę roztworu.']] });
      },
    ),
    S(
      'diagram',
      'Odczytywanie procentów z diagramu',
      [P('Na diagramie procentowym wszystkie części razem dają 100%. Liczbę osób obliczamy jako procent z liczby wszystkich osób.'), V(barChart([{ label: 'piłka', value: 40 }, { label: 'kosz', value: 25 }, { label: 'siatka', value: 35 }], '%', 'Ulubiony sport'))],
      (d, r) => {
        const a = pick(r, [10, 15, 20, 25, 30]);
        const b = pick(r, [10, 15, 20, 25]);
        const c = 100 - a - b - 10 * int(r, 1, 3);
        const e = 100 - a - b - c;
        const labels = ['pies', 'kot', 'rybki', 'chomik'];
        const vals = [a, b, c, e];
        const n = pick(r, [200, 400, 600, 800, 1000]);
        const i = int(r, 0, 3);
        const count = r6((n * vals[i]) / 100);
        return q(sid('diagram'), d, {
          prompt: `Ankietę o ulubionym zwierzęciu wypełniło ${n} uczniów. Wyniki pokazuje diagram. Ilu uczniów wybrało odpowiedź „${labels[i]}”?`,
          visual: barChart(labels.map((label, k) => ({ label, value: vals[k] })), '%', 'Ulubione zwierzę (procent uczniów)'),
          ans: count,
          hints: [`Odczytaj procent dla „${labels[i]}”.`, `Oblicz ten procent z ${n}.`],
          sol: [`„${labels[i]}” wybrało ${vals[i]}% uczniów.`, `${vals[i]}% z ${n} = ${fmt(count)}`],
          wrong: [[vals[i], 'To procent, a pytanie dotyczy liczby uczniów.']],
        });
      },
    ),
    S(
      'procent-z-procentu',
      'Procent z procentu',
      [P('Jeśli część całości dzieli się dalej, mnożymy procenty jak ułamki.'), EX('40% uczniów to dziewczęta, a 25% z nich gra w siatkówkę.', ['0,25 · 0,40 = 0,10'], '10% wszystkich uczniów')],
      (d, r) => {
        const a = pick(r, [40, 50, 60, 80, 20]);
        const b = pick(r, [10, 20, 25, 50, 75]);
        const ans = r6((a * b) / 100);
        return q(sid('procent-z-procentu'), d, { prompt: `${pc(a)} uczniów szkoły dojeżdża autobusem, a ${pc(b)} z nich ma bilet miesięczny. Jaki procent wszystkich uczniów ma bilet miesięczny?`, ans, unit: '%', hints: [`Oblicz ${pc(b)} z ${pc(a)}.`], sol: [`${fmt(b / 100)} · ${pc(a)} = ${pc(ans)}`], wrong: [[a - b, 'Nie odejmujemy procentów – liczymy procent z procentu.'], [b, `${pc(b)} dotyczy tylko uczniów dojeżdżających, nie wszystkich.`]] });
      },
    ),
    S(
      'oferty',
      'Która oferta jest korzystniejsza',
      [P('Porównując promocje, oblicz cenę końcową w każdej z nich.'), EX('Oferta A: −30%. Oferta B: drugi produkt za pół ceny.', ['Dwa produkty po 100 zł: A → 140 zł, B → 150 zł.'], 'A jest tańsza')],
      (d, r) => {
        const price = int(r, 4, 20) * 10;
        const pA = pick(r, [20, 25, 30, 35]);
        const cut = pick(r, [10, 15, 20, 25, 30]);
        const A = r6(price * (1 - pA / 100));
        const B = price - cut;
        if (A === B) return q(sid('oferty'), d, { prompt: `Bluza kosztuje ${price} zł. Ile zapłacimy po obniżce o ${pc(pA)}?`, ans: A, unit: 'zł', hints: [`Oblicz ${pc(100 - pA)} z ${price}.`], sol: [`${fmt(r6(1 - pA / 100))} · ${price} = ${fmt(A)} zł`] });
        const right = A < B ? `Sklep A, o ${fmt(r6(B - A))} zł` : `Sklep B, o ${fmt(r6(A - B))} zł`;
        return mc(sid('oferty'), d, r, {
          prompt: `Bluza kosztuje ${price} zł. Sklep A daje rabat ${pc(pA)}, a sklep B obniża cenę o ${cut} zł. Gdzie bluza będzie tańsza i o ile?`,
          right,
          wrong: [A < B ? `Sklep B, o ${fmt(r6(B - A))} zł` : `Sklep A, o ${fmt(r6(A - B))} zł`, `Sklep A, o ${fmt(Math.abs(pA - cut))} zł`, 'W obu sklepach tyle samo'],
          hints: ['Oblicz cenę w każdym sklepie osobno.'],
          sol: [`Sklep A: ${fmt(A)} zł`, `Sklep B: ${fmt(B)} zł`],
        });
      },
    ),
    S(
      'klasa',
      'Procenty w klasie i w szkole',
      [P('W zadaniach o liczbie osób wynik musi być liczbą naturalną – to dobry sposób na sprawdzenie obliczeń.')],
      (d, r) => {
        const n = pick(r, [20, 25, 24, 30, 32, 28]);
        const ps = [10, 20, 25, 50, 75, 40, 60, 12.5, 37.5, 62.5, 87.5].filter((p) => Number.isInteger((n * p) / 100));
        const p = pick(r, ps);
        const k = (n * p) / 100;
        if (r() < 0.5) return q(sid('klasa'), d, { prompt: `W klasie jest ${n} uczniów. ${pc(p)} z nich nosi okulary. Ilu uczniów nosi okulary?`, ans: k, hints: [`Oblicz ${pc(p)} z ${n}.`], sol: [`${fmt(r6(p / 100))} · ${n} = ${k}`] });
        return q(sid('klasa'), d, { prompt: `W klasie jest ${n} uczniów, a ${k} z nich gra na instrumencie. Jaki procent klasy gra na instrumencie?`, ans: p, unit: '%', hints: [`Oblicz {${k}/${n}} · 100%.`], sol: [`{${k}/${n}} · 100% = ${pc(p)}`], wrong: [[k, 'To liczba uczniów, a pytanie dotyczy procentu.']] });
      },
    ),
    S(
      'porownanie',
      'Porównywanie procentów różnych całości',
      [P('Większy procent nie zawsze oznacza większą liczbę – zależy od tego, z czego liczymy procent.'), EX('Co jest większe: 30% z 50 czy 20% z 80?', ['30% z 50 = 15', '20% z 80 = 16'], '20% z 80')],
      (d, r) => {
        const a = pick(r, [10, 20, 25, 30, 40, 50]), x = pick(r, [40, 60, 80, 120, 200]);
        let b = pick(r, [10, 20, 25, 30, 40, 50]), y = pick(r, [40, 60, 80, 120, 200]);
        while ((a * x) === (b * y)) (b = pick(r, [10, 20, 25, 30, 40, 50]), (y = pick(r, [40, 60, 80, 120, 200])));
        const A = r6((a * x) / 100), B = r6((b * y) / 100);
        return tf(sid('porownanie'), d, {
          items: [
            [`${pc(a)} liczby ${x} to więcej niż ${pc(b)} liczby ${y}.`, A > B, `${pc(a)} z ${x} = ${fmt(A)}, a ${pc(b)} z ${y} = ${fmt(B)}.`],
            [`${pc(b)} liczby ${y} to ${fmt(B)}.`, true, `${fmt(r6(b / 100))} · ${y} = ${fmt(B)}.`],
          ],
        });
      },
    ),
    S(
      'egzamin',
      'Procenty w zadaniach egzaminacyjnych',
      [P('Zadania egzaminacyjne często łączą kilka kroków: procent liczby, porównanie i różnicę.')],
      (d, r) => {
        const who = person(r);
        const kieszonkowe = int(r, 10, 40) * 10;
        const p1 = pick(r, [20, 25, 30, 40]);
        const p2 = pick(r, [10, 20, 25, 50]);
        const spent1 = r6((kieszonkowe * p1) / 100);
        const rest = kieszonkowe - spent1;
        const spent2 = r6((rest * p2) / 100);
        const left = r6(rest - spent2);
        return q(sid('egzamin'), d, {
          prompt: `${who.name} ${g(who, 'dostał', 'dostała')} ${kieszonkowe} zł. ${pc(p1)} tej kwoty ${g(who, 'wydał', 'wydała')} na książki, a ${pc(p2)} **pozostałej** kwoty – na kino. Ile pieniędzy ${g(who, 'mu', 'jej')} zostało?`,
          ans: left,
          unit: 'zł',
          hints: ['Oblicz wydatek na książki i resztę.', `Wydatek na kino liczymy od reszty, nie od ${kieszonkowe} zł.`],
          sol: [`Książki: ${fmt(spent1)} zł, zostało ${fmt(rest)} zł.`, `Kino: ${pc(p2)} z ${fmt(rest)} = ${fmt(spent2)} zł.`, `Zostało: ${fmt(rest)} − ${fmt(spent2)} = ${fmt(left)} zł.`],
          wrong: [[r6(kieszonkowe * (1 - (p1 + p2) / 100)), `${pc(p2)} liczymy od pozostałej kwoty, a nie od ${kieszonkowe} zł.`]],
        });
      },
    ),
    S(
      'srednia-proc',
      'Ile procent to ułamek „co któryś”',
      [L('co drugi → {1/2} = 50%', 'co czwarty → {1/4} = 25%', 'co piąty → {1/5} = 20%', 'co dziesiąty → {1/10} = 10%')],
      (d, r) => {
        const k = pick(r, lvl(d, [2, 4, 5, 10], [4, 5, 8, 20], [8, 16, 40, 25]));
        const word = { 2: 'drugi', 4: 'czwarty', 5: 'piąty', 8: 'ósmy', 10: 'dziesiąty', 16: 'szesnasty', 20: 'dwudziesty', 25: 'dwudziesty piąty', 40: 'czterdziesty' }[k] ?? String(k);
        return numMc(sid('srednia-proc'), d, r, { prompt: `Co ${word} los w loterii wygrywa. Jaki procent losów wygrywa?`, ans: r6(100 / k), unit: '%', wrong: [[k, 'To liczba, a nie procent.']], hints: [`Co ${word} to {1/${k}} wszystkich.`], sol: [`{1/${k}} · 100% = ${pc(r6(100 / k))}`] });
      },
    ),
  ],
};
