import type { Fraction } from '../lib/fraction';
import type { CheckOptions } from '../lib/parse';

export type TopicId =
  | 'pojecie'
  | 'skracanie'
  | 'mieszane'
  | 'porownywanie'
  | 'dodawanie'
  | 'mnozenie'
  | 'dziesietne'
  | 'kolejnosc'
  | 'tekstowe';

export type Difficulty = 1 | 2 | 3;

/* ---------- Wizualizacje ---------- */

export type Visual =
  | { kind: 'bar'; num: number; den: number; label?: string }
  | { kind: 'bars'; items: { num: number; den: number; label?: string }[] }
  | {
      kind: 'numberline';
      /** zakres osi w liczbach całkowitych */
      min: number;
      max: number;
      /** na ile części dzielimy jednostkę */
      den: number;
      /** zaznaczone punkty: licznik względem den */
      points: { at: number; label: string; showValue?: boolean }[];
    };

/* ---------- Teoria ---------- */

export type TheoryBlock =
  | { type: 'p'; text: string }
  | { type: 'rule'; title?: string; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'visual'; visual: Visual; caption?: string }
  | { type: 'example'; title?: string; problem: string; steps: string[]; answer: string }
  | { type: 'mistake'; wrong: string; right: string; why: string };

export type TheorySection = { title: string; blocks: TheoryBlock[] };

export type Topic = {
  id: TopicId;
  order: number;
  title: string;
  short: string;
  /** Co uczeń ma umieć po opanowaniu działu */
  goals: string[];
  sections: TheorySection[];
};

/* ---------- Zadania ---------- */

export type Choice = { text: string; correct: boolean; misconception?: string };

export type Statement = { text: string; isTrue: boolean; explanation: string };

export type Misconception = { value: Fraction; message: string };

export type AnswerSpec = {
  /** Oczekiwana wartość */
  value: Fraction;
  check?: CheckOptions;
  /** Niestandardowa walidacja (np. „podaj dowolny ułamek między…”) */
  validate?: (f: Fraction) => boolean;
  placeholder?: string;
  /** Jednostka wyświetlana za polem odpowiedzi, np. „zł”, „km” */
  unit?: string;
  /** Prefiks przed polem, np. „x =” */
  prefix?: string;
};

export type Step = {
  prompt: string;
  answer: AnswerSpec;
  hint?: string;
  misconceptions?: Misconception[];
};

type TaskBase = {
  id: string;
  topicId: TopicId;
  difficulty: Difficulty;
  prompt: string;
  visual?: Visual;
  hints: string[];
  /** Kolejne kroki pełnego rozwiązania (MathText) */
  solution: string[];
  /** Krótka odpowiedź do podsumowania */
  answerText: string;
};

export type InputTask = TaskBase & {
  format: 'input';
  answer: AnswerSpec;
  misconceptions?: Misconception[];
  /** Opcjonalny tryb „krok po kroku” */
  steps?: Step[];
};

export type ChoiceTask = TaskBase & { format: 'choice'; choices: Choice[] };

export type TrueFalseTask = TaskBase & { format: 'truefalse'; statements: Statement[] };

export type Task = InputTask | ChoiceTask | TrueFalseTask;

export type Rng = () => number;
export type Generator = (difficulty: Difficulty, rng: Rng) => Task;
