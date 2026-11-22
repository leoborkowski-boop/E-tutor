/** Dział: Geometria płaska – kąty, trójkąty, czworokąty, pola i obwody. */
import { ERR, EX, L, P, R, V, fmt, int, lvl, mc, person, pick, q, r6, tf } from '../kit';
import { adjacentFig, crossFig, parallelFig, parallelogramFig, rectFig, rhombusFig, trapezoidFig, triFig, figure } from '../figures';
import type { Pt } from '../../types';
import type { Skill, Zone } from '../model';

const S = (id: string, title: string, theory: Skill['theory'], gen: Skill['gen']): Skill => ({ id: `g-${id}`, title, theory, gen });
const sid = (id: string) => `g-${id}`;
const deg = (n: number) => `${fmt(n)}°`;

/** Trójkąt o zadanych kątach przy A i B (podstawa AB pozioma) – do rysunku. */
function triByAngles(a: number, b: number): [Pt, Pt, Pt] {
  const ra = (a * Math.PI) / 180, rb = (b * Math.PI) / 180;
  // C = przecięcie promieni z A pod kątem a i z B pod kątem 180 − b
  const t = Math.sin(rb) / Math.sin(ra + rb);
  return [[0, 0], [1, 0], [t * Math.cos(ra), t * Math.sin(ra)]];
}

export const GEOMETRIA: Zone = {
  id: 'geometria',
  title: 'Geometria płaska',
  short: 'Kąty, trójkąty i czworokąty, obwody i pola figur, jednostki pola.',
  mark: '△',
  skills: [
    S(
      'rodzaje-katow',
      'Rodzaje kątów',
      [L('kąt **ostry**: mniejszy od 90°', 'kąt **prosty**: 90°', 'kąt **rozwarty**: między 90° a 180°', 'kąt **półpełny**: 180°', 'kąt **pełny**: 360°')],
      (d, r) => {
        const kinds: [string, number][] = [['ostry', int(r, 5, 89)], ['prosty', 90], ['rozwarty', int(r, 91, 179)], ['półpełny', 180]];
        const [name, a] = pick(r, kinds.slice(0, lvl(d, 3, 4, 4)));
        return mc(sid('rodzaje-katow'), d, r, { prompt: `Kąt ma miarę ${deg(a)}. Jaki to kąt?`, right: name, wrong: kinds.map((k) => k[0]).filter((k) => k !== name), hints: ['Porównaj miarę kąta z 90° i 180°.'], sol: [`${deg(a)} to kąt ${name}.`] });
      },
    ),
    S(
      'przylegle',
      'Kąty przyległe',
      [R('Kąty przyległe mają wspólne ramię, a pozostałe ramiona tworzą prostą. Ich suma to **180°**.', 'Zapamiętaj'), V(adjacentFig('α', 'β', 60), 'α + β = 180°')],
      (d, r) => {
        const angle = d === 1 ? 10 * int(r, 2, 16) : int(r, 15, 165);
        if (d === 3) {
          const k = int(r, 2, 4);
          const x = r6(180 / (k + 1));
          if (Number.isInteger(x)) return q(sid('przylegle'), d, { prompt: `Jeden z kątów przyległych jest ${k} razy większy od drugiego. Jaką miarę ma mniejszy z nich?`, ans: x, unit: '°', hints: ['Oznacz mniejszy kąt przez x. Suma kątów przyległych to 180°.'], sol: [`x + ${k}x = 180°`, `x = ${deg(x)}`] });
        }
        return q(sid('przylegle'), d, { prompt: `Kąt α ma miarę ${deg(angle)}. Jaką miarę ma kąt β przyległy do niego?`, visual: adjacentFig(deg(angle), 'β', angle), ans: 180 - angle, unit: '°', hints: ['Suma kątów przyległych wynosi 180°.'], sol: [`β = 180° − ${deg(angle)} = ${deg(180 - angle)}`], wrong: [[90 - angle, 'Kąty przyległe sumują się do 180°, a nie do 90°.'], [angle, 'Kąty przyległe nie są równe (chyba że oba mają 90°).']] });
      },
    ),
    S(
      'wierzcholkowe',
      'Kąty wierzchołkowe',
      [R('Kąty wierzchołkowe (naprzeciw siebie przy przecięciu dwóch prostych) są **równe**.', 'Zapamiętaj'), V(crossFig('α', 'β'), 'Kąt wierzchołkowy do α ma tę samą miarę co α, a β = 180° − α.')],
      (d, r) => {
        const a = int(r, 20, 160);
        if (r() < 0.5) return q(sid('wierzcholkowe'), d, { prompt: `Dwie proste przecinają się. Jeden z kątów ma ${deg(a)}. Jaką miarę ma kąt do niego wierzchołkowy?`, ans: a, unit: '°', visual: crossFig(deg(a)), hints: ['Kąty wierzchołkowe są równe.'], sol: [`Kąt wierzchołkowy też ma ${deg(a)}.`], wrong: [[180 - a, 'To miara kąta przyległego, a nie wierzchołkowego.']] });
        return q(sid('wierzcholkowe'), d, { prompt: `Dwie proste przecinają się. Jeden z kątów ma ${deg(a)}. Jaką miarę ma kąt β na rysunku?`, visual: crossFig(deg(a), 'β'), ans: 180 - a, unit: '°', hints: ['β jest kątem przyległym do danego kąta.'], sol: [`β = 180° − ${deg(a)} = ${deg(180 - a)}`], wrong: [[a, 'β nie jest kątem wierzchołkowym – to kąt przyległy.']] });
      },
    ),
    S(
      'rownolegle',
      'Kąty przy prostych równoległych',
      [L('Kąty **odpowiadające** są równe.', 'Kąty **naprzemianległe** są równe.', 'Kąty przyległe sumują się do 180°.'), V(parallelFig('α', 'β', 'odpowiadajacy'), 'Proste poziome są równoległe: α = β.')],
      (d, r) => {
        const a = int(r, 35, 80);
        const pos = pick(r, lvl(d, ['odpowiadajacy'], ['odpowiadajacy', 'naprzemianlegly'], ['naprzemianlegly', 'przylegly']) as ('odpowiadajacy' | 'naprzemianlegly' | 'przylegly')[]);
        const ans = pos === 'przylegly' ? 180 - a : a;
        return q(sid('rownolegle'), d, { prompt: 'Proste poziome na rysunku są równoległe. Jaką miarę ma kąt β?', visual: parallelFig(deg(a), 'β', pos), ans, unit: '°', hints: [pos === 'przylegly' ? 'β i dany kąt są przyległe.' : `To kąty ${pos === 'odpowiadajacy' ? 'odpowiadające' : 'naprzemianległe'} – są równe.`], sol: [pos === 'przylegly' ? `β = 180° − ${deg(a)} = ${deg(ans)}` : `β = ${deg(a)}`], wrong: [[pos === 'przylegly' ? a : 180 - a, pos === 'przylegly' ? 'Te kąty tworzą razem kąt półpełny.' : 'Te kąty są równe, a nie przyległe.']] });
      },
    ),
    S(
      'suma-trojkat',
      'Suma kątów w trójkącie',
      [R('Suma kątów wewnętrznych każdego trójkąta wynosi **180°**.', 'Twierdzenie'), EX('Dwa kąty trójkąta mają 50° i 65°.', ['180° − 50° − 65°'], '65°')],
      (d, r) => {
        const a = int(r, 25, 95), b = int(r, 20, 150 - a);
        const c = 180 - a - b;
        if (d === 3) {
          const k = int(r, 2, 3);
          const x = 180 / (2 + k);
          if (Number.isInteger(x)) return q(sid('suma-trojkat'), d, { prompt: `W trójkącie dwa kąty są równe, a trzeci jest od każdego z nich ${k} razy większy. Jaką miarę ma największy kąt?`, ans: k * x, unit: '°', hints: ['Oznacz równe kąty przez x, trzeci: ' + k + 'x.'], sol: [`x + x + ${k}x = 180°`, `x = ${deg(x)}`, `Największy: ${deg(k * x)}`] });
        }
        const [A, B, C] = triByAngles(a, b);
        return q(sid('suma-trojkat'), d, { prompt: `Dwa kąty trójkąta mają miary ${deg(a)} i ${deg(b)}. Jaką miarę ma trzeci kąt?`, visual: triFig(A, B, C, { angles: [deg(a), deg(b), '?'] }), ans: c, unit: '°', hints: ['Suma kątów w trójkącie to 180°.'], sol: [`180° − ${deg(a)} − ${deg(b)} = ${deg(c)}`], wrong: [[360 - a - b, 'Suma kątów trójkąta to 180°, a nie 360°.']] });
      },
    ),
    S(
      'rownoramienny',
      'Trójkąt równoramienny',
      [P('W trójkącie równoramiennym kąty przy podstawie są równe.'), EX('Kąt między ramionami ma 40°.', ['(180° − 40°) : 2'], 'kąty przy podstawie: 70°')],
      (d, r) => {
        if (r() < 0.5) {
          const top = 2 * int(r, 10, 70);
          const base = (180 - top) / 2;
          const [A, B, C] = triByAngles(base, base);
          return q(sid('rownoramienny'), d, { prompt: `Kąt między ramionami trójkąta równoramiennego ma ${deg(top)}. Jaką miarę ma kąt przy podstawie?`, visual: triFig(A, B, C, { angles: ['?', '', deg(top)] }), ans: base, unit: '°', hints: ['Kąty przy podstawie są równe, a wszystkie trzy sumują się do 180°.'], sol: [`(180° − ${deg(top)}) : 2 = ${deg(base)}`], wrong: [[180 - top, 'Podziel różnicę przez 2 – są dwa równe kąty przy podstawie.']] });
        }
        const base = int(r, 20, 85);
        const top = 180 - 2 * base;
        const [A, B, C] = triByAngles(base, base);
        return q(sid('rownoramienny'), d, { prompt: `Kąt przy podstawie trójkąta równoramiennego ma ${deg(base)}. Jaką miarę ma kąt między ramionami?`, visual: triFig(A, B, C, { angles: [deg(base), '', '?'] }), ans: top, unit: '°', hints: ['Oba kąty przy podstawie mają tę samą miarę.'], sol: [`180° − 2 · ${deg(base)} = ${deg(top)}`], wrong: [[180 - base, 'W trójkącie są dwa kąty przy podstawie – oba trzeba odjąć.']] });
      },
    ),
    S(
      'zewnetrzny',
      'Kąt zewnętrzny trójkąta',
      [R('Kąt zewnętrzny trójkąta jest równy sumie dwóch kątów wewnętrznych do niego nieprzyległych.', 'Twierdzenie'), P('Kąt zewnętrzny i przyległy do niego kąt wewnętrzny sumują się do 180°.')],
      (d, r) => {
        const a = int(r, 25, 80), b = int(r, 25, 80);
        return q(sid('zewnetrzny'), d, { prompt: `Dwa kąty wewnętrzne trójkąta mają ${deg(a)} i ${deg(b)}. Jaką miarę ma kąt zewnętrzny przy trzecim wierzchołku?`, ans: a + b, unit: '°', hints: ['Trzeci kąt wewnętrzny: 180° − (α + β). Kąt zewnętrzny jest do niego przyległy.'], sol: [`Trzeci kąt: ${deg(180 - a - b)}`, `Kąt zewnętrzny: 180° − ${deg(180 - a - b)} = ${deg(a + b)}`], wrong: [[180 - a - b, 'To kąt wewnętrzny, a pytanie dotyczy kąta zewnętrznego.']] });
      },
    ),
    S(
      'nierownosc',
      'Nierówność trójkąta',
      [R('Z odcinków a, b, c można zbudować trójkąt, gdy najdłuższy odcinek jest **krótszy** od sumy dwóch pozostałych.', 'Warunek'), ERR('2 cm, 3 cm, 5 cm – to trójkąt', 'nie – 2 + 3 = 5, odcinki „położą się” płasko', 'Suma dwóch krótszych musi być większa od najdłuższego.')],
      (d, r) => {
        const good = (): number[] => {
          const a = int(r, 2, 9), b = int(r, 2, 9);
          return [a, b, int(r, Math.abs(a - b) + 1, a + b - 1)];
        };
        const bad = (): number[] => {
          const a = int(r, 1, 6), b = int(r, 1, 6);
          return [a, b, a + b + int(r, 0, 3)];
        };
        const right = good();
        return mc(sid('nierownosc'), d, r, { prompt: 'Z których odcinków (w cm) można zbudować trójkąt?', right: right.join(', '), wrong: [bad(), bad(), bad()].map((t) => [t.join(', '), `${Math.min(t[0], t[1])} + ${Math.max(t[0], t[1])} = ${t[0] + t[1]}, a to nie więcej niż ${t[2]}.`] as [string, string]), hints: ['Dodaj dwa krótsze odcinki i porównaj z najdłuższym.'], sol: [`${right.slice().sort((x, y) => x - y).slice(0, 2).join(' + ')} > ${Math.max(...right)} – warunek spełniony.`] });
      },
    ),
    S(
      'rodzaje-trojkatow',
      'Rodzaje trójkątów',
      [L('ze względu na kąty: **ostrokątny** (wszystkie kąty ostre), **prostokątny** (jeden kąt prosty), **rozwartokątny** (jeden kąt rozwarty)', 'ze względu na boki: **różnoboczny**, **równoramienny**, **równoboczny**')],
      (d, r) => {
        const a = int(r, 20, 70);
        const kind = pick(r, ['ostro', 'prosto', 'rozwarto'] as const);
        const b = kind === 'prosto' ? 90 - a : kind === 'ostro' ? int(r, 91 - a, 89) : int(r, 5, 85 - a);
        const c = 180 - a - b;
        const name = { ostro: 'ostrokątny', prosto: 'prostokątny', rozwarto: 'rozwartokątny' }[kind];
        return mc(sid('rodzaje-trojkatow'), d, r, { prompt: `Dwa kąty trójkąta mają ${deg(a)} i ${deg(b)}. Jaki to trójkąt?`, right: name, wrong: ['ostrokątny', 'prostokątny', 'rozwartokątny', 'równoboczny'].filter((x) => x !== name), hints: ['Oblicz trzeci kąt i sprawdź, czy któryś jest prosty lub rozwarty.'], sol: [`Trzeci kąt: 180° − ${deg(a)} − ${deg(b)} = ${deg(c)}`, `Największy kąt: ${deg(Math.max(a, b, c))}, więc trójkąt jest ${name}.`] });
      },
    ),
    S(
      'czworokat',
      'Suma kątów czworokąta',
      [R('Suma kątów wewnętrznych czworokąta wynosi **360°** (przekątna dzieli go na dwa trójkąty).', 'Twierdzenie')],
      (d, r) => {
        const a = int(r, 60, 120), b = int(r, 60, 120), c = int(r, 60, 120);
        const e = 360 - a - b - c;
        if (e <= 20 || e >= 180) return q(sid('czworokat'), d, { prompt: 'Trzy kąty czworokąta mają 90°, 90° i 110°. Jaką miarę ma czwarty kąt?', ans: 70, unit: '°', hints: ['Suma kątów czworokąta to 360°.'], sol: ['360° − 90° − 90° − 110° = 70°'] });
        return q(sid('czworokat'), d, { prompt: `Trzy kąty czworokąta mają ${deg(a)}, ${deg(b)} i ${deg(c)}. Jaką miarę ma czwarty kąt?`, ans: e, unit: '°', hints: ['Suma kątów czworokąta to 360°.'], sol: [`360° − ${deg(a)} − ${deg(b)} − ${deg(c)} = ${deg(e)}`] });
      },
    ),
    S(
      'obwod',
      'Obwód prostokąta i kwadratu',
      [L('Obwód prostokąta: 2a + 2b', 'Obwód kwadratu: 4a'), V(rectFig(5, 3, 'a', 'b'), 'Obwód = a + b + a + b')],
      (d, r) => {
        const a = int(r, 2, 20), b = int(r, 2, 15);
        if (d === 3) {
          const ob = 2 * a + 2 * b;
          return q(sid('obwod'), d, { prompt: `Obwód prostokąta wynosi ${ob} cm, a jeden bok ma ${a} cm. Jaką długość ma drugi bok?`, ans: b, unit: 'cm', hints: ['Połowa obwodu to suma dwóch sąsiednich boków.'], sol: [`${ob} : 2 = ${a + b}`, `${a + b} − ${a} = ${b} cm`], wrong: [[ob - a, 'Obwód zawiera każdy bok dwa razy.']] });
        }
        return q(sid('obwod'), d, { prompt: `Oblicz obwód prostokąta o bokach ${a} cm i ${b} cm.`, visual: rectFig(a, b, `${a} cm`, `${b} cm`), ans: 2 * a + 2 * b, unit: 'cm', hints: ['Dodaj długości wszystkich czterech boków.'], sol: [`2 · ${a} + 2 · ${b} = ${2 * a + 2 * b} cm`], wrong: [[a + b, 'Prostokąt ma cztery boki – każdy wymiar liczymy dwa razy.'], [a * b, 'To pole, a nie obwód.']] });
      },
    ),
    S(
      'pole-prostokata',
      'Pole prostokąta i kwadratu',
      [L('Pole prostokąta: P = a · b', 'Pole kwadratu: P = a²'), R('Pole podajemy w jednostkach kwadratowych: cm², m².', 'Uwaga')],
      (d, r) => {
        const a = d === 3 ? r6(int(r, 5, 40) / 2) : int(r, 2, 20), b = int(r, 2, 15);
        return q(sid('pole-prostokata'), d, { prompt: `Oblicz pole prostokąta o bokach ${fmt(a)} cm i ${b} cm.`, visual: rectFig(Number(a), b, `${fmt(a)} cm`, `${b} cm`), ans: r6(a * b), unit: 'cm²', hints: ['Pomnóż długości boków.'], sol: [`P = ${fmt(a)} · ${b} = ${fmt(r6(a * b))} cm²`], wrong: [[r6(2 * a + 2 * b), 'To obwód, a nie pole.']] });
      },
    ),
    S(
      'pole-trojkata',
      'Pole trójkąta',
      [R('P = {a · h/2} – połowa iloczynu podstawy i wysokości opuszczonej na tę podstawę.', 'Wzór'), P('W trójkącie prostokątnym wysokością jest druga przyprostokątna: P = {a · b/2}.')],
      (d, r) => {
        const a = int(r, 2, 20), h = int(r, 2, 16);
        const shift = r6(a * (0.2 + r() * 0.5));
        return q(sid('pole-trojkata'), d, { prompt: `Oblicz pole trójkąta o podstawie ${a} cm i wysokości ${h} cm.`, visual: triFig([0, 0], [a, 0], [shift, h], { sides: [`${a} cm`], height: `${h} cm` }), ans: r6((a * h) / 2), unit: 'cm²', hints: ['Pomnóż podstawę przez wysokość i podziel przez 2.'], sol: [`P = ${a} · ${h} : 2 = ${fmt(r6((a * h) / 2))} cm²`], wrong: [[a * h, 'Nie zapomnij podzielić przez 2.']] });
      },
    ),
    S(
      'pole-rownolegloboku',
      'Pole równoległoboku',
      [R('P = a · h, gdzie h to wysokość opuszczona na bok a.', 'Wzór'), ERR('P = a · b (iloczyn boków)', 'P = a · h', 'Bok ukośny nie jest wysokością.')],
      (d, r) => {
        const a = int(r, 3, 15), h = int(r, 2, 10), side = h + int(r, 1, 4);
        return q(sid('pole-rownolegloboku'), d, { prompt: `Równoległobok ma bok ${a} cm, drugi bok ${side} cm i wysokość opuszczoną na pierwszy bok ${h} cm. Oblicz jego pole.`, visual: parallelogramFig(a, h, Math.sqrt(side * side - h * h), `${a} cm`, `${h} cm`, `${side} cm`), ans: a * h, unit: 'cm²', hints: ['Pole równoległoboku to bok razy wysokość opuszczona na ten bok.'], sol: [`P = ${a} · ${h} = ${a * h} cm²`], wrong: [[a * side, 'Bok ukośny nie jest wysokością.'], [r6((a * h) / 2), 'To wzór na pole trójkąta.']] });
      },
    ),
    S(
      'pole-rombu',
      'Pole rombu',
      [R('P = {e · f/2}, gdzie e i f to długości przekątnych.', 'Wzór'), P('Romb jest też równoległobokiem, więc jego pole to również bok razy wysokość.')],
      (d, r) => {
        const e = int(r, 2, 16) * 2, f = int(r, 2, 12);
        return q(sid('pole-rombu'), d, { prompt: `Przekątne rombu mają długości ${e} cm i ${f} cm. Oblicz pole rombu.`, visual: rhombusFig(e, f, `${e} cm`, `${f} cm`), ans: (e * f) / 2, unit: 'cm²', hints: ['Pomnóż przekątne i podziel przez 2.'], sol: [`P = ${e} · ${f} : 2 = ${(e * f) / 2} cm²`], wrong: [[e * f, 'Nie zapomnij podzielić przez 2.']] });
      },
    ),
    S(
      'pole-trapezu',
      'Pole trapezu',
      [R('P = {(a + b) · h/2}, gdzie a i b to podstawy, h – wysokość.', 'Wzór'), EX('Podstawy 10 cm i 6 cm, wysokość 4 cm.', ['(10 + 6) · 4 : 2 = 16 · 2'], '32 cm²')],
      (d, r) => {
        const a = int(r, 6, 20), b = int(r, 2, a - 2), h = int(r, 2, 12);
        return q(sid('pole-trapezu'), d, { prompt: `Trapez ma podstawy ${a} cm i ${b} cm oraz wysokość ${h} cm. Oblicz jego pole.`, visual: trapezoidFig(a, b, h, `${a} cm`, `${b} cm`, `${h} cm`), ans: r6(((a + b) * h) / 2), unit: 'cm²', hints: ['Dodaj podstawy, pomnóż przez wysokość i podziel przez 2.'], sol: [`P = (${a} + ${b}) · ${h} : 2 = ${fmt(r6(((a + b) * h) / 2))} cm²`], wrong: [[(a + b) * h, 'Nie zapomnij podzielić przez 2.'], [r6((a * b * h) / 2), 'Podstawy dodajemy, a nie mnożymy.']] });
      },
    ),
    S(
      'brakujacy-bok',
      'Bok lub wysokość, gdy znamy pole',
      [P('Przekształcamy wzór na pole: z P = a · b mamy b = P : a, z P = {a · h/2} mamy h = 2P : a.')],
      (d, r) => {
        const a = int(r, 2, 15), b = int(r, 2, 15);
        if (d === 1) return q(sid('brakujacy-bok'), d, { prompt: `Pole prostokąta wynosi ${a * b} cm², a jeden bok ma ${a} cm. Ile wynosi drugi bok?`, ans: b, unit: 'cm', hints: ['Podziel pole przez znany bok.'], sol: [`${a * b} : ${a} = ${b} cm`] });
        if (d === 2) return q(sid('brakujacy-bok'), d, { prompt: `Pole kwadratu wynosi ${a * a} cm². Ile wynosi jego obwód?`, ans: 4 * a, unit: 'cm', hints: ['Najpierw oblicz bok: a = √P.'], sol: [`a = √${a * a} = ${a} cm`, `Obwód: 4 · ${a} = ${4 * a} cm`], wrong: [[a, 'To długość boku, a nie obwód.']] });
        const x = int(r, 2, 12), y = int(r, 2, 12);
        return q(sid('brakujacy-bok'), d, { prompt: `Trapez o polu ${r6(((x + y + 4) * a) / 2)} cm² ma podstawy ${x + 4} cm i ${y} cm. Jaka jest jego wysokość?`, ans: a, unit: 'cm', hints: ['h = 2P : (a + b)'], sol: [`h = 2 · ${fmt(r6(((x + y + 4) * a) / 2))} : (${x + 4} + ${y}) = ${a} cm`] });
      },
    ),
    S(
      'jednostki',
      'Jednostki pola',
      [L('1 cm² = 100 mm²', '1 m² = 10 000 cm²', '1 a (ar) = 100 m²', '1 ha (hektar) = 10 000 m²', '1 km² = 1 000 000 m² = 100 ha'), ERR('1 m² = 100 cm²', '1 m² = 100 cm · 100 cm = 10 000 cm²', 'Przy jednostkach kwadratowych mnożnik też jest „do kwadratu”.')],
      (d, r) => {
        const conv = pick(r, lvl(d, [['m²', 'cm²', 10000], ['cm²', 'mm²', 100]], [['ha', 'm²', 10000], ['a', 'm²', 100], ['m²', 'cm²', 10000]], [['km²', 'ha', 100], ['ha', 'a', 100], ['km²', 'm²', 1000000]]) as [string, string, number][]);
        const v = r6(int(r, 1, 40) / (d === 1 ? 1 : 2));
        if (r() < 0.5) return q(sid('jednostki'), d, { prompt: `Zamień: ${fmt(v)} ${conv[0]} = ? ${conv[1]}`, ans: r6(v * conv[2]), unit: conv[1], hints: [`1 ${conv[0]} = ${fmt(conv[2])} ${conv[1]}.`], sol: [`${fmt(v)} · ${fmt(conv[2])} = ${fmt(r6(v * conv[2]))} ${conv[1]}`], wrong: [[r6(v * Math.sqrt(conv[2])), 'Przy jednostkach pola mnożnik jest kwadratem mnożnika długości.']] });
        return q(sid('jednostki'), d, { prompt: `Zamień: ${fmt(r6(v * conv[2]))} ${conv[1]} = ? ${conv[0]}`, ans: v, unit: conv[0], hints: [`1 ${conv[0]} = ${fmt(conv[2])} ${conv[1]}. Podziel.`], sol: [`${fmt(r6(v * conv[2]))} : ${fmt(conv[2])} = ${fmt(v)} ${conv[0]}`] });
      },
    ),
    S(
      'zlozone',
      'Pole figury złożonej',
      [P('Figurę dzielimy na prostokąty (albo od dużego prostokąta odejmujemy wycięty fragment).'), EX('Prostokąt 10 × 6 z wyciętym kwadratem 3 × 3 w rogu.', ['10 · 6 = 60', '3 · 3 = 9', '60 − 9 = 51'], '51')],
      (d, r) => {
        const W = int(r, 6, 14), H = int(r, 5, 10), w = int(r, 2, W - 3), h = int(r, 2, H - 2);
        const pts: Pt[] = [[0, 0], [W, 0], [W, H - h], [W - w, H - h], [W - w, H], [0, H]];
        const vis = figure([{ t: 'poly', pts, fill: true }, { t: 'elabel', a: [0, 0], b: [W, 0], text: `${W}` }, { t: 'elabel', a: [0, H], b: [0, 0], text: `${H}` }, { t: 'elabel', a: [W - w, H - h], b: [W, H - h], text: `${w}`, side: -1 }, { t: 'elabel', a: [W, 0], b: [W, H - h], text: `${H - h}` }], 'Wymiary w metrach');
        const area = W * H - w * h;
        return q(sid('zlozone'), d, { prompt: 'Oblicz pole działki w kształcie przedstawionym na rysunku (wymiary w metrach).', visual: vis, ans: area, unit: 'm²', hints: ['Uzupełnij figurę do prostokąta i odejmij brakujący fragment.', `Brakujący prostokąt ma wymiary ${w} × ${h}.`], sol: [`Duży prostokąt: ${W} · ${H} = ${W * H} m²`, `Wycięty: ${w} · ${h} = ${w * h} m²`, `Pole: ${W * H} − ${w * h} = ${area} m²`], wrong: [[W * H, 'Odejmij wycięty fragment.']] });
      },
    ),
    S(
      'katy-rownoleglobok',
      'Kąty w równoległoboku i rombie',
      [L('Przeciwległe kąty równoległoboku są równe.', 'Sąsiednie kąty równoległoboku sumują się do 180°.')],
      (d, r) => {
        const a = int(r, 30, 85);
        if (r() < 0.5) return q(sid('katy-rownoleglobok'), d, { prompt: `Kąt ostry równoległoboku ma ${deg(a)}. Jaką miarę ma kąt rozwarty?`, ans: 180 - a, unit: '°', hints: ['Sąsiednie kąty równoległoboku sumują się do 180°.'], sol: [`180° − ${deg(a)} = ${deg(180 - a)}`], wrong: [[360 - a, 'Sąsiednie kąty sumują się do 180°.']] });
        const k = int(r, 2, 4);
        const x = 180 / (k + 1);
        if (!Number.isInteger(x)) return q(sid('katy-rownoleglobok'), d, { prompt: `Jeden kąt rombu ma ${deg(a)}. Ile wynosi suma pozostałych trzech kątów?`, ans: 360 - a, unit: '°', hints: ['Suma kątów czworokąta to 360°.'], sol: [`360° − ${deg(a)} = ${deg(360 - a)}`] });
        return q(sid('katy-rownoleglobok'), d, { prompt: `W równoległoboku kąt rozwarty jest ${k} razy większy od ostrego. Jaką miarę ma kąt ostry?`, ans: x, unit: '°', hints: ['x + ' + k + 'x = 180°'], sol: [`${k + 1}x = 180°`, `x = ${deg(x)}`] });
      },
    ),
    S(
      'foremne',
      'Wielokąty foremne',
      [P('Wielokąt foremny ma wszystkie boki równe i wszystkie kąty równe.'), R('Suma kątów n-kąta: (n − 2) · 180°. Kąt wewnętrzny n-kąta foremnego: (n − 2) · 180° : n.', 'Wzory'), L('trójkąt równoboczny: 60°', 'kwadrat: 90°', 'pięciokąt foremny: 108°', 'sześciokąt foremny: 120°')],
      (d, r) => {
        const [n, name] = pick(r, lvl(d, [[3, 'trójkąta równobocznego'], [4, 'kwadratu'], [6, 'sześciokąta foremnego']], [[5, 'pięciokąta foremnego'], [6, 'sześciokąta foremnego'], [8, 'ośmiokąta foremnego']], [[8, 'ośmiokąta foremnego'], [10, 'dziesięciokąta foremnego'], [12, 'dwunastokąta foremnego']]) as [number, string][]);
        if (r() < 0.4) return q(sid('foremne'), d, { prompt: `Ile wynosi suma kątów wewnętrznych ${name.replace(' foremnego', '').replace('kwadratu', 'czworokąta').replace('trójkąta równobocznego', 'trójkąta')}?`, ans: (n - 2) * 180, unit: '°', hints: ['(n − 2) · 180°'], sol: [`(${n} − 2) · 180° = ${deg((n - 2) * 180)}`] });
        return q(sid('foremne'), d, { prompt: `Jaką miarę ma kąt wewnętrzny ${name}?`, ans: ((n - 2) * 180) / n, unit: '°', hints: ['Oblicz sumę kątów (n − 2) · 180° i podziel przez liczbę kątów.'], sol: [`(${n} − 2) · 180° : ${n} = ${deg(((n - 2) * 180) / n)}`], wrong: [[360 / n, 'To kąt środkowy, a nie wewnętrzny.']] });
      },
    ),
    S(
      'symetria',
      'Osie symetrii figur',
      [L('prostokąt (nie kwadrat): 2 osie', 'kwadrat: 4 osie', 'romb (nie kwadrat): 2 osie (przekątne)', 'trójkąt równoboczny: 3 osie', 'trójkąt równoramienny: 1 oś', 'koło: nieskończenie wiele osi', 'równoległobok (nie romb, nie prostokąt): 0 osi')],
      (d, r) => {
        const items: [string, string][] = [['kwadrat', '4'], ['prostokąt, który nie jest kwadratem', '2'], ['trójkąt równoboczny', '3'], ['trójkąt równoramienny, który nie jest równoboczny', '1'], ['romb, który nie jest kwadratem', '2'], ['równoległobok, który nie jest ani rombem, ani prostokątem', '0'], ['sześciokąt foremny', '6'], ['koło', 'nieskończenie wiele']];
        const [fig, ans] = pick(r, items.slice(0, lvl(d, 4, 6, 8)));
        return mc(sid('symetria'), d, r, { prompt: `Ile osi symetrii ma ${fig}?`, right: ans, wrong: ['0', '1', '2', '3', '4', '6', 'nieskończenie wiele'].filter((x) => x !== ans), hints: ['Wyobraź sobie, że składasz figurę na pół tak, by obie części się pokryły.'], sol: [`${fig[0].toUpperCase() + fig.slice(1)}: ${ans} ${ans === '1' ? 'oś' : ['2', '3', '4'].includes(ans) ? 'osie' : 'osi'} symetrii.`] });
      },
    ),
    S(
      'wysokosc',
      'Wysokość trójkąta z pola',
      [P('Każdy trójkąt ma trzy wysokości. Iloczyn boku i wysokości na ten bok jest zawsze równy 2P.'), EX('Trójkąt prostokątny o przyprostokątnych 6 i 8 i przeciwprostokątnej 10.', ['P = 6 · 8 : 2 = 24', 'Wysokość na przeciwprostokątną: 2 · 24 : 10'], '4,8')],
      (d, r) => {
        const [a, b, c] = pick(r, [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17]] as [number, number, number][]);
        const P2 = a * b;
        if (d === 1) {
          const base = int(r, 2, 12), h = int(r, 2, 12);
          return q(sid('wysokosc'), d, { prompt: `Pole trójkąta wynosi ${r6((base * h) / 2)} cm², a jego podstawa ma ${base} cm. Jaka jest wysokość opuszczona na tę podstawę?`, ans: h, unit: 'cm', hints: ['h = 2P : a'], sol: [`h = 2 · ${fmt(r6((base * h) / 2))} : ${base} = ${h} cm`], wrong: [[r6((base * h) / 2 / base), 'Pomnóż pole przez 2 przed dzieleniem.']] });
        }
        return q(sid('wysokosc'), d, { prompt: `Trójkąt prostokątny ma przyprostokątne ${a} cm i ${b} cm oraz przeciwprostokątną ${c} cm. Oblicz wysokość opuszczoną na przeciwprostokątną.`, visual: triFig([0, 0], [a, 0], [0, b], { sides: [`${a} cm`, `${c} cm`, `${b} cm`], rightAt: 0 }), ans: r6(P2 / c), unit: 'cm', hints: ['Oblicz pole z przyprostokątnych.', 'h = 2P : c'], sol: [`P = ${a} · ${b} : 2 = ${P2 / 2} cm²`, `h = 2 · ${P2 / 2} : ${c} = ${fmt(r6(P2 / c))} cm`] });
      },
    ),
    S(
      'trapez-katy',
      'Kąty w trapezie',
      [R('Kąty przy tym samym ramieniu trapezu sumują się do **180°** (podstawy są równoległe).', 'Własność'), P('W trapezie równoramiennym kąty przy tej samej podstawie są równe.')],
      (d, r) => {
        const a = int(r, 40, 85);
        if (d >= 2 && r() < 0.5) return q(sid('trapez-katy'), d, { prompt: `W trapezie równoramiennym kąt ostry ma ${deg(a)}. Ile wynosi suma obu kątów rozwartych?`, ans: 2 * (180 - a), unit: '°', hints: ['Kąt rozwarty = 180° − kąt ostry. Są dwa takie kąty.'], sol: [`Kąt rozwarty: ${deg(180 - a)}`, `Suma: 2 · ${deg(180 - a)} = ${deg(2 * (180 - a))}`] });
        return q(sid('trapez-katy'), d, { prompt: `Kąt przy dłuższej podstawie trapezu ma ${deg(a)}. Jaką miarę ma kąt przy tym samym ramieniu, ale przy krótszej podstawie?`, ans: 180 - a, unit: '°', hints: ['Kąty przy jednym ramieniu sumują się do 180°.'], sol: [`180° − ${deg(a)} = ${deg(180 - a)}`], wrong: [[a, 'Te kąty nie są równe – sumują się do 180°.']] });
      },
    ),
    S(
      'plytki',
      'Zadania praktyczne: płytki, farba, siatka',
      [P('W zadaniach praktycznych najpierw liczymy pole (albo obwód), a potem dzielimy przez to, co pokrywa jedna płytka, puszka itp. Liczba kupowanych rzeczy musi być całkowita – zaokrąglamy w górę.')],
      (d, r) => {
        const who = person(r);
        if (r() < 0.5) {
          const W = int(r, 2, 6), H = int(r, 2, 5);
          const tile = pick(r, [20, 25, 50]);
          const count = ((W * 100) / tile) * ((H * 100) / tile);
          return q(sid('plytki'), d, { prompt: `Podłogę o wymiarach ${W} m × ${H} m trzeba wyłożyć kwadratowymi płytkami o boku ${tile} cm. Ile płytek potrzeba?`, ans: count, hints: ['Zamień metry na centymetry.', `Policz, ile płytek zmieści się wzdłuż każdego boku.`], sol: [`Wzdłuż: ${W * 100} : ${tile} = ${(W * 100) / tile}, wszerz: ${H * 100} : ${tile} = ${(H * 100) / tile}`, `Razem: ${count} płytek`], wrong: [[(W * H) / (tile * tile), 'Pamiętaj o zamianie metrów na centymetry.']] });
        }
        const area = int(r, 20, 80), per = pick(r, [6, 8, 10, 12]);
        const cans = Math.ceil(area / per);
        return q(sid('plytki'), d, { prompt: `${who.name} chce pomalować ścianę o powierzchni ${area} m². Jedna puszka farby wystarcza na ${per} m². Ile co najmniej puszek musi kupić?`, ans: cans, hints: [`${area} : ${per} = ${fmt(r6(area / per))}`, 'Puszek nie da się kupić „trochę” – zaokrąglij w górę.'], sol: [`${area} : ${per} = ${fmt(r6(area / per))}`, `Potrzeba ${cans} puszek.`], wrong: [[Math.floor(area / per), 'Zaokrąglij w górę – inaczej farby zabraknie.']] });
      },
    ),
    S(
      'pr-falsz',
      'Prawda czy fałsz: własności figur',
      [P('Sprawdzaj każde zdanie osobno. Szukaj kontrprzykładu – jeśli znajdziesz jeden, zdanie jest fałszywe.')],
      (d, r) => {
        const items: [string, boolean, string][] = [
          ['Każdy kwadrat jest prostokątem.', true, 'Kwadrat ma cztery kąty proste – spełnia definicję prostokąta.'],
          ['Każdy prostokąt jest kwadratem.', false, 'Prostokąt 2 × 5 nie ma równych boków.'],
          ['Każdy romb jest równoległobokiem.', true, 'Romb ma dwie pary boków równoległych.'],
          ['Przekątne każdego prostokąta są prostopadłe.', false, 'Przekątne są prostopadłe tylko w kwadracie.'],
          ['Trójkąt może mieć dwa kąty rozwarte.', false, 'Dwa kąty rozwarte dają razem ponad 180°.'],
          ['W trójkącie prostokątnym dwa kąty są ostre.', true, '90° + α + β = 180°, więc α + β = 90°.'],
          ['Przekątne rombu są prostopadłe.', true, 'To jedna z własności rombu.'],
          ['Każdy trapez ma oś symetrii.', false, 'Tylko trapez równoramienny ma oś symetrii.'],
        ];
        const a = pick(r, items), b = pick(r, items.filter((x) => x !== a));
        return tf(sid('pr-falsz'), d, { items: [a, b] });
      },
    ),
  ],
};
