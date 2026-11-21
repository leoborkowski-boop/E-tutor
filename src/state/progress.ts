import type { Difficulty, TopicId } from '../content/types';

export type AttemptSource = 'practice' | 'diagnostic' | 'exam';

export type Attempt = {
  ts: number;
  topicId: TopicId;
  difficulty: Difficulty;
  correct: boolean;
  /** Wartość 0–1 po uwzględnieniu podpowiedzi, prób i trybu krok po kroku */
  score: number;
  hints: number;
  source: AttemptSource;
  /** Rozpoznany typowy błąd (treść komunikatu) – do analizy */
  misconception?: string;
};

export type ExamResult = { ts: number; points: number; max: number; minutes: number };

export type TopicMeta = {
  /** etap powtórek (0 = brak) – rośnie, gdy dział zostaje opanowany po przerwie */
  reviewStage: number;
  lastMasteredTs?: number;
};

export type Progress = {
  attempts: Attempt[];
  topicMeta: Partial<Record<TopicId, TopicMeta>>;
  diagnosticDone: boolean;
  exams: ExamResult[];
  /** sekundy nauki na dzień, klucz YYYY-MM-DD */
  studySeconds: Record<string, number>;
  badges: Record<string, number>; // id → timestamp zdobycia
  theoryRead: Partial<Record<TopicId, number>>;
};

export const EMPTY_PROGRESS: Progress = {
  attempts: [],
  topicMeta: {},
  diagnosticDone: false,
  exams: [],
  studySeconds: {},
  badges: {},
  theoryRead: {},
};

/* ---------------- Ocena opanowania ---------------- */

export const MASTERY_WINDOW = 12;
export const THRESHOLD_REVIEW = 0.5; // poniżej → do powtórki
export const THRESHOLD_MASTERED = 0.85; // od → opanowane

export type Status = 'new' | 'review' | 'learning' | 'mastered';

/** Poziom trudności wpływa na maksymalny wkład zadania – same łatwe zadania nie dają „opanowania”. */
const DIFF_FACTOR: Record<Difficulty, number> = { 1: 0.8, 2: 1, 3: 1 };

export type TopicStats = {
  mastery: number; // 0–1
  status: Status;
  attempts: number;
  recentCorrect: number;
  recentTotal: number;
  lastTs?: number;
  dueForReview: boolean;
  lowConfidence: boolean;
};

const REVIEW_INTERVAL_DAYS = [2, 4, 7, 14, 30, 60];
const DAY = 24 * 3600 * 1000;

export function topicStats(progress: Progress, topicId: TopicId, now = Date.now()): TopicStats {
  const all = progress.attempts.filter((a) => a.topicId === topicId);
  const recent = all.slice(-MASTERY_WINDOW);
  if (!recent.length) {
    return { mastery: 0, status: 'new', attempts: 0, recentCorrect: 0, recentTotal: 0, dueForReview: false, lowConfidence: true };
  }
  let wsum = 0;
  let vsum = 0;
  recent.forEach((a, i) => {
    const w = i + 1; // nowsze próby ważą więcej
    wsum += w;
    vsum += w * a.score * DIFF_FACTOR[a.difficulty];
  });
  const mastery = vsum / wsum;
  const status: Status = mastery >= THRESHOLD_MASTERED ? 'mastered' : mastery < THRESHOLD_REVIEW ? 'review' : 'learning';
  const lastTs = recent[recent.length - 1].ts;
  const meta = progress.topicMeta[topicId];
  const stage = meta?.reviewStage ?? 0;
  const interval = REVIEW_INTERVAL_DAYS[Math.min(Math.max(stage - 1, 0), REVIEW_INTERVAL_DAYS.length - 1)];
  const dueForReview = status === 'mastered' && now - lastTs > interval * DAY;
  return {
    mastery,
    status,
    attempts: all.length,
    recentCorrect: recent.filter((a) => a.correct).length,
    recentTotal: recent.length,
    lastTs,
    dueForReview,
    lowConfidence: recent.length < 4,
  };
}

/** Automatyczny poziom trudności na podstawie opanowania. */
export function autoDifficulty(stats: TopicStats): Difficulty {
  if (stats.status === 'new') return 1;
  if (stats.mastery < 0.5) return 1;
  if (stats.mastery < 0.8) return 2;
  return 3;
}

/** Wynik pojedynczej próby (0–1). */
export function attemptScore(opts: { correct: boolean; hints: number; extraTries: number; stepMode: boolean; revealed: boolean }) {
  if (!opts.correct || opts.revealed) return 0;
  const s = 1 - 0.25 * opts.hints - 0.25 * opts.extraTries - (opts.stepMode ? 0.25 : 0);
  return Math.max(0.25, Math.min(1, s));
}

/* ---------------- Czas nauki i kalendarz ---------------- */

export function dayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function learningDays(progress: Progress) {
  return Object.entries(progress.studySeconds).filter(([, s]) => s >= 60).length;
}
