import { useRef } from 'react';

const W = 600;
const PAD = 30;

/**
 * Oś liczbowa, na której uczeń zaznacza punkt (dotknięcie, przeciągnięcie
 * albo strzałki na klawiaturze). Punkt „przykleja się” do najbliższej kreski.
 */
export function NumberLinePicker({
  min,
  max,
  den,
  value,
  onChange,
  disabled,
  correctTick,
  showLabels = true,
}: {
  min: number;
  max: number;
  den: number;
  value: number | null;
  onChange: (tick: number) => void;
  disabled?: boolean;
  correctTick?: number;
  showLabels?: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const steps = (max - min) * den;
  const x = (k: number) => PAD + ((W - 2 * PAD) * k) / steps;

  const tickFromEvent = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const r = svg.getBoundingClientRect();
    const sx = ((clientX - r.left) / r.width) * W;
    const k = Math.round(((sx - PAD) / (W - 2 * PAD)) * steps);
    return Math.max(0, Math.min(steps, k));
  };

  return (
    <div className="nlp">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} 100`}
        width="100%"
        className={`nlp-svg ${disabled ? 'is-disabled' : ''}`}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label="Oś liczbowa – wybierz punkt"
        aria-valuemin={0}
        aria-valuemax={steps}
        aria-valuenow={value ?? undefined}
        aria-valuetext={value === null ? 'nie wybrano' : `${value} działek od ${min}`}
        onPointerDown={(e) => {
          if (disabled) return;
          dragging.current = true;
          (e.target as Element).setPointerCapture?.(e.pointerId);
          const k = tickFromEvent(e.clientX);
          if (k !== null) onChange(k);
        }}
        onPointerMove={(e) => {
          if (!dragging.current || disabled) return;
          const k = tickFromEvent(e.clientX);
          if (k !== null && k !== value) onChange(k);
        }}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onChange(Math.min(steps, (value ?? -1) + 1));
          if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onChange(Math.max(0, (value ?? 1) - 1));
          if (e.key === 'Home') onChange(0);
          if (e.key === 'End') onChange(steps);
          if (e.key.startsWith('Arrow') || e.key === 'Home' || e.key === 'End') e.preventDefault();
        }}
      >
        <rect x={0} y={0} width={W} height={100} fill="transparent" />
        <line x1={PAD - 12} x2={W - PAD + 14} y1={55} y2={55} className="viz-axis" />
        <polygon points={`${W - PAD + 18},55 ${W - PAD + 8},50 ${W - PAD + 8},60`} className="viz-arrow" />
        {Array.from({ length: steps + 1 }, (_, k) => {
          const unit = k % den === 0;
          return (
            <g key={k}>
              <line x1={x(k)} x2={x(k)} y1={unit ? 43 : 48} y2={unit ? 67 : 62} className={unit ? 'viz-tick-major' : 'viz-tick'} />
              {unit && showLabels && (
                <text x={x(k)} y={88} textAnchor="middle" className="viz-text">
                  {min + k / den}
                </text>
              )}
            </g>
          );
        })}
        {correctTick !== undefined && correctTick !== value && (
          <g>
            <circle cx={x(correctTick)} cy={55} r={9} className="nlp-correct" />
            <text x={x(correctTick)} y={30} textAnchor="middle" className="nlp-correct-label">
              tu
            </text>
          </g>
        )}
        {value !== null && (
          <g className="nlp-handle" style={{ transform: `translateX(${x(value)}px)` }}>
            <line x1={0} x2={0} y1={22} y2={55} className="nlp-stem" />
            <circle cx={0} cy={55} r={10} className="nlp-point" />
            <circle cx={0} cy={18} r={7} className="nlp-point" />
          </g>
        )}
      </svg>
    </div>
  );
}
