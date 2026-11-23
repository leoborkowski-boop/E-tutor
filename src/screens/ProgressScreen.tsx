import { TOPICS } from '../content/topics';
import { Button, Card, MasteryBar, StatusChip } from '../components/ui';
import { href } from '../router';
import { useApp } from '../state/AppState';
import { BADGES } from '../state/badges';
import { THRESHOLD_MASTERED, THRESHOLD_REVIEW, dayKey, learningDays, topicStats } from '../state/progress';

function relTime(ts?: number) {
  if (!ts) return 'jeszcze nie ćwiczono';
  const days = Math.floor((Date.now() - ts) / 86_400_000);
  if (days === 0) return 'dziś';
  if (days === 1) return 'wczoraj';
  return `${days} dni temu`;
}

function Calendar() {
  const { progress, settings } = useApp();
  const weeks = 6;
  const today = new Date();
  // Poniedziałek tygodnia sprzed (weeks-1) tygodni
  const start = new Date(today);
  const dow = (today.getDay() + 6) % 7;
  start.setDate(today.getDate() - dow - (weeks - 1) * 7);
  const days: { key: string; sec: number; future: boolean; date: Date }[] = [];
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const k = dayKey(d);
    days.push({ key: k, sec: progress.studySeconds[k] ?? 0, future: d > today, date: d });
  }
  const goal = Math.max(60, settings.dailyGoalMinutes * 60);
  const level = (s: number) => (s < 60 ? 0 : s < goal / 2 ? 1 : s < goal ? 2 : 3);
  return (
    <div className="calendar">
      <div className="calendar-labels">
        {['pn', 'wt', 'śr', 'cz', 'pt', 'sb', 'nd'].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {days.map((d) => (
          <span
            key={d.key}
            className={`cal-day lvl-${d.future ? 'f' : level(d.sec)} ${d.key === dayKey() ? 'is-today' : ''}`}
            title={`${d.date.toLocaleDateString('pl-PL')}: ${Math.round(d.sec / 60)} min`}
            role="img"
            aria-label={d.future ? `${d.date.toLocaleDateString('pl-PL')}: jeszcze przed nami` : `${d.date.toLocaleDateString('pl-PL')}: ${Math.round(d.sec / 60)} min nauki`}
          />
        ))}
      </div>
      <div className="calendar-legend" aria-hidden="true">
        mniej <span className="cal-day lvl-0" /> <span className="cal-day lvl-1" /> <span className="cal-day lvl-2" /> <span className="cal-day lvl-3" /> więcej (pełny kolor = cel dnia)
      </div>
      <p className="muted small">
        Dni z nauką: {learningDays(progress)}. Bez presji – każdy dzień nauki się liczy, przerwy niczego nie zabierają.
      </p>
    </div>
  );
}

export function ProgressScreen() {
  const { progress, settings } = useApp();
  const stats = TOPICS.map((t) => ({ t, s: topicStats(progress, t.id) }));
  const due = stats.filter((x) => x.s.status === 'review' || x.s.dueForReview);
  const totalMin = Math.round(Object.values(progress.studySeconds).reduce((a, b) => a + b, 0) / 60);
  const practiceAttempts = progress.attempts.filter((a) => a.source === 'practice');
  const misconceptions = new Map<string, number>();
  progress.attempts.slice(-200).forEach((a) => a.misconception && misconceptions.set(a.misconception, (misconceptions.get(a.misconception) ?? 0) + 1));
  const topMistakes = [...misconceptions.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);

  return (
    <div className="page">
      <header className="page-head">
        <h1>Postępy</h1>
        <p className="lead">
          Rozwiązane zadania: {practiceAttempts.length} · czas nauki: {totalMin} min · arkusze: {progress.exams.length}
        </p>
      </header>

      {due.length > 0 && (
        <Card className="callout">
          <div className="callout-body">
            <h3>
              Do powtórki: {due.slice(0, 3).map((x) => x.t.title).join(', ')}
              {due.length > 3 ? ` i ${due.length - 3} ${due.length - 3 === 1 ? 'inny dział' : due.length - 3 < 5 ? 'inne działy' : 'innych działów'}` : ''}
            </h3>
            <p className="muted">Krótka sesja powtórkowa wybierze zadania właśnie z tych działów.</p>
          </div>
          <Button variant="primary" href={href.practice('powtorka')} icon="refresh">
            Powtórka
          </Button>
        </Card>
      )}

      <Card>
        <h2>Opanowanie działów</h2>
        <p className="muted small">
          Poziom liczymy z ostatnich zadań (nowsze ważą więcej). Podpowiedzi i kolejne próby obniżają wynik. Poniżej {Math.round(THRESHOLD_REVIEW * 100)}% –
          do powtórki, od {Math.round(THRESHOLD_MASTERED * 100)}% – opanowane. Opanowane działy wracają co jakiś czas do odświeżenia.
        </p>
        <div className="progress-table">
          {stats.map(({ t, s }) => (
            <div key={t.id} className="progress-row">
              <a className="progress-title" href={href.topic(t.id)}>
                <span className="topic-num">{t.order}</span>
                {t.title}
              </a>
              <MasteryBar stats={s} />
              <StatusChip stats={s} />
              <span className="muted small progress-meta">
                {s.attempts > 0 ? `${s.recentCorrect}/${s.recentTotal} ostatnio dobrze · ${relTime(s.lastTs)}` : relTime()}
                {s.lowConfidence && s.attempts > 0 ? ' · mało danych' : ''}
              </span>
              <a className="progress-action" href={href.practice(t.id)}>
                Ćwicz →
              </a>
            </div>
          ))}
        </div>
      </Card>

      {topMistakes.length > 0 && (
        <Card>
          <h2>Najczęstsze błędy</h2>
          <ul className="theory-list">
            {topMistakes.map(([m, n]) => (
              <li key={m}>
                {m.replace(/\*\*/g, '')} <span className="muted">({n}×)</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {settings.showCalendar && (
        <Card>
          <h2>Kalendarz nauki</h2>
          <Calendar />
        </Card>
      )}

      {progress.exams.length > 0 && (
        <Card>
          <h2>Próbne arkusze</h2>
          <div className="summary-list">
            {[...progress.exams].reverse().slice(0, 8).map((e) => (
              <div key={e.ts} className="summary-row">
                <span>{new Date(e.ts).toLocaleDateString('pl-PL')}</span>
                <strong>
                  {e.points}/{e.max} pkt ({Math.round((e.points / e.max) * 100)}%)
                </strong>
                <span className="muted">{e.minutes} min</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {settings.showBadges && (
        <Card>
          <h2>Odznaki</h2>
          <div className="badges">
            {BADGES.map((b) => {
              const got = b.id in progress.badges;
              return (
                <div key={b.id} className={`badge ${got ? 'is-earned' : ''}`} title={b.description}>
                  <span className="badge-icon" aria-hidden="true">
                    {b.icon}
                  </span>
                  <span className="badge-state">{got ? 'Zdobyta' : 'Do zdobycia'}</span>
                  <strong>{b.name}</strong>
                  <span className="muted small">{b.description}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
