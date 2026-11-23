import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

/** Id widocznej etykiety wiersza ustawień – kontrolki biorą z niej nazwę (WCAG 2.5.3). */
export const LabelContext = createContext<string | null>(null);
function useLabelProps(label: string) {
  const id = useContext(LabelContext);
  return id ? { 'aria-labelledby': id } : { 'aria-label': label };
}
import { speak, speechSupported, stopSpeaking } from '../lib/speech';
import { useApp } from '../state/AppState';
import type { Status, TopicStats } from '../state/progress';

/* ---------------- Ikony (proste, liniowe) ---------------- */
const ICONS: Record<string, string> = {
  home: 'M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10',
  book: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20',
  exam: 'M9 3h6l1 2h3v16H5V5h3zM9 11h6M9 15h6',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  speaker: 'M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14',
  stop: 'M6 6h12v12H6z',
  back: 'M15 18l-6-6 6-6',
  next: 'M9 18l6-6-6-6',
  check: 'M20 6 9 17l-5-5',
  bulb: 'M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z',
  steps: 'M4 20h4v-4h4v-4h4V8h4',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  compass: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM16.2 7.8l-2.1 6.3-6.3 2.1 2.1-6.3z',
  play: 'M6 4l14 8-14 8z',
  refresh: 'M3 12a9 9 0 0 1 15.5-6.3L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.3L3 16M3 21v-5h5',
  x: 'M18 6 6 18M6 6l12 12',
};

export function Icon({ name, size = 20 }: { name: keyof typeof ICONS | string; size?: number }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name] ?? ''} />
    </svg>
  );
}

/* ---------------- Przyciski ---------------- */
type BtnProps = {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'quiet';
  icon?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
  href?: string;
  className?: string;
  title?: string;
};

export function Button({ children, onClick, variant = 'secondary', icon, disabled, type = 'button', href, className = '', title }: BtnProps) {
  const cls = `btn btn-${variant} ${className}`;
  const content = (
    <>
      {icon && <Icon name={icon} size={18} />}
      <span>{children}</span>
    </>
  );
  if (href)
    return (
      <a className={cls} href={href} title={title}>
        {content}
      </a>
    );
  return (
    <button className={cls} type={type} onClick={onClick} disabled={disabled} title={title}>
      {content}
    </button>
  );
}

/* ---------------- Czytanie na głos ---------------- */
export function SpeakButton({ text, label = 'Przeczytaj' }: { text: string | string[]; label?: string }) {
  const { settings } = useApp();
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => () => stopSpeaking(), []);
  if (!speechSupported || !settings.voiceEnabled) return null;
  return (
    <button
      type="button"
      className={`speak-btn ${speaking ? 'is-speaking' : ''}`}
      aria-label={speaking ? 'Zatrzymaj czytanie' : label}
      title={speaking ? 'Zatrzymaj' : label}
      onClick={() => {
        if (speaking) {
          stopSpeaking();
          setSpeaking(false);
        } else {
          setSpeaking(true);
          speak(text, { ...settings, onEnd: () => setSpeaking(false) });
        }
      }}
    >
      <Icon name={speaking ? 'stop' : 'speaker'} size={18} />
    </button>
  );
}

/* ---------------- Status opanowania ---------------- */
export const STATUS_LABEL: Record<Status, string> = {
  new: 'Nowy',
  review: 'Do powtórki',
  learning: 'W trakcie',
  mastered: 'Opanowane',
};

export function StatusChip({ stats }: { stats: TopicStats }) {
  const label = stats.dueForReview ? 'Warto odświeżyć' : STATUS_LABEL[stats.status];
  return <span className={`chip chip-${stats.dueForReview ? 'due' : stats.status}`}>{label}</span>;
}

export function MasteryBar({ stats, showValue = true }: { stats: TopicStats; showValue?: boolean }) {
  const pct = Math.round(stats.mastery * 100);
  return (
    <div className="mastery">
      <div
        className="mastery-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label="Poziom opanowania"
      >
        <div className={`mastery-fill fill-${stats.status}`} style={{ width: `${stats.status === 'new' ? 0 : Math.max(4, pct)}%` }} />
        <span className="mastery-mark" style={{ left: '50%' }} aria-hidden="true" />
        <span className="mastery-mark" style={{ left: '85%' }} aria-hidden="true" />
      </div>
      {showValue && <span className="mastery-value">{stats.status === 'new' ? '—' : `${pct}%`}</span>}
    </div>
  );
}

export function Ring({ value, size = 64, label }: { value: number; size?: number; label?: ReactNode }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-track" strokeWidth={6} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="ring-fill"
          strokeWidth={6}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {label && <div className="ring-label">{label}</div>}
    </div>
  );
}

/* ---------------- Kontrolki ustawień ---------------- */
export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  const labelProps = useLabelProps(label);
  return (
    <div className="segmented" role="radiogroup" {...labelProps}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          className={o.value === value ? 'is-active' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  const labelProps = useLabelProps(label);
  return (
    <button type="button" role="switch" aria-checked={checked} {...labelProps} className={`toggle ${checked ? 'is-on' : ''}`} onClick={() => onChange(!checked)}>
      <span className="toggle-knob" />
    </button>
  );
}

export function Slider({
  value,
  min,
  max,
  step,
  onChange,
  label,
  format,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  label: string;
  format?: (v: number) => string;
}) {
  const labelProps = useLabelProps(label);
  return (
    <div className="slider">
      <input type="range" min={min} max={max} step={step} value={value} {...labelProps} aria-valuetext={format ? format(value) : undefined} onChange={(e) => onChange(Number(e.target.value))} />
      <span className="slider-value">{format ? format(value) : value}</span>
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>;
}
