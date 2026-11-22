import { useMemo, useRef, useState } from 'react';
import { TOPIC_BY_ID, TOPICS } from '../content/topics';
import { generateTask } from '../content/tasks';
import type { Task, TopicId } from '../content/types';
import { TaskView, type TaskOutcome } from '../components/TaskView';
import { Button, Card, MasteryBar, StatusChip } from '../components/ui';
import { defaultRng, weightedPick } from '../lib/random';
import { href } from '../router';
import { useApp, useStudyTimer } from '../state/AppState';
import { autoDifficulty, topicStats, type Progress } from '../state/progress';

type Mode = { kind: 'topic'; topic: TopicId } | { kind: 'mix' } | { kind: 'review' };

function modeFrom(id: string): Mode {
  if (id === 'mix') return { kind: 'mix' };
  if (id === 'powtorka') return { kind: 'review' };
  if (id in TOPIC_BY_ID) return { kind: 'topic', topic: id as TopicId };
  return { kind: 'mix' };
}

function pickTopic(mode: Mode, p: Progress): TopicId {
  if (mode.kind === 'topic') return mode.topic;
  const stats = TOPICS.map((t) => ({ id: t.id, s: topicStats(p, t.id) }));
  let pool = stats;
  if (mode.kind === 'review') {
    const weak = stats.filter((x) => x.s.status === 'review' || x.s.status === 'learning' || x.s.dueForReview);
    if (weak.length) pool = weak;
  }
  return weightedPick(defaultRng, pool, (x) => (x.s.status === 'new' ? 0.6 : 1.2 - x.s.mastery + (x.s.dueForReview ? 0.5 : 0))).id;
}

export function Practice({ id }: { id: string }) {
  const { progress, settings, recordAttempt } = useApp();
  useStudyTimer(true);
  const mode = useMemo(() => modeFrom(id), [id]);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  const startStats = useRef(Object.fromEntries(TOPICS.map((t) => [t.id, topicStats(progress, t.id).mastery])) as Record<TopicId, number>);
  const seenPrompts = useRef(new Set<string>());

  const makeTask = (): Task => {
    const p = progressRef.current;
    let t: Task | null = null;
    for (let i = 0; i < 8; i++) {
      const topic = pickTopic(mode, p);
      const diff = settings.difficulty === 'auto' ? autoDifficulty(topicStats(p, topic)) : settings.difficulty;
      t = generateTask(topic, diff, defaultRng);
      if (!seenPrompts.current.has(t.prompt)) break;
    }
    seenPrompts.current.add(t!.prompt);
    return t!;
  };

  const [task, setTask] = useState<Task>(() => makeTask());
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<{ topicId: TopicId; correct: boolean; misconception?: string }[]>([]);
  const [finished, setFinished] = useState(false);
  const total = settings.sessionLength;

  const onFinished = (o: TaskOutcome) => {
    recordAttempt({
      topicId: task.topicId,
      difficulty: task.difficulty,
      correct: o.correct,
      score: o.score,
      hints: o.hints,
      source: 'practice',
      misconception: o.misconception,
    });
    setResults((r) => [...r, { topicId: task.topicId as TopicId, correct: o.correct, misconception: o.misconception }]);
  };

  const onNext = () => {
    if (index + 1 >= total) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setTask(makeTask());
  };

  const restart = () => {
    startStats.current = Object.fromEntries(TOPICS.map((t) => [t.id, topicStats(progress, t.id).mastery])) as Record<TopicId, number>;
    setResults([]);
    setIndex(0);
    setFinished(false);
    setTask(makeTask());
  };

  const title = mode.kind === 'topic' ? TOPIC_BY_ID[mode.topic].title : mode.kind === 'mix' ? 'Ćwiczenia mieszane' : 'Powtórka';

  if (finished) {
    const correct = results.filter((r) => r.correct).length;
    const touched = [...new Set(results.map((r) => r.topicId))];
    const mistakes = [...new Set(results.map((r) => r.misconception).filter(Boolean))] as string[];
    return (
      <div className="page">
        <header className="page-head">
          <p className="eyebrow">{title}</p>
          <h1>Koniec sesji</h1>
          <p className="lead">
            Poprawne odpowiedzi: <strong>{correct}</strong> z {results.length}.{' '}
            {correct === results.length ? 'Znakomicie!' : correct >= results.length * 0.7 ? 'Dobra robota.' : 'Każde zadanie to krok do przodu.'}
          </p>
        </header>
        <Card>
          <h2>Jak zmienił się Twój poziom</h2>
          <div className="summary-list">
            {touched.map((t) => {
              const s = topicStats(progress, t);
              const before = Math.round(startStats.current[t] * 100);
              const after = Math.round(s.mastery * 100);
              return (
                <div key={t} className="summary-row">
                  <div className="summary-title">
                    <strong>{TOPIC_BY_ID[t].title}</strong>
                    <StatusChip stats={s} />
                  </div>
                  <MasteryBar stats={s} />
                  <span className={`delta ${after >= before ? 'up' : 'down'}`}>
                    {after >= before ? '+' : ''}
                    {after - before} pkt
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
        {mistakes.length > 0 && (
          <Card>
            <h2>Na co uważać</h2>
            <p className="muted">Te typowe błędy pojawiły się w tej sesji:</p>
            <ul className="theory-list">
              {mistakes.map((m) => (
                <li key={m}>{m.replace(/\*\*/g, '')}</li>
              ))}
            </ul>
          </Card>
        )}
        <div className="actions">
          <Button variant="primary" icon="refresh" onClick={restart}>
            Kolejna sesja
          </Button>
          {mode.kind === 'topic' && (
            <Button href={href.topic(mode.topic)} icon="book">
              Wróć do teorii
            </Button>
          )}
          <Button href={href.progress} icon="chart" variant="ghost">
            Postępy
          </Button>
        </div>
      </div>
    );
  }

  const topicStat = topicStats(progress, task.topicId);
  return (
    <div className="page practice">
      <div className="practice-head">
        <a className="back-link" href={mode.kind === 'topic' ? href.topic(mode.topic) : href.home}>
          ← {mode.kind === 'topic' ? 'Teoria' : 'Start'}
        </a>
        <div className="practice-title">
          <h1>{title}</h1>
          {mode.kind !== 'topic' && <span className="muted">Dział: {TOPIC_BY_ID[task.topicId as TopicId].title}</span>}
        </div>
        <div className="session-progress" aria-label={`Zadanie ${index + 1} z ${total}`}>
          <div className="session-track">
            <div className="session-fill" style={{ width: `${(index / total) * 100}%` }} />
          </div>
          <span className="muted">
            {index + 1} / {total}
          </span>
        </div>
      </div>
      <Card className="task-card">
        <TaskView key={task.id} task={task} onFinished={onFinished} onNext={onNext} nextLabel={index + 1 >= total ? 'Zakończ sesję' : 'Następne zadanie'} />
      </Card>
      <div className="practice-foot">
        <span className="muted">Poziom opanowania działu:</span>
        <MasteryBar stats={topicStat} />
        <Button variant="quiet" onClick={() => setFinished(true)} disabled={results.length === 0}>
          Zakończ wcześniej
        </Button>
      </div>
    </div>
  );
}
