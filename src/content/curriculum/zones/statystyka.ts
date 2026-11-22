/** Dział: Statystyka, kombinatoryka i prawdopodobieństwo. */
import { Fraction } from '../../../lib/fraction';
import { EX, L, P, R, V, fmt, frac, int, lvl, mc, par, person, g, pick, q, r6, shuffle, tf } from '../kit';
import { barChart, table } from '../figures';
import type { Skill, Zone } from '../model';

const S = (id: string, title: string, theory: Skill['theory'], gen: Skill['gen']): Skill => ({ id: `s-${id}`, title, theory, gen });
const sid = (id: string) => `s-${id}`;

const sum = (a: number[]) => a.reduce((s, x) => s + x, 0);
const sorted = (a: number[]) => [...a].sort((x, y) => x - y);
function median(a: number[]) {
  const s = sorted(a);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : r6((s[m - 1] + s[m]) / 2);
}
const list = (a: number[]) => a.map((x) => fmt(x)).join('; ');
const FR = (n: number, d: number) => new Fraction(n, d).simplify();

export const STATYSTYKA: Zone = {
  id: 'statystyka',
  title: 'Statystyka i prawdopodobieństwo',
  short: 'Średnia, mediana, odczytywanie danych, liczenie możliwości i prawdopodobieństwo.',
  mark: '⚂',
  skills: [
    S(
      'srednia',
      'Średnia arytmetyczna',
      [R('Średnia = {suma liczb/ile jest liczb}', 'Wzór'), EX('Oceny: 4, 5, 3, 5, 3', ['Suma: 20', '20 : 5'], '4')],
      (d, r) => {
        const n = lvl(d, 4, 5, 6);
        const arr = Array.from({ length: n }, () => int(r, lvl(d, 1, 2, 10), lvl(d, 6, 20, 60)));
        const avg = r6(sum(arr) / n);
        if (!Number.isInteger(avg * 100)) arr[0] += n - (sum(arr) % n);
        const a2 = r6(sum(arr) / n);
        return q(sid('srednia'), d, { prompt: `Oblicz średnią arytmetyczną liczb: ${list(arr)}.`, ans: a2, hints: ['Dodaj wszystkie liczby i podziel przez ich liczbę.'], sol: [`Suma: ${sum(arr)}`, `${sum(arr)} : ${n} = ${fmt(a2)}`], wrong: [[median(arr), 'To mediana, a nie średnia.']] });
      },
    ),
    S(
      'dwie-grupy',
      'Średnia z dwóch grup',
      [P('Średniej dwóch grup nie liczymy jako średniej ze średnich! Trzeba obliczyć sumę wszystkich wyników i podzielić przez liczbę wszystkich osób.'), EX('Klasa A: 20 osób, średnia 4. Klasa B: 30 osób, średnia 3,5.', ['Suma: 20 · 4 + 30 · 3,5 = 80 + 105 = 185', '185 : 50'], '3,7')],
      (d, r) => {
        const n1 = pick(r, [10, 15, 20, 25]), n2 = pick(r, [10, 20, 30]);
        const a1 = r6(int(r, 6, 10) / 2), a2 = r6(int(r, 6, 10) / 2);
        const tot = r6(n1 * a1 + n2 * a2);
        const avg = r6(tot / (n1 + n2));
        if (!Number.isInteger(r6(avg * 100))) return q(sid('dwie-grupy'), d, { prompt: `W grupie A (${n1} osób) średnia ocen to ${fmt(a1)}, a w grupie B (${n1} osób) – ${fmt(a2)}. Jaka jest średnia ocen obu grup razem?`, ans: r6((a1 + a2) / 2), hints: ['Grupy są równe, więc średnia to średnia ze średnich.'], sol: [`(${fmt(a1)} + ${fmt(a2)}) : 2 = ${fmt(r6((a1 + a2) / 2))}`] });
        return q(sid('dwie-grupy'), d, { prompt: `W grupie A (${n1} osób) średnia ocen to ${fmt(a1)}, a w grupie B (${n2} osób) – ${fmt(a2)}. Jaka jest średnia ocen obu grup razem?`, ans: avg, hints: ['Oblicz sumę ocen w każdej grupie.', 'Podziel łączną sumę przez liczbę wszystkich osób.'], sol: [`${n1} · ${fmt(a1)} + ${n2} · ${fmt(a2)} = ${fmt(tot)}`, `${fmt(tot)} : ${n1 + n2} = ${fmt(avg)}`], wrong: [[r6((a1 + a2) / 2), 'Grupy mają różną liczebność – nie można uśrednić samych średnich.']] });
      },
    ),
    S(
      'brakujaca',
      'Brakująca liczba przy znanej średniej',
      [P('Jeśli średnia n liczb wynosi s, to ich suma wynosi n · s.'), EX('Średnia z 4 sprawdzianów to 4. Trzy oceny to 3, 5, 4. Jaka jest czwarta?', ['Suma: 4 · 4 = 16', '16 − 12 = 4'], '4')],
      (d, r) => {
        const n = lvl(d, 3, 4, 5);
        let kn: number[] = [];
        let avg = 4;
        let miss = 4;
        for (let t = 0; t < 60; t++) {
          avg = int(r, 3, 5);
          kn = Array.from({ length: n - 1 }, () => int(r, 2, 6));
          miss = n * avg - sum(kn);
          if (miss >= 1 && miss <= 6) break;
          kn = Array.from({ length: n - 1 }, () => avg);
          miss = avg;
        }
        const who = person(r);
        return q(sid('brakujaca'), d, { prompt: `${who.name} ${g(who, 'dostał', 'dostała')} ${n} ocen, ich średnia to ${fmt(avg)}. Znane oceny: ${list(kn)}. Jaka jest brakująca ocena?`, ans: miss, hints: [`Suma wszystkich ocen to ${n} · ${fmt(avg)} = ${n * avg}.`], sol: [`${n} · ${fmt(avg)} = ${n * avg}`, `${n * avg} − ${sum(kn)} = ${miss}`], wrong: [[avg, 'To średnia, a nie brakująca ocena.']] });
      },
    ),
    S(
      'mediana',
      'Mediana',
      [P('Mediana to wartość środkowa danych **uporządkowanych** od najmniejszej do największej.'), L('Nieparzysta liczba danych: mediana to liczba w środku.', 'Parzysta liczba danych: średnia dwóch środkowych liczb.'), EX('7, 2, 9, 4', ['Porządkujemy: 2, 4, 7, 9', '(4 + 7) : 2'], '5,5')],
      (d, r) => {
        const n = lvl(d, 5, int(r, 5, 6), int(r, 6, 8));
        const arr = shuffle(r, Array.from({ length: n }, () => int(r, 1, 30)));
        const m = median(arr);
        return q(sid('mediana'), d, { prompt: `Oblicz medianę liczb: ${list(arr)}.`, ans: m, hints: ['Najpierw uporządkuj liczby rosnąco.', n % 2 ? 'Weź liczbę środkową.' : 'Weź średnią dwóch środkowych.'], sol: [`Uporządkowane: ${list(sorted(arr))}`, `Mediana: ${fmt(m)}`], wrong: [[arr[Math.floor(n / 2)], 'Dane trzeba najpierw uporządkować.'], [r6(sum(arr) / n), 'To średnia, a nie mediana.']] });
      },
    ),
    S(
      'dominanta',
      'Dominanta',
      [P('Dominanta to wartość, która występuje **najczęściej**.')],
      (d, r) => {
        const mode = int(r, 1, 6);
        const others = Array.from({ length: lvl(d, 4, 6, 8) }, () => int(r, 1, 6)).filter((x) => x !== mode);
        const uniq = [...new Set(others)];
        const arr = shuffle(r, [mode, mode, mode, ...uniq.slice(0, 4), ...(uniq.length > 1 ? [uniq[0]] : [])]);
        return q(sid('dominanta'), d, { prompt: `Rzucono kostką kilka razy i otrzymano: ${list(arr)}. Jaka jest dominanta wyników?`, ans: mode, hints: ['Policz, ile razy wypadła każda liczba oczek.'], sol: [`Najczęściej (${arr.filter((x) => x === mode).length} razy) wypadło ${mode}.`], wrong: [[median(arr), 'To mediana.']] });
      },
    ),
    S(
      'rozstep',
      'Rozstęp danych',
      [R('Rozstęp = największa wartość − najmniejsza wartość', 'Wzór')],
      (d, r) => {
        const arr = Array.from({ length: lvl(d, 5, 6, 7) }, () => int(r, d === 3 ? -15 : 0, 35));
        const rng = Math.max(...arr) - Math.min(...arr);
        return q(sid('rozstep'), d, { prompt: `Temperatury (°C) w kolejnych dniach: ${list(arr)}. Oblicz rozstęp temperatur.`, ans: rng, unit: '°C', hints: ['Znajdź największą i najmniejszą wartość.'], sol: [`Największa: ${fmt(Math.max(...arr))}, najmniejsza: ${fmt(Math.min(...arr))}`, `${fmt(Math.max(...arr))} − ${par(Math.min(...arr))} = ${rng}`], wrong: [[Math.max(...arr) + Math.min(...arr), 'Odejmij najmniejszą wartość od największej.']] });
      },
    ),
    S(
      'diagram',
      'Odczytywanie diagramu słupkowego',
      [P('Na diagramie słupkowym wysokość słupka pokazuje wartość. Zawsze sprawdź skalę na osi pionowej.'), V(barChart([{ label: 'pn', value: 12 }, { label: 'wt', value: 18 }, { label: 'śr', value: 9 }], 'liczba osób', 'Frekwencja na zajęciach'))],
      (d, r) => {
        const days = ['pn', 'wt', 'śr', 'czw', 'pt'];
        const vals = days.map(() => int(r, 2, 10) * lvl(d, 1, 5, 10));
        const i = int(r, 0, 4);
        let j = int(r, 0, 4);
        while (j === i) j = int(r, 0, 4);
        const vis = barChart(days.map((label, k) => ({ label, value: vals[k] })), 'sztukach', 'Liczba sprzedanych rowerów');
        const kind = pick(r, lvl(d, [0], [0, 1], [1, 2]));
        if (kind === 0) return q(sid('diagram'), d, { prompt: `Ile rowerów sprzedano w dniu „${days[i]}”?`, visual: vis, ans: vals[i], hints: ['Odczytaj wysokość słupka na osi pionowej.'], sol: [`${days[i]}: ${vals[i]}`] });
        if (kind === 1) return q(sid('diagram'), d, { prompt: `O ile więcej rowerów sprzedano w dniu „${days[vals[i] >= vals[j] ? i : j]}” niż w dniu „${days[vals[i] >= vals[j] ? j : i]}”?`, visual: vis, ans: Math.abs(vals[i] - vals[j]), hints: ['Odczytaj obie wartości i odejmij.'], sol: [`${Math.max(vals[i], vals[j])} − ${Math.min(vals[i], vals[j])} = ${Math.abs(vals[i] - vals[j])}`] });
        return q(sid('diagram'), d, { prompt: 'Ile średnio rowerów sprzedawano dziennie w tym tygodniu?', visual: vis, ans: r6(sum(vals) / 5), hints: ['Dodaj wszystkie wartości i podziel przez 5.'], sol: [`(${vals.join(' + ')}) : 5 = ${fmt(r6(sum(vals) / 5))}`] });
      },
    ),
    S(
      'tabela',
      'Odczytywanie danych z tabeli',
      [P('Tabela liczebności pokazuje, ile razy wystąpiła każda wartość. Liczbę wszystkich danych otrzymamy, dodając liczebności.')],
      (d, r) => {
        const grades = [1, 2, 3, 4, 5, 6];
        const counts = grades.map((gr) => (gr === 1 ? int(r, 0, 2) : int(r, 1, 8)));
        const vis = table(['ocena', ...grades.map(String)], [['liczba uczniów', ...counts.map(String)]]);
        const total = sum(counts);
        if (d === 1) return q(sid('tabela'), d, { prompt: 'Tabela pokazuje oceny ze sprawdzianu. Ilu uczniów pisało sprawdzian?', visual: vis, ans: total, hints: ['Dodaj liczby uczniów przy wszystkich ocenach.'], sol: [`${counts.join(' + ')} = ${total}`] });
        if (d === 2) {
          const atLeast4 = counts[3] + counts[4] + counts[5];
          return q(sid('tabela'), d, { prompt: 'Tabela pokazuje oceny ze sprawdzianu. Ilu uczniów dostało co najmniej czwórkę?', visual: vis, ans: atLeast4, hints: ['„Co najmniej 4” to 4, 5 i 6.'], sol: [`${counts[3]} + ${counts[4]} + ${counts[5]} = ${atLeast4}`], wrong: [[counts[3], '„Co najmniej 4” obejmuje też oceny wyższe.']] });
        }
        const s = sum(grades.map((gr, k) => gr * counts[k]));
        const avg = r6(s / total);
        if (Number.isInteger(avg * 100)) return q(sid('tabela'), d, { prompt: 'Tabela pokazuje oceny ze sprawdzianu. Oblicz średnią ocen w klasie.', visual: vis, ans: avg, hints: ['Pomnóż każdą ocenę przez liczbę uczniów, dodaj iloczyny i podziel przez liczbę uczniów.'], sol: [`Suma ocen: ${grades.map((gr, k) => `${gr} · ${counts[k]}`).join(' + ')} = ${s}`, `${s} : ${total} = ${fmt(avg)}`] });
        return q(sid('tabela'), d, { prompt: 'Tabela pokazuje oceny ze sprawdzianu. Ile wynosi suma wszystkich ocen?', visual: vis, ans: s, hints: ['Pomnóż każdą ocenę przez liczbę uczniów i dodaj.'], sol: [`${grades.map((gr, k) => `${gr} · ${counts[k]}`).join(' + ')} = ${s}`] });
      },
    ),
    S(
      'procent-dane',
      'Procenty w danych statystycznych',
      [P('Aby obliczyć, jaki procent danych ma pewną cechę, dzielimy liczbę takich danych przez liczbę wszystkich i mnożymy przez 100%.')],
      (d, r) => {
        const total = pick(r, [20, 25, 40, 50]);
        const ps = [10, 20, 40, 60, 80, 30, 50].filter((p) => Number.isInteger((total * p) / 100));
        const p = pick(r, ps);
        const k = (total * p) / 100;
        return q(sid('procent-dane'), d, { prompt: `W ankiecie wzięło udział ${total} osób. ${k} z nich odpowiedziało „tak”. Jaki procent ankietowanych odpowiedział „tak”?`, ans: p, unit: '%', hints: [`{${k}/${total}} · 100%`], sol: [`${k} : ${total} · 100% = ${p}%`], wrong: [[k, 'To liczba osób, a nie procent.']] });
      },
    ),
    S(
      'wazona',
      'Średnia ważona',
      [P('W średniej ważonej każda liczba ma swoją wagę (np. sprawdzian liczy się podwójnie).'), R('Średnia ważona = {suma (wartość · waga)/suma wag}', 'Wzór'), EX('Sprawdzian 5 (waga 3), kartkówka 3 (waga 1)', ['(5 · 3 + 3 · 1) : (3 + 1) = 18 : 4'], '4,5')],
      (d, r) => {
        const a = int(r, 2, 6), b = int(r, 2, 6), c = int(r, 2, 6);
        const wa = pick(r, [3, 2]), wb = 2, wc = 1;
        const s = a * wa + b * wb + c * wc, w = wa + wb + wc;
        const avg = r6(s / w);
        if (!Number.isInteger(avg * 100)) return q(sid('wazona'), d, { prompt: `Ocena ze sprawdzianu (${a}) ma wagę 3, a z kartkówki (${b}) wagę 1. Oblicz średnią ważoną.`, ans: r6((3 * a + b) / 4), hints: ['(ocena · waga + …) : suma wag'], sol: [`(${a} · 3 + ${b} · 1) : 4 = ${fmt(r6((3 * a + b) / 4))}`] });
        return q(sid('wazona'), d, { prompt: `Oceny: sprawdzian ${a} (waga ${wa}), kartkówka ${b} (waga ${wb}), odpowiedź ustna ${c} (waga ${wc}). Oblicz średnią ważoną.`, ans: avg, hints: ['Pomnóż oceny przez wagi, dodaj i podziel przez sumę wag.'], sol: [`(${a} · ${wa} + ${b} · ${wb} + ${c} · ${wc}) : ${w} = ${s} : ${w} = ${fmt(avg)}`], wrong: [[r6((a + b + c) / 3), 'To zwykła średnia – uwzględnij wagi.']] });
      },
    ),
    S(
      'nowa-srednia',
      'Jak zmieni się średnia',
      [P('Dopisanie nowej liczby zmienia sumę i liczbę danych. Nowa średnia = (stara suma + nowa liczba) : (n + 1).')],
      (d, r) => {
        const n = int(r, 3, 9), avg = int(r, 10, 40), x = int(r, 5, 60);
        const total = n * avg + x;
        if (total % (n + 1)) {
          const y = avg + (n + 1) * int(r, 1, 3);
          const na = (n * avg + y) / (n + 1);
          return q(sid('nowa-srednia'), d, { prompt: `Średnia wieku ${n} osób to ${avg} lat. Dołączyła osoba w wieku ${y} lat. Jaka jest nowa średnia?`, ans: na, unit: 'lat', hints: [`Stara suma: ${n} · ${avg} = ${n * avg}.`], sol: [`(${n * avg} + ${y}) : ${n + 1} = ${fmt(na)}`], wrong: [[(avg + y) / 2, 'Nie wystarczy uśrednić starej średniej i nowej liczby.']] });
        }
        return q(sid('nowa-srednia'), d, { prompt: `Średnia wieku ${n} osób to ${avg} lat. Dołączyła osoba w wieku ${x} lat. Jaka jest nowa średnia?`, ans: total / (n + 1), unit: 'lat', hints: [`Stara suma: ${n} · ${avg} = ${n * avg}.`], sol: [`(${n * avg} + ${x}) : ${n + 1} = ${fmt(total / (n + 1))}`], wrong: [[r6((avg + x) / 2), 'Nie wystarczy uśrednić starej średniej i nowej liczby.']] });
      },
    ),
    S(
      'kostka',
      'Prawdopodobieństwo: rzut kostką',
      [R('P(A) = {liczba zdarzeń sprzyjających/liczba wszystkich możliwych wyników}', 'Wzór'), EX('Jakie jest prawdopodobieństwo wyrzucenia liczby parzystej?', ['Sprzyjające: 2, 4, 6 – trzy', 'Wszystkie: 6'], '{3/6} = {1/2}')],
      (d, r) => {
        const events: [string, number[]][] = [
          ['szóstki', [6]],
          ['liczby parzystej', [2, 4, 6]],
          ['liczby większej niż 4', [5, 6]],
          ['liczby pierwszej', [2, 3, 5]],
          ['liczby podzielnej przez 3', [3, 6]],
          ['co najwyżej dwóch oczek', [1, 2]],
          ['liczby różnej od 1', [2, 3, 4, 5, 6]],
        ];
        const [name, fav] = pick(r, events.slice(0, lvl(d, 3, 5, 7)));
        const pr = FR(fav.length, 6);
        return q(sid('kostka'), d, { prompt: `Rzucamy jeden raz sześcienną kostką do gry. Jakie jest prawdopodobieństwo wyrzucenia ${name}?`, ans: pr, form: 'common', placeholder: 'np. 1/3', hints: ['Wypisz wyniki sprzyjające. Wszystkich wyników jest 6.'], sol: [`Sprzyjające: ${fav.join(', ')} (${fav.length})`, `P = {${fav.length}/6} = ${frac(pr)}`], wrong: [[FR(fav.length, 1 + fav.length), 'W mianowniku jest liczba wszystkich wyników (6).']] });
      },
    ),
    S(
      'urna',
      'Prawdopodobieństwo: losowanie kul',
      [P('Każda kula ma takie same szanse wylosowania. Prawdopodobieństwo to liczba kul danego koloru podzielona przez liczbę wszystkich kul.')],
      (d, r) => {
        const b = int(r, 1, 8), c = int(r, 1, 8), z = int(r, 1, 8);
        const total = b + c + z;
        const [name, cnt] = pick(r, [['białą', b], ['czarną', c], ['zieloną', z]] as [string, number][]);
        if (d === 3) return q(sid('urna'), d, { prompt: `W pudełku jest ${b} kul białych, ${c} czarnych i ${z} zielonych. Jakie jest prawdopodobieństwo, że wylosowana kula **nie** będzie biała?`, ans: FR(c + z, total), form: 'common', hints: ['Kule, które nie są białe: czarne i zielone.'], sol: [`${c} + ${z} = ${c + z}`, `P = {${c + z}/${total}} = ${frac(FR(c + z, total))}`], wrong: [[FR(b, total), 'To prawdopodobieństwo wylosowania kuli białej.']] });
        return q(sid('urna'), d, { prompt: `W pudełku jest ${b} kul białych, ${c} czarnych i ${z} zielonych. Losujemy jedną kulę. Jakie jest prawdopodobieństwo, że wylosujemy kulę ${name}?`, ans: FR(cnt, total), form: 'common', hints: [`Wszystkich kul jest ${total}.`], sol: [`P = {${cnt}/${total}} = ${frac(FR(cnt, total))}`], wrong: [[FR(cnt, Math.max(1, total - cnt)), 'W mianowniku jest liczba **wszystkich** kul.']] });
      },
    ),
    S(
      'moneta',
      'Prawdopodobieństwo: rzuty monetą',
      [P('Przy dwóch rzutach monetą możliwe wyniki to: OO, OR, RO, RR (O – orzeł, R – reszka). Jest ich 4.'), L('dwa orły: {1/4}', 'dokładnie jeden orzeł: {2/4} = {1/2}', 'co najmniej jeden orzeł: {3/4}')],
      (d, r) => {
        const n = d === 3 ? 3 : 2;
        const all = 2 ** n;
        const opts: [string, number][] = n === 2 ? [['dwóch orłów', 1], ['dokładnie jednego orła', 2], ['co najmniej jednego orła', 3], ['dwóch reszek', 1]] : [['trzech orłów', 1], ['dokładnie dwóch orłów', 3], ['co najmniej jednego orła', 7], ['dokładnie jednej reszki', 3]];
        const [name, fav] = pick(r, opts);
        return q(sid('moneta'), d, { prompt: `Rzucamy ${n === 2 ? 'dwa razy' : 'trzy razy'} monetą. Jakie jest prawdopodobieństwo otrzymania ${name}?`, ans: FR(fav, all), form: 'common', hints: [`Wypisz wszystkie wyniki – jest ich ${all}.`], sol: [`Wszystkich wyników: ${all}, sprzyjających: ${fav}`, `P = {${fav}/${all}} = ${frac(FR(fav, all))}`], wrong: [[FR(1, n + 1), 'Wyniki OR i RO to dwa różne zdarzenia – wypisz wszystkie możliwości.']] });
      },
    ),
    S(
      'dwie-kostki',
      'Prawdopodobieństwo: dwie kostki',
      [P('Przy rzucie dwiema kostkami jest 6 · 6 = 36 równie prawdopodobnych wyników (pary liczb oczek).'), EX('Suma oczek równa 7', ['(1,6), (2,5), (3,4), (4,3), (5,2), (6,1) – 6 par'], '{6/36} = {1/6}')],
      (d, r) => {
        const target = int(r, lvl(d, 2, 3, 2), lvl(d, 12, 11, 12));
        let fav = 0;
        for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (a + b === target) fav++;
        if (d === 3 && r() < 0.5) {
          const dbl = 6;
          return q(sid('dwie-kostki'), d, { prompt: 'Rzucamy dwiema kostkami. Jakie jest prawdopodobieństwo, że na obu wypadnie ta sama liczba oczek?', ans: FR(dbl, 36), form: 'common', hints: ['Pary: (1,1), (2,2), …'], sol: [`Sprzyjające: ${dbl}, wszystkie: 36`, `P = ${frac(FR(dbl, 36))}`], wrong: [[FR(1, 36), 'Takich par jest 6, nie 1.']] });
        }
        return q(sid('dwie-kostki'), d, { prompt: `Rzucamy dwiema sześciennymi kostkami. Jakie jest prawdopodobieństwo, że suma oczek wyniesie ${target}?`, ans: FR(fav, 36), form: 'common', hints: ['Wszystkich wyników jest 36. Wypisz pary dające tę sumę.'], sol: [`Par z sumą ${target}: ${fav}`, `P = {${fav}/36} = ${frac(FR(fav, 36))}`], wrong: [[FR(1, 11), 'Sumy nie są jednakowo prawdopodobne – licz pary.']] });
      },
    ),
    S(
      'mozliwosci',
      'Liczba możliwości – reguła mnożenia',
      [R('Jeśli pierwszy wybór można zrobić na m sposobów, a drugi na n sposobów, to oba razem na m · n sposobów.', 'Reguła mnożenia'), EX('3 bluzki i 4 spódnice', ['3 · 4'], '12 zestawów')],
      (d, r) => {
        const a = int(r, 2, 6), b = int(r, 2, 6), c = d === 3 ? int(r, 2, 4) : 1;
        const items = d === 3 ? `${a} rodzajów pizzy, ${b} rodzajów napojów i ${c} rodzajów deseru` : `${a} rodzajów pizzy i ${b} rodzajów napojów`;
        return q(sid('mozliwosci'), d, { prompt: `W menu jest ${items}. Ile różnych zestawów (${d === 3 ? 'pizza + napój + deser' : 'pizza + napój'}) można zamówić?`, ans: a * b * c, hints: ['Pomnóż liczby możliwości.'], sol: [`${a} · ${b}${d === 3 ? ' · ' + c : ''} = ${a * b * c}`], wrong: [[a + b + (d === 3 ? c : 0), 'Liczby możliwości mnożymy, a nie dodajemy.']] });
      },
    ),
    S(
      'liczby-z-cyfr',
      'Ile liczb można utworzyć z cyfr',
      [P('Pamiętaj: liczba nie może zaczynać się od zera. Sprawdź, czy cyfry mogą się powtarzać.'), EX('Ile jest liczb dwucyfrowych o różnych cyfrach?', ['Pierwsza cyfra: 1–9 (9 sposobów)', 'Druga: dowolna inna (9 sposobów)'], '81')],
      (d, r) => {
        const v = pick(r, lvl(d, [0, 1], [1, 2], [2, 3]));
        if (v === 0) return q(sid('liczby-z-cyfr'), d, { prompt: 'Ile jest wszystkich liczb dwucyfrowych?', ans: 90, hints: ['Od 10 do 99.'], sol: ['Pierwsza cyfra: 9 sposobów, druga: 10 sposobów', '9 · 10 = 90'], wrong: [[99, 'Liczby jednocyfrowe nie są dwucyfrowe.']] });
        if (v === 1) {
          const digits = shuffle(r, [1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, int(r, 3, 5));
          return q(sid('liczby-z-cyfr'), d, { prompt: `Ile liczb dwucyfrowych o **różnych** cyfrach można utworzyć z cyfr: ${digits.join(', ')}?`, ans: digits.length * (digits.length - 1), hints: [`Pierwsza cyfra: ${digits.length} sposobów, druga: o jeden mniej.`], sol: [`${digits.length} · ${digits.length - 1} = ${digits.length * (digits.length - 1)}`], wrong: [[digits.length ** 2, 'Cyfry nie mogą się powtarzać.']] });
        }
        if (v === 2) return q(sid('liczby-z-cyfr'), d, { prompt: 'Ile jest liczb dwucyfrowych o różnych cyfrach?', ans: 81, hints: ['Pierwsza cyfra nie może być zerem.'], sol: ['9 · 9 = 81'], wrong: [[90, 'Odrzuć liczby o takich samych cyfrach: 11, 22, …, 99.']] });
        const digits = [0, ...shuffle(r, [1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3)];
        return q(sid('liczby-z-cyfr'), d, { prompt: `Ile liczb trzycyfrowych o różnych cyfrach można utworzyć z cyfr: ${digits.join(', ')}?`, ans: 3 * 3 * 2, hints: ['Pierwsza cyfra nie może być zerem.'], sol: ['Pierwsza: 3 sposoby (bez zera), druga: 3, trzecia: 2', '3 · 3 · 2 = 18'], wrong: [[24, 'Liczba nie może zaczynać się od zera.']] });
      },
    ),
    S(
      'mecze',
      'Mecze, uściski dłoni, odcinki',
      [R('Każda z n osób wita się z każdą inną: n · (n − 1) : 2 powitań.', 'Wzór'), P('Dzielimy przez 2, bo powitanie Ani z Basią to to samo co Basi z Anią.')],
      (d, r) => {
        const n = int(r, lvl(d, 3, 5, 8), lvl(d, 6, 10, 20));
        const v = pick(r, ['powitania', 'mecze', 'odcinki'] as const);
        const prompt = { powitania: `Na spotkanie przyszło ${n} osób. Każda przywitała się z każdą uściskiem dłoni. Ile było uścisków?`, mecze: `W turnieju gra ${n} drużyn. Każda drużyna rozgrywa z każdą inną jeden mecz. Ile meczów zostanie rozegranych?`, odcinki: `Na okręgu zaznaczono ${n} punktów. Ile odcinków można poprowadzić, łącząc je parami?` }[v];
        return q(sid('mecze'), d, { prompt, ans: (n * (n - 1)) / 2, hints: [`Każdy z ${n} uczestników ma ${n - 1} „par”, ale każdą parę liczymy wtedy dwa razy.`], sol: [`${n} · ${n - 1} : 2 = ${(n * (n - 1)) / 2}`], wrong: [[n * (n - 1), 'Każdą parę policzono dwa razy – podziel przez 2.']] });
      },
    ),
    S(
      'kolejka',
      'Ustawienia w kolejce',
      [P('n osób można ustawić w kolejce na n · (n − 1) · … · 2 · 1 sposobów.'), EX('3 osoby', ['3 · 2 · 1'], '6 sposobów')],
      (d, r) => {
        const n = int(r, lvl(d, 3, 4, 5), lvl(d, 4, 5, 6));
        let f = 1;
        for (let k = 2; k <= n; k++) f *= k;
        if (d === 3 && r() < 0.5) {
          const k = 3;
          return q(sid('kolejka'), d, { prompt: `Z ${n} uczniów wybieramy przewodniczącego, zastępcę i skarbnika. Na ile sposobów można to zrobić?`, ans: n * (n - 1) * (n - 2), hints: ['Przewodniczący: n sposobów, zastępca: n − 1, skarbnik: n − 2.'], sol: [`${n} · ${n - 1} · ${n - 2} = ${n * (n - 1) * (n - 2)}`], wrong: [[n * k, 'Na każde kolejne stanowisko zostaje o jedną osobę mniej.']] });
        }
        return q(sid('kolejka'), d, { prompt: `Na ile sposobów można ustawić ${n} osób w kolejce?`, ans: f, hints: ['Na pierwsze miejsce: ' + n + ' sposobów, na drugie: ' + (n - 1) + '…'], sol: [`${Array.from({ length: n }, (_, k) => n - k).join(' · ')} = ${f}`], wrong: [[n * n, 'Na każde kolejne miejsce zostaje o jedną osobę mniej.']] });
      },
    ),
    S(
      'przeciwne',
      'Zdarzenie przeciwne',
      [R('P(A′) = 1 − P(A) – prawdopodobieństwo, że A **nie** zajdzie.', 'Wzór'), EX('P(wygranej) = {1/5}', ['1 − {1/5}'], '{4/5}')],
      (d, r) => {
        const den = pick(r, [4, 5, 8, 10, 20, 25]);
        const num = int(r, 1, den - 1);
        const p = FR(num, den);
        const dec = d === 3;
        return q(sid('przeciwne'), d, { prompt: dec ? `Prawdopodobieństwo, że jutro będzie padać, wynosi ${fmt(Number(p.valueOf()))}. Jakie jest prawdopodobieństwo, że nie będzie padać?` : `Prawdopodobieństwo wygranej w grze wynosi ${frac(p)}. Jakie jest prawdopodobieństwo przegranej (jeśli nie ma remisów)?`, ans: new Fraction(1).sub(p), placeholder: dec ? 'np. 0,3' : 'np. 3/4', hints: ['P(A′) = 1 − P(A)'], sol: [`1 − ${dec ? fmt(Number(p.valueOf())) : frac(p)} = ${dec ? fmt(new Fraction(1).sub(p)) : frac(new Fraction(1).sub(p))}`] });
      },
    ),
    S(
      'losowanie-liczby',
      'Losowanie liczby z przedziału',
      [P('Liczymy, ile liczb w przedziale ma daną własność, i dzielimy przez liczbę wszystkich liczb w przedziale.'), EX('Losujemy liczbę od 1 do 20. Jakie jest prawdopodobieństwo, że będzie podzielna przez 3?', ['3, 6, 9, 12, 15, 18 – 6 liczb'], '{6/20} = {3/10}')],
      (d, r) => {
        const n = pick(r, lvl(d, [10, 20], [20, 30, 50], [40, 50, 100]));
        const k = pick(r, [2, 3, 4, 5, 7]);
        const fav = Math.floor(n / k);
        if (d === 3 && r() < 0.5) {
          let sq = 0;
          for (let x = 1; x * x <= n; x++) sq++;
          return q(sid('losowanie-liczby'), d, { prompt: `Losujemy jedną liczbę ze zbioru {1, 2, …, ${n}}. Jakie jest prawdopodobieństwo, że będzie kwadratem liczby naturalnej?`, ans: FR(sq, n), form: 'common', hints: ['Wypisz kwadraty: 1, 4, 9, 16, …'], sol: [`Kwadratów do ${n} jest ${sq}.`, `P = {${sq}/${n}} = ${frac(FR(sq, n))}`] });
        }
        return q(sid('losowanie-liczby'), d, { prompt: `Losujemy jedną liczbę ze zbioru {1, 2, …, ${n}}. Jakie jest prawdopodobieństwo, że będzie podzielna przez ${k}?`, ans: FR(fav, n), form: 'common', hints: [`Ile wielokrotności ${k} jest od 1 do ${n}?`], sol: [`Wielokrotności ${k}: ${fav}`, `P = {${fav}/${n}} = ${frac(FR(fav, n))}`] });
      },
    ),
    S(
      'dolozenie',
      'Ile kul dołożyć, żeby…',
      [EX('W pudełku są 2 kule czerwone i 6 niebieskich. Ile czerwonych dołożyć, aby P(czerwona) = {1/2}?', ['Czerwonych musi być tyle, ile niebieskich: 6', '6 − 2'], '4')],
      (d, r) => {
        const red = int(r, 1, 5), blue = red + int(r, 2, 8);
        if (d <= 2) return q(sid('dolozenie'), d, { prompt: `W pudełku jest ${red} kul czerwonych i ${blue} niebieskich. Ile kul czerwonych trzeba dołożyć, aby prawdopodobieństwo wylosowania czerwonej wynosiło {1/2}?`, ans: blue - red, hints: ['P = 1/2, gdy kul czerwonych jest tyle samo co niebieskich.'], sol: [`${blue} − ${red} = ${blue - red}`] });
        const k = int(r, 2, 3);
        const b2 = red * k;
        const add = b2 - blue;
        if (add <= 0) return q(sid('dolozenie'), d, { prompt: `W pudełku jest ${red} kul czerwonych i ${blue} niebieskich. Ile kul czerwonych trzeba dołożyć, aby prawdopodobieństwo wylosowania czerwonej wynosiło {1/2}?`, ans: blue - red, hints: ['Kul czerwonych musi być tyle samo co niebieskich.'], sol: [`${blue} − ${red} = ${blue - red}`] });
        return q(sid('dolozenie'), d, { prompt: `W pudełku jest ${red} kul czerwonych i ${blue} niebieskich. Ile kul niebieskich trzeba dołożyć, aby prawdopodobieństwo wylosowania czerwonej wynosiło {1/${k + 1}}?`, ans: add, hints: [`Kul niebieskich musi być ${k} razy więcej niż czerwonych.`], sol: [`Niebieskich ma być ${k} · ${red} = ${b2}`, `${b2} − ${blue} = ${add}`] });
      },
    ),
    S(
      'wykres-zmian',
      'Wykres zmian w czasie',
      [P('Wykres pokazuje, jak wartość zmienia się w czasie. Największy wzrost to miejsce, gdzie różnica między sąsiednimi słupkami jest największa.')],
      (d, r) => {
        const months = ['I', 'II', 'III', 'IV', 'V', 'VI'];
        const vals = months.map(() => int(r, 2, 20) * 5);
        const vis = barChart(months.map((label, k) => ({ label, value: vals[k] })), 'zł', 'Oszczędności w kolejnych miesiącach');
        if (d === 1) {
          const mx = Math.max(...vals);
          const i = vals.indexOf(mx);
          return mc(sid('wykres-zmian'), d, r, { prompt: 'W którym miesiącu oszczędności były największe?', visual: vis, right: months[i], wrong: months.filter((_, k) => vals[k] !== mx).slice(0, 3), hints: ['Znajdź najwyższy słupek.'], sol: [`Najwyższy słupek: ${months[i]} (${mx} zł)`] });
        }
        const total = sum(vals);
        if (d === 2) return q(sid('wykres-zmian'), d, { prompt: 'Ile złotych zaoszczędzono łącznie w ciągu tych sześciu miesięcy?', visual: vis, ans: total, unit: 'zł', hints: ['Dodaj wartości wszystkich słupków.'], sol: [`${vals.join(' + ')} = ${total} zł`] });
        return q(sid('wykres-zmian'), d, { prompt: 'Ile wynosi średnia miesięczna kwota oszczędności?', visual: vis, ans: r6(total / 6), unit: 'zł', hints: ['Dodaj wartości i podziel przez 6.'], sol: [`${total} : 6 = ${fmt(r6(total / 6))} zł`] });
      },
    ),
    S(
      'pin',
      'Kody i hasła',
      [P('Każdą cyfrę kodu wybieramy niezależnie – stosujemy regułę mnożenia.'), L('kod 4-cyfrowy (cyfry mogą się powtarzać): 10 · 10 · 10 · 10 = 10 000', 'kod 3-cyfrowy o różnych cyfrach: 10 · 9 · 8 = 720')],
      (d, r) => {
        const n = int(r, 2, lvl(d, 3, 4, 4));
        const diff = d >= 2 && r() < 0.5;
        let ans = 1;
        for (let k = 0; k < n; k++) ans *= diff ? 10 - k : 10;
        return q(sid('pin'), d, { prompt: `Ile jest różnych ${n}-cyfrowych kodów (mogą zaczynać się od zera)${diff ? ', w których cyfry się nie powtarzają' : ''}?`, ans, hints: [diff ? 'Na każdą kolejną pozycję zostaje o jedną cyfrę mniej.' : 'Na każdą pozycję jest 10 możliwości.'], sol: [`${Array.from({ length: n }, (_, k) => (diff ? 10 - k : 10)).join(' · ')} = ${fmt(ans)}`], wrong: [[10 * n, 'Możliwości mnożymy, a nie dodajemy.']] });
      },
    ),
    S(
      'pr-falsz',
      'Prawda czy fałsz: statystyka i prawdopodobieństwo',
      [P('Prawdopodobieństwo zawsze jest liczbą od 0 do 1. Zdarzenie pewne ma prawdopodobieństwo 1, niemożliwe – 0.')],
      (d, r) => {
        const arr = Array.from({ length: 5 }, () => int(r, 1, 9));
        const avg = r6(sum(arr) / 5), med = median(arr);
        const items: [string, boolean, string][] = [
          [`Średnia liczb ${list(arr)} jest równa ${fmt(avg)}.`, true, `Suma ${sum(arr)} : 5 = ${fmt(avg)}.`],
          [`Mediana liczb ${list(arr)} jest równa ${fmt(med + 1)}.`, false, `Po uporządkowaniu (${list(sorted(arr))}) mediana to ${fmt(med)}.`],
          ['Prawdopodobieństwo wyrzucenia 7 oczek jedną kostką wynosi {1/6}.', false, 'Na kostce nie ma 7 oczek – to zdarzenie niemożliwe (P = 0).'],
          ['Prawdopodobieństwo może być równe 1,5.', false, 'Prawdopodobieństwo jest zawsze między 0 a 1.'],
          ['Prawdopodobieństwo wyrzucenia orła w jednym rzucie monetą wynosi {1/2}.', true, 'Dwa równie prawdopodobne wyniki, jeden sprzyjający.'],
        ];
        const a = pick(r, items.slice(0, 2)), b = pick(r, items.slice(2));
        return tf(sid('pr-falsz'), d, { items: [a, b] });
      },
    ),
  ],
};

