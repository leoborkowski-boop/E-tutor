/**
 * Dokładna arytmetyka na ułamkach zwykłych.
 * Ułamek przechowywany jest zawsze w postaci znormalizowanej znakowo
 * (mianownik > 0), ale NIE jest automatycznie skracany – dzięki temu
 * możemy pokazywać uczniowi np. 4/8 przed skróceniem.
 */

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

export function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

export class Fraction {
  readonly num: number;
  readonly den: number;

  constructor(num: number, den = 1) {
    if (den === 0) throw new Error('Mianownik nie może być zerem');
    if (!Number.isInteger(num) || !Number.isInteger(den)) {
      throw new Error(`Fraction wymaga liczb całkowitych: ${num}/${den}`);
    }
    if (den < 0) {
      num = -num;
      den = -den;
    }
    this.num = num === 0 ? 0 : num; // usuwa -0
    this.den = den;
  }

  static of(num: number, den = 1) {
    return new Fraction(num, den);
  }

  static fromMixed(whole: number, num: number, den: number) {
    const sign = whole < 0 ? -1 : 1;
    return new Fraction(sign * (Math.abs(whole) * den + num), den);
  }

  /** Zamienia skończony ułamek dziesiętny (np. 0.125) na ułamek zwykły. */
  static fromDecimalString(s: string): Fraction | null {
    const m = s.trim().match(/^(-)?(\d*)[.,](\d+)$/);
    if (!m) return null;
    const sign = m[1] ? -1 : 1;
    const intPart = m[2] || '0';
    const frac = m[3];
    const den = 10 ** frac.length;
    return new Fraction(sign * (Number(intPart) * den + Number(frac)), den);
  }

  add(o: Fraction) {
    return new Fraction(this.num * o.den + o.num * this.den, this.den * o.den).simplify();
  }
  sub(o: Fraction) {
    return new Fraction(this.num * o.den - o.num * this.den, this.den * o.den).simplify();
  }
  mul(o: Fraction) {
    return new Fraction(this.num * o.num, this.den * o.den).simplify();
  }
  div(o: Fraction) {
    if (o.num === 0) throw new Error('Dzielenie przez zero');
    return new Fraction(this.num * o.den, this.den * o.num).simplify();
  }
  inverse() {
    return new Fraction(this.den, this.num);
  }
  neg() {
    return new Fraction(-this.num, this.den);
  }

  simplify() {
    const g = gcd(this.num, this.den);
    return new Fraction(this.num / g, this.den / g);
  }

  isSimplest() {
    return gcd(this.num, this.den) === 1;
  }

  /** Rozszerza ułamek tak, by miał podany mianownik (musi być wielokrotnością). */
  withDen(den: number) {
    if (den % this.den !== 0) throw new Error('Nie da się rozszerzyć do tego mianownika');
    const k = den / this.den;
    return new Fraction(this.num * k, den);
  }

  equals(o: Fraction) {
    return this.num * o.den === o.num * this.den;
  }

  /** Identyczny zapis (ten sam licznik i mianownik). */
  same(o: Fraction) {
    return this.num === o.num && this.den === o.den;
  }

  compare(o: Fraction) {
    const d = this.num * o.den - o.num * this.den;
    return d === 0 ? 0 : d > 0 ? 1 : -1;
  }

  isInteger() {
    return this.num % this.den === 0;
  }

  isProper() {
    return Math.abs(this.num) < this.den;
  }

  valueOf() {
    return this.num / this.den;
  }

  /** Rozkład na liczbę mieszaną: część całkowita + ułamek właściwy. */
  toMixed(): { whole: number; num: number; den: number; negative: boolean } {
    const negative = this.num < 0;
    const n = Math.abs(this.num);
    return { whole: Math.floor(n / this.den), num: n % this.den, den: this.den, negative };
  }

  /** Czy rozwinięcie dziesiętne jest skończone (mianownik po skróceniu = 2^a·5^b). */
  hasFiniteDecimal() {
    let d = this.simplify().den;
    while (d % 2 === 0) d /= 2;
    while (d % 5 === 0) d /= 5;
    return d === 1;
  }

  /**
   * Zapis w znaczniku MathText: {a/b}, {w a/b} albo liczba całkowita.
   * mixed=true zamienia ułamki niewłaściwe na liczby mieszane.
   */
  toMarkup(mixed = false): string {
    if (this.den === 1) return formatInt(this.num);
    if (mixed && !this.isProper()) {
      const m = this.toMixed();
      if (m.num === 0) return formatInt(m.negative ? -m.whole : m.whole);
      return `{${m.negative ? '-' : ''}${m.whole} ${m.num}/${m.den}}`;
    }
    return `{${this.num}/${this.den}}`;
  }

  /** Prosty zapis tekstowy, np. "3/4" albo "1 1/2". */
  toPlain(mixed = false): string {
    if (this.den === 1) return String(this.num);
    if (mixed && !this.isProper()) {
      const m = this.toMixed();
      if (m.num === 0) return String(m.negative ? -m.whole : m.whole);
      return `${m.negative ? '-' : ''}${m.whole} ${m.num}/${m.den}`;
    }
    return `${this.num}/${this.den}`;
  }

  /** Zapis dziesiętny z przecinkiem (tylko gdy rozwinięcie skończone). */
  toDecimalString(): string {
    const s = this.simplify();
    if (!s.hasFiniteDecimal()) throw new Error('Rozwinięcie nieskończone');
    let digits = 0;
    let d = s.den;
    let p2 = 0;
    let p5 = 0;
    while (d % 2 === 0) {
      d /= 2;
      p2++;
    }
    while (d % 5 === 0) {
      d /= 5;
      p5++;
    }
    digits = Math.max(p2, p5);
    const scaled = (Math.abs(s.num) * 10 ** digits) / s.den;
    const str = String(Math.round(scaled)).padStart(digits + 1, '0');
    const intPart = digits ? str.slice(0, -digits) : str;
    const fracPart = digits ? str.slice(-digits) : '';
    return `${s.num < 0 ? '-' : ''}${intPart}${fracPart ? ',' + fracPart : ''}`;
  }
}

export function formatInt(n: number) {
  return n < 0 ? `−${Math.abs(n)}` : String(n);
}

export const F = Fraction.of;
