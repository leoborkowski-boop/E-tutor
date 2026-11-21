import { useRef } from 'react';

/**
 * Pasek podzielony na `den` części. Dotknięcie przełącza część,
 * przeciągnięcie palcem/myszą maluje (albo czyści) kolejne części.
 */
export function ShadeBar({
  den,
  shaded,
  onChange,
  disabled,
  highlight,
}: {
  den: number;
  shaded: boolean[];
  onChange: (next: boolean[]) => void;
  disabled?: boolean;
  /** po zakończeniu: ile części powinno być zamalowanych (pokazujemy obrys) */
  highlight?: number;
}) {
  const drag = useRef<{ mode: boolean } | null>(null);
  const stateRef = useRef(shaded);
  stateRef.current = shaded;

  const setAt = (i: number, v: boolean) => {
    if (stateRef.current[i] === v) return;
    const next = [...stateRef.current];
    next[i] = v;
    stateRef.current = next;
    onChange(next);
  };
  const indexAt = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const v = el?.closest<HTMLElement>('[data-seg]')?.dataset.seg;
    return v === undefined ? null : Number(v);
  };

  return (
    <div className="shade">
      <div
        className={`shade-bar ${disabled ? 'is-disabled' : ''}`}
        style={{ gridTemplateColumns: `repeat(${den}, 1fr)` }}
        onPointerDown={(e) => {
          if (disabled) return;
          const i = indexAt(e.clientX, e.clientY);
          if (i === null) return;
          drag.current = { mode: !stateRef.current[i] };
          setAt(i, drag.current.mode);
        }}
        onPointerMove={(e) => {
          if (!drag.current || disabled) return;
          const i = indexAt(e.clientX, e.clientY);
          if (i !== null) setAt(i, drag.current.mode);
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerLeave={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      >
        {Array.from({ length: den }, (_, i) => (
          <button
            key={i}
            type="button"
            data-seg={i}
            className={`shade-seg ${shaded[i] ? 'is-on' : ''} ${highlight !== undefined && i < highlight ? 'is-target' : ''}`}
            aria-pressed={shaded[i]}
            aria-label={`Część ${i + 1} z ${den}`}
            disabled={disabled}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setAt(i, !shaded[i]);
              }
            }}
            onClick={(e) => e.preventDefault()}
          />
        ))}
      </div>
      <div className="shade-info muted small" aria-live="polite">
        Zamalowane: {shaded.filter(Boolean).length} z {den}
        {!disabled && shaded.some(Boolean) && (
          <button type="button" className="link-btn" onClick={() => onChange(Array(den).fill(false))}>
            wyczyść
          </button>
        )}
      </div>
    </div>
  );
}
