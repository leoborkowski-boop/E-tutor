import type { Difficulty } from '../content/types';

export type Settings = {
  /* Tempo */
  sessionLength: number;
  timerMode: 'off' | 'stopwatch' | 'countdown';
  taskSeconds: number;
  difficulty: 'auto' | Difficulty;
  examMinutes: number; // 0 = bez limitu
  /* Pomoc */
  hintsMode: 'always' | 'afterError' | 'off';
  maxAttempts: number;
  solutionDetail: 'short' | 'full';
  showSolutionAfterCorrect: boolean;
  stepModeAvailable: boolean;
  showVisuals: boolean;
  /* Głos */
  voiceEnabled: boolean;
  autoRead: boolean;
  readFeedback: boolean;
  voiceURI: string | null;
  rate: number;
  pitch: number;
  volume: number;
  /* Wygląd */
  theme: 'system' | 'light' | 'dark';
  fontScale: number;
  highContrast: boolean;
  dyslexiaFont: boolean;
  wideSpacing: boolean;
  reduceMotion: boolean;
  sounds: boolean;
  /* Motywacja */
  dailyGoalMinutes: number; // 0 = wyłączony
  showBadges: boolean;
  showCalendar: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  sessionLength: 10,
  timerMode: 'off',
  taskSeconds: 120,
  difficulty: 'auto',
  examMinutes: 45,
  hintsMode: 'always',
  maxAttempts: 2,
  solutionDetail: 'full',
  showSolutionAfterCorrect: false,
  stepModeAvailable: true,
  showVisuals: true,
  voiceEnabled: true,
  autoRead: false,
  readFeedback: false,
  voiceURI: null,
  rate: 0.9,
  pitch: 1,
  volume: 1,
  theme: 'system',
  fontScale: 1,
  highContrast: false,
  dyslexiaFont: false,
  wideSpacing: false,
  reduceMotion: false,
  sounds: false,
  dailyGoalMinutes: 10,
  showBadges: true,
  showCalendar: true,
};

/** Gotowe zestawy ustawień – szybki start dla różnych stylów nauki. */
export const PRESETS: { id: string; name: string; description: string; values: Partial<Settings> }[] = [
  {
    id: 'spokojnie',
    name: 'Spokojnie',
    description: 'Bez pośpiechu: brak limitu czasu, krótkie sesje, wolniejszy głos, dużo pomocy.',
    values: { sessionLength: 5, timerMode: 'off', hintsMode: 'always', maxAttempts: 3, rate: 0.8, solutionDetail: 'full', sounds: false, reduceMotion: true },
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'Ustawienia domyślne – zrównoważone tempo i pomoc.',
    values: { sessionLength: 10, timerMode: 'off', hintsMode: 'always', maxAttempts: 2, rate: 0.9, solutionDetail: 'full' },
  },
  {
    id: 'egzamin',
    name: 'Przed egzaminem',
    description: 'Dłuższe sesje, odliczanie czasu, podpowiedzi dopiero po błędzie.',
    values: { sessionLength: 15, timerMode: 'countdown', taskSeconds: 180, hintsMode: 'afterError', maxAttempts: 1, solutionDetail: 'short' },
  },
];
