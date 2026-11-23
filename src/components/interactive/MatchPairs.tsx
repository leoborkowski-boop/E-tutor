import { useState } from 'react';
import { MathText } from '../MathText';
import { toSpoken } from '../../lib/spoken';

const PAIR_COLORS = 4;

/**
 * Łączenie w pary: dotknij elementu z lewej, potem z prawej.
 * pairs[left] = indeks w kolumnie prawej (w kolejności wyświetlania).
 */
export function MatchPairs({
  left,
  right,
  pairs,
  onChange,
  locked,
  disabled,
}: {
  left: string[];
  right: string[];
  pairs: Record<number, number>;
  onChange: (p: Record<number, number>) => void;
  /** lewe indeksy par potwierdzonych jako poprawne */
  locked: number[];
  disabled?: boolean;
}) {
  const [selLeft, setSelLeft] = useState<number | null>(null);
  const rightToLeft = Object.fromEntries(Object.entries(pairs).map(([l, r]) => [r, Number(l)]));
  const colorOf = (l: number) => `pair-c${l % PAIR_COLORS}`;

  const pickLeft = (l: number) => {
    if (disabled || locked.includes(l)) return;
    if (pairs[l] !== undefined) {
      const next = { ...pairs };
      delete next[l];
      onChange(next);
      setSelLeft(l);
      return;
    }
    setSelLeft(selLeft === l ? null : l);
  };
  const pickRight = (r: number) => {
    if (disabled) return;
    const owner = rightToLeft[r];
    if (owner !== undefined && locked.includes(owner)) return;
    if (selLeft === null) {
      if (owner !== undefined) {
        const next = { ...pairs };
        delete next[owner];
        onChange(next);
      }
      return;
    }
    const next = { ...pairs };
    if (owner !== undefined) delete next[owner];
    next[selLeft] = r;
    onChange(next);
    setSelLeft(null);
  };

  return (
    <div className="match">
      <div className="match-col">
        {left.map((t, l) => (
          <button
            key={l}
            type="button"
            className={`match-item ${selLeft === l ? 'is-selected' : ''} ${pairs[l] !== undefined ? `is-paired ${colorOf(l)}` : ''} ${locked.includes(l) ? 'is-locked' : ''}`}
            onClick={() => pickLeft(l)}
            disabled={disabled}
            aria-pressed={selLeft === l}
            aria-label={pairs[l] !== undefined ? `${toSpoken(t)}, para ${l + 1}${locked.includes(l) ? ', poprawna' : ''}` : undefined}
          >
            {pairs[l] !== undefined && (
              <span className="pair-badge" aria-hidden="true">
                {l + 1}
              </span>
            )}
            <MathText text={t} />
          </button>
        ))}
      </div>
      <div className="match-col">
        {right.map((t, r) => {
          const owner = rightToLeft[r];
          return (
            <button
              key={r}
              type="button"
              className={`match-item ${owner !== undefined ? `is-paired ${colorOf(owner)}` : ''} ${owner !== undefined && locked.includes(owner) ? 'is-locked' : ''} ${selLeft !== null && owner === undefined ? 'is-target' : ''}`}
              onClick={() => pickRight(r)}
              disabled={disabled}
              aria-label={owner !== undefined ? `${toSpoken(t)}, para ${owner + 1}` : undefined}
            >
              {owner !== undefined && (
                <span className="pair-badge" aria-hidden="true">
                  {owner + 1}
                </span>
              )}
              <MathText text={t} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
