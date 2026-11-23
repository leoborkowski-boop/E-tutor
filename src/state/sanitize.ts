import { TOPICS } from '../content/topics';
import type { Difficulty, TopicId } from '../content/types';
import type { Attempt, AttemptSource, ExamResult, Progress, TopicMeta } from './progress';
import { DEFAULT_SETTINGS, type Settings } from './settings';

/**
 * Dane z localStorage i z importowanego pliku traktujemy jako niezaufane:
 * uszkodzony lub ręcznie zmieniony plik nie może zablokować aplikacji.
 * Zachowujemy tylko pola o znanym kształcie, resztę odrzucamy.
 */

const TOPIC_IDS = new Set<string>(TOPICS.map((t) => t.id));
const SOURCES = new Set<AttemptSource>(['practice', 'diagnostic', 'exam']);
const MAX_ATTEMPTS = 3000;
const MAX_TEXT = 300;

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown, min: number, max: number): number | null => (typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? v : null);
const ownEntries = (v: Record<string, unknown>) => Object.keys(v).filter((k) => k !== '__proto__' && k !== 'constructor' && k !== 'prototype').map((k) => [k, v[k]] as const);

function attempt(v: unknown): Attempt | null {
  if (!isObj(v)) return null;
  const ts = num(v.ts, 0, 8.64e15);
  const score = num(v.score, 0, 1);
  const hints = num(v.hints, 0, 100);
  const difficulty = num(v.difficulty, 1, 3);
  if (ts === null || score === null || hints === null || difficulty === null || !Number.isInteger(difficulty)) return null;
  if (typeof v.topicId !== 'string' || !TOPIC_IDS.has(v.topicId)) return null;
  if (typeof v.correct !== 'boolean' || typeof v.source !== 'string' || !SOURCES.has(v.source as AttemptSource)) return null;
  return {
    ts,
    topicId: v.topicId as TopicId,
    difficulty: difficulty as Difficulty,
    correct: v.correct,
    score,
    hints,
    source: v.source as AttemptSource,
    misconception: typeof v.misconception === 'string' ? v.misconception.slice(0, MAX_TEXT) : undefined,
  };
}

function exam(v: unknown): ExamResult | null {
  if (!isObj(v)) return null;
  const ts = num(v.ts, 0, 8.64e15);
  const max = num(v.max, 1, 1000);
  const points = num(v.points, 0, 1000);
  const minutes = num(v.minutes, 0, 10_000);
  if (ts === null || max === null || points === null || minutes === null || points > max) return null;
  return { ts, max, points, minutes };
}

function numberRecord(v: unknown, keyOk: (k: string) => boolean, min: number, max: number): Record<string, number> {
  const out: Record<string, number> = {};
  if (!isObj(v)) return out;
  for (const [k, val] of ownEntries(v)) {
    const n = num(val, min, max);
    if (keyOk(k) && n !== null) out[k] = n;
  }
  return out;
}

export function sanitizeProgress(raw: unknown): Progress {
  const v = isObj(raw) ? raw : {};
  const attempts = (Array.isArray(v.attempts) ? v.attempts : [])
    .slice(-MAX_ATTEMPTS)
    .map(attempt)
    .filter((a): a is Attempt => a !== null);
  const topicMeta: Partial<Record<TopicId, TopicMeta>> = {};
  if (isObj(v.topicMeta)) {
    for (const [k, m] of ownEntries(v.topicMeta)) {
      if (!TOPIC_IDS.has(k) || !isObj(m)) continue;
      const stage = num(m.reviewStage, 0, 100);
      if (stage === null) continue;
      const last = num(m.lastMasteredTs, 0, 8.64e15);
      topicMeta[k as TopicId] = { reviewStage: stage, ...(last !== null ? { lastMasteredTs: last } : {}) };
    }
  }
  return {
    attempts,
    topicMeta,
    diagnosticDone: v.diagnosticDone === true,
    exams: (Array.isArray(v.exams) ? v.exams : []).slice(-200).map(exam).filter((e): e is ExamResult => e !== null),
    studySeconds: numberRecord(v.studySeconds, (k) => /^\d{4}-\d{2}-\d{2}$/.test(k), 0, 86_400),
    badges: numberRecord(v.badges, (k) => /^[a-z0-9-]{1,40}$/.test(k), 0, 8.64e15),
    theoryRead: numberRecord(v.theoryRead, (k) => TOPIC_IDS.has(k), 0, 8.64e15) as Partial<Record<TopicId, number>>,
  };
}

/** Ustawienia: każde pole musi mieć ten sam typ co wartość domyślna (i dozwoloną wartość). */
export function sanitizeSettings(raw: unknown): Settings {
  const out: Settings = { ...DEFAULT_SETTINGS };
  if (!isObj(raw)) return out;
  const allowed: Partial<Record<keyof Settings, readonly unknown[]>> = {
    timerMode: ['off', 'stopwatch', 'countdown'],
    difficulty: ['auto', 1, 2, 3],
    hintsMode: ['always', 'afterError', 'off'],
    solutionDetail: ['short', 'full'],
    theme: ['system', 'light', 'dark'],
    keypad: ['auto', 'on', 'off'],
  };
  const ranges: Partial<Record<keyof Settings, [number, number]>> = {
    sessionLength: [1, 50],
    taskSeconds: [10, 600],
    examMinutes: [0, 300],
    maxAttempts: [1, 5],
    rate: [0.3, 2],
    pitch: [0.3, 2],
    volume: [0, 1],
    fontScale: [0.8, 1.6],
    dailyGoalMinutes: [0, 240],
  };
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
    const val = raw[key];
    if (val === undefined) continue;
    const list = allowed[key];
    if (list) {
      if (list.includes(val)) (out as Record<string, unknown>)[key] = val;
      continue;
    }
    const def = DEFAULT_SETTINGS[key];
    if (key === 'voiceURI') {
      if (val === null || (typeof val === 'string' && val.length < 500)) out.voiceURI = val as string | null;
      continue;
    }
    if (typeof def === 'number') {
      const range = ranges[key];
      const n = range ? num(val, range[0], range[1]) : null;
      if (n !== null) (out as Record<string, unknown>)[key] = n;
    } else if (typeof def === 'boolean' && typeof val === 'boolean') {
      (out as Record<string, unknown>)[key] = val;
    }
  }
  return out;
}
