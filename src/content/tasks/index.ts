import { pick, shuffle } from '../../lib/random';
import type { Difficulty, Generator, Rng, Task, TopicId, TrueFalseTask } from '../types';
import { mieszaneGenerators, pojecieGenerators, skracanieGenerators } from './basics';
import { additionStatement, comparisonStatements, dodawanieGenerators, mnozenieGenerators, porownywanieGenerators } from './operations';
import { WORD_PROBLEMS, decimalStatement, dziesietneGenerators, kolejnoscGenerators, tekstoweGenerators, wordProblemTask } from './advanced';
import { fractionChoices, id } from './helpers';
import { lineTask, matchDecimalTask, matchEquivalentTask, orderTask, shadeTask } from './interactive';
import type { Fraction } from '../../lib/fraction';

export const GENERATORS: Record<TopicId, Generator[]> = {
  pojecie: [...pojecieGenerators, (d, r) => shadeTask(d, r), (d, r) => lineTask(d, r, 'pojecie')],
  skracanie: [...skracanieGenerators, (d, r) => (d === 1 ? shadeTask(2, r, 'skracanie') : shadeTask(d, r, 'skracanie')), (d, r) => matchEquivalentTask(d, r)],
  mieszane: [...mieszaneGenerators, (d, r) => lineTask(d, r, 'mieszane')],
  porownywanie: [...porownywanieGenerators, (d, r) => orderTask(d, r), (d, r) => orderTask(d, r)],
  dodawanie: dodawanieGenerators,
  mnozenie: mnozenieGenerators,
  dziesietne: [...dziesietneGenerators, (d, r) => matchDecimalTask(d, r), (d, r) => lineTask(d, r, 'dziesietne')],
  kolejnosc: kolejnoscGenerators,
  tekstowe: tekstoweGenerators,
};

export function generateTask(topic: TopicId, difficulty: Difficulty, rng: Rng): Task {
  return pick(rng, GENERATORS[topic])(difficulty, rng);
}

/** Zadanie prawda/fałsz w stylu egzaminu (dwa stwierdzenia). */
export function trueFalseTask(rng: Rng): TrueFalseTask {
  const kind = pick(rng, ['porownywanie', 'dziesietne', 'dodawanie'] as const);
  const make = () => (kind === 'porownywanie' ? comparisonStatements(rng) : kind === 'dziesietne' ? decimalStatement(rng) : additionStatement(rng));
  const s1 = make();
  let s2 = make();
  let guard = 0;
  while (s2.text === s1.text && guard++ < 20) s2 = make();
  return {
    id: id(kind),
    topicId: kind,
    difficulty: 2,
    format: 'truefalse',
    prompt: 'Oceń prawdziwość podanych zdań. Wybierz **P**, jeśli zdanie jest prawdziwe, albo **F** – jeśli jest fałszywe.',
    statements: [s1, s2],
    hints: [],
    solution: [s1.explanation, s2.explanation],
    answerText: `${s1.isTrue ? 'P' : 'F'}, ${s2.isTrue ? 'P' : 'F'}`,
  };
}

export type ExamItem = { task: Task; points: number; kind: 'closed' | 'open' };

const ALL_TOPICS: TopicId[] = ['pojecie', 'skracanie', 'mieszane', 'porownywanie', 'dodawanie', 'mnozenie', 'dziesietne', 'kolejnosc', 'tekstowe'];

/**
 * Próbny arkusz w stylu egzaminu ósmoklasisty (tylko ułamki):
 * 10 zadań zamkniętych (A–D), 2 zadania prawda/fałsz, 3 zadania otwarte.
 */
export function buildExam(rng: Rng): ExamItem[] {
  const closed: ExamItem[] = [];
  const topics = shuffle(rng, ALL_TOPICS.filter((t) => t !== 'tekstowe'));
  let i = 0;
  let guard = 0;
  while (closed.length < 10 && guard++ < 400) {
    const topic = topics[i % topics.length];
    const d: Difficulty = closed.length < 4 ? 2 : 3;
    const t = toChoice(generateTask(topic, d, rng), rng);
    if (t) {
      closed.push({ task: t, points: 1, kind: 'closed' });
      i++;
    }
  }
  const tf: ExamItem[] = [0, 1].map(() => ({ task: trueFalseTask(rng), points: 1, kind: 'closed' }));
  const open = shuffle(rng, WORD_PROBLEMS.filter((w) => w.difficulty >= 2))
    .slice(0, 3)
    .map((w) => {
      const task = wordProblemTask(w);
      return { task, points: Math.min(3, Math.max(2, w.steps.length)), kind: 'open' as const };
    });
  return [...closed.slice(0, 5), tf[0], ...closed.slice(5), tf[1], ...open];
}

/** Zamienia zadanie z polem odpowiedzi na zadanie zamknięte (A–D). */
export function toChoice(task: Task, rng: Rng): Task | null {
  if (task.format === 'choice') return task.choices.length >= 3 ? task : null;
  if (task.format !== 'input') return null;
  if (task.answer.validate) return null; // zadania „podaj dowolny” nie nadają się na ABCD
  const needDecimal = task.answer.check?.requireDecimal;
  const render = needDecimal
    ? (f: Fraction) => (f.hasFiniteDecimal() ? f.toDecimalString() : f.toMarkup(true))
    : (f: Fraction) => f.toMarkup(!task.answer.check?.requireImproper);
  return {
    id: task.id,
    topicId: task.topicId,
    difficulty: task.difficulty,
    format: 'choice',
    prompt: task.prompt.replace(/ Wynik podaj w najprostszej postaci\./, ''),
    visual: task.visual,
    hints: task.hints,
    solution: task.solution,
    answerText: task.answerText,
    choices: fractionChoices(
      rng,
      task.answer.value,
      (task.misconceptions ?? []).filter((mc) => !mc.value.equals(task.answer.value)),
      { render },
    ).map((c) => ({ ...c, text: c.text + (task.answer.unit ? ` ${task.answer.unit}` : '') })),
  };
}

/** Test diagnostyczny: po 2 zadania z każdego działu (poziom 1 i 2). */
export function buildDiagnostic(rng: Rng): Task[] {
  return ALL_TOPICS.flatMap((t) => [generateTask(t, 1, rng), generateTask(t, 2, rng)]);
}

export { ALL_TOPICS };
