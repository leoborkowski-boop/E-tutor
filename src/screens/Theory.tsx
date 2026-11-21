import { useEffect, useRef } from 'react';
import { TOPIC_BY_ID, TOPICS } from '../content/topics';
import type { TheoryBlock, TopicId } from '../content/types';
import { FractionVisual } from '../components/FractionVisual';
import { MathText } from '../components/MathText';
import { Widget } from '../components/widgets/Widgets';
import { Button, Card, MasteryBar, SpeakButton, StatusChip } from '../components/ui';
import { href } from '../router';
import { useApp, useStudyTimer } from '../state/AppState';
import { topicStats } from '../state/progress';

function blockSpeech(b: TheoryBlock): string[] {
  switch (b.type) {
    case 'p':
      return [b.text];
    case 'rule':
      return [(b.title ? b.title + '. ' : '') + b.text];
    case 'list':
      return b.items;
    case 'visual':
      return b.caption ? [b.caption] : [];
    case 'example':
      return [`${b.title ?? 'Przykład'}. ${b.problem}`, ...b.steps, `Odpowiedź: ${b.answer}`];
    case 'mistake':
      return [`Błędnie: ${b.wrong}`, `Poprawnie: ${b.right}`, b.why];
    case 'interactive':
      return [];
  }
}

function Block({ b }: { b: TheoryBlock }) {
  const { settings } = useApp();
  switch (b.type) {
    case 'p':
      return <MathText as="p" text={b.text} />;
    case 'rule':
      return (
        <div className="rule">
          {b.title && <strong className="rule-title">{b.title}</strong>}
          <MathText as="p" text={b.text} />
        </div>
      );
    case 'list':
      return (
        <ul className="theory-list">
          {b.items.map((it, i) => (
            <MathText as="li" key={i} text={it} />
          ))}
        </ul>
      );
    case 'visual':
      return settings.showVisuals ? (
        <figure className="theory-figure">
          <FractionVisual visual={b.visual} />
          {b.caption && (
            <figcaption>
              <MathText text={b.caption} />
            </figcaption>
          )}
        </figure>
      ) : b.caption ? (
        <MathText as="p" className="muted" text={b.caption} />
      ) : null;
    case 'example':
      return (
        <div className="example">
          <div className="example-head">
            <strong>{b.title ?? 'Przykład'}</strong>
            <SpeakButton text={blockSpeech(b)} label="Przeczytaj przykład" />
          </div>
          <MathText as="p" className="example-problem" text={b.problem} />
          <details className="example-steps" open>
            <summary>Rozwiązanie</summary>
            <ol>
              {b.steps.map((s, i) => (
                <MathText as="li" key={i} text={s} />
              ))}
            </ol>
            <p className="solution-answer">
              <MathText text={b.answer} />
            </p>
          </details>
        </div>
      );
    case 'interactive':
      return <Widget id={b.widget} title={b.title} text={b.text} />;
    case 'mistake':
      return (
        <div className="mistake">
          <p className="mistake-wrong">
            <span className="mistake-tag">Błędnie</span> <MathText text={b.wrong} />
          </p>
          <p className="mistake-right">
            <span className="mistake-tag">Poprawnie</span> <MathText text={b.right} />
          </p>
          <MathText as="p" className="muted" text={b.why} />
        </div>
      );
  }
}

export function Theory({ id }: { id: string }) {
  const { progress, markTheoryRead } = useApp();
  useStudyTimer(true);
  const topic = TOPIC_BY_ID[id as TopicId];
  const endRef = useRef<HTMLDivElement>(null);

  // Dział uznajemy za „przeczytany”, gdy uczeń dotrze do końca strony
  useEffect(() => {
    if (!topic || !endRef.current) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) markTheoryRead(topic.id);
    });
    obs.observe(endRef.current);
    return () => obs.disconnect();
  }, [topic?.id]);

  if (!topic) return <p>Nie znaleziono działu.</p>;
  const stats = topicStats(progress, topic.id);
  const idx = TOPICS.findIndex((t) => t.id === topic.id);
  const next = TOPICS[idx + 1];
  const prev = TOPICS[idx - 1];

  return (
    <div className="page theory">
      <a className="back-link" href={href.material}>
        ← Materiał
      </a>
      <header className="page-head">
        <p className="eyebrow">Dział {topic.order}</p>
        <h1>{topic.title}</h1>
        <div className="theory-status">
          <StatusChip stats={stats} />
          <MasteryBar stats={stats} />
        </div>
      </header>

      <Card className="goals">
        <div className="section-head">
          <h2>Co musisz umieć</h2>
          <SpeakButton text={topic.goals} />
        </div>
        <ul className="goal-list">
          {topic.goals.map((g, i) => (
            <MathText as="li" key={i} text={g} />
          ))}
        </ul>
      </Card>

      <nav className="toc" aria-label="Spis treści działu">
        {topic.sections.map((s, i) => (
          <a key={i} href={`#/temat/${topic.id}`} onClick={(e) => {
            e.preventDefault();
            document.getElementById(`sec-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}>
            {s.title}
          </a>
        ))}
      </nav>

      {topic.sections.map((s, i) => (
        <Card key={i} className="theory-section">
          <div className="section-head" id={`sec-${i}`}>
            <h2>{s.title}</h2>
            <SpeakButton text={[s.title, ...s.blocks.flatMap(blockSpeech)]} label="Przeczytaj całą sekcję" />
          </div>
          {s.blocks.map((b, j) => (
            <Block key={j} b={b} />
          ))}
        </Card>
      ))}

      <div ref={endRef} />
      <Card className="callout">
        <div className="callout-body">
          <h3>Czas sprawdzić się w zadaniach</h3>
          <p className="muted">Zadania dopasują się do Twojego poziomu. W każdej chwili możesz poprosić o podpowiedź.</p>
        </div>
        <Button variant="primary" href={href.practice(topic.id)} icon="play">
          Ćwicz ten dział
        </Button>
      </Card>

      <div className="pager">
        {prev ? <a href={href.topic(prev.id)}>← {prev.title}</a> : <span />}
        {next ? <a href={href.topic(next.id)}>{next.title} →</a> : <span />}
      </div>
    </div>
  );
}
