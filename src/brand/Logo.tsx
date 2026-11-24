import { MARK_E, MARK_TWO, NAME_BOX, NAME_PATH } from './paths';

/** Znak EduKwadrat („e²” w kole). W trybie ciemnym kolory się odwracają (negatyw). */
export function LogoMark({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg className={`logo-mark ${className}`} width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <circle cx="50" cy="50" r="50" className="logo-mark-bg" />
      <path d={MARK_E} className="logo-mark-fg" />
      <path d={MARK_TWO} className="logo-mark-fg" />
    </svg>
  );
}

/** Napis „EduKwadrat” jako kontury (wygląda tak samo bez względu na załadowane czcionki). */
export function LogoName({ height = 20, className = '' }: { height?: number; className?: string }) {
  const [, , w, h] = NAME_BOX.split(' ').map(Number);
  return (
    <svg className={`logo-name ${className}`} height={height} width={(height * w) / h} viewBox={NAME_BOX} aria-hidden="true" focusable="false">
      <path d={NAME_PATH} fill="currentColor" />
    </svg>
  );
}
