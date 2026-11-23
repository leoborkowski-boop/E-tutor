import { useEffect, useMemo, useState } from 'react';
import { buildExam, type ExamItem } from '../content/tasks';
import { TOPIC_BY_ID } from '../content/topics';
import type { TopicId } from '../content/types';
import { AnswerInput } from '../components/AnswerInput';
import { MathText } from '../components/MathText';
import { Solution, TaskPrompt } from '../components/TaskView';
import { Button, Card, Icon, Segmented } from '../components/ui';
import { checkFractionAnswer } from '../lib/parse';
import { defaultRng } from '../lib/random';
import { href } from '../router';
import { useApp, useStudyTimer } from '../state/AppState';

type Answer = { choice?: number; tf?: (boolean | null)[]; text?: string; notes?: string };

function scoreItem(item: ExamItem, a: Answer | undefined): number {
  const t = item.task;
  if (!a) return 0;
  if (t.format === 'choice') return a.choice !== undefined && t.choices[a.choice]?.correct ? item.points : 0;
  if (t.format === 'truefalse') return a.tf && t.statements.every((s, i) => a.tf![i] === s.isTrue) ? item.points : 0;
  if (t.format !== 'input' || !a.text?.trim()) return 0;
  return checkFractionAnswer(a.text, t.answer.value).status === 'correct' ? item.points : 0;
}

function isAnswered(item: ExamItem, a: Answer | undefined) {
  if (!a) return false;
  if (item.task.format === 'choice') return a.choice !== undefined;
  if (item.task.format === 'truefalse') return !!a.tf && a.tf.every((x) => x !== null);
  return !!a.text?.trim();
}

function fmtTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

const LETTERS = ['A', 'B', 'C', 'D'];

export function Exam() {
  const { settings, updateSettings, recordAttempts, addExam, progress } = useApp();
  const [phase, setPhase] = useState<'intro' | 'running' | 'results'>('intro');
  const [items, setItems] = useState<ExamItem[]>([]);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [current, setCurrent] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [confirmEnd, setConfirmEnd] = useState(false);
  useStudyTimer(phase === 'running');

  const limit = settings.examMinutes * 60;
  const maxPoints = useMemo(() => items.reduce((s, i) => s + i.points, 0), [items]);

  useEffect(() => {
    if (phase !== 'running') return;
    const iv = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(iv);
  }, [phase]);

  useEffect(() => {
    if (phase === 'running' && limit > 0 && elapsed >= limit) submit();
  }, [elapsed]);

  const start = () => {
    setItems(buildExam(defaultRng));
    setAnswers({});
    setCurrent(0);
    setElapsed(0);
    setConfirmEnd(false);
    setPhase('running');
  };

  const submit = () => {
    const pts = items.reduce((s, it, i) => s + scoreItem(it, answers[i]), 0);
    recordAttempts(
      items.map((it, i) => {
        const sc = scoreItem(it, answers[i]);
        return { topicId: it.task.topicId, difficulty: it.task.difficulty, correct: sc === it.points, score: sc / it.points, hints: 0, source: 'exam' as const };
      }),
    );
    addExam({ ts: Date.now(), points: pts, max: maxPoints, minutes: Math.round(elapsed / 60) });
    setPhase('results');
    window.scrollTo({ top: 0 });
  };

  const setAnswer = (i: number, patch: Answer) => setAnswers((a) => ({ ...a, [i]: { ...a[i], ...patch } }));

  if (phase === 'intro') {
    const last = progress.exams[progress.exams.length - 1];
    return (
      <div className="page">
        <header className="page-head">
          <h1>Próbny arkusz</h1>
          <p className="lead">Zadania z ułamków w stylu egzaminu ósmoklasisty.</p>
        </header>
        <Card>
          <h2>Jak wygląda arkusz</h2>
          <ul className="theory-list">
            <li>
              <strong>12 zadań zamkniętych</strong> – wybór jednej odpowiedzi (A–D) i zadania „prawda/fałsz”, po 1 punkcie.
            </li>
            <li>
              <strong>3 zadania otwarte</strong> – zadania tekstowe za 2–3 punkty. Wpisz wynik końcowy; obliczenia możesz zapisać w notatkach.
            </li>
            <li>Podczas arkusza nie ma podpowiedzi. Rozwiązania i wyjaśnienia zobaczysz po zakończeniu.</li>
            <li>Możesz przechodzić między zadaniami i wracać do nich.</li>
          </ul>
          <p className="muted small">
            Na prawdziwym egzaminie za zadania otwarte można dostać część punktów za poprawną metodę. W tym prototypie punktujemy wynik końcowy.
          </p>
          <div className="setting-inline">
            <span>Czas na arkusz:</span>
            <Segmented
              label="Czas na arkusz"
              value={settings.examMinutes}
              onChange={(v) => updateSettings({ examMinutes: v })}
              options={[
                { value: 30, label: '30 min' },
                { value: 45, label: '45 min' },
                { value: 60, label: '60 min' },
                { value: 0, label: 'bez limitu' },
              ]}
            />
          </div>
          <div className="actions">
            <Button variant="primary" icon="play" onClick={start}>
              Rozpocznij arkusz
            </Button>
          </div>
          {last && (
            <p className="muted small">
              Ostatni wynik: {last.points}/{last.max} pkt ({Math.round((last.points / last.max) * 100)}%), {new Date(last.ts).toLocaleDateString('pl-PL')}.
            </p>
          )}
        </Card>
      </div>
    );
  }

  if (phase === 'results') {
    const pts = items.reduce((s, it, i) => s + scoreItem(it, answers[i]), 0);
    const pct = Math.round((pts / maxPoints) * 100);
    const byTopic = new Map<TopicId, { got: number; max: number }>();
    items.forEach((it, i) => {
      const e = byTopic.get(it.task.topicId) ?? { got: 0, max: 0 };
      e.got += scoreItem(it, answers[i]);
      e.max += it.points;
      byTopic.set(it.task.topicId, e);
    });
    const weak = [...byTopic.entries()].filter(([, v]) => v.got / v.max < 0.6);
    return (
      <div className="page">
        <header className="page-head">
          <h1>Wynik arkusza</h1>
          <p className="score-big">
            {pts} <span>/ {maxPoints} pkt</span>
          </p>
          <p className="lead">
            {pct}% · czas: {fmtTime(elapsed)}.{' '}
            {pct >= 80 ? 'Bardzo dobry wynik!' : pct >= 50 ? 'Solidna podstawa – popracuj nad słabszymi działami.' : 'Dobrze, że już wiesz, co powtórzyć.'}
          </p>
        </header>
        <Card>
          <h2>Wynik w działach</h2>
          <div className="summary-list">
            {[...byTopic.entries()].map(([t, v]) => (
              <div key={t} className="summary-row">
                <strong>{TOPIC_BY_ID[t].title}</strong>
                <span className={v.got / v.max < 0.6 ? 'text-warn' : 'text-ok'}>
                  {v.got}/{v.max} pkt
                </span>
              </div>
            ))}
          </div>
          {weak.length > 0 && (
            <div className="actions">
              {weak.map(([t]) => (
                <Button key={t} href={href.topic(t)} icon="book" variant="secondary">
                  Powtórz: {TOPIC_BY_ID[t].title}
                </Button>
              ))}
            </div>
          )}
        </Card>
        <h2>Przegląd zadań</h2>
        {items.map((it, i) => {
          const got = scoreItem(it, answers[i]);
          const a = answers[i];
          const t = it.task;
          return (
            <Card key={i} className={`review-item ${got === it.points ? 'ok' : 'bad'}`}>
              <div className="review-head">
                <span className="task-number">Zadanie {i + 1}</span>
                <span className={got === it.points ? 'text-ok' : 'text-warn'}>
                  {got}/{it.points} pkt
                </span>
              </div>
              <TaskPrompt task={t} />
              <p className="muted">
                Twoja odpowiedź:{' '}
                {!isAnswered(it, a) ? (
                  'brak'
                ) : t.format === 'choice' ? (
                  <>
                    {LETTERS[a!.choice!]}. <MathText text={t.choices[a!.choice!].text} />
                  </>
                ) : t.format === 'truefalse' ? (
                  a!.tf!.map((x) => (x ? 'P' : 'F')).join(', ')
                ) : (
                  a!.text
                )}
              </p>
              {t.format === 'choice' && a?.choice !== undefined && !t.choices[a.choice].correct && t.choices[a.choice].misconception && (
                <div className="feedback feedback-info">
                  <MathText text={t.choices[a.choice].misconception!} />
                </div>
              )}
              <details>
                <summary>Rozwiązanie</summary>
                <Solution task={t} detail="full" />
              </details>
            </Card>
          );
        })}
        <div className="actions">
          <Button variant="primary" icon="refresh" onClick={start}>
            Nowy arkusz
          </Button>
          <Button href={href.progress} icon="chart">
            Postępy
          </Button>
        </div>
      </div>
    );
  }

  const item = items[current];
  const t = item.task;
  const a = answers[current];
  const remaining = limit > 0 ? limit - elapsed : null;
  const unanswered = items.filter((it, i) => !isAnswered(it, answers[i])).length;

  return (
    <div className="page exam">
      <div className="exam-bar">
        <div className="exam-nav" role="tablist" aria-label="Zadania">
          {items.map((it, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === current}
              className={`exam-pill ${i === current ? 'is-current' : ''} ${isAnswered(it, answers[i]) ? 'is-answered' : ''}`}
              aria-label={`Zadanie ${i + 1}${isAnswered(it, answers[i]) ? ', odpowiedziano' : ', bez odpowiedzi'}`}
              onClick={() => setCurrent(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <span className={`timer ${remaining !== null && remaining < 300 ? 'timer-over' : ''}`}>
          <Icon name="clock" size={16} /> {remaining !== null ? fmtTime(Math.max(0, remaining)) : fmtTime(elapsed)}
        </span>
      </div>
      <p className="exam-legend" aria-hidden="true">
        <span>• pod numerem – zadanie z odpowiedzią</span>
        <span>obramowanie – bieżące zadanie</span>
      </p>
      {remaining !== null && remaining < 300 && remaining > 0 && <p className="muted small center">Zostało mniej niż 5 minut – sprawdź swoje odpowiedzi.</p>}

      <Card className="task-card">
        <div className="task-meta">
          <span className="muted">
            Zadanie {current + 1} z {items.length} · {item.points} pkt · {item.kind === 'open' ? 'otwarte' : 'zamknięte'}
          </span>
        </div>
        <TaskPrompt task={t} />

        {t.format === 'choice' && (
          <div className="choices" role="radiogroup">
            {t.choices.map((c, i) => (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={a?.choice === i}
                className={`choice ${a?.choice === i ? 'is-selected' : ''}`}
                onClick={() => setAnswer(current, { choice: i })}
              >
                <span className="choice-letter">{LETTERS[i]}</span>
                <MathText text={c.text} />
              </button>
            ))}
          </div>
        )}

        {t.format === 'truefalse' && (
          <div className="tf">
            {t.statements.map((s, i) => (
              <div className="tf-row" key={i}>
                <MathText text={s.text} />
                <div className="tf-buttons">
                  {[true, false].map((v) => (
                    <button
                      key={String(v)}
                      type="button"
                      className={`tf-btn ${a?.tf?.[i] === v ? 'is-selected' : ''}`}
                      aria-pressed={a?.tf?.[i] === v}
                      onClick={() => {
                        const tf = [...(a?.tf ?? t.statements.map(() => null))];
                        tf[i] = v;
                        setAnswer(current, { tf });
                      }}
                    >
                      {v ? 'P' : 'F'}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {t.format === 'input' && (
          <>
            <label className="notes">
              <span className="muted small">Obliczenia (notatki, nie są oceniane)</span>
              <textarea rows={3} value={a?.notes ?? ''} onChange={(e) => setAnswer(current, { notes: e.target.value })} />
            </label>
            <AnswerInput key={current} value={a?.text ?? ''} onChange={(v) => setAnswer(current, { text: v })} spec={t.answer} label="Odpowiedź" autoFocus={false} />
          </>
        )}

        <div className="actions spread">
          <Button variant="ghost" icon="back" onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0}>
            Poprzednie
          </Button>
          {current < items.length - 1 ? (
            <Button variant="primary" icon="next" onClick={() => setCurrent((c) => c + 1)}>
              Następne
            </Button>
          ) : (
            <Button variant="primary" icon="check" onClick={() => setConfirmEnd(true)}>
              Zakończ arkusz
            </Button>
          )}
        </div>
      </Card>

      <div className="center">
        {!confirmEnd ? (
          <Button variant="quiet" onClick={() => setConfirmEnd(true)}>
            Zakończ i sprawdź
          </Button>
        ) : (
          <Card className="confirm">
            <p>{unanswered > 0 ? `Bez odpowiedzi: ${unanswered} ${unanswered === 1 ? 'zadanie' : unanswered < 5 ? 'zadania' : 'zadań'}. Na pewno zakończyć?` : 'Zakończyć i sprawdzić arkusz?'}</p>
            <div className="actions">
              <Button variant="primary" onClick={submit}>
                Tak, sprawdź
              </Button>
              <Button variant="ghost" onClick={() => setConfirmEnd(false)}>
                Wróć do arkusza
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
