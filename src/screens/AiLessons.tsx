import { useEffect, useRef, useState } from 'react';
import { ZONES } from '../content/curriculum';
import { AI_URL, AiError, loadAiLessons, requestLesson, saveAiLessons, type AiLesson, type AiLevel } from '../lib/ai';
import { Button, Card, Icon, Segmented } from '../components/ui';
import { href, navigate } from '../router';
import { useApp } from '../state/AppState';
import { LessonRunner, Stars } from './Lessons';
import { starsFor } from '../content/curriculum/model';
import { FREE_ZONES, useFullAccess } from '../state/access';

const IDEAS = [
  'Nie rozumiem, jak obliczyć, o ile procent cena wzrosła',
  'Twierdzenie Pitagorasa w zadaniach z drabiną i telewizorem',
  'Równania z ułamkami – krok po kroku',
  'Jak obliczyć objętość graniastosłupa o podstawie trójkąta',
  'Prawdopodobieństwo przy rzucie dwiema kostkami',
];

export function AiLessonsScreen() {
  const { progress } = useApp();
  const full = useFullAccess();
  // bez pełnej wersji lekcje na zamówienie tylko z darmowych działów
  const zones = full ? ZONES : ZONES.filter((z) => FREE_ZONES.includes(z.id));
  const [lessons, setLessons] = useState<AiLesson[]>(() => loadAiLessons());
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState<AiLevel>('sredni');
  const [zone, setZone] = useState('');
  const [interests, setInterests] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim().length < 5) {
      setError('Opisz temat trochę dokładniej, np. „dodawanie ułamków o różnych mianownikach”.');
      return;
    }
    setError('');
    setBusy(true);
    abort.current = new AbortController();
    try {
      const l = await requestLesson({ topic: topic.trim().slice(0, 300), level, zone: (full ? zone : zones[0]?.title) || undefined, interests: interests.trim().slice(0, 100) || undefined }, abort.current.signal);
      const list = [l, ...lessons];
      setLessons(list);
      saveAiLessons(list);
      navigate(href.aiLesson(l.id));
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setError(err instanceof AiError ? err.message : 'Coś poszło nie tak. Spróbuj ponownie.');
    } finally {
      setBusy(false);
    }
  };

  const remove = (id: string) => {
    const list = lessons.filter((l) => l.id !== id);
    setLessons(list);
    saveAiLessons(list);
  };

  return (
    <div className="page">
      <a className="back-link" href={href.lessons}>
        ← Lekcje
      </a>
      <header className="page-head">
        <p className="eyebrow">Lekcja na zamówienie</p>
        <h1>Moja lekcja</h1>
        <p className="lead">Napisz, czego nie rozumiesz albo co chcesz poćwiczyć. Tutor przygotuje krótką teorię, przykłady i zadania na Twoim poziomie.</p>
      </header>

      {!AI_URL && (
        <Card className="notice">
          <p>
            <strong>Ta funkcja nie jest jeszcze włączona.</strong> Lekcje na zamówienie wymagają połączenia z serwerem tutora. Do tego czasu korzystaj z gotowych lekcji w działach.
          </p>
        </Card>
      )}

      <Card>
        <form className="ai-form" onSubmit={submit}>
          <div className="field">
            <label htmlFor="ai-topic">Czego chcesz się nauczyć?</label>
            <textarea
              id="ai-topic"
              rows={3}
              maxLength={300}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="np. Nie rozumiem, jak obliczyć pole trapezu"
              disabled={busy}
            />
            <span className="muted small">Nie wpisuj imienia, nazwiska ani innych danych osobowych.</span>
            <div className="idea-chips" aria-label="Przykładowe tematy">
              {IDEAS.map((i) => (
                <button key={i} type="button" className="idea-chip" onClick={() => setTopic(i)} disabled={busy}>
                  {i}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <span className="field-label">Poziom</span>
            <Segmented
              label="Poziom"
              value={level}
              onChange={setLevel}
              options={[
                { value: 'latwy', label: 'Od podstaw' },
                { value: 'sredni', label: 'Średni' },
                { value: 'trudny', label: 'Jak na egzaminie' },
              ]}
            />
          </div>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="ai-zone">Dział (nieobowiązkowe)</label>
              <select id="ai-zone" value={zone} onChange={(e) => setZone(e.target.value)} disabled={busy}>
                {full && <option value="">Dowolny</option>}
                {zones.map((z) => (
                  <option key={z.id} value={z.title}>
                    {z.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="ai-interests">Co lubisz? (nieobowiązkowe)</label>
              <input id="ai-interests" maxLength={100} value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="np. piłka nożna, konie, gry" disabled={busy} />
              <span className="muted small">Użyjemy tego w zadaniach tekstowych.</span>
            </div>
          </div>
          {error && (
            <div className="feedback feedback-wrong" role="alert">
              {error}
            </div>
          )}
          <div className="actions">
            <Button type="submit" variant="primary" icon="spark" disabled={busy || !AI_URL}>
              {busy ? 'Tutor przygotowuje lekcję…' : 'Przygotuj lekcję'}
            </Button>
            {busy && (
              <Button variant="quiet" onClick={() => abort.current?.abort()}>
                Anuluj
              </Button>
            )}
          </div>
          {busy && <p className="muted small">To zwykle trwa 20–40 sekund. Każde zadanie sprawdzamy, zanim je zobaczysz.</p>}
        </form>
      </Card>

      {lessons.length > 0 && (
        <section className="ai-list">
          <h2>Twoje lekcje</h2>
          {lessons.map((l) => {
            const st = progress.lessons?.[`ai-${l.id}`]?.stars ?? 0;
            return (
              <Card key={l.id} className="ai-item">
                <a href={href.aiLesson(l.id)} className="ai-item-link">
                  <strong>{l.title}</strong>
                  <span className="muted small">
                    {new Date(l.createdAt).toLocaleDateString('pl-PL')} · {l.tasks.length} zadań · „{l.request.topic.slice(0, 60)}”
                  </span>
                </a>
                {st > 0 && <Stars n={st} size={14} />}
                <button type="button" className="icon-btn" aria-label={`Usuń lekcję ${l.title}`} onClick={() => remove(l.id)}>
                  <Icon name="trash" size={18} />
                </button>
              </Card>
            );
          })}
        </section>
      )}
    </div>
  );
}

export function AiLessonScreen({ id }: { id: string }) {
  const { completeLesson } = useApp();
  const [lesson] = useState(() => loadAiLessons().find((l) => l.id === id));
  const [round, setRound] = useState(0);
  const [stars, setStars] = useState(0);
  if (!lesson) return <p>Nie znaleziono lekcji. Mogła zostać usunięta.</p>;
  return (
    <LessonRunner
      key={round}
      eyebrow="Moja lekcja"
      title={lesson.title}
      theory={lesson.theory}
      count={lesson.tasks.length}
      makeTask={(i) => lesson.tasks[i]}
      skillId={`ai-${lesson.id}`}
      backHref={href.ai}
      backLabel="Moje lekcje"
      onComplete={(r) => {
        const s = starsFor('cwicz', r.avg, r.correct, r.total);
        setStars(s);
        completeLesson(`ai-${lesson.id}`, s);
      }}
      summaryExtra={() => (
        <Card className="lesson-result">
          <Stars n={stars} size={34} />
          <p>{stars === 3 ? 'Znakomicie! Ten temat masz opanowany.' : stars === 2 ? 'Dobra robota. Jeszcze jedno podejście i będzie perfekcyjnie.' : 'Dobry początek. Powtórz lekcję albo poproś tutora o łatwiejszą wersję.'}</p>
          <div className="actions">
            <Button
              icon="refresh"
              onClick={() => {
                setRound((x) => x + 1);
                window.scrollTo({ top: 0 });
              }}
            >
              Powtórz lekcję
            </Button>
            <Button href={href.ai} variant="primary" icon="spark">
              Nowa lekcja
            </Button>
          </div>
        </Card>
      )}
    />
  );
}
