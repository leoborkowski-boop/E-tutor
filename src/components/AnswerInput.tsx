import { useEffect, useRef } from 'react';
import { parseAnswer } from '../lib/parse';
import type { AnswerSpec } from '../content/types';
import { MathText } from './MathText';
import { FractionKeypad, useKeypadVisible } from './FractionKeypad';

/** Pole odpowiedzi z podglądem wpisanego ułamka. */
export function AnswerInput({
  value,
  onChange,
  onSubmit,
  spec,
  disabled,
  autoFocus = true,
  label = 'Twoja odpowiedź',
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  spec: AnswerSpec;
  disabled?: boolean;
  autoFocus?: boolean;
  label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const keypad = useKeypadVisible();
  useEffect(() => {
    // z klawiaturą ekranową nie ustawiamy fokusu, żeby nie wyskakiwała systemowa klawiatura
    if (autoFocus && !disabled && !keypad) ref.current?.focus({ preventScroll: true });
  }, [autoFocus, disabled, keypad]);
  const parsed = value.trim() ? parseAnswer(value) : null;
  const preview = parsed && (parsed.form === 'fraction' || parsed.form === 'mixed') ? value.trim().replace(/\s*\/\s*/g, '/') : null;
  return (
    <div className="answer">
      <label className="answer-row">
        <span className="sr-only">{label}</span>
        {spec.prefix && <span className="answer-affix">{spec.prefix}</span>}
        <input
          ref={ref}
          className="answer-input"
          inputMode={keypad ? 'none' : 'text'}
          autoComplete="off"
          spellCheck={false}
          placeholder={spec.placeholder ?? 'np. 3/4'}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && onSubmit) {
              e.preventDefault();
              onSubmit();
            }
          }}
        />
        {spec.unit && <span className="answer-affix">{spec.unit}</span>}
        <span className="answer-preview" aria-live="polite">
          {preview && <MathText text={`= {${preview.replace('-', '-')}}`} />}
        </span>
      </label>
      {/* podpowiedź o zapisie tylko wtedy, gdy wynik nie jest liczbą całkowitą */}
      {!spec.value.isInteger() && (
        <p className="answer-help">{keypad ? 'Liczba mieszana: 1 ␣ 1/2' : 'Ułamek: 3/4 · liczba mieszana: 1 1/2 · dziesiętny: 0,75'}</p>
      )}
      {keypad && !disabled && <FractionKeypad value={value} onChange={onChange} onSubmit={onSubmit} disabled={disabled} />}
    </div>
  );
}
