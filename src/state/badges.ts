import { TOPICS } from '../content/topics';
import { type Progress, learningDays, topicStats } from './progress';

export type Badge = { id: string; icon: string; name: string; description: string };

export const BADGES: Badge[] = [
  { id: 'first-step', icon: '🌱', name: 'Pierwszy krok', description: 'Rozwiąż pierwsze zadanie.' },
  { id: 'diagnostic', icon: '🧭', name: 'Znam swój start', description: 'Ukończ test diagnostyczny.' },
  { id: 'theory-3', icon: '📖', name: 'Czytelnik', description: 'Przeczytaj teorię z trzech działów.' },
  { id: 'goal', icon: '🎯', name: 'Cel dnia', description: 'Osiągnij dzienny cel nauki.' },
  { id: 'days-5', icon: '📅', name: 'Systematyczność', description: 'Ucz się w 5 różnych dniach (nie muszą być pod rząd).' },
  { id: 'days-20', icon: '🗓️', name: 'Wytrwałość', description: 'Ucz się w 20 różnych dniach.' },
  { id: 'first-exam', icon: '📝', name: 'Próba generalna', description: 'Rozwiąż pierwszy próbny arkusz.' },
  { id: 'exam-80', icon: '🏅', name: 'Forma egzaminacyjna', description: 'Zdobądź co najmniej 80% punktów w próbnym arkuszu.' },
  ...TOPICS.map((t) => ({ id: `mastered-${t.id}`, icon: '⭐', name: t.title, description: `Opanuj dział „${t.title}”.` })),
  { id: 'all-mastered', icon: '🏆', name: 'Ułamki opanowane', description: 'Opanuj wszystkie działy.' },
];

export const BADGE_BY_ID = Object.fromEntries(BADGES.map((b) => [b.id, b]));

/** Zwraca listę odznak, które należy teraz przyznać. */
export function newlyEarned(p: Progress, dailyGoalSeconds: number, todaySeconds: number): string[] {
  const has = (id: string) => id in p.badges;
  const earned: string[] = [];
  const add = (id: string, cond: boolean) => {
    if (cond && !has(id)) earned.push(id);
  };
  add('first-step', p.attempts.some((a) => a.source === 'practice' && a.correct));
  add('diagnostic', p.diagnosticDone);
  add('theory-3', Object.keys(p.theoryRead).length >= 3);
  add('goal', dailyGoalSeconds > 0 && todaySeconds >= dailyGoalSeconds);
  const days = learningDays(p);
  add('days-5', days >= 5);
  add('days-20', days >= 20);
  add('first-exam', p.exams.length > 0);
  add('exam-80', p.exams.some((e) => e.points / e.max >= 0.8));
  let all = true;
  for (const t of TOPICS) {
    const mastered = topicStats(p, t.id).status === 'mastered';
    if (!mastered) all = false;
    add(`mastered-${t.id}`, mastered);
  }
  add('all-mastered', all);
  return earned;
}
