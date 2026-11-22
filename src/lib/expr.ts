/**
 * Bezpieczny kalkulator wyrażeń na dokładnych ułamkach (bez eval).
 * Służy do sprawdzania odpowiedzi w lekcjach przygotowanych przez AI:
 * tutor podaje wynik i wyrażenie, które do niego prowadzi – jeśli się nie zgadzają,
 * zadanie odrzucamy.
 *
 * Obsługuje: liczby (także 2,5 i 2.5), + − * · × / : ^ nawiasy, √(…), unarny minus.
 */
import { Fraction } from './fraction';

type Tok = { t: 'num'; v: Fraction } | { t: 'op'; v: string } | { t: '('; v: '(' } | { t: ')'; v: ')' } | { t: 'sqrt'; v: '√' };

function tokenize(src: string): Tok[] | null {
  const s = src.replace(/\s+/g, '').replace(/[−–]/g, '-').replace(/[·×]/g, '*').replace(/:/g, '/').replace(/sqrt/gi, '√');
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/[0-9]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9.,]/.test(s[j])) j++;
      const f = Fraction.fromDecimalString(s.slice(i, j).replace('.', ','));
      if (!f) return null;
      out.push({ t: 'num', v: f });
      i = j;
    } else if ('+-*/^'.includes(c)) {
      out.push({ t: 'op', v: c });
      i++;
    } else if (c === '(' || c === ')') {
      out.push({ t: c, v: c } as Tok);
      i++;
    } else if (c === '√') {
      out.push({ t: 'sqrt', v: '√' });
      i++;
    } else return null;
  }
  return out;
}

function isqrt(n: number): number | null {
  if (n < 0) return null;
  const r = Math.round(Math.sqrt(n));
  return r * r === n ? r : null;
}

/** Zwraca wartość wyrażenia albo null, gdy nie da się go policzyć dokładnie. */
export function evaluate(src: string): Fraction | null {
  const tokens = tokenize(src);
  if (!tokens || !tokens.length || tokens.length > 200) return null;
  const toks: Tok[] = tokens;
  let p = 0;
  const peek = () => toks[p];

  function primary(): Fraction | null {
    const tk = toks[p];
    if (!tk) return null;
    if (tk.t === 'num') {
      p++;
      return tk.v;
    }
    if (tk.t === '(') {
      p++;
      const v = expr();
      if (toks[p]?.t !== ')') return null;
      p++;
      return v;
    }
    if (tk.t === 'sqrt') {
      p++;
      const v = power();
      if (!v || v.num < 0) return null;
      const s = v.simplify();
      const a = isqrt(s.num);
      const b = isqrt(s.den);
      return a === null || b === null ? null : new Fraction(a, b);
    }
    if (tk.t === 'op' && tk.v === '-') {
      p++;
      const v = power();
      return v ? v.neg() : null;
    }
    return null;
  }

  function power(): Fraction | null {
    const base = primary();
    if (!base) return null;
    if (peek()?.t === 'op' && peek()!.v === '^') {
      p++;
      const e = power();
      if (!e || !e.isInteger() || Math.abs(e.num) > 12) return null;
      let r = new Fraction(1);
      for (let k = 0; k < Math.abs(e.num); k++) r = r.mul(base);
      if (e.num < 0) {
        if (r.num === 0) return null;
        r = r.inverse();
      }
      return r;
    }
    return base;
  }

  function term(): Fraction | null {
    let v = power();
    while (v && peek()?.t === 'op' && (peek()!.v === '*' || peek()!.v === '/')) {
      const op = toks[p++].v;
      const r = power();
      if (!r) return null;
      if (op === '/') {
        if (r.num === 0) return null;
        v = v.div(r);
      } else v = v.mul(r);
    }
    return v;
  }

  function expr(): Fraction | null {
    let v = term();
    while (v && peek()?.t === 'op' && (peek()!.v === '+' || peek()!.v === '-')) {
      const op = toks[p++].v;
      const r = term();
      if (!r) return null;
      v = op === '+' ? v.add(r) : v.sub(r);
    }
    return v;
  }

  const v = expr();
  if (!v || p !== toks.length) return null;
  if (!Number.isFinite(v.num) || !Number.isFinite(v.den) || Math.abs(v.num) > 1e12 || v.den > 1e12) return null;
  return v.simplify();
}
