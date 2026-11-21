import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { TopicId } from '../content/types';
import { BADGE_BY_ID, newlyEarned, type Badge } from './badges';
import { EMPTY_PROGRESS, type Attempt, type ExamResult, type Progress, dayKey, topicStats } from './progress';
import { DEFAULT_SETTINGS, type Settings } from './settings';
import { load, save } from './storage';

type AppState = {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  resetSettings: () => void;
  progress: Progress;
  recordAttempt: (a: Omit<Attempt, 'ts'>) => void;
  recordAttempts: (a: Omit<Attempt, 'ts'>[]) => void;
  addStudySeconds: (s: number) => void;
  completeDiagnostic: () => void;
  addExam: (r: ExamResult) => void;
  markTheoryRead: (t: TopicId) => void;
  resetProgress: () => void;
  importProgress: (p: Progress) => void;
  toasts: Badge[];
  dismissToast: (id: string) => void;
};

const Ctx = createContext<AppState | null>(null);

function withReviewStages(before: Progress, after: Progress, now: number): Progress {
  const topics = new Set(after.attempts.slice(before.attempts.length).map((a) => a.topicId));
  if (!topics.size) return after;
  const meta = { ...after.topicMeta };
  for (const t of topics) {
    const b = topicStats(before, t, now);
    const a = topicStats(after, t, now);
    if (a.status === 'mastered' && (b.status !== 'mastered' || b.dueForReview)) {
      const prev = meta[t]?.reviewStage ?? 0;
      meta[t] = { reviewStage: prev + 1, lastMasteredTs: now };
    }
  }
  return { ...after, topicMeta: meta };
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => ({ ...DEFAULT_SETTINGS, ...load<Partial<Settings>>('settings', {}) }));
  const [progress, setProgress] = useState<Progress>(() => ({ ...EMPTY_PROGRESS, ...load<Partial<Progress>>('progress', {}) }));
  const [toasts, setToasts] = useState<Badge[]>([]);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => save('settings', settings), [settings]);
  useEffect(() => save('progress', progress), [progress]);

  /** Każda zmiana postępów przechodzi przez tę funkcję – przyznaje odznaki. */
  const commit = useCallback((fn: (p: Progress) => Progress) => {
    setProgress((prev) => {
      const now = Date.now();
      let next = withReviewStages(prev, fn(prev), now);
      const goal = settingsRef.current.dailyGoalMinutes * 60;
      const earned = newlyEarned(next, goal, next.studySeconds[dayKey()] ?? 0);
      if (earned.length) {
        next = { ...next, badges: { ...next.badges, ...Object.fromEntries(earned.map((id) => [id, now])) } };
        if (settingsRef.current.showBadges) {
          // odkładamy, by nie aktualizować stanu w trakcie innej aktualizacji
          queueMicrotask(() =>
            setToasts((t) => [...t, ...earned.map((id) => BADGE_BY_ID[id]).filter((b) => b && !t.some((x) => x.id === b.id))]),
          );
        }
      }
      return next;
    });
  }, []);

  const dismissToast = useCallback((id: string) => setToasts((t) => t.filter((b) => b.id !== id)), []);

  const value = useMemo<AppState>(
    () => ({
      settings,
      updateSettings: (patch) => setSettings((s) => ({ ...s, ...patch })),
      resetSettings: () => setSettings(DEFAULT_SETTINGS),
      progress,
      recordAttempt: (a) => commit((p) => ({ ...p, attempts: [...p.attempts, { ...a, ts: Date.now() }].slice(-3000) })),
      recordAttempts: (list) =>
        commit((p) => ({ ...p, attempts: [...p.attempts, ...list.map((a) => ({ ...a, ts: Date.now() }))].slice(-3000) })),
      addStudySeconds: (s) =>
        commit((p) => {
          const k = dayKey();
          return { ...p, studySeconds: { ...p.studySeconds, [k]: (p.studySeconds[k] ?? 0) + s } };
        }),
      completeDiagnostic: () => commit((p) => ({ ...p, diagnosticDone: true })),
      addExam: (r) => commit((p) => ({ ...p, exams: [...p.exams, r] })),
      markTheoryRead: (t) => commit((p) => (p.theoryRead[t] ? p : { ...p, theoryRead: { ...p.theoryRead, [t]: Date.now() } })),
      resetProgress: () => setProgress(EMPTY_PROGRESS),
      importProgress: (p) => setProgress({ ...EMPTY_PROGRESS, ...p }),
      toasts,
      dismissToast,
    }),
    [settings, progress, toasts, commit, dismissToast],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp poza AppStateProvider');
  return v;
}

/** Zlicza czas nauki, gdy ekran jest aktywny i karta widoczna. */
export function useStudyTimer(active = true) {
  const { addStudySeconds } = useApp();
  const addRef = useRef(addStudySeconds);
  addRef.current = addStudySeconds;
  useEffect(() => {
    if (!active) return;
    let acc = 0;
    let lastInput = Date.now();
    const onInput = () => (lastInput = Date.now());
    window.addEventListener('pointerdown', onInput);
    window.addEventListener('keydown', onInput);
    window.addEventListener('scroll', onInput, { passive: true });
    const iv = window.setInterval(() => {
      // liczymy tylko, gdy uczeń coś robił w ciągu ostatnich 3 minut
      if (document.visibilityState === 'visible' && Date.now() - lastInput < 180_000) acc += 5;
      if (acc >= 30) {
        addRef.current(acc);
        acc = 0;
      }
    }, 5000);
    return () => {
      window.clearInterval(iv);
      window.removeEventListener('pointerdown', onInput);
      window.removeEventListener('keydown', onInput);
      window.removeEventListener('scroll', onInput);
      if (acc > 0) addRef.current(acc);
    };
  }, [active]);
}
