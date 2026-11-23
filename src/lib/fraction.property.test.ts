/**
 * Testy własności (fast-check): zamiast kilku przykładów sprawdzamy reguły
 * arytmetyki i odczytu odpowiedzi na tysiącach losowych ułamków.
 */
import fc from 'fast-check';
import { describe, it } from 'vitest';
import { Fraction, gcd } from './fraction';
import { checkFractionAnswer, parseAnswer } from './parse';
import { spokenFraction, toSpoken } from './spoken';

const den = fc.integer({ min: 1, max: 60 });
const numr = fc.integer({ min: -200, max: 200 });
const frac = fc.tuple(numr, den).map(([n, d]) => new Fraction(n, d));
const nonZero = frac.filter((f) => f.num !== 0);

describe('arytmetyka ułamków – własności', () => {
  it('dodawanie jest przemienne i łączne', () => {
    fc.assert(fc.property(frac, frac, frac, (a, b, c) => a.add(b).equals(b.add(a)) && a.add(b).add(c).equals(a.add(b.add(c)))));
  });
  it('odejmowanie odwraca dodawanie', () => {
    fc.assert(fc.property(frac, frac, (a, b) => a.add(b).sub(b).equals(a)));
  });
  it('dzielenie odwraca mnożenie', () => {
    fc.assert(fc.property(frac, nonZero, (a, b) => a.mul(b).div(b).equals(a)));
  });
  it('mnożenie jest rozdzielne względem dodawania', () => {
    fc.assert(fc.property(frac, frac, frac, (a, b, c) => a.mul(b.add(c)).equals(a.mul(b).add(a.mul(c)))));
  });
  it('wyniki działań są zawsze skrócone, a mianownik dodatni', () => {
    fc.assert(
      fc.property(frac, nonZero, (a, b) =>
        [a.add(b), a.sub(b), a.mul(b), a.div(b)].every((r) => r.den > 0 && gcd(r.num, r.den) === 1),
      ),
    );
  });
  it('porównanie zgadza się z wartością liczbową', () => {
    fc.assert(fc.property(frac, frac, (a, b) => Math.sign(a.valueOf() - b.valueOf()) === a.compare(b) || a.equals(b)));
  });
  it('liczba mieszana i ułamek niewłaściwy to ta sama wartość', () => {
    fc.assert(
      fc.property(frac, (a) => {
        const m = a.toMixed();
        const back = Fraction.fromMixed(m.negative ? -m.whole : m.whole, m.num, m.den);
        // dla liczb ujemnych z częścią całkowitą 0 znak siedzi w liczniku
        return m.negative && m.whole === 0 ? new Fraction(-m.num, m.den).equals(a) : back.equals(a);
      }),
    );
  });
});

describe('odczyt odpowiedzi ucznia – własności', () => {
  it('każdy zapis ułamka (zwykły, mieszany, dziesiętny) jest rozpoznawany jako ta sama liczba', () => {
    fc.assert(
      fc.property(frac, (a) => {
        const forms = [a.toPlain(false), a.toPlain(true), a.toPlain(true).replace(' ', '  ')];
        if (a.hasFiniteDecimal()) forms.push(a.toDecimalString(), a.toDecimalString().replace(',', '.'));
        return forms.every((s) => parseAnswer(s)?.value.equals(a) === true);
      }),
    );
  });
  it('ułamek równy, ale nieskrócony, nigdy nie jest oceniany jako błąd', () => {
    fc.assert(
      fc.property(frac, fc.integer({ min: 2, max: 9 }), (a, k) => {
        const status = checkFractionAnswer(`${a.num * k}/${a.den * k}`, a, { requireSimplest: true }).status;
        return status === 'not-simplified' || status === 'correct';
      }),
    );
  });
  it('dowolny tekst nie wywraca parsera', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 40 }), (s) => {
        const r = parseAnswer(s);
        return r === null || (Number.isFinite(r.value.num) && r.value.den > 0);
      }),
    );
  });
  it('liczby z ponad 9 cyframi są odrzucane (ochrona przed utratą dokładności)', () => {
    fc.assert(fc.property(fc.integer({ min: 1_000_000_000, max: Number.MAX_SAFE_INTEGER }), (n) => parseAnswer(`${n}/3`) === null));
  });
});

describe('lektor – własności', () => {
  it('odczyt ułamka zawsze składa się ze słów (bez cyfr i „undefined”)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 999 }), fc.integer({ min: 1, max: 100 }), (n, d) => {
        const s = spokenFraction(n, d);
        return !/undefined|NaN/.test(s) && (d > 99 && d !== 100 ? true : !/\d/.test(s));
      }),
    );
  });
  it('toSpoken usuwa całą notację ułamków', () => {
    fc.assert(fc.property(frac, (a) => !/[{}]/.test(toSpoken(`Oblicz ${a.toMarkup(true)} + ${a.toMarkup()}`))));
  });
});
