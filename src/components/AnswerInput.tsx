import { useEffect, useRef } from 'react';
import { parseAnswer } from '../lib/parse';
import type { AnswerSpec } from '../content/types';
import { MathText } from './MathText';

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
  useEffect(() => {
    if (autoFocus && !disabled) ref.current?.focus({ preventScroll: true });
  }, [autoFocus, disabled]);
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
          inputMode="text"
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
      <p className="answer-help">Ułamek: 3/4 · liczba mieszana: 1 1/2 · dziesiętny: 0,75</p>
    </div>
  );
}
