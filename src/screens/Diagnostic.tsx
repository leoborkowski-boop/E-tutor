import { useState } from 'react';
import { buildDiagnostic } from '../content/tasks';
import { TOPICS } from '../content/topics';
import type { Task } from '../content/types';
import { AnswerInput } from '../components/AnswerInput';
import { MathText } from '../components/MathText';
import { TaskPrompt, evaluateInput } from '../components/TaskView';
import { InteractiveAnswer, checkInteractive, hasAnswer, initialIA, isInteractive, type IAState } from '../components/interactive/InteractiveAnswer';
import { Button, Card, MasteryBar, StatusChip } from '../components/ui';
import { defaultRng } from '../lib/random';
import { href } from '../router';
import { useApp, useStudyTimer } from '../state/AppState';
import { topicStats } from '../state/progress';

const LETTERS = ['A', 'B', 'C', 'D'];

export function Diagnostic() {
  const { progress, recordAttempts, completeDiagnostic } = useApp();
  const [phase, setPhase] = useState<'intro' | 'running' | 'done'>('intro');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [i, setI] = useState(0);
  const [input, setInput] = useState('');
  const [choice, setChoice] = useState<number | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [ia, setIa] = useState<IAState | null>(null);
  useStudyTimer(phase === 'running');

  const prepare = (t: Task | undefined) => setIa(t && isInteractive(t) ? initialIA(t) : null);

  const start = () => {
    const list = buildDiagnostic(defaultRng);
    setTasks(list);
    prepare(list[0]);
    setI(0);
    setResults([]);
    setPhase('running');
  };

  const answer = (correct: boolean) => {
    const res = [...results, correct];
    setResults(res);
    setInput('');
    setChoice(null);
    setHint(null);
    if (i + 1 >= tasks.length) {
      recordAttempts(tasks.map((t, k) => ({ topicId: t.topicId, difficulty: t.difficulty, correct: res[k], score: res[k] ? 1 : 0, hints: 0, source: 'diagnostic' as const })));
      completeDiagnostic();
      setPhase('done');
    } else {
      setI(i + 1);
      prepare(tasks[i + 1]);
    }
  };

  const submit = () => {
    const t = tasks[i];
    if (t.format === 'input') {
      if (!input.trim()) return;
      const r = evaluateInput(input, t.answer, t.misconceptions);
      // Komunikaty o formie (np. „skróć ułamek”) pokazujemy, ale nie liczymy jako błąd
      if (!r.ok && !r.countsAsTry) {
        setHint(r.message);
        return;
      }
      answer(r.ok);
    } else if (t.format === 'choice') {
      if (choice === null) return;
      answer(t.choices[choice].correct);
    } else if (isInteractive(t) && ia) {
      const { verdict } = checkInteractive(t, ia);
      if (!verdict.ok && !verdict.countsAsTry) {
        setHint(verdict.message);
        return;
      }
      answer(verdict.ok);
    }
  };

  if (phase === 'intro') {
    return (
      <div className="page">
        <header className="page-head">
          <h1>Test diagnostyczny</h1>
          <p className="lead">Sprawdźmy, od czego zacząć.</p>
        </header>
        <Card>
          <ul className="theory-list">
            <li>18 krótkich zadań – po 2 z każdego działu.</li>
            <li>Zajmie około 10 minut. Nie ma limitu czasu.</li>
            <li>W trakcie nie pokazujemy, czy odpowiedź jest dobra – to nie sprawdzian, tylko punkt startowy.</li>
            <li>
              Jeśli nie wiesz – wybierz <strong>„Nie wiem”</strong>. To w porządku i pomoże dobrać materiał.
            </li>
          </ul>
          <div className="actions">
            <Button variant="primary" icon="play" onClick={start}>
              {progress.diagnosticDone ? 'Rozwiąż ponownie' : 'Zaczynamy'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (phase === 'done') {
    const correct = results.filter(Boolean).length;
    return (
      <div className="page">
        <header className="page-head">
          <h1>Twój punkt startowy</h1>
          <p className="lead">
            Poprawnie: {correct} z {results.length}. Na tej podstawie ustawiliśmy poziom trudności w każdym dziale.
          </p>
        </header>
        <Card>
          <div className="summary-list">
            {TOPICS.map((t) => {
              const s = topicStats(progress, t.id);
              return (
                <a key={t.id} className="summary-row link-row" href={href.topic(t.id)}>
                  <div className="summary-title">
                    <strong>{t.title}</strong>
                    <StatusChip stats={s} />
                  </div>
                  <MasteryBar stats={s} />
                </a>
              );
            })}
          </div>
        </Card>
        <div className="actions">
          <Button variant="primary" href={href.home} icon="home">
            Zobacz, co dalej
          </Button>
        </div>
      </div>
    );
  }

  const t = tasks[i];
  return (
    <div className="page practice">
      <div className="practice-head">
        <div className="practice-title">
          <h1>Test diagnostyczny</h1>
        </div>
        <div className="session-progress">
          <div className="session-track">
            <div className="session-fill" style={{ width: `${(i / tasks.length) * 100}%` }} />
          </div>
          <span className="muted">
            {i + 1} / {tasks.length}
          </span>
        </div>
      </div>
      <Card className="task-card">
        <TaskPrompt task={t} />
        {t.format === 'input' && <AnswerInput key={t.id} value={input} onChange={setInput} onSubmit={submit} spec={t.answer} />}
        {t.format === 'choice' && (
          <div className="choices" role="radiogroup">
            {t.choices.map((c, k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={choice === k}
                className={`choice ${choice === k ? 'is-selected' : ''}`}
                onClick={() => setChoice(k)}
              >
                <span className="choice-letter">{LETTERS[k]}</span>
                <MathText text={c.text} />
              </button>
            ))}
          </div>
        )}
        {isInteractive(t) && ia && (
          <div className="interactive-area">
            <InteractiveAnswer task={t} state={ia} onChange={setIa} />
          </div>
        )}
        {hint && (
          <div className="feedback feedback-info">
            <MathText text={hint} />
          </div>
        )}
        <div className="actions">
          <Button variant="primary" icon="next" onClick={submit} disabled={t.format === 'input' ? !input.trim() : t.format === 'choice' ? choice === null : !(isInteractive(t) && ia && hasAnswer(t, ia))}>
            Dalej
          </Button>
          <Button variant="ghost" onClick={() => answer(false)}>
            Nie wiem
          </Button>
        </div>
      </Card>
    </div>
  );
}
