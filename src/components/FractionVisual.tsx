import type { FigItem, Pt, Visual } from '../content/types';
import { MathText } from './MathText';

function Bar({ num, den, label, width = 320 }: { num: number; den: number; label?: string; width?: number }) {
  const h = 36;
  const full = Math.max(1, Math.ceil(num / den)); // dla ułamków niewłaściwych rysujemy kilka pasków
  const bars = Array.from({ length: full }, (_, b) => b);
  return (
    <div className="viz-bar-row">
      <div className="viz-bars">
        {bars.map((b) => {
          const filled = Math.min(den, Math.max(0, num - b * den));
          return (
            <svg key={b} viewBox={`0 0 ${width} ${h}`} width="100%" style={{ maxWidth: width }} role="img" aria-label={`${filled} z ${den} części`}>
              {Array.from({ length: den }, (_, i) => (
                <rect
                  key={i}
                  x={(i * width) / den + 1}
                  y={1}
                  width={width / den - 2}
                  height={h - 2}
                  rx={4}
                  className={i < filled ? 'viz-fill' : 'viz-empty'}
                />
              ))}
            </svg>
          );
        })}
      </div>
      {label && <MathText className="viz-label" text={label} />}
    </div>
  );
}

function NumberLine({ min, max, den, points }: Extract<Visual, { kind: 'numberline' }>) {
  const W = 560;
  const pad = 28;
  const units = max - min;
  const steps = units * den;
  const x = (k: number) => pad + ((W - 2 * pad) * k) / steps;
  return (
    <svg viewBox={`0 0 ${W} 92`} width="100%" className="viz-line" role="img" aria-label="Oś liczbowa">
      <line x1={pad - 10} x2={W - pad + 14} y1={50} y2={50} className="viz-axis" />
      <polygon points={`${W - pad + 18},50 ${W - pad + 8},45 ${W - pad + 8},55`} className="viz-arrow" />
      {Array.from({ length: steps + 1 }, (_, k) => {
        const isUnit = k % den === 0;
        return (
          <g key={k}>
            <line x1={x(k)} x2={x(k)} y1={isUnit ? 40 : 44} y2={isUnit ? 60 : 56} className={isUnit ? 'viz-tick-major' : 'viz-tick'} />
            {isUnit && (
              <text x={x(k)} y={80} textAnchor="middle" className="viz-text">
                {min + k / den}
              </text>
            )}
          </g>
        );
      })}
      {points.map((p) => (
        <g key={p.label}>
          <circle cx={x(p.at)} cy={50} r={7} className="viz-point" />
          <text x={x(p.at)} y={28} textAnchor="middle" className="viz-point-label">
            {p.label}
            {p.showValue ? ` = ${p.at}/${den}` : ''}
          </text>
        </g>
      ))}
    </svg>
  );
}

/* ---------------- Rysunki geometryczne ---------------- */

const unit = (from: Pt, to: Pt): Pt => {
  const l = Math.hypot(to[0] - from[0], to[1] - from[1]) || 1;
  return [(to[0] - from[0]) / l, (to[1] - from[1]) / l];
};

function Arc({ at, a, b, label }: { at: Pt; a: Pt; b: Pt; label?: string }) {
  const r = 22;
  const u = unit(at, a);
  const v = unit(at, b);
  const p1: Pt = [at[0] + u[0] * r, at[1] + u[1] * r];
  const p2: Pt = [at[0] + v[0] * r, at[1] + v[1] * r];
  const cross = u[0] * v[1] - u[1] * v[0];
  const bis = unit([0, 0], [u[0] + v[0], u[1] + v[1]]);
  const lr = 40;
  return (
    <g>
      <path d={`M${p1[0]},${p1[1]} A${r},${r} 0 0 ${cross > 0 ? 1 : 0} ${p2[0]},${p2[1]}`} className="fig-arc" />
      {label && (
        <text x={at[0] + bis[0] * lr} y={at[1] + bis[1] * lr + 5} textAnchor="middle" className="fig-text fig-angle">
          {label}
        </text>
      )}
    </g>
  );
}

function FigItemView({ it }: { it: FigItem }) {
  switch (it.t) {
    case 'poly': {
      const d = it.pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ') + (it.open ? '' : ' Z');
      return <path d={d} className={`fig-shape ${it.fill ? 'fig-fill' : ''} ${it.dashed ? 'fig-dashed' : ''}`} />;
    }
    case 'line':
      return <line x1={it.a[0]} y1={it.a[1]} x2={it.b[0]} y2={it.b[1]} className={`fig-line ${it.dashed ? 'fig-dashed' : ''} ${it.thin ? 'fig-thin' : ''}`} />;
    case 'circle':
      return <circle cx={it.c[0]} cy={it.c[1]} r={it.r} className={`fig-shape ${it.fill ? 'fig-fill' : ''} ${it.dashed ? 'fig-dashed' : ''}`} />;
    case 'text':
      return (
        <text x={it.at[0]} y={it.at[1]} textAnchor={it.anchor ?? 'middle'} className={`fig-text ${it.bold ? 'fig-bold' : ''}`}>
          {it.text}
        </text>
      );
    case 'right': {
      const s = 11;
      const u = unit(it.at, it.a);
      const v = unit(it.at, it.b);
      const p1: Pt = [it.at[0] + u[0] * s, it.at[1] + u[1] * s];
      const p3: Pt = [it.at[0] + v[0] * s, it.at[1] + v[1] * s];
      const p2: Pt = [p1[0] + v[0] * s, p1[1] + v[1] * s];
      return <path d={`M${p1[0]},${p1[1]} L${p2[0]},${p2[1]} L${p3[0]},${p3[1]}`} className="fig-arc" />;
    }
    case 'arc':
      return <Arc at={it.at} a={it.a} b={it.b} label={it.label} />;
    case 'dot':
      return (
        <g>
          <circle cx={it.at[0]} cy={it.at[1]} r={3.5} className="fig-dot" />
          {it.label && (
            <text x={it.at[0] + (it.dx ?? 8)} y={it.at[1] + (it.dy ?? -8)} className="fig-text fig-bold">
              {it.label}
            </text>
          )}
        </g>
      );
  }
}

function Figure({ visual }: { visual: Extract<Visual, { kind: 'figure' }> }) {
  return (
    <figure className="fig">
      <svg viewBox={`0 0 ${visual.w} ${visual.h}`} width="100%" style={{ maxWidth: visual.w * 1.25 }} role="img" aria-label={visual.caption ?? 'Rysunek do zadania'}>
        {visual.items.map((it, i) => (
          <FigItemView key={i} it={it} />
        ))}
      </svg>
      {visual.caption && <figcaption className="muted small">{visual.caption}</figcaption>}
    </figure>
  );
}

function niceMax(v: number) {
  const p = 10 ** Math.floor(Math.log10(Math.max(1, v)));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}

function Chart({ visual }: { visual: Extract<Visual, { kind: 'chart' }> }) {
  const W = 360;
  const H = 220;
  const left = 40;
  const bottom = 34;
  const top = 16;
  const max = niceMax(Math.max(...visual.bars.map((b) => b.value)));
  const steps = 5;
  const bw = (W - left - 10) / visual.bars.length;
  const y = (v: number) => H - bottom - ((H - bottom - top) * v) / max;
  return (
    <figure className="fig">
      {visual.title && <figcaption className="fig-title">{visual.title}</figcaption>}
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 460 }} role="img" aria-label={visual.title ?? 'Wykres słupkowy'}>
        {Array.from({ length: steps + 1 }, (_, i) => {
          const v = (max / steps) * i;
          return (
            <g key={i}>
              <line x1={left} x2={W - 6} y1={y(v)} y2={y(v)} className="fig-grid" />
              <text x={left - 6} y={y(v) + 4} textAnchor="end" className="fig-text fig-small">
                {String(Math.round(v * 100) / 100).replace('.', ',')}
              </text>
            </g>
          );
        })}
        {visual.bars.map((b, i) => (
          <g key={i}>
            <rect x={left + i * bw + bw * 0.18} y={y(b.value)} width={bw * 0.64} height={H - bottom - y(b.value)} rx={3} className="fig-bar" />
            <text x={left + i * bw + bw / 2} y={H - bottom + 18} textAnchor="middle" className="fig-text fig-small">
              {b.label}
            </text>
          </g>
        ))}
        <line x1={left} x2={W - 6} y1={H - bottom} y2={H - bottom} className="fig-line" />
      </svg>
      {visual.unit && <figcaption className="muted small">Wartości w: {visual.unit}</figcaption>}
    </figure>
  );
}

function Plane({ visual }: { visual: Extract<Visual, { kind: 'plane' }> }) {
  const { min, max } = visual;
  const S = 280;
  const pad = 20;
  const n = max - min;
  const c = (S - 2 * pad) / n;
  const X = (x: number) => pad + (x - min) * c;
  const Y = (y: number) => S - pad - (y - min) * c;
  const pts = visual.points;
  return (
    <figure className="fig">
      <svg viewBox={`0 0 ${S} ${S}`} width="100%" style={{ maxWidth: 340 }} role="img" aria-label="Układ współrzędnych">
        {Array.from({ length: n + 1 }, (_, i) => (
          <g key={i}>
            <line x1={X(min + i)} x2={X(min + i)} y1={Y(min)} y2={Y(max)} className="fig-grid" />
            <line x1={X(min)} x2={X(max)} y1={Y(min + i)} y2={Y(min + i)} className="fig-grid" />
          </g>
        ))}
        <line x1={X(min)} x2={X(max)} y1={Y(0)} y2={Y(0)} className="fig-axis" />
        <line x1={X(0)} x2={X(0)} y1={Y(min)} y2={Y(max)} className="fig-axis" />
        <text x={X(max) - 4} y={Y(0) - 6} textAnchor="end" className="fig-text fig-small">x</text>
        <text x={X(0) + 6} y={Y(max) + 12} className="fig-text fig-small">y</text>
        <text x={X(1)} y={Y(0) + 14} textAnchor="middle" className="fig-text fig-small">1</text>
        <text x={X(0) - 6} y={Y(1) + 4} textAnchor="end" className="fig-text fig-small">1</text>
        {visual.poly && pts.length > 2 && <path d={pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.x)},${Y(p.y)}`).join(' ') + ' Z'} className="fig-shape fig-fill" />}
        {(visual.segments ?? []).map(([a, b], i) => (
          <line key={i} x1={X(pts[a].x)} y1={Y(pts[a].y)} x2={X(pts[b].x)} y2={Y(pts[b].y)} className="fig-line" />
        ))}
        {pts.map((p) => (
          <g key={p.label}>
            <circle cx={X(p.x)} cy={Y(p.y)} r={4} className="fig-dot" />
            <text x={X(p.x) + 7} y={Y(p.y) - 7} className="fig-text fig-bold">
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </figure>
  );
}

function DataTable({ visual }: { visual: Extract<Visual, { kind: 'table' }> }) {
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {visual.head.map((h, i) => (
              <th key={i} scope="col">
                <MathText text={h} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visual.rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j}>
                  <MathText text={c} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FractionVisual({ visual }: { visual: Visual }) {
  return (
    <div className="viz">
      {visual.kind === 'figure' && <Figure visual={visual} />}
      {visual.kind === 'chart' && <Chart visual={visual} />}
      {visual.kind === 'plane' && <Plane visual={visual} />}
      {visual.kind === 'table' && <DataTable visual={visual} />}
      {visual.kind === 'bar' && <Bar num={visual.num} den={visual.den} label={visual.label} />}
      {visual.kind === 'bars' && visual.items.map((it, i) => <Bar key={i} num={it.num} den={it.den} label={it.label} width={240} />)}
      {visual.kind === 'numberline' && <NumberLine {...visual} />}
    </div>
  );
}
