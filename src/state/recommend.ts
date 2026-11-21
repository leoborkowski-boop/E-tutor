import { TOPICS } from '../content/topics';
import type { Topic } from '../content/types';
import { type Progress, type TopicStats, topicStats } from './progress';

export type Recommendation = { topic: Topic; stats: TopicStats; reason: string; action: 'theory' | 'practice' };

/** Co warto zrobić teraz – maksymalnie `limit` propozycji. */
export function recommendations(p: Progress, limit = 3): Recommendation[] {
  const all = TOPICS.map((t) => ({ topic: t, stats: topicStats(p, t.id) }));
  const out: Recommendation[] = [];
  const push = (r: Recommendation) => {
    if (out.length < limit && !out.some((o) => o.topic.id === r.topic.id)) out.push(r);
  };
  all
    .filter((x) => x.stats.status === 'review')
    .sort((a, b) => a.stats.mastery - b.stats.mastery)
    .forEach((x) => push({ ...x, reason: 'Ten dział wymaga powtórki – zacznij od teorii.', action: p.theoryRead[x.topic.id] ? 'practice' : 'theory' }));
  all.filter((x) => x.stats.dueForReview).forEach((x) => push({ ...x, reason: 'Dawno niećwiczony – krótkie odświeżenie utrwali wiedzę.', action: 'practice' }));
  all
    .filter((x) => x.stats.status === 'learning')
    .sort((a, b) => b.stats.mastery - a.stats.mastery)
    .forEach((x) => push({ ...x, reason: 'Jesteś blisko opanowania – jeszcze kilka zadań.', action: 'practice' }));
  all.filter((x) => x.stats.status === 'new').forEach((x) => push({ ...x, reason: 'Nowy dział – zapoznaj się z teorią i przykładami.', action: 'theory' }));
  return out;
}
