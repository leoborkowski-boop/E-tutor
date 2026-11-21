import { Fraction } from './fraction';

/**
 * Parsuje odpowiedź ucznia. Akceptowane formy:
 *  "3/4", " -3 / 4 ", "1 1/2" (liczba mieszana), "2", "0,75", "0.75", "−1/2"
 * Zwraca null, gdy nie da się odczytać odpowiedzi.
 */
export type ParsedAnswer = {
  value: Fraction;
  /** Forma, w jakiej uczeń wpisał odpowiedź. */
  form: 'integer' | 'fraction' | 'mixed' | 'decimal';
  /** Ułamek dokładnie w zapisie ucznia (do sprawdzania skrócenia). */
  raw: Fraction;
};

export function parseAnswer(input: string): ParsedAnswer | null {
  const s = input
    .trim()
    .replace(/[−–—]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/\s*\/\s*/g, '/');
  if (!s) return null;

  let m = s.match(/^(-)?\s?(\d+)$/);
  if (m) {
    const v = new Fraction((m[1] ? -1 : 1) * Number(m[2]));
    return { value: v, raw: v, form: 'integer' };
  }

  m = s.match(/^(-)?\s?(\d+)\/(\d+)$/);
  if (m) {
    if (Number(m[3]) === 0) return null;
    const v = new Fraction((m[1] ? -1 : 1) * Number(m[2]), Number(m[3]));
    return { value: v, raw: v, form: 'fraction' };
  }

  m = s.match(/^(-)?\s?(\d+) (\d+)\/(\d+)$/);
  if (m) {
    if (Number(m[4]) === 0) return null;
    const whole = Number(m[2]);
    const v = Fraction.fromMixed(m[1] ? -whole : whole, Number(m[3]), Number(m[4]));
    // raw: część ułamkowa liczby mieszanej – to ją sprawdzamy pod kątem skrócenia
    return { value: v, raw: new Fraction(Number(m[3]), Number(m[4])), form: 'mixed' };
  }

  const dec = Fraction.fromDecimalString(s.replace(/\s/g, ''));
  if (dec) return { value: dec, raw: dec, form: 'decimal' };

  return null;
}

export type CheckResult =
  | { status: 'correct' }
  | { status: 'not-simplified' }
  | { status: 'improper-not-allowed' }
  | { status: 'wrong-form'; expected: 'improper' | 'decimal' | 'fraction' }
  | { status: 'wrong'; parsed: ParsedAnswer }
  | { status: 'unreadable' };

export type CheckOptions = {
  /** Wymagaj wyniku w najprostszej postaci (skróconego). */
  requireSimplest?: boolean;
  /** Wymagaj liczby mieszanej zamiast ułamka niewłaściwego. */
  requireMixed?: boolean;
  /** Wymagaj ułamka niewłaściwego (np. 7/3), a nie liczby mieszanej. */
  requireImproper?: boolean;
  /** Wymagaj zapisu dziesiętnego (np. 0,75). */
  requireDecimal?: boolean;
  /** Wymagaj ułamka zwykłego (nie dziesiętnego). */
  requireCommon?: boolean;
};

export function checkFractionAnswer(input: string, expected: Fraction, opts: CheckOptions = {}): CheckResult {
  const parsed = parseAnswer(input);
  if (!parsed) return { status: 'unreadable' };
  if (!parsed.value.equals(expected)) return { status: 'wrong', parsed };
  if (opts.requireDecimal && parsed.form !== 'decimal' && parsed.form !== 'integer') {
    return { status: 'wrong-form', expected: 'decimal' };
  }
  if (opts.requireCommon && parsed.form === 'decimal') return { status: 'wrong-form', expected: 'fraction' };
  if (opts.requireImproper && parsed.form === 'mixed') return { status: 'wrong-form', expected: 'improper' };
  if (opts.requireSimplest && parsed.form !== 'decimal' && parsed.form !== 'integer' && !parsed.raw.isSimplest()) {
    return { status: 'not-simplified' };
  }
  if (opts.requireMixed && parsed.form === 'fraction' && !parsed.value.isProper()) {
    return { status: 'improper-not-allowed' };
  }
  return { status: 'correct' };
}
