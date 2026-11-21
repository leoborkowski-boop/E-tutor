import { TOPICS } from '../content/topics';
import { Button, Card, Icon, MasteryBar, Ring, StatusChip } from '../components/ui';
import { href } from '../router';
import { useApp } from '../state/AppState';
import { dayKey, topicStats } from '../state/progress';
import { recommendations } from '../state/recommend';

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
  const mastered = stats.filter((s) => s.status === 'mastered').length;

  return (
    <div className="page">
      <header className="page-head">
        <h1>{greeting()}!</h1>
        <p className="lead">Ułamki · klasa 8. Ucz się we własnym tempie.</p>
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
          <Ring value={mastered / TOPICS.length} size={72} label={<span>{mastered}/{TOPICS.length}</span>} />
          <div>
            <h3>Opanowane działy</h3>
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
            <h3>Zacznij od krótkiego testu diagnostycznego</h3>
            <p className="muted">18 zadań, około 10 minut. Sprawdzimy, co już umiesz, i ustawimy poziom trudności w każdym dziale.</p>
          </div>
          <Button variant="primary" href={href.diagnostic} icon="play">
            Rozpocznij test
          </Button>
        </Card>
      )}

      <section>
        <h2>Co dalej?</h2>
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
        <h2>Twoje działy</h2>
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
