import { TOPICS } from '../content/topics';
import { Button, Card, Icon, MasteryBar, Ring, StatusChip } from '../components/ui';
import { href } from '../router';
import { useApp } from '../state/AppState';
import { dayKey, topicStats } from '../state/progress';
import { recommendations } from '../state/recommend';
import { ALL_LESSONS, ZONES, firstOpenLesson } from '../content/curriculum';
import { zoneDone } from './Lessons';
import { useFullAccess, zoneLocked } from '../state/access';

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Dobry wieczór';
  if (h < 12) return 'Dzień dobry';
  if (h < 18) return 'Cześć';
  return 'Dobry wieczór';
}

export function Home() {
  const { progress, settings } = useApp();
  const recs = recommendations(progress);
  const todaySec = progress.studySeconds[dayKey()] ?? 0;
  const goalSec = settings.dailyGoalMinutes * 60;
  const stats = TOPICS.map((t) => topicStats(progress, t.id));
  const done = progress.lessons ?? {};
  const full = useFullAccess();
  const lessonsDone = ALL_LESSONS.filter((l) => (done[l.id]?.stars ?? 0) > 0).length;

  return (
    <div className="page">
      <header className="page-head">
        <h1>{greeting()}!</h1>
        <p className="lead">Nauka do kwadratu: matematyka do egzaminu ósmoklasisty, we własnym tempie.</p>
      </header>

      <div className="grid-2">
        {goalSec > 0 && (
          <Card className="goal-card">
            <Ring value={todaySec / goalSec} size={72} label={<span>{Math.floor(todaySec / 60)}′</span>} />
            <div>
              <h3>Cel na dziś</h3>
              <p className="muted">
                {todaySec >= goalSec
                  ? 'Cel osiągnięty. Możesz odpocząć albo ćwiczyć dalej.'
                  : `${Math.floor(todaySec / 60)} z ${settings.dailyGoalMinutes} minut nauki`}
              </p>
            </div>
          </Card>
        )}
        <Card className="goal-card">
          <Ring value={lessonsDone / (full ? ALL_LESSONS.length : ALL_LESSONS.filter((l) => l.zoneId === 'ulamki').length)} size={72} label={<span>{lessonsDone}</span>} />
          <div>
            <h3>Ukończone lekcje</h3>
            <p className="muted">
              {lessonsDone} z {full ? ALL_LESSONS.length : ALL_LESSONS.filter((l) => l.zoneId === 'ulamki').length} {full ? 'we wszystkich działach' : 'w darmowym dziale ułamków'}
            </p>
            <p className="muted">
              <a href={href.progress}>Zobacz szczegóły postępów</a>
            </p>
          </div>
        </Card>
      </div>

      {!progress.diagnosticDone && (
        <Card className="callout">
          <div className="callout-icon">
            <Icon name="compass" size={26} />
          </div>
          <div className="callout-body">
            <h3>Zacznij od krótkiego testu sprawdzającego</h3>
            <p className="muted">18 zadań z ułamków, około 10 minut. Sprawdzimy, co już umiesz, i ustawimy poziom trudności w każdym temacie.</p>
          </div>
          <Button variant="primary" href={href.diagnostic} icon="play">
            Rozpocznij test
          </Button>
        </Card>
      )}

      <section>
        <h2>Wszystkie działy egzaminu</h2>
        <div className="zone-grid">
          {ZONES.map((z) => {
            const d = zoneDone(z.id, done);
            const next = firstOpenLesson(z.id, done);
            const locked = zoneLocked(z.id, full);
            return (
              <Card key={z.id} className={`zone-card ${locked ? 'is-locked' : ''}`}>
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
                {locked ? (
                  <span className="zone-lock">Pełna wersja</span>
                ) : (
                  next && (
                    <Button className="zone-next" variant={d.finished ? 'primary' : 'secondary'} href={href.lesson(next.id)} icon="play">
                      {d.finished ? 'Dalej' : 'Zacznij'}
                    </Button>
                  )
                )}
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <h2>Co dalej w ułamkach?</h2>
        <div className="rec-list">
          {recs.map((r) => (
            <Card key={r.topic.id} className="rec">
              <div className="rec-main">
                <div className="rec-title">
                  <h3>{r.topic.title}</h3>
                  <StatusChip stats={r.stats} />
                </div>
                <p className="muted">{r.reason}</p>
              </div>
              <div className="rec-actions">
                <Button variant={r.action === 'theory' ? 'primary' : 'secondary'} href={href.topic(r.topic.id)} icon="book">
                  Teoria
                </Button>
                <Button variant={r.action === 'practice' ? 'primary' : 'secondary'} href={href.practice(r.topic.id)} icon="play">
                  Ćwicz
                </Button>
              </div>
            </Card>
          ))}
          {recs.length === 0 && (
            <Card>
              <p>Wszystkie działy są opanowane i aktualne. Spróbuj próbnego arkusza egzaminacyjnego!</p>
            </Card>
          )}
        </div>
      </section>

      <section className="quick">
        <a className="quick-tile" href={href.practice('mix')}>
          <Icon name="refresh" size={22} />
          <strong>Ćwiczenia mieszane</strong>
          <span className="muted">Zadania ze wszystkich działów, więcej z tych słabszych.</span>
        </a>
        <a className="quick-tile" href={href.exam}>
          <Icon name="exam" size={22} />
          <strong>Próbny arkusz</strong>
          <span className="muted">15 zadań w stylu egzaminu ósmoklasisty.</span>
        </a>
        <a className="quick-tile" href={href.material}>
          <Icon name="book" size={22} />
          <strong>Cały materiał</strong>
          <span className="muted">Teoria, przykłady i typowe błędy.</span>
        </a>
      </section>

      <section>
        <h2>Ułamki: tematy z teorią i modelami</h2>
        <Card className="topic-mini-list">
          {TOPICS.map((t, i) => (
            <a key={t.id} className="topic-mini" href={href.topic(t.id)}>
              <span className="topic-num">{t.order}</span>
              <span className="topic-mini-title">{t.title}</span>
              <MasteryBar stats={stats[i]} />
            </a>
          ))}
        </Card>
      </section>
    </div>
  );
}
