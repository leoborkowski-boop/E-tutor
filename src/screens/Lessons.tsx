import { useMemo, useRef, useState } from 'react';
import { ALL_LESSONS, LESSONS_BY_ZONE, LESSON_BY_ID, SKILL_BY_ID, ZONES, ZONE_BY_ID, firstOpenLesson, nextLesson } from '../content/curriculum';
import { LESSON_KINDS, starsFor, type Lesson } from '../content/curriculum/model';
import { toChoice } from '../content/tasks';
import type { Task, TheoryBlock } from '../content/types';
import { TaskView, type TaskOutcome } from '../components/TaskView';
import { Button, Card, Icon, SpeakButton } from '../components/ui';
import { defaultRng } from '../lib/random';
import { href } from '../router';
import { useApp, useStudyTimer } from '../state/AppState';
import { Block, blockSpeech } from './Theory';
import { neuralSupported, useNeuralState } from '../lib/neuralVoice';
import { FractionVisual } from '../components/FractionVisual';

/* ---------------- Gwiazdki ---------------- */

export function Stars({ n, of = 3, size = 16 }: { n: number; of?: number; size?: number }) {
  return (
    <span className="stars" aria-label={`${n} z ${of} gwiazdek`}>
      {Array.from({ length: of }, (_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" className={i < n ? 'star on' : 'star'} aria-hidden="true">
          <path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2 6.3 20.3l1.2-6.4L2.8 9.5l6.4-.8z" />
        </svg>
      ))}
    </span>
  );
}

function zoneDone(zoneId: string, done: Record<string, { stars: number }>) {
  const list = LESSONS_BY_ZONE[zoneId] ?? [];
  const finished = list.filter((l) => (done[l.id]?.stars ?? 0) > 0).length;
  const stars = list.reduce((s, l) => s + (done[l.id]?.stars ?? 0), 0);
  return { finished, total: list.length, stars };
}

/* ---------------- Lista działów ---------------- */

export function ZonesScreen() {
  const { progress, settings } = useApp();
  const neural = useNeuralState();
  const done = progress.lessons ?? {};
  const voiceMissing = neuralSupported && settings.voiceEnabled && settings.voiceEngine === 'neural' && !neural.ready.includes(settings.neuralVoice);
  return (
    <div className="page">
      <header className="page-head">
        <h1>Lekcje</h1>
        <p className="lead">
          {ZONES.length} działów egzaminu ósmoklasisty, {ALL_LESSONS.length} lekcji. W każdej lekcji są zadania, które się nie kończą, podpowiedzi i rozwiązania krok po kroku.
        </p>
      </header>

      <a className="ai-entry" href={href.ai}>
        <span className="ai-entry-mark" aria-hidden="true">
          <Icon name="spark" size={22} />
        </span>
        <span>
          <strong>Moja lekcja</strong>
          <span className="muted">Napisz, czego nie rozumiesz, a tutor przygotuje lekcję specjalnie dla Ciebie.</span>
        </span>
        <Icon name="next" />
      </a>

      {voiceMissing && (
        <a className="voice-banner" href={href.settings}>
          <Icon name="speaker" size={20} />
          <span>
            <strong>Naturalny głos lektora.</strong> <span className="muted">Pobierz raz (ok. 60 MB), a teoria i zadania będą czytane głosem, który brzmi jak prawdziwy nauczyciel.</span>
          </span>
          <Icon name="next" />
        </a>
      )}

      <div className="zone-grid">
        {ZONES.map((z) => {
          const d = zoneDone(z.id, done);
          const next = firstOpenLesson(z.id, done);
          return (
            <Card key={z.id} className="zone-card">
              <a className="zone-card-link" href={href.zone(z.id)}>
                <span className="zone-mark" aria-hidden="true">
                  {z.mark}
                </span>
                <span className="zone-card-text">
                  <strong>{z.title}</strong>
                  <span className="muted small">{z.short}</span>
                </span>
              </a>
              <div className="zone-progress">
                <div className="zone-track" aria-hidden="true">
                  <div className="zone-fill" style={{ width: `${(d.finished / d.total) * 100}%` }} />
                </div>
                <span className="muted small">
                  {d.finished} / {d.total} lekcji
                </span>
              </div>
              {next && (
                <Button href={href.lesson(next.id)} variant={d.finished ? 'primary' : 'secondary'} icon="play" className="zone-next">
                  {d.finished ? 'Kontynuuj' : 'Zacznij'}: lekcja {next.n}
                </Button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Jeden dział ---------------- */

export function ZoneScreen({ id }: { id: string }) {
  const { progress } = useApp();
  const zone = ZONE_BY_ID[id];
  if (!zone) return <p>Nie znaleziono działu.</p>;
  const done = progress.lessons ?? {};
  const d = zoneDone(zone.id, done);
  const next = firstOpenLesson(zone.id, done);
  const lessons = LESSONS_BY_ZONE[zone.id];
  return (
    <div className="page">
      <a className="back-link" href={href.lessons}>
        ← Wszystkie działy
      </a>
      <header className="page-head zone-head">
        <span className="zone-mark zone-mark-lg" aria-hidden="true">
          {zone.mark}
        </span>
        <div>
          <p className="eyebrow">Dział</p>
          <h1>{zone.title}</h1>
          <p className="lead">{zone.short}</p>
        </div>
      </header>
      <Card className="zone-summary">
        <div>
          <strong>
            {d.finished} z {d.total} lekcji
          </strong>
          <span className="muted"> · {d.stars} gwiazdek</span>
        </div>
        <div className="actions">
          {next && (
            <Button href={href.lesson(next.id)} variant="primary" icon="play">
              {d.finished ? 'Kontynuuj' : 'Zacznij'}: lekcja {next.n}
            </Button>
          )}
          {zone.extraLink && (
            <Button href={zone.extraLink.href} icon="book" variant="ghost">
              {zone.extraLink.label}
            </Button>
          )}
        </div>
      </Card>

      <ol className="skill-list">
        {zone.skills.map((s, si) => (
          <li key={s.id} className="skill-row">
            <div className="skill-title">
              <span className="skill-num">{si + 1}</span>
              <h3>{s.title}</h3>
            </div>
            <div className="lesson-chips">
              {lessons
                .filter((l) => l.skillId === s.id)
                .map((l) => {
                  const st = done[l.id]?.stars ?? 0;
                  const isNext = next?.id === l.id;
                  const k = LESSON_KINDS.find((x) => x.kind === l.kind)!;
                  return (
                    <a key={l.id} href={href.lesson(l.id)} className={`lesson-chip ${st ? 'is-done' : ''} ${isNext ? 'is-next' : ''}`} title={`Lekcja ${l.n}: ${k.about}`}>
                      <span className="lesson-chip-n">{l.n}</span>
                      <span className="lesson-chip-label">{k.label}</span>
                      {st > 0 ? <Stars n={st} size={12} /> : <span className="lesson-chip-about">{k.about}</span>}
                    </a>
                  );
                })}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ---------------- Przebieg lekcji (wspólny dla lekcji z działów i lekcji z AI) ---------------- */

export type RunnerResult = { correct: number; total: number; avg: number; mistakes: string[] };

export function LessonRunner({
  eyebrow,
  title,
  theory,
  example,
  count,
  makeTask,
  skillId,
  backHref,
  backLabel,
  startLabel = 'Zaczynam zadania',
  onComplete,
  summaryExtra,
}: {
  eyebrow: string;
  title: string;
  theory?: TheoryBlock[];
  /** zadanie pokazane jako przykład z rozwiązaniem przed ćwiczeniami */
  example?: Task;
  count: number;
  makeTask: (i: number, seen: Set<string>) => Task;
  skillId: string;
  backHref: string;
  backLabel: string;
  startLabel?: string;
  onComplete: (r: RunnerResult) => void;
  summaryExtra: (r: RunnerResult) => React.ReactNode;
}) {
  const { recordAttempt } = useApp();
  useStudyTimer(true);
  const hasTheory = !!theory?.length || !!example;
  const [phase, setPhase] = useState<'theory' | 'tasks' | 'summary'>(hasTheory ? 'theory' : 'tasks');
  const seen = useRef(new Set<string>());
  const [index, setIndex] = useState(0);
  const [task, setTask] = useState<Task>(() => makeTask(0, seen.current));
  const results = useRef<{ correct: boolean; score: number; misconception?: string }[]>([]);
  const [result, setResult] = useState<RunnerResult | null>(null);

  const onFinished = (o: TaskOutcome) => {
    results.current.push({ correct: o.correct, score: o.score, misconception: o.misconception });
    recordAttempt({ topicId: skillId, difficulty: task.difficulty, correct: o.correct, score: o.score, hints: o.hints, source: 'lesson', misconception: o.misconception });
  };

  const onNext = () => {
    if (index + 1 >= count) {
      const rs = results.current;
      const r: RunnerResult = {
        correct: rs.filter((x) => x.correct).length,
        total: rs.length,
        avg: rs.reduce((s, x) => s + x.score, 0) / Math.max(1, rs.length),
        mistakes: [...new Set(rs.map((x) => x.misconception).filter(Boolean))] as string[],
      };
      setResult(r);
      onComplete(r);
      setPhase('summary');
      window.scrollTo({ top: 0 });
      return;
    }
    setIndex(index + 1);
    setTask(makeTask(index + 1, seen.current));
  };

  if (phase === 'theory') {
    return (
      <div className="page lesson">
        <a className="back-link" href={backHref}>
          ← {backLabel}
        </a>
        <header className="page-head">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
        </header>
        {!!theory?.length && (
          <Card className="theory-card">
            <div className="theory-card-head">
              <h2>Teoria</h2>
              <SpeakButton text={theory.flatMap(blockSpeech)} label="Przeczytaj teorię" />
            </div>
            {theory.map((b, i) => (
              <Block key={i} b={b} />
            ))}
          </Card>
        )}
        {example && (
          <Card className="theory-card">
            <h2>Przykład z rozwiązaniem</h2>
            {example.visual && <FractionVisual visual={example.visual} />}
            <Block b={{ type: 'example', title: 'Zadanie', problem: example.prompt, steps: example.solution, answer: `Odpowiedź: ${example.answerText}` }} />
          </Card>
        )}
        <div className="actions">
          <Button variant="primary" icon="play" onClick={() => setPhase('tasks')}>
            {startLabel}
          </Button>
        </div>
      </div>
    );
  }

  if (phase === 'summary' && result) {
    return (
      <div className="page lesson">
        <header className="page-head">
          <p className="eyebrow">{eyebrow}</p>
          <h1>Koniec lekcji</h1>
          <p className="lead">
            Poprawne odpowiedzi: <strong>{result.correct}</strong> z {result.total}.
          </p>
        </header>
        {summaryExtra(result)}
        {result.mistakes.length > 0 && (
          <Card>
            <h2>Na co uważać</h2>
            <ul className="theory-list">
              {result.mistakes.map((m) => (
                <li key={m}>{m.replace(/\*\*/g, '')}</li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="page practice">
      <div className="practice-head">
        <a className="back-link" href={backHref}>
          ← {backLabel}
        </a>
        <div className="practice-title">
          <h1>{title}</h1>
          <span className="muted">{eyebrow}</span>
        </div>
        <div className="session-progress" aria-label={`Zadanie ${index + 1} z ${count}`}>
          <div className="session-track">
            <div className="session-fill" style={{ width: `${(index / count) * 100}%` }} />
          </div>
          <span className="muted">
            {index + 1} / {count}
          </span>
        </div>
      </div>
      <Card className="task-card">
        <TaskView key={task.id} task={task} onFinished={onFinished} onNext={onNext} nextLabel={index + 1 >= count ? 'Zakończ lekcję' : 'Następne zadanie'} />
      </Card>
    </div>
  );
}

/** Zadanie z umiejętności; czasem w formie A–D, bez powtórzeń treści. */
function lessonTask(lesson: Lesson, i: number, seen: Set<string>): Task {
  const skill = SKILL_BY_ID[lesson.skillId];
  const d = lesson.diffs[i % lesson.diffs.length];
  let t = skill.gen(d, defaultRng);
  for (let k = 0; k < 8 && seen.has(t.prompt); k++) t = skill.gen(d, defaultRng);
  seen.add(t.prompt);
  const choiceChance = lesson.kind === 'poznaj' ? 0.35 : lesson.kind === 'cwicz' ? 0.25 : 0;
  if (t.format === 'input' && defaultRng() < choiceChance) {
    const c = toChoice(t, defaultRng);
    if (c) return c;
  }
  return t;
}

export function LessonScreen({ id }: { id: string }) {
  const { completeLesson, progress } = useApp();
  const lesson = LESSON_BY_ID[id];
  const [round, setRound] = useState(0);
  const example = useMemo(() => (lesson?.kind === 'poznaj' ? SKILL_BY_ID[lesson.skillId].gen(1, defaultRng) : undefined), [id, round]);
  const [stars, setStars] = useState(0);
  if (!lesson) return <p>Nie znaleziono lekcji.</p>;
  const zone = ZONE_BY_ID[lesson.zoneId];
  const skill = SKILL_BY_ID[lesson.skillId];
  const kind = LESSON_KINDS.find((k) => k.kind === lesson.kind)!;
  const next = nextLesson(lesson);
  const prevStars = progress.lessons?.[lesson.id]?.stars ?? 0;

  return (
    <LessonRunner
      key={`${id}-${round}`}
      eyebrow={`${zone.title} · lekcja ${lesson.n} z ${LESSONS_BY_ZONE[zone.id].length}`}
      title={lesson.title}
      theory={lesson.kind === 'poznaj' ? skill.theory : undefined}
      example={example}
      count={lesson.diffs.length}
      makeTask={(i, seen) => lessonTask(lesson, i, seen)}
      skillId={skill.id}
      backHref={href.zone(zone.id)}
      backLabel={zone.title}
      onComplete={(r) => {
        const s = starsFor(lesson.kind, r.avg, r.correct, r.total);
        setStars(s);
        if (s > 0) completeLesson(lesson.id, s);
      }}
      summaryExtra={(r) => (
        <Card className="lesson-result">
          {stars > 0 ? (
            <>
              <Stars n={stars} size={34} />
              <p>
                {stars === 3 ? 'Znakomicie! Lekcja zaliczona na trzy gwiazdki.' : stars === 2 ? 'Dobra robota. Lekcja zaliczona.' : 'Lekcja zaliczona. Powtórz ją, żeby zdobyć więcej gwiazdek.'}
                {prevStars > stars ? ` Twój najlepszy wynik to ${prevStars} gwiazdki.` : ''}
              </p>
            </>
          ) : (
            <p>
              Sprawdzian zalicza {Math.ceil(r.total * 0.8)} dobrych odpowiedzi z {r.total}. Tym razem: {r.correct}. Wróć do lekcji „Ćwicz” i spróbuj ponownie.
            </p>
          )}
          <p className="muted small">{kind.label}: {kind.about}.</p>
          <div className="actions">
            {next && (stars > 0 || lesson.kind !== 'sprawdzian') && (
              <Button href={href.lesson(next.id)} variant="primary" icon="next">
                Następna lekcja
              </Button>
            )}
            <Button
              onClick={() => {
                setStars(0);
                setRound((x) => x + 1);
                window.scrollTo({ top: 0 });
              }}
              icon="refresh"
            >
              Powtórz lekcję
            </Button>
            <Button href={href.zone(zone.id)} variant="ghost" icon="book">
              Wróć do działu
            </Button>
          </div>
        </Card>
      )}
    />
  );
}
