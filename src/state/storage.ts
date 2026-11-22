/**
 * Zapis lokalny (localStorage). Klucze zawierają identyfikator profilu,
 * aby później łatwo dodać wiele profili uczniów i synchronizację z serwerem.
 */
// Prefiks z pierwotnej nazwy (E-tutor) – zostaje, żeby zapisane postępy nie zniknęły po zmianie nazwy
const PREFIX = 'etutor:v1';
export const PROFILE_ID = 'default';

function key(name: string) {
  return `${PREFIX}:${PROFILE_ID}:${name}`;
}

export function load<T>(name: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key(name));
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function save<T>(name: string, value: T) {
  try {
    localStorage.setItem(key(name), JSON.stringify(value));
  } catch {
    /* brak miejsca lub zablokowany storage – aplikacja działa dalej bez zapisu */
  }
}

export function remove(name: string) {
  try {
    localStorage.removeItem(key(name));
  } catch {
    /* ignorujemy */
  }
}
