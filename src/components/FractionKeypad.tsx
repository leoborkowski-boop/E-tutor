import { signal } from '../lib/feedback';
import { useApp } from '../state/AppState';

const KEYS: { k: string; label?: string; aria?: string; wide?: boolean; kind?: 'op' | 'action' }[] = [
  { k: '7' }, { k: '8' }, { k: '9' }, { k: 'back', label: '⌫', aria: 'Usuń znak', kind: 'action' },
  { k: '4' }, { k: '5' }, { k: '6' }, { k: '/', label: '/', aria: 'Kreska ułamkowa', kind: 'op' },
  { k: '1' }, { k: '2' }, { k: '3' }, { k: ' ', label: '␣', aria: 'Spacja (liczba mieszana)', kind: 'op' },
  { k: '-', label: '−', aria: 'Minus', kind: 'op' }, { k: '0' }, { k: ',', label: ',', aria: 'Przecinek', kind: 'op' }, { k: 'ok', label: '✓', aria: 'Sprawdź', kind: 'action' },
];

export function useKeypadVisible() {
  const { settings } = useApp();
  if (settings.keypad === 'on') return true;
  if (settings.keypad === 'off') return false;
  return typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
}

/** Ekranowa klawiatura do wpisywania ułamków (wygodna na telefonie). */
export function FractionKeypad({ value, onChange, onSubmit, disabled }: { value: string; onChange: (v: string) => void; onSubmit?: () => void; disabled?: boolean }) {
  const { settings } = useApp();
  const press = (k: string) => {
    if (disabled) return;
    signal('tap', settings);
    if (k === 'back') onChange(value.slice(0, -1));
    else if (k === 'ok') onSubmit?.();
    else if (k === ' ' && (value.endsWith(' ') || !value)) return;
    else onChange(value + k);
  };
  return (
    <div className="keypad" role="group" aria-label="Klawiatura ułamków">
      {KEYS.map((key) => (
        <button
          key={key.k}
          type="button"
          className={`key ${key.kind ? `key-${key.kind}` : ''} ${key.k === 'ok' ? 'key-ok' : ''}`}
          aria-label={key.aria ?? key.k}
          disabled={disabled || (key.k === 'ok' && !value.trim())}
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => press(key.k)}
        >
          {key.label ?? key.k}
        </button>
      ))}
    </div>
  );
}
