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

export type Pt = [number, number];

/** Elementy rysunku geometrycznego (współrzędne w jednostkach rysunku, oś y w dół). */
export type FigItem =
  | { t: 'poly'; pts: Pt[]; fill?: boolean; dashed?: boolean; open?: boolean }
  | { t: 'line'; a: Pt; b: Pt; dashed?: boolean; thin?: boolean }
  | { t: 'circle'; c: Pt; r: number; fill?: boolean; dashed?: boolean }
  | { t: 'text'; at: Pt; text: string; anchor?: 'start' | 'middle' | 'end'; bold?: boolean }
  | { t: 'right'; at: Pt; a: Pt; b: Pt }
  | { t: 'arc'; at: Pt; a: Pt; b: Pt; label?: string }
  | { t: 'dot'; at: Pt; label?: string; dx?: number; dy?: number };

export type Visual =
  | { kind: 'bar'; num: number; den: number; label?: string }
  | { kind: 'figure'; w: number; h: number; items: FigItem[]; caption?: string }
  | { kind: 'chart'; bars: { label: string; value: number }[]; unit?: string; title?: string }
  | { kind: 'plane'; min: number; max: number; points: { x: number; y: number; label: string }[]; poly?: boolean; segments?: [number, number][] }
  | { kind: 'table'; head: string[]; rows: string[][] }
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
  | { type: 'mistake'; wrong: string; right: string; why: string }
  | { type: 'interactive'; widget: WidgetId; title?: string; text?: string };

/** Interaktywne „laboratoria” w teorii */
export type WidgetId = 'builder' | 'equivalent' | 'mixed' | 'compare' | 'add' | 'multiply' | 'decimal';

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
  /** Dział ułamków (TopicId) albo identyfikator umiejętności z lekcji */
  topicId: string;
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

/** Zamaluj odpowiednią część paska (klikanie w kratki). */
export type ShadeTask = TaskBase & {
  format: 'shade';
  den: number;
  target: Fraction;
  misconceptions?: { count: number; message: string }[];
};

/** Zaznacz liczbę na osi liczbowej (dotknięcie / przeciągnięcie). */
export type LineTask = TaskBase & {
  format: 'numberline';
  min: number;
  max: number;
  den: number;
  target: Fraction;
  misconceptions?: { value: Fraction; message: string }[];
};

/** Ułóż w kolejności. */
export type OrderTask = TaskBase & {
  format: 'order';
  items: { text: string; value: Fraction }[];
  direction: 'asc' | 'desc';
};

/** Połącz w pary (lewa kolumna z prawą). */
export type MatchTask = TaskBase & {
  format: 'match';
  pairs: { left: string; right: string }[];
};

export type InteractiveTask = ShadeTask | LineTask | OrderTask | MatchTask;

export type Task = InputTask | ChoiceTask | TrueFalseTask | InteractiveTask;

export type Rng = () => number;
export type Generator = (difficulty: Difficulty, rng: Rng) => Task;
