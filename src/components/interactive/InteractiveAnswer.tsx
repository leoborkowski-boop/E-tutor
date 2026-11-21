import type { InteractiveTask, Task } from '../../content/types';
import { checkLine, checkMatch, checkOrder, checkShade, type InteractiveVerdict } from '../../lib/interactiveCheck';
import { shuffle } from '../../lib/random';
import { MatchPairs } from './MatchPairs';
import { NumberLinePicker } from './NumberLinePicker';
import { OrderPicker } from './OrderPicker';
import { ShadeBar } from './ShadeBar';

export type IAState = {
  shade: boolean[];
  tick: number | null;
  order: number[];
  pairs: Record<number, number>;
  rightOrder: number[];
  locked: number[];
};

export function isInteractive(t: Task): t is InteractiveTask {
  return t.format === 'shade' || t.format === 'numberline' || t.format === 'order' || t.format === 'match';
}

export function initialIA(task: InteractiveTask): IAState {
  return {
    shade: task.format === 'shade' ? Array(task.den).fill(false) : [],
    tick: null,
    order: [],
    pairs: {},
    rightOrder: task.format === 'match' ? shuffle(Math.random, task.pairs.map((_, i) => i)) : [],
    locked: [],
  };
}

export function hasAnswer(task: InteractiveTask, s: IAState) {
  switch (task.format) {
    case 'shade':
      return s.shade.some(Boolean);
    case 'numberline':
      return s.tick !== null;
    case 'order':
      return s.order.length === task.items.length;
    case 'match':
      return Object.keys(s.pairs).length === task.pairs.length;
  }
}

/** Sprawdza odpowiedź; zwraca też nowy stan (np. zablokowane poprawne pary). */
export function checkInteractive(task: InteractiveTask, s: IAState): { verdict: InteractiveVerdict; next: IAState } {
  switch (task.format) {
    case 'shade':
      return { verdict: checkShade(task, s.shade.filter(Boolean).length), next: s };
    case 'numberline':
      return { verdict: checkLine(task, s.tick), next: s };
    case 'order':
      return { verdict: checkOrder(task, s.order), next: s };
    case 'match': {
      const v = checkMatch(task, s.pairs, s.rightOrder);
      // poprawne pary blokujemy, błędne rozłączamy
      const pairs = Object.fromEntries(Object.entries(s.pairs).filter(([l]) => v.correctLeft.includes(Number(l))));
      return { verdict: v, next: { ...s, locked: v.correctLeft, pairs: v.ok ? s.pairs : pairs } };
    }
  }
}

/** Indeks kreski, na której leży poprawna odpowiedź (do pokazania po zakończeniu). */
export function correctTick(task: InteractiveTask) {
  if (task.format !== 'numberline') return undefined;
  return Math.round((task.target.valueOf() - task.min) * task.den);
}

export function InteractiveAnswer({
  task,
  state,
  onChange,
  disabled,
  reveal,
}: {
  task: InteractiveTask;
  state: IAState;
  onChange: (s: IAState) => void;
  disabled?: boolean;
  reveal?: boolean;
}) {
  switch (task.format) {
    case 'shade':
      return (
        <ShadeBar
          den={task.den}
          shaded={state.shade}
          onChange={(shade) => onChange({ ...state, shade })}
          disabled={disabled}
          highlight={reveal ? (task.target.num * task.den) / task.target.den : undefined}
        />
      );
    case 'numberline':
      return (
        <NumberLinePicker
          min={task.min}
          max={task.max}
          den={task.den}
          value={state.tick}
          onChange={(tick) => onChange({ ...state, tick })}
          disabled={disabled}
          correctTick={reveal ? correctTick(task) : undefined}
        />
      );
    case 'order':
      return <OrderPicker items={task.items} order={state.order} onChange={(order) => onChange({ ...state, order })} disabled={disabled} direction={task.direction} />;
    case 'match':
      return (
        <MatchPairs
          left={task.pairs.map((p) => p.left)}
          right={state.rightOrder.map((i) => task.pairs[i].right)}
          pairs={state.pairs}
          onChange={(pairs) => onChange({ ...state, pairs })}
          locked={state.locked}
          disabled={disabled}
        />
      );
  }
}
