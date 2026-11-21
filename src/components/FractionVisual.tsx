import type { Visual } from '../content/types';
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

export function FractionVisual({ visual }: { visual: Visual }) {
  return (
    <div className="viz">
      {visual.kind === 'bar' && <Bar num={visual.num} den={visual.den} label={visual.label} />}
      {visual.kind === 'bars' && visual.items.map((it, i) => <Bar key={i} num={it.num} den={it.den} label={it.label} width={240} />)}
      {visual.kind === 'numberline' && <NumberLine {...visual} />}
    </div>
  );
}
