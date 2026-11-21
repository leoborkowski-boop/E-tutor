import { Fragment, type ReactNode } from 'react';

/**
 * Renderuje tekst z notacją:
 *   {3/4}     → ułamek piętrowy
 *   {2 1/3}   → liczba mieszana
 *   **tekst** → pogrubienie
 */
const TOKEN = /\{(-?)(?:(\d+) )?([^{}/\s]+)\/([^{}/\s]+)\}|\*\*(.+?)\*\*/g;

export function Frac({ num, den, whole, negative }: { num: ReactNode; den: ReactNode; whole?: ReactNode; negative?: boolean }) {
  return (
    <span className="frac-wrap" role="math">
      {negative && <span className="frac-sign">−</span>}
      {whole !== undefined && <span className="frac-whole">{whole}</span>}
      <span className="frac">
        <span className="frac-num">{num}</span>
        <span className="frac-bar" aria-hidden="true" />
        <span className="frac-den">{den}</span>
      </span>
    </span>
  );
}

/** Tylko wewnątrz ułamka: minus typograficzny i „?” jako pole do uzupełnienia. */
function prettyPart(s: string) {
  return s.replace(/-/g, '−').replace(/[?]/g, '□');
}

export function MathText({ text, as: Tag = 'span', className }: { text: string; as?: 'span' | 'p' | 'div' | 'li'; className?: string }) {
  const out: ReactNode[] = [];
  let last = 0;
  let k = 0;
  for (const m of text.matchAll(TOKEN)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push(<Fragment key={k++}>{text.slice(last, idx)}</Fragment>);
    if (m[5] !== undefined) {
      out.push(<strong key={k++}>{<MathText text={m[5]} />}</strong>);
    } else {
      out.push(<Frac key={k++} negative={!!m[1]} whole={m[2]} num={prettyPart(m[3])} den={prettyPart(m[4])} />);
    }
    last = idx + m[0].length;
  }
  if (last < text.length) out.push(<Fragment key={k++}>{text.slice(last)}</Fragment>);
  return <Tag className={className}>{out}</Tag>;
}
