/**
 * Schemat JSON lekcji – Claude musi odpowiedzieć dokładnie w tym formacie
 * (structured outputs). Pola po polsku, zgodne z typem AiLessonRaw w src/lib/ai.ts aplikacji.
 */
const str = { type: 'string' } as const;
const strArr = { type: 'array', items: str } as const;

export const LESSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['odmowa', 'tytul', 'wstep', 'teoria', 'przyklady', 'zadania'],
  properties: {
    odmowa: { type: 'string', description: 'Pusty tekst, jeśli lekcja jest w porządku. Jeśli prośba nie dotyczy matematyki albo jest niestosowna – krótkie, życzliwe wyjaśnienie po polsku.' },
    tytul: str,
    wstep: str,
    teoria: {
      type: 'array',
      items: { type: 'object', additionalProperties: false, required: ['tytul', 'tresc'], properties: { tytul: str, tresc: str } },
    },
    przyklady: {
      type: 'array',
      items: { type: 'object', additionalProperties: false, required: ['zadanie', 'kroki', 'odpowiedz'], properties: { zadanie: str, kroki: strArr, odpowiedz: str } },
    },
    zadania: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['tresc', 'rodzaj', 'odpowiedz', 'sprawdzenie', 'jednostka', 'odpowiedzi_do_wyboru', 'podpowiedzi', 'rozwiazanie'],
        properties: {
          tresc: str,
          rodzaj: { type: 'string', enum: ['wpisz', 'wybierz'] },
          odpowiedz: str,
          sprawdzenie: str,
          jednostka: str,
          odpowiedzi_do_wyboru: strArr,
          podpowiedzi: strArr,
          rozwiazanie: strArr,
        },
      },
    },
  },
} as const;

export type LessonJson = {
  odmowa: string;
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
