/**
 * Serwer lekcji z AI dla E-tutora (Cloudflare Worker).
 *
 * POST /lekcja  { topic, level, zone?, interests? }  →  { lekcja } albo { blad }
 *
 * Klucz API Claude jest tylko tutaj (sekret ANTHROPIC_API_KEY), nigdy w aplikacji.
 * Dzienny limit lekcji na urządzenie i na adres IP chroni przed nadużyciami
 * (wymaga powiązania KV o nazwie LIMITS – bez niego limitu nie ma).
 */
import Anthropic from '@anthropic-ai/sdk';
import { LESSON_SCHEMA, type LessonJson } from './schema';
import { SYSTEM_PROMPT, userMessage } from './prompt';

export interface Env {
  ANTHROPIC_API_KEY: string;
  /** model Claude (domyślnie claude-opus-5-5) */
  MODEL?: string;
  /** dozwolone adresy aplikacji, oddzielone przecinkami; puste = wszystkie */
  ALLOWED_ORIGINS?: string;
  /** ile lekcji dziennie może przygotować jedno urządzenie (domyślnie 5) */
  DAILY_LIMIT?: string;
  LIMITS?: KVNamespace;
}

const LEVELS = ['latwy', 'sredni', 'trudny'] as const;
type Level = (typeof LEVELS)[number];

function cors(origin: string | null, env: Env): Record<string, string> {
  const allowed = (env.ALLOWED_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  // aplikacja na Androidzie (Capacitor) ma adres https://localhost
  const ok = !allowed.length || (origin && (allowed.includes(origin) || origin === 'https://localhost' || origin === 'capacitor://localhost'));
  return {
    'Access-Control-Allow-Origin': ok ? (origin ?? '*') : 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Device-Id',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' } });
}

/** Zwiększa licznik dzienny; zwraca false, gdy limit przekroczony. */
async function underLimit(env: Env, key: string, limit: number): Promise<boolean> {
  if (!env.LIMITS) return true;
  const day = new Date().toISOString().slice(0, 10);
  const k = `${day}:${key}`;
  const n = Number((await env.LIMITS.get(k)) ?? 0);
  if (n >= limit) return false;
  await env.LIMITS.put(k, String(n + 1), { expirationTtl: 60 * 60 * 26 });
  return true;
}

function clean(s: unknown, max: number): string {
  return typeof s === 'string' ? s.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max) : '';
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const h = cors(req.headers.get('Origin'), env);
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
    if (url.pathname === '/' && req.method === 'GET') return json({ ok: true, usluga: 'E-tutor – lekcje z AI' }, 200, h);
    if (url.pathname !== '/lekcja' || req.method !== 'POST') return json({ blad: 'Nie ma takiego adresu.' }, 404, h);
    if (h['Access-Control-Allow-Origin'] === 'null') return json({ blad: 'Ta aplikacja nie ma dostępu do serwera.' }, 403, h);
    if (!env.ANTHROPIC_API_KEY) return json({ blad: 'Serwer nie jest jeszcze skonfigurowany.' }, 503, h);

    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return json({ blad: 'Niepoprawne zapytanie.' }, 400, h);
    }
    const topic = clean(body.topic, 300);
    const level = (LEVELS.includes(body.level as Level) ? body.level : 'sredni') as Level;
    const zone = clean(body.zone, 60) || undefined;
    const interests = clean(body.interests, 100) || undefined;
    if (topic.length < 5) return json({ blad: 'Opisz temat lekcji trochę dokładniej.' }, 400, h);

    // limity: na urządzenie i (wyższy) na adres IP
    const limit = Number(env.DAILY_LIMIT ?? 5);
    const device = clean(req.headers.get('X-Device-Id'), 64) || 'brak';
    const ip = req.headers.get('CF-Connecting-IP') ?? 'brak';
    if (!(await underLimit(env, `dev:${device}`, limit)) || !(await underLimit(env, `ip:${ip}`, limit * 6))) {
      return json({ blad: `Na dziś to już wszystkie lekcje na zamówienie (limit: ${limit} dziennie). Wróć jutro albo ćwicz w gotowych działach.` }, 429, h);
    }

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    try {
      const msg = await client.beta.messages.create({
        model: env.MODEL || 'claude-opus-5-5',
        max_tokens: 16000,
        // gdy filtr bezpieczeństwa odrzuci zapytanie, API samo spróbuje innym modelem
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'medium', format: { type: 'json_schema', schema: LESSON_SCHEMA as unknown as Record<string, unknown> } },
        system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: userMessage({ topic, level, zone, interests }) }],
      });

      if (msg.stop_reason === 'refusal') return json({ blad: 'Tutor nie może przygotować lekcji na ten temat. Spróbuj zapytać o inne zagadnienie z matematyki.' }, 422, h);
      if (msg.stop_reason === 'max_tokens') return json({ blad: 'Lekcja wyszła za długa. Spróbuj zawęzić temat.' }, 502, h);

      const text = msg.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
      let lesson: LessonJson;
      try {
        lesson = JSON.parse(text) as LessonJson;
      } catch {
        return json({ blad: 'Nie udało się przygotować lekcji. Spróbuj ponownie.' }, 502, h);
      }
      if (lesson.odmowa?.trim()) return json({ blad: lesson.odmowa.trim().slice(0, 300) }, 422, h);
      if (!Array.isArray(lesson.zadania) || lesson.zadania.length < 3) return json({ blad: 'Nie udało się przygotować zadań. Spróbuj opisać temat inaczej.' }, 502, h);

      const { odmowa: _odmowa, ...lekcja } = lesson;
      return json({ lekcja }, 200, h);
    } catch (e) {
      if (e instanceof Anthropic.RateLimitError) return json({ blad: 'Tutor ma teraz dużo pracy. Spróbuj za minutę.' }, 503, h);
      if (e instanceof Anthropic.AuthenticationError) return json({ blad: 'Serwer jest źle skonfigurowany (klucz API).' }, 503, h);
      if (e instanceof Anthropic.APIError) return json({ blad: 'Usługa AI jest chwilowo niedostępna. Spróbuj ponownie za chwilę.' }, 502, h);
      return json({ blad: 'Coś poszło nie tak. Spróbuj ponownie.' }, 500, h);
    }
  },
};
