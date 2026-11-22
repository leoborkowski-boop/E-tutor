/**
 * Rysunki do zadań z geometrii. Funkcje przyjmują współrzędne „matematyczne”
 * (oś y w górę) i same dopasowują rysunek do ramki.
 */
import type { FigItem, Pt, Visual } from '../types';

type Draft =
  | FigItem
  | { t: 'elabel'; a: Pt; b: Pt; text: string; side?: 1 | -1 }
  | { t: 'vlabel'; at: Pt; text: string };

const W = 320;
const H = 210;
const PAD = 34;

/** Zamienia szkic w jednostkach matematycznych na rysunek SVG. */
export function figure(drafts: Draft[], caption?: string, opts: { w?: number; h?: number } = {}): Visual {
  const w = opts.w ?? W;
  const h = opts.h ?? H;
  const pts: Pt[] = [];
  for (const d of drafts) {
    if (d.t === 'poly') pts.push(...d.pts);
    else if (d.t === 'line' || d.t === 'elabel') pts.push(d.a, d.b);
    else if (d.t === 'circle') pts.push([d.c[0] - d.r, d.c[1] - d.r], [d.c[0] + d.r, d.c[1] + d.r]);
    else if (d.t === 'dot' || d.t === 'vlabel' || d.t === 'text') pts.push(d.at);
  }
  const minX = Math.min(...pts.map((p) => p[0]));
  const maxX = Math.max(...pts.map((p) => p[0]));
  const minY = Math.min(...pts.map((p) => p[1]));
  const maxY = Math.max(...pts.map((p) => p[1]));
  const s = Math.min((w - 2 * PAD) / Math.max(1e-6, maxX - minX), (h - 2 * PAD) / Math.max(1e-6, maxY - minY));
  const ox = (w - (maxX - minX) * s) / 2;
  const oy = (h - (maxY - minY) * s) / 2;
  const T = (p: Pt): Pt => [round(ox + (p[0] - minX) * s), round(oy + (maxY - p[1]) * s)];
  // środek ciężkości wszystkich wielokątów – do wypychania podpisów na zewnątrz
  const polyPts = drafts.flatMap((d) => (d.t === 'poly' ? d.pts : []));
  const cm: Pt = polyPts.length
    ? [polyPts.reduce((a, p) => a + p[0], 0) / polyPts.length, polyPts.reduce((a, p) => a + p[1], 0) / polyPts.length]
    : [(minX + maxX) / 2, (minY + maxY) / 2];
  const C = T(cm);
  const items: FigItem[] = drafts.map((d): FigItem => {
    switch (d.t) {
      case 'poly':
        return { ...d, pts: d.pts.map(T) };
      case 'line':
        return { ...d, a: T(d.a), b: T(d.b) };
      case 'circle':
        return { ...d, c: T(d.c), r: round(d.r * s) };
      case 'text':
        return { ...d, at: T(d.at) };
      case 'dot':
        return { ...d, at: T(d.at) };
      case 'right':
        return { t: 'right', at: T(d.at), a: T(d.a), b: T(d.b) };
      case 'arc':
        return { ...d, at: T(d.at), a: T(d.a), b: T(d.b) };
      case 'vlabel': {
        const p = T(d.at);
        const v = norm([p[0] - C[0], p[1] - C[1]]);
        return { t: 'text', at: [round(p[0] + v[0] * 14), round(p[1] + v[1] * 14 + 5)], text: d.text, anchor: 'middle', bold: true };
      }
      case 'elabel': {
        const a = T(d.a);
        const b = T(d.b);
        const mid: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        let n = norm([-(b[1] - a[1]), b[0] - a[0]]);
        const toC = [C[0] - mid[0], C[1] - mid[1]];
        if (n[0] * toC[0] + n[1] * toC[1] > 0) n = [-n[0], -n[1]];
        if (d.side === -1) n = [-n[0], -n[1]];
        return { t: 'text', at: [round(mid[0] + n[0] * 15), round(mid[1] + n[1] * 15 + 5)], text: d.text, anchor: 'middle' };
      }
    }
  });
  return { kind: 'figure', w, h, items, caption };
}

function round(n: number) {
  return Math.round(n * 10) / 10;
}
function norm(v: number[]): Pt {
  const l = Math.hypot(v[0], v[1]) || 1;
  return [v[0] / l, v[1] / l];
}

const lab = (a: Pt, b: Pt, text?: string): Draft[] => (text ? [{ t: 'elabel', a, b, text }] : []);

/* ---------------- Figury płaskie ---------------- */

export function rectFig(w: number, h: number, wLabel?: string, hLabel?: string, opts: { diagonal?: string; names?: boolean } = {}): Visual {
  const A: Pt = [0, 0], B: Pt = [w, 0], Cc: Pt = [w, h], D: Pt = [0, h];
  return figure([
    { t: 'poly', pts: [A, B, Cc, D], fill: true },
    ...lab(A, B, wLabel),
    ...lab(B, Cc, hLabel),
    ...(opts.diagonal ? ([{ t: 'line', a: A, b: Cc, dashed: true }, { t: 'text', at: [w * 0.45, h * 0.62], text: opts.diagonal, anchor: 'middle' }] as Draft[]) : []),
    ...(opts.names ? ([['A', A], ['B', B], ['C', Cc], ['D', D]] as [string, Pt][]).map(([text, at]): Draft => ({ t: 'vlabel', at, text })) : []),
  ]);
}

/** Trójkąt z podpisami boków (AB, BC, CA), kątów i wierzchołków. */
export function triFig(
  A: Pt,
  B: Pt,
  Cc: Pt,
  o: { sides?: [string?, string?, string?]; angles?: [string?, string?, string?]; names?: boolean; rightAt?: 0 | 1 | 2; height?: string } = {},
): Visual {
  const V = [A, B, Cc];
  const d: Draft[] = [{ t: 'poly', pts: V, fill: true }];
  const [ab, bc, ca] = o.sides ?? [];
  d.push(...lab(A, B, ab), ...lab(B, Cc, bc), ...lab(Cc, A, ca));
  (o.angles ?? []).forEach((text, i) => {
    if (!text) return;
    d.push({ t: 'arc', at: V[i], a: V[(i + 1) % 3], b: V[(i + 2) % 3], label: text });
  });
  if (o.rightAt !== undefined) {
    const i = o.rightAt;
    d.push({ t: 'right', at: V[i], a: V[(i + 1) % 3], b: V[(i + 2) % 3] });
  }
  if (o.height) {
    // wysokość z C na AB (AB poziomo)
    const foot: Pt = [Cc[0], A[1]];
    d.push({ t: 'line', a: Cc, b: foot, dashed: true }, { t: 'right', at: foot, a: B, b: Cc }, { t: 'text', at: [Cc[0] + 0.12 * Math.abs(B[0] - A[0]), (Cc[1] + A[1]) / 2], text: o.height, anchor: 'start' });
  }
  if (o.names) ['A', 'B', 'C'].forEach((text, i) => d.push({ t: 'vlabel', at: V[i], text }));
  return figure(d);
}

/** Trójkąt prostokątny: przyprostokątne a (poziomo), b (pionowo), przeciwprostokątna c. */
export function rightTriFig(a: number, b: number, la?: string, lb?: string, lc?: string): Visual {
  return triFig([0, 0], [a, 0], [0, b], { sides: [la, lc, lb], rightAt: 0 });
}

export function parallelogramFig(a: number, h: number, shift: number, la?: string, lh?: string, lside?: string): Visual {
  const A: Pt = [0, 0], B: Pt = [a, 0], Cc: Pt = [a + shift, h], D: Pt = [shift, h];
  const foot: Pt = [shift, 0];
  return figure([
    { t: 'poly', pts: [A, B, Cc, D], fill: true },
    ...lab(A, B, la),
    ...lab(B, Cc, lside),
    ...(lh ? ([{ t: 'line', a: D, b: foot, dashed: true }, { t: 'right', at: foot, a: B, b: D }, { t: 'text', at: [shift + a * 0.06, h / 2], text: lh, anchor: 'start' }] as Draft[]) : []),
  ]);
}

export function trapezoidFig(a: number, b: number, h: number, la?: string, lb?: string, lh?: string): Visual {
  const off = (a - b) / 2;
  const A: Pt = [0, 0], B: Pt = [a, 0], Cc: Pt = [off + b, h], D: Pt = [off, h];
  const foot: Pt = [off, 0];
  return figure([
    { t: 'poly', pts: [A, B, Cc, D], fill: true },
    ...lab(A, B, la),
    ...lab(Cc, D, lb),
    ...(lh ? ([{ t: 'line', a: D, b: foot, dashed: true }, { t: 'right', at: foot, a: B, b: D }, { t: 'text', at: [off + a * 0.04, h / 2], text: lh, anchor: 'start' }] as Draft[]) : []),
  ]);
}

export function rhombusFig(d1: number, d2: number, l1?: string, l2?: string): Visual {
  const A: Pt = [0, 0], B: Pt = [d1 / 2, -d2 / 2], Cc: Pt = [d1, 0], D: Pt = [d1 / 2, d2 / 2];
  return figure([
    { t: 'poly', pts: [A, B, Cc, D], fill: true },
    { t: 'line', a: A, b: Cc, dashed: true },
    { t: 'line', a: B, b: D, dashed: true },
    ...(l1 ? ([{ t: 'text', at: [d1 * 0.25, -d2 * 0.07], text: l1, anchor: 'middle' }] as Draft[]) : []),
    ...(l2 ? ([{ t: 'text', at: [d1 * 0.5 + d1 * 0.04, d2 * 0.22], text: l2, anchor: 'start' }] as Draft[]) : []),
  ]);
}

export function circleFig(rLabel?: string, dLabel?: string): Visual {
  const d: Draft[] = [{ t: 'circle', c: [0, 0], r: 1, fill: true }, { t: 'dot', at: [0, 0], label: 'S', dx: -12, dy: -6 }];
  if (rLabel) d.push({ t: 'line', a: [0, 0], b: [1, 0] }, { t: 'text', at: [0.5, 0.12], text: rLabel, anchor: 'middle' });
  if (dLabel) d.push({ t: 'line', a: [-1, 0], b: [1, 0] }, { t: 'text', at: [0, -0.18], text: dLabel, anchor: 'middle' });
  return figure(d);
}

/** Dwie proste przecięte – kąty wierzchołkowe i przyległe. */
export function crossFig(label1: string, label2?: string): Visual {
  const a: Pt = [-2, -0.8], b: Pt = [2, 0.8], c: Pt = [-1.2, 1.2], e: Pt = [1.2, -1.2];
  return figure([
    { t: 'line', a, b },
    { t: 'line', a: c, b: e },
    { t: 'arc', at: [0, 0], a: b, b: c, label: label1 },
    ...(label2 ? ([{ t: 'arc', at: [0, 0], a: c, b: a, label: label2 }] as Draft[]) : []),
  ]);
}

/** Kąt półpełny podzielony półprostą: α i β przyległe. */
export function adjacentFig(label1: string, label2: string, deg: number): Visual {
  const r = (deg * Math.PI) / 180;
  const ray: Pt = [Math.cos(r) * 2, Math.sin(r) * 2];
  return figure([
    { t: 'line', a: [-2, 0], b: [2, 0] },
    { t: 'line', a: [0, 0], b: ray },
    { t: 'arc', at: [0, 0], a: [2, 0], b: ray, label: label1 },
    { t: 'arc', at: [0, 0], a: ray, b: [-2, 0], label: label2 },
  ]);
}

/** Dwie proste równoległe przecięte trzecią. */
export function parallelFig(label1: string, label2: string, pos2: 'odpowiadajacy' | 'naprzemianlegly' | 'przylegly'): Visual {
  const p1: Pt = [-0.5, 0], p2: Pt = [0.5, 1.4];
  const dir: Pt = [1, 2.8];
  const d: Draft[] = [
    { t: 'line', a: [-2.5, 0], b: [2.5, 0] },
    { t: 'line', a: [-2.5, 1.4], b: [2.5, 1.4] },
    { t: 'line', a: [p1[0] - dir[0] * 0.3, p1[1] - dir[1] * 0.3], b: [p2[0] + dir[0] * 0.3, p2[1] + dir[1] * 0.3] },
    { t: 'arc', at: p1, a: [2.5, 0], b: [p1[0] + dir[0], p1[1] + dir[1]], label: label1 },
  ];
  if (pos2 === 'odpowiadajacy') d.push({ t: 'arc', at: p2, a: [2.5, 1.4], b: [p2[0] + dir[0], p2[1] + dir[1]], label: label2 });
  if (pos2 === 'naprzemianlegly') d.push({ t: 'arc', at: p2, a: [-2.5, 1.4], b: [p2[0] - dir[0], p2[1] - dir[1]], label: label2 });
  if (pos2 === 'przylegly') d.push({ t: 'arc', at: p1, a: [p1[0] + dir[0], p1[1] + dir[1]], b: [-2.5, 0], label: label2 });
  return figure(d);
}

/* ---------------- Bryły (rzut ukośny) ---------------- */

const DX = 0.45;
const DY = 0.35;
const back = (p: Pt, depth: number): Pt => [p[0] + depth * DX, p[1] + depth * DY];

/** Prostopadłościan a × b × c (szerokość, głębokość, wysokość). */
export function cuboidFig(a: number, b: number, c: number, la?: string, lb?: string, lc?: string, diag?: string): Visual {
  const A: Pt = [0, 0], B: Pt = [a, 0], Cc: Pt = [a, c], D: Pt = [0, c];
  const A2 = back(A, b), B2 = back(B, b), C2 = back(Cc, b), D2 = back(D, b);
  const d: Draft[] = [
    { t: 'poly', pts: [A, B, Cc, D], fill: true },
    { t: 'poly', pts: [D, Cc, C2, D2], fill: true },
    { t: 'poly', pts: [B, B2, C2, Cc], fill: true },
    { t: 'line', a: A, b: A2, dashed: true, thin: true },
    { t: 'line', a: A2, b: B2, dashed: true, thin: true },
    { t: 'line', a: A2, b: D2, dashed: true, thin: true },
    ...lab(A, B, la),
    ...(lb ? ([{ t: 'elabel', a: B, b: B2, text: lb, side: 1 }] as Draft[]) : []),
    ...(lc ? ([{ t: 'elabel', a: A, b: D, text: lc }] as Draft[]) : []),
  ];
  if (diag) d.push({ t: 'line', a: A, b: C2, dashed: true }, { t: 'text', at: [(A[0] + C2[0]) / 2 + 0.1, (A[1] + C2[1]) / 2 - 0.15 * c], text: diag, anchor: 'start' });
  return figure(d);
}

/** Graniastosłup prosty o podstawie trójkątnej (trójkąt prostokątny). */
export function triPrismFig(a: number, b: number, hgt: number, la?: string, lb?: string, lh?: string): Visual {
  const A: Pt = [0, 0], B: Pt = [a, 0], Cc: Pt = back([0, 0], b);
  const up = (p: Pt): Pt => [p[0], p[1] + hgt];
  return figure([
    { t: 'poly', pts: [A, B, up(B), up(A)], fill: true },
    { t: 'poly', pts: [up(A), up(B), up(Cc)], fill: true },
    { t: 'line', a: B, b: Cc, dashed: true, thin: true },
    { t: 'line', a: A, b: Cc, dashed: true, thin: true },
    { t: 'line', a: Cc, b: up(Cc), dashed: true, thin: true },
    { t: 'line', a: up(B), b: up(Cc) },
    ...lab(A, B, la),
    ...(lb ? ([{ t: 'text', at: [Cc[0] * 0.5 - 0.15, Cc[1] * 0.5 + 0.05], text: lb, anchor: 'end' }] as Draft[]) : []),
    ...(lh ? ([{ t: 'elabel', a: B, b: up(B), text: lh, side: -1 }] as Draft[]) : []),
  ]);
}

/** Ostrosłup prawidłowy czworokątny: krawędź podstawy a, wysokość h. */
export function pyramidFig(a: number, h: number, la?: string, lh?: string, lEdge?: string): Visual {
  const A: Pt = [0, 0], B: Pt = [a, 0], Cc = back(B, a), D = back(A, a);
  const O: Pt = [(A[0] + Cc[0]) / 2, (A[1] + Cc[1]) / 2];
  const S: Pt = [O[0], O[1] + h];
  const d: Draft[] = [
    { t: 'poly', pts: [A, B, S], fill: true },
    { t: 'poly', pts: [B, Cc, S], fill: true },
    { t: 'line', a: A, b: D, dashed: true, thin: true },
    { t: 'line', a: D, b: Cc, dashed: true, thin: true },
    { t: 'line', a: D, b: S, dashed: true, thin: true },
    ...lab(A, B, la),
  ];
  if (lh) d.push({ t: 'line', a: O, b: S, dashed: true }, { t: 'dot', at: O }, { t: 'text', at: [O[0] + 0.08 * a, O[1] + h * 0.45], text: lh, anchor: 'start' });
  if (lEdge) d.push({ t: 'elabel', a: B, b: S, text: lEdge, side: 1 });
  return figure(d);
}

export function cubeFig(a: number, la?: string): Visual {
  return cuboidFig(a, a, a, la);
}

/* ---------------- Wykresy i tabele ---------------- */

export function barChart(bars: { label: string; value: number }[], unit?: string, title?: string): Visual {
  return { kind: 'chart', bars, unit, title };
}

export function table(head: string[], rows: (string | number)[][]): Visual {
  return { kind: 'table', head, rows: rows.map((r) => r.map(String)) };
}
