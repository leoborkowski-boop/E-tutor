import { TOPICS } from '../content/topics';
import { Button, Card, MasteryBar, StatusChip } from '../components/ui';
import { href } from '../router';
import { useApp } from '../state/AppState';
import { topicStats } from '../state/progress';

export function Material() {
  const { progress } = useApp();
  return (
    <div className="page">
      <header className="page-head">
        <h1>Materiał: ułamki</h1>
        <p className="lead">Wybierz dział. Możesz najpierw przeczytać teorię albo od razu przejść do zadań.</p>
      </header>
      <div className="topic-list">
        {TOPICS.map((t) => {
          const s = topicStats(progress, t.id);
          return (
            <Card key={t.id} className="topic-card">
              <div className="topic-card-head">
                <span className="topic-num">{t.order}</span>
                <div>
                  <h2 className="h3">{t.title}</h2>
                  <p className="muted">{t.short}</p>
                </div>
                <StatusChip stats={s} />
              </div>
              <MasteryBar stats={s} />
              <div className="topic-card-actions">
                <Button href={href.topic(t.id)} icon="book" variant="secondary">
                  Teoria{progress.theoryRead[t.id] ? ' ✓' : ''}
                </Button>
                <Button href={href.practice(t.id)} icon="play" variant="primary">
                  Ćwicz
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
