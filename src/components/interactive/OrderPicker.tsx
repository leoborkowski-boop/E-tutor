import { MathText } from '../MathText';

/**
 * Układanie kart w kolejności: dotknięcie karty dokłada ją na koniec
 * rzędu odpowiedzi, dotknięcie karty w rzędzie odkłada ją z powrotem.
 */
export function OrderPicker({
  items,
  order,
  onChange,
  disabled,
  direction,
}: {
  items: { text: string }[];
  order: number[];
  onChange: (o: number[]) => void;
  disabled?: boolean;
  direction: 'asc' | 'desc';
}) {
  const sign = direction === 'asc' ? '<' : '>';
  const pool = items.map((_, i) => i).filter((i) => !order.includes(i));
  return (
    <div className="order">
      <div className="order-row" aria-label="Twoja kolejność">
        {items.map((_, slot) => {
          const idx = order[slot];
          return (
            <div key={slot} className="order-slot-wrap">
              {slot > 0 && <span className="order-sign">{sign}</span>}
              {idx !== undefined ? (
                <button type="button" className="order-card is-placed" disabled={disabled} onClick={() => onChange(order.filter((o) => o !== idx))} aria-label="Usuń z kolejności">
                  <MathText text={items[idx].text} />
                </button>
              ) : (
                <span className="order-slot" aria-hidden="true">
                  {slot + 1}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="order-pool" aria-label="Karty do ułożenia">
        {pool.map((i) => (
          <button key={i} type="button" className="order-card" disabled={disabled} onClick={() => onChange([...order, i])}>
            <MathText text={items[i].text} />
          </button>
        ))}
        {pool.length === 0 && !disabled && <span className="muted small">Wszystkie karty ułożone. Dotknij karty w rzędzie, aby ją cofnąć.</span>}
      </div>
    </div>
  );
}
