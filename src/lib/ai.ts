/**
 * Lekcje przygotowane przez AI (tutor Claude) – komunikacja z serwerem
 * (katalog server/) i zamiana odpowiedzi na zadania aplikacji.
 *
 * Każde zadanie od AI ma wynik i wyrażenie liczbowe („sprawdzenie”).
 * Aplikacja sama liczy wyrażenie; zadania, w których wynik się nie zgadza,
 * są odrzucane, żeby uczeń nie dostał błędnej odpowiedzi.
 */
import type { Task, TheoryBlock } from '../content/types';
import { evaluate } from './expr';
import { parseAnswer } from './parse';
import { uid } from './random';
import { load, save } from '../state/storage';

/** Adres serwera lekcji AI (zmienna VITE_AI_URL przy budowaniu). Pusty = funkcja wyłączona. */
export const AI_URL: string = (import.meta.env.VITE_AI_URL as string | undefined)?.replace(/\/$/, '') ?? '';

export type AiLevel = 'latwy' | 'sredni' | 'trudny';

export type AiRequest = {
  topic: string;
  level: AiLevel;
  zone?: string;
  interests?: string;
};

/** Format lekcji zwracany przez serwer (pola po polsku, zgodne ze schematem w server/src/schema.ts). */
export type AiLessonRaw = {
  tytul: string;
  wstep: string;
  teoria: { tytul: string; tresc: string }[];
  przyklady: { zadanie: string; kroki: string[]; odpowiedz: string }[];
  zadania: {
    tresc: string;
    rodzaj: 'wpisz' | 'wybierz';
    odpowiedz: string;
    sprawdzenie: string;
    jednostka: string;
    odpowiedzi_do_wyboru: string[];
    podpowiedzi: string[];
    rozwiazanie: string[];
  }[];
};

export type AiLesson = {
  id: string;
  createdAt: number;
  request: AiRequest;
  title: string;
  intro: string;
  theory: TheoryBlock[];
  tasks: Task[];
  /** ile zadań odrzucono, bo wynik się nie zgadzał */
  rejected: number;
};

/* ---------------- Zapis lokalny ---------------- */

export function loadAiLessons(): AiLesson[] {
  return load<AiLesson[]>('aiLessons', []).map(revive);
}
export function saveAiLessons(list: AiLesson[]) {
  save('aiLessons', list.slice(0, 50));
}

// Fraction po JSON.parse traci metody – odtwarzamy wartości odpowiedzi z zapisanego tekstu
function revive(l: AiLesson): AiLesson {
  return {
    ...l,
    tasks: l.tasks.map((t) => {
      if (t.format !== 'input') return t;
      const p = answerValue((t as unknown as { answerRaw: string }).answerRaw ?? t.answerText);
      return p ? { ...t, answer: { ...t.answer, value: p.value } } : t;
    }),
  };
}

/* ---------------- Identyfikator urządzenia (do dziennego limitu na serwerze) ---------------- */

function deviceId() {
  let id = load<string>('deviceId', '');
  if (!id) {
    id = crypto.randomUUID?.() ?? uid('dev');
    save('deviceId', id);
  }
  return id;
}

/* ---------------- Zamiana odpowiedzi AI na lekcję ---------------- */

const clean = (s: string) => String(s ?? '').trim().slice(0, 1200);

/** Liczba z odpowiedzi AI: dopuszczamy zapis „3/4”, „2 1/2”, „12,5”, „−3”. */
function answerValue(s: string) {
  return parseAnswer(s.replace(/\s*(zł|cm²|cm³|cm|m²|m|km|kg|g|l|°|%|min|h|s)\s*$/i, '').trim());
}

export function toLesson(raw: AiLessonRaw, request: AiRequest): AiLesson {
  const id = uid('ai');
  const theory: TheoryBlock[] = [];
  if (raw.wstep) theory.push({ type: 'p', text: clean(raw.wstep) });
  for (const s of raw.teoria ?? []) theory.push({ type: 'rule', title: clean(s.tytul), text: clean(s.tresc) });
  for (const e of raw.przyklady ?? [])
    theory.push({ type: 'example', title: 'Przykład', problem: clean(e.zadanie), steps: (e.kroki ?? []).map(clean), answer: `Odpowiedź: ${clean(e.odpowiedz)}` });

  let rejected = 0;
  const tasks: Task[] = [];
  for (const z of raw.zadania ?? []) {
    const parsed = answerValue(z.odpowiedz);
    const checked = evaluate(z.sprawdzenie);
    // odrzucamy zadania, których wyniku nie da się sprawdzić albo się nie zgadza
    if (!parsed || !checked || !parsed.value.equals(checked)) {
      rejected++;
      continue;
    }
    const base = {
      id: uid(id),
      topicId: `ai-${id}`,
      difficulty: (request.level === 'latwy' ? 1 : request.level === 'sredni' ? 2 : 3) as 1 | 2 | 3,
      prompt: clean(z.tresc),
      hints: (z.podpowiedzi ?? []).map(clean).slice(0, 3),
      solution: (z.rozwiazanie ?? []).map(clean).slice(0, 8),
      answerText: `${clean(z.odpowiedz)}`,
    };
    const choices = (z.odpowiedzi_do_wyboru ?? []).map(clean).filter(Boolean);
    if (z.rodzaj === 'wybierz' && choices.length >= 3) {
      // poprawna odpowiedź musi być dokładnie jedną z opcji (porównujemy wartości liczbowe)
      const correctIdx = choices.map((c) => answerValue(c)).map((p) => !!p && p.value.equals(parsed.value));
      if (correctIdx.filter(Boolean).length !== 1) {
        rejected++;
        continue;
      }
      tasks.push({ ...base, format: 'choice', choices: choices.slice(0, 5).map((text, i) => ({ text, correct: correctIdx[i] })) });
    } else {
      const task = {
        ...base,
        format: 'input' as const,
        answer: { value: parsed.value, unit: clean(z.jednostka).slice(0, 12) || undefined, placeholder: 'wynik' },
        answerRaw: z.odpowiedz,
      };
      tasks.push(task as Task);
    }
  }
  return { id, createdAt: Date.now(), request, title: clean(raw.tytul).slice(0, 120) || 'Moja lekcja', intro: clean(raw.wstep), theory, tasks: tasks.slice(0, 10), rejected };
}

/* ---------------- Zapytanie do serwera ---------------- */

export class AiError extends Error {}

export async function requestLesson(req: AiRequest, signal?: AbortSignal): Promise<AiLesson> {
  if (!AI_URL) throw new AiError('Lekcje z AI nie są jeszcze włączone w tej wersji aplikacji.');
  let res: Response;
  try {
    res = await fetch(`${AI_URL}/lekcja`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Id': deviceId() },
      body: JSON.stringify(req),
      signal,
    });
  } catch {
    throw new AiError('Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie.');
  }
  const body = (await res.json().catch(() => null)) as { lekcja?: AiLessonRaw; blad?: string } | null;
  if (!res.ok || !body?.lekcja) throw new AiError(body?.blad ?? 'Nie udało się przygotować lekcji. Spróbuj ponownie za chwilę.');
  const lesson = toLesson(body.lekcja, req);
  if (lesson.tasks.length < 3) throw new AiError('Tutor nie przygotował wystarczająco sprawdzonych zadań. Spróbuj opisać temat inaczej.');
  return lesson;
}
