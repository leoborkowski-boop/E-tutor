import { useEffect, useRef, useState } from 'react';
import type { AnswerSpec, InputTask, Misconception, Task } from '../content/types';
import { speak } from '../lib/speech';
import { toSpoken } from '../lib/spoken';
import { signal } from '../lib/feedback';
import { checkFractionAnswer, parseAnswer, type CheckResult } from '../lib/parse';
import { attemptScore } from '../state/progress';
import { useApp } from '../state/AppState';
import { AnswerInput } from './AnswerInput';
import { FractionVisual } from './FractionVisual';
import { MathText } from './MathText';
import { Button, Icon, SpeakButton } from './ui';
import { InteractiveAnswer, checkInteractive, hasAnswer, initialIA, isInteractive, type IAState } from './interactive/InteractiveAnswer';

export type TaskOutcome = { correct: boolean; score: number; hints: number; misconception?: string; stepMode: boolean };

type Feedback = { kind: 'correct' | 'wrong' | 'info'; message: string } | null;

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

/** Sprawdza wpisaną odpowiedź i zwraca komunikat dla ucznia. */
export function evaluateInput(input: string, spec: AnswerSpec, misconceptions: Misconception[] = []): { ok: boolean; countsAsTry: boolean; message: string; misconception?: string } {
  let res: CheckResult;
  if (spec.validate) {
    const p = parseAnswer(input);
    res = !p ? { status: 'unreadable' } : spec.validate(p.value) ? { status: 'correct' } : { status: 'wrong', parsed: p };
  } else {
    res = checkFractionAnswer(input, spec.value, spec.check);
  }
  switch (res.status) {
    case 'correct':
      return { ok: true, countsAsTry: true, message: pickPraise() };
    case 'not-simplified':
      return { ok: false, countsAsTry: false, message: 'Wartość jest dobra, ale ułamek można jeszcze skrócić. Spróbuj podać wynik w najprostszej postaci.' };
    case 'improper-not-allowed':
      return { ok: false, countsAsTry: false, message: 'Wartość jest dobra. Zapisz ją jako liczbę mieszaną, np. 2 1/3.' };
    case 'wrong-form':
      return {
        ok: false,
        countsAsTry: false,
        message:
          res.expected === 'decimal'
            ? 'Wartość jest dobra. Zapisz ją w postaci ułamka dziesiętnego, np. 0,75.'
            : res.expected === 'improper'
              ? 'Wartość jest dobra. Zapisz ją jako ułamek niewłaściwy, np. 7/3.'
              : 'Wartość jest dobra. Zapisz ją jako ułamek zwykły, np. 3/4.',
      };
    case 'unreadable':
      return { ok: false, countsAsTry: false, message: 'Nie mogę odczytać tej odpowiedzi. Wpisz np. 3/4, 1 1/2 albo 0,75.' };
    case 'wrong': {
      const mc = misconceptions.find((m) => m.value.equals(res.parsed.value));
      return { ok: false, countsAsTry: true, message: mc ? mc.message : 'To jeszcze nie to. Spróbuj ponownie – możesz skorzystać z podpowiedzi.', misconception: mc?.message };
    }
  }
}

const PRAISE = ['Dobrze!', 'Świetnie!', 'Brawo, poprawnie.', 'Tak, to dobra odpowiedź.', 'Bardzo dobrze.'];
function pickPraise() {
  return PRAISE[Math.floor(Math.random() * PRAISE.length)];
}

export function TaskPrompt({ task, number }: { task: Task; number?: number }) {
  const { settings } = useApp();
  return (
    <div className="task-prompt">
      <div className="task-prompt-row">
        {number !== undefined && <span className="task-number">{number}.</span>}
        <MathText as="p" className="task-text" text={task.prompt} />
        <SpeakButton text={task.format === 'choice' ? [task.prompt, ...task.choices.map((c, i) => `${LETTERS[i]}: ${c.text}`)] : task.prompt} />
      </div>
      {task.visual && settings.showVisuals && <FractionVisual visual={task.visual} />}
    </div>
  );
}

export function Solution({ task, detail }: { task: Task; detail: 'short' | 'full' }) {
  const steps = detail === 'full' ? task.solution : task.solution.slice(-1);
  return (
    <div className="solution">
      <div className="solution-head">
        <h4>Rozwiązanie</h4>
        <SpeakButton text={steps} label="Przeczytaj rozwiązanie" />
      </div>
      <ol>
        {steps.map((s, i) => (
          <MathText as="li" key={i} text={s} />
        ))}
      </ol>
      <p className="solution-answer">
        Odpowiedź: <MathText text={task.answerText} />
      </p>
    </div>
  );
}

function StepMode({ task, onDone }: { task: InputTask; onDone: () => void }) {
  const steps = task.steps!;
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [fails, setFails] = useState(0);
  const [fb, setFb] = useState<Feedback>(null);
  const [revealedValue, setRevealedValue] = useState<string | null>(null);
  const step = steps[idx];
  const advance = () => {
    setInput('');
    setFails(0);
    setFb(null);
    setRevealedValue(null);
    if (idx + 1 >= steps.length) onDone();
    else setIdx(idx + 1);
  };
  const check = () => {
    if (!input.trim()) return;
    const r = evaluateInput(input, step.answer, step.misconceptions);
    if (r.ok) {
      setFb({ kind: 'correct', message: r.message });
      return;
    }
    if (r.countsAsTry) {
      const f = fails + 1;
      setFails(f);
      if (f >= 2) {
        setRevealedValue(step.answer.value.toMarkup(true));
        setFb({ kind: 'info', message: 'Nic się nie stało. Poprawny wynik tego kroku jest poniżej – przejdź dalej.' });
        return;
      }
      setFb({ kind: 'wrong', message: r.misconception ?? step.hint ?? r.message });
    } else setFb({ kind: 'info', message: r.message });
  };
  const finished = fb?.kind === 'correct' || revealedValue !== null;
  return (
    <div className="steps">
      <div className="steps-progress">
        {steps.map((_, i) => (
          <span key={i} className={`steps-dot ${i < idx ? 'done' : i === idx ? 'current' : ''}`} />
        ))}
        <span className="muted">
          Krok {idx + 1} z {steps.length}
        </span>
      </div>
      <div className="step-card">
        <div className="task-prompt-row">
          <MathText as="p" className="step-text" text={step.prompt} />
          <SpeakButton text={step.prompt} />
        </div>
        <AnswerInput value={input} onChange={setInput} onSubmit={finished ? advance : check} spec={step.answer} disabled={finished} />
        {fb && <FeedbackBox fb={fb} />}
        <LiveRegion message={fb?.message ?? null} />
        {revealedValue && (
          <p className="step-reveal">
            Wynik kroku: <MathText text={revealedValue} />
          </p>
        )}
        <div className="actions">
          {!finished ? (
            <>
              <Button variant="primary" icon="check" onClick={input.trim() ? check : () => setFb({ kind: 'info', message: 'Najpierw wpisz wynik tego kroku.' })}>
                Sprawdź krok
              </Button>
              {step.hint && fails === 0 && fb?.kind !== 'wrong' && (
                <Button variant="ghost" icon="bulb" onClick={() => setFb({ kind: 'info', message: step.hint! })}>
                  Podpowiedź
                </Button>
              )}
            </>
          ) : (
            <Button variant="primary" icon="next" onClick={advance}>
              {idx + 1 >= steps.length ? 'Zakończ' : 'Następny krok'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

const FEEDBACK_PREFIX = { correct: '✓', wrong: '✗', info: 'ℹ' } as const;

/** Widoczny komunikat (kolor + symbol, nie sam kolor). Czytnik ekranu dostaje go przez LiveRegion. */
function FeedbackBox({ fb }: { fb: NonNullable<Feedback> }) {
  return (
    <div className={`feedback feedback-${fb.kind}`}>
      <span className="feedback-icon" aria-hidden="true">
        {FEEDBACK_PREFIX[fb.kind]}
      </span>
      <MathText text={fb.message} />
    </div>
  );
}

/**
 * Stały, pusty na starcie region „status” – czytniki ekranu niezawodnie ogłaszają
 * zmiany tekstu w regionie, który już istniał. Ułamki czytamy po polsku („dwie trzecie”).
 */
export function LiveRegion({ message }: { message: string | null }) {
  return (
    <div className="sr-only" role="status">
      {message ? toSpoken(message) : ''}
    </div>
  );
}

function Timer({ mode, seconds, running }: { mode: 'stopwatch' | 'countdown'; seconds: number; running: boolean }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!running) return;
    const iv = window.setInterval(() => setT((x) => x + 1), 1000);
    return () => window.clearInterval(iv);
  }, [running]);
  const shown = mode === 'countdown' ? Math.max(0, seconds - t) : t;
  const over = mode === 'countdown' && t >= seconds;
  const mm = Math.floor(shown / 60);
  const ss = String(shown % 60).padStart(2, '0');
  return (
    <span className={`timer ${over ? 'timer-over' : ''}`} title={over ? 'Czas minął – możesz spokojnie dokończyć' : undefined}>
      <Icon name="clock" size={16} /> {mm}:{ss}
      {over && <span className="timer-note">czas minął – spokojnie dokończ</span>}
    </span>
  );
}

/**
 * Pełny widok zadania w trybie ćwiczeń: odpowiedź, sprawdzanie, podpowiedzi,
 * tryb krok po kroku i rozwiązanie.
 */
export function TaskView({ task, onFinished, onNext, nextLabel = 'Dalej' }: { task: Task; onFinished: (o: TaskOutcome) => void; onNext: () => void; nextLabel?: string }) {
  const { settings } = useApp();
  const [input, setInput] = useState('');
  const [selected, setSelected] = useState<number | null>(null);
  const [disabledChoices, setDisabledChoices] = useState<number[]>([]);
  const [wrongTries, setWrongTries] = useState(0);
  const [hintsShown, setHintsShown] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [done, setDone] = useState<null | { correct: boolean }>(null);
  const [revealed, setRevealed] = useState(false);
  const [stepMode, setStepMode] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const lastMisconception = useRef<string | undefined>(undefined);
  const reportedRef = useRef(false);
  const [ia, setIa] = useState<IAState | null>(() => (isInteractive(task) ? initialIA(task) : null));

  useEffect(() => {
    if (settings.voiceEnabled && settings.autoRead) speak(task.prompt, settings);
  }, [task.id]);

  const say = (fb: Feedback) => {
    setFeedback(fb);
    if (fb && settings.voiceEnabled && settings.readFeedback) speak(fb.message, settings);
  };

  const finish = (correct: boolean, opts: { revealed?: boolean; stepMode?: boolean } = {}) => {
    if (reportedRef.current) return;
    reportedRef.current = true;
    setDone({ correct });
    signal(correct ? 'correct' : 'wrong', settings);
    if (!correct || opts.revealed || settings.showSolutionAfterCorrect || opts.stepMode) setShowSolution(true);
    const score = attemptScore({ correct, hints: hintsShown, extraTries: wrongTries, stepMode: !!opts.stepMode, revealed: !!opts.revealed });
    onFinished({ correct: correct && !opts.revealed, score, hints: hintsShown, misconception: lastMisconception.current, stepMode: !!opts.stepMode });
  };

  const registerWrong = (message: string, misconception?: string) => {
    if (misconception) lastMisconception.current = misconception;
    const tries = wrongTries + 1;
    setWrongTries(tries);
    signal('wrong', settings);
    if (tries >= settings.maxAttempts) {
      say({ kind: 'wrong', message: `${message} Zobacz rozwiązanie poniżej.` });
      finish(false);
    } else {
      say({ kind: 'wrong', message });
    }
  };

  const checkInput = () => {
    if (task.format !== 'input' || done || !input.trim()) return;
    const r = evaluateInput(input, task.answer, task.misconceptions);
    if (r.ok) {
      say({ kind: 'correct', message: r.message });
      finish(true);
    } else if (!r.countsAsTry) say({ kind: 'info', message: r.message });
    else registerWrong(r.message, r.misconception);
  };

  const checkChoice = () => {
    if (task.format !== 'choice' || done || selected === null) return;
    const c = task.choices[selected];
    if (c.correct) {
      say({ kind: 'correct', message: pickPraise() });
      finish(true);
    } else {
      setDisabledChoices((d) => [...d, selected]);
      setSelected(null);
      registerWrong(c.misconception ?? 'To nie jest poprawna odpowiedź. Spróbuj jeszcze raz.', c.misconception);
    }
  };

  const checkIA = () => {
    if (!isInteractive(task) || !ia || done) return;
    const { verdict, next } = checkInteractive(task, ia);
    setIa(next);
    if (verdict.ok) {
      say({ kind: 'correct', message: pickPraise() });
      finish(true);
    } else if (!verdict.countsAsTry) say({ kind: 'info', message: verdict.message });
    else registerWrong(verdict.message, verdict.misconception);
  };

  const runCheck = task.format === 'input' ? checkInput : task.format === 'choice' ? checkChoice : checkIA;
  const canCheck =
    task.format === 'input' ? !!input.trim() : task.format === 'choice' ? selected !== null : isInteractive(task) && !!ia && hasAnswer(task, ia);

  /** Sprawdzanie przy kliknięciu: zamiast wyłączonego przycisku mówimy, czego brakuje. */
  const onCheck = () => {
    if (canCheck) return runCheck();
    const message =
      task.format === 'input'
        ? 'Najpierw wpisz odpowiedź w polu powyżej.'
        : task.format === 'choice'
          ? 'Najpierw wybierz jedną z odpowiedzi.'
          : isInteractive(task) && ia
            ? checkInteractive(task, ia).verdict.message || 'Najpierw dokończ zadanie.'
            : 'Najpierw dokończ zadanie.';
    say({ kind: 'info', message });
  };

  const hintsAvailable = settings.hintsMode === 'always' || (settings.hintsMode === 'afterError' && wrongTries > 0);
  const canStepMode = task.format === 'input' && !!task.steps?.length && settings.stepModeAvailable && !done;

  if (stepMode && task.format === 'input' && !done) {
    return (
      <div className="task">
        <TaskPrompt task={task} />
        <StepMode
          task={task}
          onDone={() => {
            say({ kind: 'correct', message: 'Gotowe! Zadanie rozwiązane krok po kroku.' });
            finish(true, { stepMode: true });
          }}
        />
        <div className="actions">
          <Button variant="quiet" onClick={() => setStepMode(false)}>
            Wróć do zwykłego trybu
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="task">
      <div className="task-meta">
        <span className="muted">Poziom {'●'.repeat(task.difficulty)}{'○'.repeat(3 - task.difficulty)}</span>
        {settings.timerMode !== 'off' && <Timer key={task.id} mode={settings.timerMode} seconds={settings.taskSeconds} running={!done} />}
      </div>
      <TaskPrompt task={task} />

      {task.format === 'input' && (
        <AnswerInput value={input} onChange={setInput} onSubmit={done ? onNext : checkInput} spec={task.answer} disabled={!!done} />
      )}

      {task.format === 'choice' && (
        <div className="choices" role="radiogroup" aria-label="Odpowiedzi">
          {task.choices.map((c, i) => {
            const isDisabled = disabledChoices.includes(i);
            const isCorrectShown = !!done && c.correct;
            return (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={selected === i}
                disabled={!!done || isDisabled}
                className={`choice ${selected === i ? 'is-selected' : ''} ${isDisabled ? 'is-wrong' : ''} ${isCorrectShown ? 'is-correct' : ''}`}
                onClick={() => setSelected(i)}
              >
                <span className="choice-letter">{LETTERS[i]}</span>
                <MathText text={c.text} />
              </button>
            );
          })}
        </div>
      )}

      {isInteractive(task) && ia && (
        <div className="interactive-area">
          <InteractiveAnswer task={task} state={ia} onChange={setIa} disabled={!!done} reveal={!!done && !done.correct} />
        </div>
      )}

      {feedback && <FeedbackBox fb={feedback} />}
      <LiveRegion message={feedback?.message ?? null} />

      {hintsAvailable && !done && hintsShown > 0 && (
        <div className="hints">
          {task.hints.slice(0, hintsShown).map((h, i) => (
            <div key={i} className="hint">
              <Icon name="bulb" size={16} />
              <MathText text={h} />
              <SpeakButton text={h} />
            </div>
          ))}
        </div>
      )}

      <div className="actions">
        {!done ? (
          <>
            <Button
              variant="primary"
              icon="check"
              onClick={onCheck}
              title={canCheck ? undefined : 'Najpierw podaj odpowiedź'}
              disabled={!!done}
            >
              Sprawdź
            </Button>
            {hintsAvailable && hintsShown < task.hints.length && (
              <Button variant="ghost" icon="bulb" onClick={() => setHintsShown((h) => h + 1)}>
                {hintsShown === 0 ? 'Podpowiedź' : 'Kolejna podpowiedź'}
              </Button>
            )}
            {canStepMode && (
              <Button variant="ghost" icon="steps" onClick={() => setStepMode(true)}>
                Krok po kroku
              </Button>
            )}
            <Button
              variant="quiet"
              icon="eye"
              onClick={() => {
                setRevealed(true);
                say({ kind: 'info', message: 'Przyjrzyj się rozwiązaniu – podobne zadanie pojawi się jeszcze w ćwiczeniach.' });
                finish(false, { revealed: true });
              }}
            >
              Pokaż rozwiązanie
            </Button>
          </>
        ) : (
          <>
            <Button variant="primary" icon="next" onClick={onNext}>
              {nextLabel}
            </Button>
            {!showSolution && (
              <Button variant="ghost" icon="eye" onClick={() => setShowSolution(true)}>
                Zobacz rozwiązanie
              </Button>
            )}
          </>
        )}
      </div>

      {done && showSolution && <Solution task={task} detail={revealed || !done.correct ? 'full' : settings.solutionDetail} />}
    </div>
  );
}
