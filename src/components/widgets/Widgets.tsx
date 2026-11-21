import { useState, type ReactElement } from 'react';
import type { WidgetId } from '../../content/types';
import { F, Fraction, gcd, lcm } from '../../lib/fraction';
import { signal } from '../../lib/feedback';
import { spokenFraction } from '../../lib/spoken';
import { useApp } from '../../state/AppState';
import { MathText } from '../MathText';
import { NumberLinePicker } from '../interactive/NumberLinePicker';
import { Icon, SpeakButton } from '../ui';

/* ---------------- Elementy wspólne ---------------- */

function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  const { settings } = useApp();
  const set = (v: number) => {
    const c = Math.max(min, Math.min(max, v));
    if (c !== value) {
      signal('tap', settings);
      onChange(c);
    }
  };
  return (
    <div className="stepper">
      <span className="stepper-label">{label}</span>
      <div className="stepper-row">
        <button type="button" className="stepper-btn" onClick={() => set(value - 1)} disabled={value <= min} aria-label={`${label}: zmniejsz`}>
          −
        </button>
        <span className="stepper-value" aria-live="polite">
          {value}
        </span>
        <button type="button" className="stepper-btn" onClick={() => set(value + 1)} disabled={value >= max} aria-label={`${label}: zwiększ`}>
          +
        </button>
      </div>
    </div>
  );
}

/** Pasek (lub kilka pasków dla ułamka niewłaściwego); opcjonalnie klikalny. */
function Bars({
  num,
  den,
  color = 'a',
  onPick,
  extra,
}: {
  num: number;
  den: number;
  color?: 'a' | 'b';
  onPick?: (n: number) => void;
  /** dodatkowe zamalowanie innym kolorem (np. drugi składnik sumy) */
  extra?: number;
}) {
  const total = num + (extra ?? 0);
  const count = Math.max(1, Math.ceil(total / den));
  return (
    <div className="wbars">
      {Array.from({ length: count }, (_, b) => (
        <div key={b} className="wbar" style={{ gridTemplateColumns: `repeat(${den}, 1fr)` }}>
          {Array.from({ length: den }, (_, i) => {
            const n = b * den + i;
            const cls = n < num ? `on-${color}` : n < total ? 'on-b' : '';
            return onPick ? (
              <button key={i} type="button" className={`wseg ${cls}`} aria-label={`Ustaw licznik na ${n + 1}`} onClick={() => onPick(n + 1 === num ? n : n + 1)} />
            ) : (
              <span key={i} className={`wseg ${cls}`} />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function Big({ f, mixed }: { f: Fraction; mixed?: boolean }) {
  return <MathText className="wbig" text={mixed ? f.toMarkup(true) : `{${f.num}/${f.den}}`} />;
}

function decimalInfo(f: Fraction) {
  if (f.hasFiniteDecimal()) return f.toDecimalString();
  return `≈ ${(f.valueOf()).toFixed(3).replace('.', ',')}…`;
}

/* ---------------- 1. Budowanie ułamka ---------------- */

function Builder() {
  const [num, setNum] = useState(3);
  const [den, setDen] = useState(4);
  const f = F(num, den);
  const max = Math.max(1, Math.ceil(num / den));
  const simple = f.simplify();
  return (
    <div className="widget-body">
      <div className="widget-controls">
        <Stepper label="Licznik" value={num} min={0} max={den * 3} onChange={setNum} />
        <Stepper label="Mianownik" value={den} min={1} max={12} onChange={(d) => { setDen(d); if (num > d * 3) setNum(d * 3); }} />
      </div>
      <div className="widget-result">
        <Big f={f} />
        <div className="widget-facts">
          <span>
            czytamy: <strong>{spokenFraction(num, den)}</strong>
          </span>
          <span>{num < den ? 'ułamek właściwy (mniejszy od 1)' : 'ułamek niewłaściwy (co najmniej 1)'}</span>
          <span>dziesiętnie: {decimalInfo(f)}</span>
          {!f.same(simple) && num > 0 && (
            <span>
              po skróceniu: <MathText text={simple.toMarkup(true)} />
            </span>
          )}
          {!f.isProper() && !f.isInteger() && (
            <span>
              liczba mieszana: <MathText text={f.toMarkup(true)} />
            </span>
          )}
        </div>
        <SpeakButton text={`{${num}/${den}}`} />
      </div>
      <p className="muted small">Dotknij części paska, żeby zmienić licznik.</p>
      <Bars num={num} den={den} onPick={setNum} />
      <NumberLinePicker min={0} max={max} den={den} value={num} onChange={setNum} />
    </div>
  );
}

/* ---------------- 2. Ułamki równe ---------------- */

function Equivalent() {
  const [num, setNum] = useState(2);
  const [den, setDen] = useState(3);
  const [k, setK] = useState(2);
  const n = Math.min(num, den);
  const ext = F(n * k, den * k);
  return (
    <div className="widget-body">
      <div className="widget-controls">
        <Stepper label="Licznik" value={n} min={1} max={den} onChange={setNum} />
        <Stepper label="Mianownik" value={den} min={2} max={8} onChange={setDen} />
        <Stepper label="Mnożymy przez" value={k} min={1} max={6} onChange={setK} />
      </div>
      <div className="widget-result">
        <MathText className="wbig" text={`{${n}/${den}} = {${n}·${k}/${den}·${k}} = {${ext.num}/${ext.den}}`} />
      </div>
      <Bars num={n} den={den} />
      <Bars num={ext.num} den={ext.den} color="b" />
      <p className="muted small">
        Zamalowana długość się nie zmienia – zmienia się tylko liczba części. Dlatego rozszerzanie i skracanie nie zmieniają wartości ułamka.
      </p>
    </div>
  );
}

/* ---------------- 3. Liczby mieszane ---------------- */

function Mixed() {
  const [num, setNum] = useState(7);
  const [den, setDen] = useState(3);
  const f = F(num, den);
  const w = Math.floor(num / den);
  const r = num % den;
  return (
    <div className="widget-body">
      <div className="widget-controls">
        <Stepper label="Licznik" value={num} min={1} max={den * 4} onChange={setNum} />
        <Stepper label="Mianownik" value={den} min={2} max={8} onChange={(d) => { setDen(d); if (num > d * 4) setNum(d * 4); }} />
      </div>
      <div className="widget-result">
        <MathText className="wbig" text={`{${num}/${den}} = ${f.isInteger() ? w : w ? `{${w} ${r}/${den}}` : `{${r}/${den}}`}`} />
        <div className="widget-facts">
          <span>
            {num} : {den} = {w} reszty {r}
          </span>
          <span>
            {w} {w === 1 ? 'pełny pasek' : w >= 2 && w <= 4 ? 'pełne paski' : 'pełnych pasków'} i {r} z {den} części
          </span>
        </div>
      </div>
      <Bars num={num} den={den} onPick={setNum} />
    </div>
  );
}

/* ---------------- 4. Porównywanie ---------------- */

function Compare() {
  const [a, setA] = useState<[number, number]>([2, 3]);
  const [b, setB] = useState<[number, number]>([3, 5]);
  const fa = F(a[0], a[1]);
  const fb = F(b[0], b[1]);
  const c = fa.compare(fb);
  const sign = c < 0 ? '<' : c > 0 ? '>' : '=';
  const L = lcm(a[1], b[1]);
  return (
    <div className="widget-body">
      <div className="widget-controls">
        <Stepper label="Licznik A" value={a[0]} min={1} max={a[1]} onChange={(v) => setA([v, a[1]])} />
        <Stepper label="Mianownik A" value={a[1]} min={2} max={10} onChange={(v) => setA([Math.min(a[0], v), v])} />
        <Stepper label="Licznik B" value={b[0]} min={1} max={b[1]} onChange={(v) => setB([v, b[1]])} />
        <Stepper label="Mianownik B" value={b[1]} min={2} max={10} onChange={(v) => setB([Math.min(b[0], v), v])} />
      </div>
      <div className="widget-result">
        <MathText className="wbig" text={`{${a[0]}/${a[1]}} ${sign} {${b[0]}/${b[1]}}`} />
        <div className="widget-facts">
          <span>
            wspólny mianownik {L}: <MathText text={`{${a[0] * (L / a[1])}/${L}} ${sign} {${b[0] * (L / b[1])}/${L}}`} />
          </span>
        </div>
      </div>
      <Bars num={a[0]} den={a[1]} />
      <Bars num={b[0]} den={b[1]} color="b" />
    </div>
  );
}

/* ---------------- 5. Dodawanie ---------------- */

function Add() {
  const [a, setA] = useState<[number, number]>([1, 2]);
  const [b, setB] = useState<[number, number]>([1, 3]);
  const L = lcm(a[1], b[1]);
  const an = a[0] * (L / a[1]);
  const bn = b[0] * (L / b[1]);
  const sum = F(a[0], a[1]).add(F(b[0], b[1]));
  return (
    <div className="widget-body">
      <div className="widget-controls">
        <Stepper label="Licznik 1" value={a[0]} min={1} max={a[1]} onChange={(v) => setA([v, a[1]])} />
        <Stepper label="Mianownik 1" value={a[1]} min={2} max={8} onChange={(v) => setA([Math.min(a[0], v), v])} />
        <Stepper label="Licznik 2" value={b[0]} min={1} max={b[1]} onChange={(v) => setB([v, b[1]])} />
        <Stepper label="Mianownik 2" value={b[1]} min={2} max={8} onChange={(v) => setB([Math.min(b[0], v), v])} />
      </div>
      <div className="widget-result">
        <MathText
          className="wbig"
          text={`{${a[0]}/${a[1]}} + {${b[0]}/${b[1]}} = {${an}/${L}} + {${bn}/${L}} = {${an + bn}/${L}}${gcd(an + bn, L) > 1 || an + bn > L ? ` = ${sum.toMarkup(true)}` : ''}`}
        />
      </div>
      <p className="muted small">Najpierw dzielimy oba paski na {L} równych części (wspólny mianownik), potem dokładamy części drugiego ułamka.</p>
      <Bars num={an} den={L} extra={bn} />
    </div>
  );
}

/* ---------------- 6. Mnożenie – model prostokątny ---------------- */

function Multiply() {
  const [a, setA] = useState<[number, number]>([2, 3]);
  const [b, setB] = useState<[number, number]>([3, 4]);
  const prod = F(a[0] * b[0], a[1] * b[1]);
  return (
    <div className="widget-body">
      <div className="widget-controls">
        <Stepper label="Licznik 1" value={a[0]} min={1} max={a[1]} onChange={(v) => setA([v, a[1]])} />
        <Stepper label="Mianownik 1" value={a[1]} min={2} max={8} onChange={(v) => setA([Math.min(a[0], v), v])} />
        <Stepper label="Licznik 2" value={b[0]} min={1} max={b[1]} onChange={(v) => setB([v, b[1]])} />
        <Stepper label="Mianownik 2" value={b[1]} min={2} max={8} onChange={(v) => setB([Math.min(b[0], v), v])} />
      </div>
      <div className="widget-result">
        <MathText
          className="wbig"
          text={`{${a[0]}/${a[1]}} · {${b[0]}/${b[1]}} = {${a[0] * b[0]}/${a[1] * b[1]}}${prod.isSimplest() ? '' : ` = ${prod.simplify().toMarkup()}`}`}
        />
      </div>
      <div className="area" style={{ gridTemplateColumns: `repeat(${a[1]}, 1fr)`, gridTemplateRows: `repeat(${b[1]}, 1fr)` }} aria-label="Model prostokątny mnożenia">
        {Array.from({ length: a[1] * b[1] }, (_, i) => {
          const col = i % a[1];
          const row = Math.floor(i / a[1]);
          const inA = col < a[0];
          const inB = row < b[0];
          return <span key={i} className={`area-cell ${inA && inB ? 'both' : inA ? 'only-a' : inB ? 'only-b' : ''}`} />;
        })}
      </div>
      <p className="muted small">
        Kolumny: <MathText text={`{${a[0]}/${a[1]}}`} /> kwadratu. Wiersze: <MathText text={`{${b[0]}/${b[1]}}`} />. Kratki zamalowane podwójnie (
        {a[0] * b[0]} z {a[1] * b[1]}) to wynik mnożenia.
      </p>
    </div>
  );
}

/* ---------------- 7. Rozwinięcie dziesiętne ---------------- */

function longDivision(num: number, den: number, maxDigits = 14) {
  const intPart = Math.floor(num / den);
  let rem = num % den;
  const digits: number[] = [];
  const seen = new Map<number, number>();
  while (rem !== 0 && digits.length < maxDigits) {
    if (seen.has(rem)) return { intPart, digits, periodStart: seen.get(rem)! };
    seen.set(rem, digits.length);
    rem *= 10;
    digits.push(Math.floor(rem / den));
    rem %= den;
  }
  return { intPart, digits, periodStart: -1 };
}

function Decimal() {
  const [num, setNum] = useState(1);
  const [den, setDen] = useState(6);
  const f = F(num, den);
  const s = f.simplify();
  const { intPart, digits, periodStart } = longDivision(num, den);
  const pre = periodStart >= 0 ? digits.slice(0, periodStart).join('') : digits.join('');
  const period = periodStart >= 0 ? digits.slice(periodStart).join('') : '';
  const factors: number[] = [];
  let x = s.den;
  for (let p = 2; p <= x; p++) while (x % p === 0) (factors.push(p), (x /= p));
  const hundred = Math.round(Math.min(1, f.valueOf()) * 100);
  return (
    <div className="widget-body">
      <div className="widget-controls">
        <Stepper label="Licznik" value={num} min={1} max={den * 2} onChange={setNum} />
        <Stepper label="Mianownik" value={den} min={2} max={20} onChange={(d) => { setDen(d); if (num > d * 2) setNum(d * 2); }} />
      </div>
      <div className="widget-result">
        <MathText className="wbig" text={`{${num}/${den}} = ${intPart}${pre || period ? ',' : ''}${pre}${period ? `(${period})` : ''}`} />
        <div className="widget-facts">
          <span>
            mianownik po skróceniu: {s.den} = {factors.join(' · ') || '1'}
          </span>
          <span>
            {period
              ? 'jest czynnik inny niż 2 i 5 → rozwinięcie nieskończone okresowe'
              : 'same dwójki i piątki → rozwinięcie skończone'}
          </span>
        </div>
      </div>
      {f.valueOf() <= 1 && (
        <>
          <div className="hundred" aria-label={`${hundred} ze 100 kratek`}>
            {Array.from({ length: 100 }, (_, i) => (
              <span key={i} className={i < hundred ? 'on' : ''} />
            ))}
          </div>
          <p className="muted small">
            {hundred} ze 100 kratek ≈ {hundred / 100 === f.valueOf() ? '' : 'około '}
            {(hundred / 100).toFixed(2).replace('.', ',')}
          </p>
        </>
      )}
    </div>
  );
}

const WIDGETS: Record<WidgetId, { title: string; Component: () => ReactElement }> = {
  builder: { title: 'Zbuduj ułamek', Component: Builder },
  equivalent: { title: 'Ułamki równe', Component: Equivalent },
  mixed: { title: 'Wyłącz całości', Component: Mixed },
  compare: { title: 'Porównaj dwa ułamki', Component: Compare },
  add: { title: 'Dodawanie na pasku', Component: Add },
  multiply: { title: 'Mnożenie na kwadracie', Component: Multiply },
  decimal: { title: 'Ułamek → ułamek dziesiętny', Component: Decimal },
};

export function Widget({ id, title, text }: { id: WidgetId; title?: string; text?: string }) {
  const w = WIDGETS[id];
  const C = w.Component;
  return (
    <div className="widget">
      <div className="widget-head">
        <Icon name="play" size={16} />
        <strong>{title ?? w.title}</strong>
        <span className="widget-tag">Wypróbuj</span>
      </div>
      {text && <MathText as="p" className="muted small" text={text} />}
      <C />
    </div>
  );
}
